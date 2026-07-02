// ═══════════════════════════════════════════════════════════════════════════════
// Document Ingestion Pipeline
// Upload → Store → OCR → Chunk → Embed → Graph → Ready
// ═══════════════════════════════════════════════════════════════════════════════

import { extractText } from "@/lib/ai/ocr";
import { chunkDocument } from "@/lib/ai/chunking";
import { embedBatch } from "@/lib/ai/embeddings";
import { upsertPoints } from "@/lib/ai/retriever/qdrant";
import { createLogger } from "@/utils/logger";
import { v4 as uuid } from "uuid";

const logger = createLogger("document-pipeline");

export interface PipelineInput {
  documentId: string;
  buffer: Buffer;
  mimeType: string;
  title: string;
  organizationId: string;
  equipmentId?: string;
}

export interface PipelineResult {
  documentId: string;
  textLength: number;
  chunksCreated: number;
  embeddingsStored: number;
  ocrConfidence: number;
  status: "success" | "partial" | "failed";
  errors: string[];
}

export async function processDocument(input: PipelineInput): Promise<PipelineResult> {
  const { documentId, buffer, mimeType, title, organizationId, equipmentId } = input;
  const errors: string[] = [];
  let textLength = 0;
  let chunksCreated = 0;
  let embeddingsStored = 0;
  let ocrConfidence = 0;

  logger.info({ documentId, mimeType, size: buffer.length }, "Pipeline started");

  // Step 1: Extract text (OCR if needed)
  let extractedText = "";
  try {
    const ocrResult = await extractText(buffer, mimeType);
    extractedText = ocrResult.text;
    textLength = extractedText.length;
    ocrConfidence = ocrResult.confidence;
    logger.info({ documentId, textLength, confidence: ocrConfidence }, "Text extracted");
  } catch (e: any) {
    errors.push(`OCR failed: ${e.message}`);
    logger.error({ documentId, error: e.message }, "OCR failed");
  }

  if (!extractedText || extractedText.length < 50) {
    return { documentId, textLength, chunksCreated, embeddingsStored, ocrConfidence, status: "failed", errors: [...errors, "No meaningful text extracted"] };
  }

  // Step 2: Chunk document
  let chunks: { content: string; index: number }[] = [];
  try {
    chunks = chunkDocument(extractedText);
    chunksCreated = chunks.length;
    logger.info({ documentId, chunksCreated }, "Document chunked");
  } catch (e: any) {
    errors.push(`Chunking failed: ${e.message}`);
  }

  // Step 3: Generate embeddings & store in Qdrant
  if (chunks.length > 0) {
    try {
      const texts = chunks.map((c) => c.content);
      const embeddings = await embedBatch(texts);

      const points = chunks.map((chunk, i) => ({
        id: uuid(),
        vector: embeddings[i],
        payload: {
          documentId,
          documentTitle: title,
          organizationId,
          equipmentId: equipmentId || null,
          content: chunk.content,
          chunkIndex: chunk.index,
          pageNumber: null,
        },
      }));

      await upsertPoints(points);
      embeddingsStored = points.length;
      logger.info({ documentId, embeddingsStored }, "Embeddings stored in Qdrant");
    } catch (e: any) {
      errors.push(`Embedding/Qdrant failed: ${e.message}`);
      logger.error({ documentId, error: e.message }, "Embedding pipeline failed");
    }
  }

  // Step 4: Entity extraction & Knowledge Graph (placeholder)
  // TODO: Extract entities and create Neo4j nodes/edges
  // This will be expanded when entity extraction service is connected

  const status = errors.length === 0 ? "success" : embeddingsStored > 0 ? "partial" : "failed";
  logger.info({ documentId, status, errors }, "Pipeline completed");

  return { documentId, textLength, chunksCreated, embeddingsStored, ocrConfidence, status, errors };
}
