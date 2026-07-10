// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Graph Service
// ═══════════════════════════════════════════════════════════════════════════════

import * as neo4j from "@/lib/ai/knowledge-graph/neo4j";
import { createLogger } from "@/utils/logger";

const logger = createLogger("graph-service");

export async function createNode(type: string, label: string, organizationId: string, properties?: Record<string, unknown>) {
  return neo4j.createNode({ type, label, properties: { ...properties, organizationId } });
}

export async function createEdge(fromId: string, toId: string, relationship: string, properties?: Record<string, unknown>) {
  return neo4j.createEdge(fromId, toId, relationship, properties);
}

export async function getRelated(nodeId: string, depth?: number) {
  return neo4j.findRelated(nodeId, depth);
}

export async function searchNodes(query: string, organizationId: string) {
  return neo4j.searchGraph(query, organizationId);
}

export async function expandRelationships(nodeId: string) {
  return neo4j.findRelated(nodeId, 3);
}
