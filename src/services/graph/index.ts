// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Graph Service — Neo4j with Prisma fallback
// ═══════════════════════════════════════════════════════════════════════════════

import * as neo4j from "@/lib/ai/knowledge-graph/neo4j";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/utils/logger";

const logger = createLogger("graph-service");

export async function createNode(type: string, label: string, organizationId: string, properties?: Record<string, unknown>) {
  // Always save to Prisma
  let prismaNode = null;
  if (prisma) {
    try {
      prismaNode = await (prisma as any).knowledgeNode.create({
        data: { type, label, organizationId, properties: properties ?? {} },
      });
    } catch (e) {
      logger.warn({ e }, "Failed to save node to Prisma");
    }
  }

  // Try Neo4j too
  try {
    const neo4jNode = await neo4j.createNode({ type, label, properties: { ...properties, organizationId } });
    // Update Prisma with neo4j ID
    if (prismaNode && prisma) {
      await (prisma as any).knowledgeNode.update({
        where: { id: prismaNode.id },
        data: { neo4jId: neo4jNode.id },
      }).catch(() => {});
    }
    return neo4jNode;
  } catch {
    logger.warn("Neo4j unavailable for createNode — using Prisma only");
    return prismaNode ? { id: prismaNode.id, type, label, properties: properties ?? {} } : { id: `local-${Date.now()}`, type, label, properties: properties ?? {} };
  }
}

export async function createEdge(fromId: string, toId: string, relationship: string, properties?: Record<string, unknown>) {
  // Save to Prisma
  if (prisma) {
    try {
      await (prisma as any).knowledgeEdge.create({
        data: { fromNodeId: fromId, toNodeId: toId, relationship, properties: properties ?? {} },
      });
    } catch (e) {
      logger.warn({ e }, "Failed to save edge to Prisma");
    }
  }

  // Try Neo4j
  try {
    return await neo4j.createEdge(fromId, toId, relationship, properties);
  } catch {
    logger.warn("Neo4j unavailable for createEdge");
  }
}

export async function getRelated(nodeId: string, depth?: number) {
  try {
    return await neo4j.findRelated(nodeId, depth);
  } catch {
    logger.warn("Neo4j unavailable for getRelated — returning empty");
    return { nodes: [], edges: [] };
  }
}

export async function searchNodes(query: string, organizationId: string) {
  // Try Neo4j first
  try {
    const results = await neo4j.searchGraph(query, organizationId);
    if (results.length > 0) return results;
  } catch {
    logger.warn("Neo4j unavailable — falling back to Prisma knowledge_nodes");
  }

  // Fallback to Prisma knowledge_nodes table
  if (!prisma) return [];
  try {
    const nodes = await (prisma as any).knowledgeNode.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { label: { contains: query, mode: "insensitive" } },
          { type: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    });

    return nodes.map((n: any) => ({
      id:         n.id,
      type:       n.type,
      label:      n.label,
      properties: n.properties ?? {},
    }));
  } catch (e) {
    logger.warn({ e }, "Prisma knowledge_nodes fallback also failed");
    return [];
  }
}

export async function expandRelationships(nodeId: string) {
  try {
    return await neo4j.findRelated(nodeId, 3);
  } catch {
    // Fallback: query Prisma edges
    if (!prisma) return { nodes: [], edges: [] };
    try {
      const edges = await (prisma as any).knowledgeEdge.findMany({
        where: { OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }] },
        include: {
          fromNode: { select: { id: true, type: true, label: true, properties: true } },
          toNode:   { select: { id: true, type: true, label: true, properties: true } },
        },
      });
      const nodesMap = new Map<string, any>();
      const edgeList: any[] = [];
      for (const e of edges) {
        nodesMap.set(e.fromNode.id, e.fromNode);
        nodesMap.set(e.toNode.id, e.toNode);
        edgeList.push({ id: e.id, fromId: e.fromNodeId, toId: e.toNodeId, relationship: e.relationship, properties: e.properties ?? {} });
      }
      return { nodes: [...nodesMap.values()], edges: edgeList };
    } catch {
      return { nodes: [], edges: [] };
    }
  }
}
