// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline Stage: Knowledge Graph Population
// ═══════════════════════════════════════════════════════════════════════════════

import { createNode, createEdge } from "@/services/graph";
import { eventBus, EventType } from "@/lib/events";
import { createLogger } from "@/utils/logger";
import type { PipelineContext } from "./types";

const logger = createLogger("pipeline:graph");

export async function graphStage(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.entities || ctx.entities.length === 0) {
    return ctx;
  }

  let nodesCreated = 0;
  let edgesCreated = 0;

  try {
    // Create nodes for extracted entities
    const nodeIds: Map<string, string> = new Map();

    for (const entity of ctx.entities) {
      try {
        const node = await createNode(entity.type.toUpperCase(), entity.value, ctx.organizationId, {
          documentId: ctx.documentId,
          confidence: entity.confidence,
          ...entity.metadata,
        });
        nodeIds.set(`${entity.type}:${entity.value}`, node.id);
        nodesCreated++;
      } catch {
        // Skip duplicate nodes
      }
    }

    // Create edges for relationships
    if (ctx.relationships) {
      for (const rel of ctx.relationships) {
        const sourceId = nodeIds.get(`${rel.sourceType}:${rel.source}`);
        const targetId = nodeIds.get(`${rel.targetType}:${rel.target}`);
        if (sourceId && targetId) {
          try {
            await createEdge(sourceId, targetId, rel.relationship, { confidence: rel.confidence });
            edgesCreated++;
          } catch {
            // Skip failed edges
          }
        }
      }
    }

    ctx.graphNodes = Array.from(nodeIds.values());

    await eventBus.publish(EventType.KNOWLEDGE_GRAPH_UPDATED, {
      documentId: ctx.documentId,
      nodesCreated,
      edgesCreated,
    }, { organizationId: ctx.organizationId });

    logger.info({ documentId: ctx.documentId, nodesCreated, edgesCreated }, "Knowledge graph updated");
  } catch (error: any) {
    ctx.errors.push(`Knowledge Graph: ${error.message}`);
    logger.error({ documentId: ctx.documentId, error: error.message }, "Graph stage failed");
  }

  return ctx;
}
