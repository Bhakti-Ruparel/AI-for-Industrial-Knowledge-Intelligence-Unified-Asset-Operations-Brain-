// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline Stage: OCR — Text extraction from documents
// ═══════════════════════════════════════════════════════════════════════════════

import { extractText } from "@/lib/ai/ocr";
import { eventBus, EventType } from "@/lib/events";
import { createLogger } from "@/utils/logger";
import type { PipelineContext } from "./types";

const logger = createLogger("pipeline:ocr");

export async function ocrStage(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.buffer) {
    ctx.errors.push("OCR: No buffer available");
    return ctx;
  }

  try {
    const result = await extractText(ctx.buffer, ctx.mimeType);
    ctx.text = result.text;

    await eventBus.publish(EventType.OCR_COMPLETED, {
      documentId: ctx.documentId,
      text: result.text.substring(0, 500),
      pages: result.pages,
      confidence: result.confidence,
    }, { organizationId: ctx.organizationId, userId: ctx.userId });

    logger.info({ documentId: ctx.documentId, textLength: result.text.length, confidence: result.confidence }, "OCR completed");
  } catch (error: any) {
    ctx.errors.push(`OCR: ${error.message}`);
    await eventBus.publish(EventType.OCR_FAILED, { documentId: ctx.documentId, error: error.message }, { organizationId: ctx.organizationId });
    logger.error({ documentId: ctx.documentId, error: error.message }, "OCR failed");
  }

  return ctx;
}
