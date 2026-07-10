// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline Stage: Relationship Extraction
// ═══════════════════════════════════════════════════════════════════════════════

import { extractRelationships } from "@/services/intelligence/relationship-extraction";
import { eventBus, EventType } from "@/lib/events";
import { createLogger } from "@/utils/logger";
import type { PipelineContext } from "./types";

const logger = createLogger("pipeline:relationship");

export async function relationshipStage(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.entities || ctx.entities.length === 0) {
    return ctx;
  }

  try {
    const relationships = await extractRelationships(ctx.text || "", ctx.entities);
    ctx.relationships = relationships;

    await eventBus.publish(EventType.RELATIONSHIPS_EXTRACTED, {
      documentId: ctx.documentId,
      relationshipCount: relationships.length,
    }, { organizationId: ctx.organizationId });

    logger.info({ documentId: ctx.documentId, count: relationships.length }, "Relationships extracted");
  } catch (error: any) {
    ctx.errors.push(`Relationship extraction: ${error.message}`);
  }

  return ctx;
}
