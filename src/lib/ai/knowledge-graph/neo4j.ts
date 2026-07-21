// ═══════════════════════════════════════════════════════════════════════════════
// Neo4j Knowledge Graph Client
// ═══════════════════════════════════════════════════════════════════════════════

import neo4j, { Driver, Session } from "neo4j-driver";
import { createLogger } from "@/utils/logger";

const logger = createLogger("neo4j");

let driver: Driver | null = null;

function getDriver(): Driver | null {
  if (!driver) {
    const uri      = process.env.NEO4J_URI      || "";
    const user     = process.env.NEO4J_USER     || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "";

    if (!uri || !password) {
      logger.warn("NEO4J_URI or NEO4J_PASSWORD not configured — graph queries disabled");
      return null;
    }

    try {
      driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    } catch (e) {
      logger.error({ e }, "Failed to create Neo4j driver");
      return null;
    }
  }
  return driver;
}

function getSession(): Session | null {
  const d = getDriver();
  if (!d) return null;
  try {
    return d.session();
  } catch {
    return null;
  }
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  fromId: string;
  toId: string;
  relationship: string;
  properties: Record<string, unknown>;
}

export async function createNode(node: Omit<GraphNode, "id">): Promise<GraphNode> {
  const session = getSession();
  if (!session) throw new Error("Neo4j not configured");
  try {
    const result = await session.run(
      `CREATE (n:${node.type} {label: $label, organizationId: $orgId}) SET n += $props RETURN n, id(n) as nodeId`,
      { label: node.label, orgId: node.properties.organizationId, props: node.properties }
    );
    const record = result.records[0];
    return {
      id: record.get("nodeId").toString(),
      type: node.type,
      label: node.label,
      properties: record.get("n").properties,
    };
  } finally {
    await session.close();
  }
}

export async function createEdge(from: string, to: string, relationship: string, properties: Record<string, unknown> = {}): Promise<void> {
  const session = getSession();
  if (!session) throw new Error("Neo4j not configured");
  try {
    await session.run(
      `MATCH (a) WHERE id(a) = $fromId MATCH (b) WHERE id(b) = $toId CREATE (a)-[r:${relationship}]->(b) SET r += $props`,
      { fromId: neo4j.int(parseInt(from)), toId: neo4j.int(parseInt(to)), props: properties }
    );
  } finally {
    await session.close();
  }
}

export async function findRelated(nodeId: string, depth: number = 2): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const session = getSession();
  if (!session) return { nodes: [], edges: [] };
  try {
    const result = await session.run(
      `MATCH path = (n)-[*1..${depth}]-(m) WHERE id(n) = $nodeId RETURN nodes(path) as nodes, relationships(path) as rels`,
      { nodeId: neo4j.int(parseInt(nodeId)) }
    );

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const seenNodes = new Set<string>();

    for (const record of result.records) {
      for (const node of record.get("nodes")) {
        const id = node.identity.toString();
        if (!seenNodes.has(id)) {
          seenNodes.add(id);
          nodes.push({
            id,
            type: node.labels[0] || "Unknown",
            label: node.properties.label || "",
            properties: node.properties,
          });
        }
      }
      for (const rel of record.get("rels")) {
        edges.push({
          id: rel.identity.toString(),
          fromId: rel.start.toString(),
          toId: rel.end.toString(),
          relationship: rel.type,
          properties: rel.properties,
        });
      }
    }

    return { nodes, edges };
  } finally {
    await session.close();
  }
}

export async function searchGraph(query: string, organizationId: string): Promise<GraphNode[]> {
  const session = getSession();
  if (!session) return [];
  try {
    const result = await session.run(
      `MATCH (n) WHERE n.organizationId = $orgId AND (n.label CONTAINS $query OR any(key IN keys(n) WHERE toString(n[key]) CONTAINS $query)) RETURN n, labels(n) as labels, id(n) as nodeId LIMIT 20`,
      { orgId: organizationId, query }
    );
    return result.records.map((r) => ({
      id: r.get("nodeId").toString(),
      type: r.get("labels")[0] || "Unknown",
      label: r.get("n").properties.label || "",
      properties: r.get("n").properties,
    }));
  } finally {
    await session.close();
  }
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}