// ═══════════════════════════════════════════════════════════════════════════════
// Document Processing Pipeline — Orchestrates all stages
// ═══════════════════════════════════════════════════════════════════════════════

import { ocrStage } from "./ocr";
import { entityStage } from "./entity";
import { relationshipStage } from "./relationship";
import { chunkStage } from "./chunk";
import { embeddingStage } from "./embedding";
import { graphStage } from "./graph";
import { eventBus, EventType } from "@/lib/events";
import { createLogger } from "@/utils/logger";
import type { PipelineContext, PipelineStage } from "./types";

const logger = createLogger("pipeline");

// Default pipeline stages — order matters
const DEFAULT_STAGES: PipelineStage[] = [
  ocrStage,
  entityStage,
  relationshipStage,
  chunkStage,
  embeddingStage,
  graphStage,
];

export interface PipelineInput {
  documentId: string;
  organizationId: string;
  userId?: string;
  filename: string;
  mimeType: string;
  storagePath: string;
  buffer: Buffer;
}

export interface PipelineResult {
  documentId: string;
  status: "success" | "partial" | "failed";
  stagesCompleted: number;
  totalStages: number;
  errors: string[];
  duration: number;
}

export async function executePipeline(input: PipelineInput, stages?: PipelineStage[]): Promise<PipelineResult> {
  const startTime = Date.now();
  const pipelineStages = stages || DEFAULT_STAGES;

  let ctx: PipelineContext = {
    documentId: input.documentId,
    organizationId: input.organizationId,
    userId: input.userId,
    filename: input.filename,
    mimeType: input.mimeType,
    storagePath: input.storagePath,
    buffer: input.buffer,
    errors: [],
    startedAt: new Date().toISOString(),
  };

  logger.info({ documentId: input.documentId, stages: pipelineStages.length }, "Pipeline started");

  let stagesCompleted = 0;

  for (const stage of pipelineStages) {
    try {
      ctx = await stage(ctx);
      stagesCompleted++;
    } catch (error: any) {
      ctx.errors.push(`Stage ${stagesCompleted + 1}: ${error.message}`);
      logger.error({ documentId: input.documentId, stage: stagesCompleted, error: error.message }, "Stage crashed");
      // Continue with remaining stages where possible
    }
  }

  const duration = Date.now() - startTime;
  const status = ctx.errors.length === 0 ? "success" : stagesCompleted > 0 ? "partial" : "failed";

  if (status === "success") {
    await eventBus.publish(EventType.DOCUMENT_INDEXED, { documentId: input.documentId }, { organizationId: input.organizationId });
  }

  logger.info({ documentId: input.documentId, status, stagesCompleted, duration, errors: ctx.errors }, "Pipeline completed");

  return { documentId: input.documentId, status, stagesCompleted, totalStages: pipelineStages.length, errors: ctx.errors, duration };
}

export type { PipelineContext, PipelineStage } from "./types";
