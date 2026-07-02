// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline Stage: Document Chunking
// ═══════════════════════════════════════════════════════════════════════════════

import { chunkDocument } from "@/lib/ai/chunking";
import { eventBus, EventType } from "@/lib/events";
import { createLogger } from "@/utils/logger";
import type { PipelineContext } from "./types";

const logger = createLogger("pipeline:chunk");

export async function chunkStage(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.text || ctx.text.length < 50) {
    ctx.errors.push("Chunking: Insufficient text");
    return ctx;
  }

  try {
    const chunks = chunkDocument(ctx.text);
    ctx.chunks = chunks;

    await eventBus.publish(EventType.DOCUMENT_CHUNKED, {
      documentId: ctx.documentId,
      chunkCount: chunks.length,
    }, { organizationId: ctx.organizationId });

    logger.info({ documentId: ctx.documentId, chunkCount: chunks.length }, "Document chunked");
  } catch (error: any) {
    ctx.errors.push(`Chunking: ${error.message}`);
  }

  return ctx;
}
