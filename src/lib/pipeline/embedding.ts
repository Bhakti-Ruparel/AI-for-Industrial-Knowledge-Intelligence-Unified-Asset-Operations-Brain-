// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline Stage: Embedding Generation + Vector Storage
// ═══════════════════════════════════════════════════════════════════════════════

import { embedBatch } from "@/lib/ai/embeddings";
import { upsertPoints } from "@/lib/ai/retriever/qdrant";
import { eventBus, EventType } from "@/lib/events";
import { createLogger } from "@/utils/logger";
import { v4 as uuid } from "uuid";
import type { PipelineContext } from "./types";

const logger = createLogger("pipeline:embedding");

export async function embeddingStage(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.chunks || ctx.chunks.length === 0) {
    ctx.errors.push("Embedding: No chunks available");
    return ctx;
  }

  try {
    const texts = ctx.chunks.map((c) => c.content);
    const embeddings = await embedBatch(texts);

    const points = ctx.chunks.map((chunk, i) => {
      const pointId = uuid();
      return {
        id: pointId,
        vector: embeddings[i],
        payload: {
          documentId: ctx.documentId,
          documentTitle: ctx.filename,
          organizationId: ctx.organizationId,
          content: chunk.content,
          chunkIndex: chunk.index,
          pageNumber: chunk.pageNumber || null,
        },
      };
    });

    await upsertPoints(points);
    ctx.embeddings = points.map((p, i) => ({ pointId: p.id, chunkIndex: i }));

    await eventBus.publish(EventType.EMBEDDING_CREATED, {
      documentId: ctx.documentId,
      chunkCount: points.length,
      vectorIds: points.map((p) => p.id),
    }, { organizationId: ctx.organizationId });

    logger.info({ documentId: ctx.documentId, vectorCount: points.length }, "Embeddings stored");
  } catch (error: any) {
    ctx.errors.push(`Embedding: ${error.message}`);
    logger.error({ documentId: ctx.documentId, error: error.message }, "Embedding stage failed");
  }

  return ctx;
}
