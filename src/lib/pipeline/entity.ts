// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline Stage: Entity Extraction
// ═══════════════════════════════════════════════════════════════════════════════

import { extractEntities } from "@/services/intelligence/entity-extraction";
import { eventBus, EventType } from "@/lib/events";
import { createLogger } from "@/utils/logger";
import type { PipelineContext } from "./types";

const logger = createLogger("pipeline:entity");

export async function entityStage(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.text || ctx.text.length < 50) {
    logger.warn({ documentId: ctx.documentId }, "Skipping entity extraction — insufficient text");
    return ctx;
  }

  try {
    const entities = await extractEntities(ctx.text, ctx.organizationId);
    ctx.entities = entities;

    await eventBus.publish(EventType.ENTITIES_EXTRACTED, {
      documentId: ctx.documentId,
      entities,
    }, { organizationId: ctx.organizationId });

    logger.info({ documentId: ctx.documentId, entityCount: entities.length }, "Entities extracted");
  } catch (error: any) {
    ctx.errors.push(`Entity extraction: ${error.message}`);
    logger.error({ documentId: ctx.documentId, error: error.message }, "Entity extraction failed");
  }

  return ctx;
}
