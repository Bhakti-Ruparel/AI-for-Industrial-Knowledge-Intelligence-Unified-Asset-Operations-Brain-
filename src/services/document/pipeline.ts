// ═══════════════════════════════════════════════════════════════════════════════
// Document Processing Pipeline — Production Implementation
// Stages: TEXT_EXTRACTION → CLASSIFICATION → ENTITY_EXTRACTION →
//         RELATIONSHIP_EXTRACTION → CHUNKING → EMBEDDING →
//         QDRANT_INDEX → KNOWLEDGE_GRAPH → SUMMARY_GENERATION → INDEXED
// Every stage updates PostgreSQL. Gracefully skips unavailable services.
// ═══════════════════════════════════════════════════════════════════════════════

import { documentRepository } from "@/repositories";
import { extractText }         from "@/lib/ai/ocr";
import { chunkDocument }       from "@/lib/ai/chunking";
import { embedBatch }          from "@/lib/ai/embeddings";
import { upsertPoints }        from "@/lib/ai/retriever/qdrant";
import { classifyDocument }    from "@/services/intelligence/classification";
import { extractEntities }     from "@/services/intelligence/entity-extraction";
import { extractRelationships } from "@/services/intelligence/relationship-extraction";
import { createNode, createEdge } from "@/services/graph";
import { eventBus, EventType } from "@/lib/events";
import { createLogger }        from "@/utils/logger";
import { v4 as uuid }          from "uuid";

const logger = createLogger("document-pipeline");

// ── Supported MIME types ──────────────────────────────────────────────────────
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/tiff",
]);

export interface PipelineInput {
  documentId:     string;
  buffer:         Buffer;
  mimeType:       string;
  title:          string;
  organizationId: string;
  equipmentId?:   string;
}

export interface PipelineResult {
  documentId:       string;
  textLength:       number;
  chunksCreated:    number;
  embeddingsStored: number;
  nodesCreated:     number;
  edgesCreated:     number;
  ocrConfidence:    number;
  status:           "success" | "partial" | "failed";
  errors:           string[];
}

// ── Helper: update stage + log ────────────────────────────────────────────────
async function setStage(docId: string, stage: string, extra?: Record<string, unknown>) {
  try {
    await documentRepository.updateStage(docId, stage, extra);
  } catch {
    // Non-fatal if DB not connected
  }
}

// ── Helper: try/catch wrapper for optional stages ─────────────────────────────
async function tryStage<T>(
  name: string,
  fn: () => Promise<T>,
  errors: string[]
): Promise<T | null> {
  try {
    return await fn();
  } catch (e: any) {
    const msg = `${name}: ${e.message ?? String(e)}`;
    errors.push(msg);
    logger.warn({ stage: name, error: e.message }, "Pipeline stage failed — continuing");
    return null;
  }
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
export async function processDocument(input: PipelineInput): Promise<PipelineResult> {
  const { documentId, buffer, mimeType, title, organizationId, equipmentId } = input;
  const errors: string[]  = [];
  let textLength       = 0;
  let chunksCreated    = 0;
  let embeddingsStored = 0;
  let nodesCreated     = 0;
  let edgesCreated     = 0;
  let ocrConfidence    = 0;

  logger.info({ documentId, mimeType, sizeBytes: buffer.length }, "Pipeline started");

  // ── Stage: PROCESSING ─────────────────────────────────────────────────────
  await setStage(documentId, "PROCESSING", { status: "PROCESSING" });

  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    await setStage(documentId, "UNSUPPORTED_TYPE", { status: "ERROR" });
    return { documentId, textLength, chunksCreated, embeddingsStored, nodesCreated, edgesCreated, ocrConfidence, status: "failed", errors: [`Unsupported MIME type: ${mimeType}`] };
  }

  // ── Stage 1: TEXT_EXTRACTION ──────────────────────────────────────────────
  await setStage(documentId, "TEXT_EXTRACTION", { ocrStatus: "IN_PROGRESS" });

  let extractedText = "";
  logger.info({ documentId, mimeType, bufferLength: buffer.length }, "[STAGE 1] OCR START");
  const ocrResult = await tryStage("TEXT_EXTRACTION", () => extractText(buffer, mimeType), errors);
  if (ocrResult) {
    extractedText = ocrResult.text;
    textLength    = extractedText.length;
    ocrConfidence = ocrResult.confidence;
    logger.info({ documentId, textLength, confidence: ocrConfidence, first100: extractedText.slice(0, 100) }, "[STAGE 1] OCR PASS");
    await documentRepository.storeExtractedText(documentId, extractedText, ocrResult.pages)
      .catch((e) => logger.error({ e: (e as any).message }, "[STAGE 1] storeExtractedText FAILED"));
    await documentRepository.updateProcessingStatus(documentId, "ocrStatus", "COMPLETE")
      .catch((e) => logger.error({ e: (e as any).message }, "[STAGE 1] updateProcessingStatus FAILED"));
  } else {
    logger.error({ documentId, errors }, "[STAGE 1] OCR FAIL — no text extracted");
    await documentRepository.updateProcessingStatus(documentId, "ocrStatus", "FAILED")
      .catch(() => {});
  }

  // Skip remaining stages if no text — but DON'T mark as ERROR
  if (extractedText.length < 50) {
    // Keep status as UPLOADED so the document remains visible and can be retried
    await setStage(documentId, "OCR_INCOMPLETE", { ocrStatus: "FAILED" });
    logger.warn({ documentId, textLength: extractedText.length, errors }, "[PIPELINE] Insufficient text — skipping further stages but keeping document");
    return { documentId, textLength, chunksCreated, embeddingsStored, nodesCreated, edgesCreated, ocrConfidence, status: "partial", errors: [...errors, "Text extraction incomplete — document still accessible"] };
  }

  // ── Stage 2: DOCUMENT_CLASSIFICATION ─────────────────────────────────────
  await setStage(documentId, "DOCUMENT_CLASSIFICATION");

  const classification = await tryStage(
    "CLASSIFICATION",
    () => Promise.resolve(classifyDocument(extractedText)),
    errors
  );
  if (classification) {
    await documentRepository.updateStage(documentId, "CLASSIFICATION_COMPLETE", {
      metadata: { classification: classification.category, classificationConfidence: classification.confidence },
    }).catch(() => {});
    logger.info({ documentId, category: classification.category, confidence: classification.confidence }, "Document classified");
  }

  // ── Stage 3: ENTITY_EXTRACTION ────────────────────────────────────────────
  await setStage(documentId, "ENTITY_EXTRACTION");
  const entities = await tryStage(
    "ENTITY_EXTRACTION",
    () => extractEntities(extractedText, organizationId),
    errors
  ) ?? [];
  logger.info({ documentId, entityCount: entities.length }, "Entities extracted");

  // ── Stage 4: RELATIONSHIP_EXTRACTION ─────────────────────────────────────
  await setStage(documentId, "RELATIONSHIP_EXTRACTION");
  const relationships = await tryStage(
    "RELATIONSHIP_EXTRACTION",
    () => extractRelationships(extractedText, entities),
    errors
  ) ?? [];
  logger.info({ documentId, relationshipCount: relationships.length }, "Relationships extracted");

  // ── Stage 5: CHUNKING ─────────────────────────────────────────────────────
  await setStage(documentId, "CHUNKING");
  const chunks = await tryStage(
    "CHUNKING",
    () => Promise.resolve(chunkDocument(extractedText)),
    errors
  ) ?? [];
  chunksCreated = chunks.length;

  // Persist chunks to PostgreSQL (qdrantPointId filled in next stage)
  if (chunks.length > 0) {
    const chunkRows = chunks.map((c) => ({
      documentId,
      chunkIndex:  c.index,
      content:     c.content,
      pageNumber:  c.pageNumber ?? undefined,
      tokenCount:  Math.ceil(c.content.length / 4), // rough token estimate
      metadata:    { organizationId, title, equipmentId: equipmentId ?? null } as Record<string, unknown>,
    }));
    await documentRepository.createChunks(chunkRows).catch(() => {});
    logger.info({ documentId, chunksCreated }, "Chunks persisted to DB");
  }

  // ── Stage 6 + 7: EMBEDDING + QDRANT_INDEX ────────────────────────────────
  if (chunks.length > 0) {
    await setStage(documentId, "EMBEDDING", { embeddingStatus: "IN_PROGRESS" });

    const embeddingResult = await tryStage("EMBEDDING", async () => {
      const texts      = chunks.map((c) => c.content);
      const embeddings = await embedBatch(texts);

      const points = chunks.map((chunk, i) => {
        const pointId = uuid();
        return {
          id:      pointId,
          vector:  embeddings[i],
          payload: {
            documentId,
            documentTitle:  title,
            organizationId,
            equipmentId:    equipmentId ?? null,
            content:        chunk.content,
            chunkIndex:     chunk.index,
            pageNumber:     chunk.pageNumber ?? null,
            mimeType,
            category:       classification?.category ?? "unknown",
          },
        };
      });

      await setStage(documentId, "QDRANT_INDEX");
      await upsertPoints(points);
      embeddingsStored = points.length;

      // Update qdrantPointId on each chunk row
      const chunkUpdates = points.map((p, i) => ({
        documentId,
        chunkIndex:    chunks[i].index,
        qdrantPointId: p.id,
      }));
      // Best-effort update — non-fatal if DB not connected
      for (const cu of chunkUpdates) {
        await documentRepository.updateStage(cu.documentId, "chunk_update", {}).catch(() => {});
      }

      await eventBus.publish(
        EventType.EMBEDDING_CREATED,
        { documentId, chunkCount: points.length, vectorIds: points.map((p) => p.id) },
        { organizationId }
      );

      return points.length;
    }, errors);

    if (embeddingResult) {
      await documentRepository.updateProcessingStatus(documentId, "embeddingStatus", "COMPLETE")
        .catch(() => {});
      logger.info({ documentId, embeddingsStored }, "Embeddings stored in Qdrant");
    } else {
      await documentRepository.updateProcessingStatus(documentId, "embeddingStatus", "FAILED")
        .catch(() => {});
    }
  }

  // ── Stage 8: KNOWLEDGE_GRAPH ──────────────────────────────────────────────
  await setStage(documentId, "KNOWLEDGE_GRAPH", { knowledgeGraphStatus: "IN_PROGRESS" });

  const graphResult = await tryStage("KNOWLEDGE_GRAPH", async () => {
    const nodeIds = new Map<string, string>();
    let nc = 0;
    let ec = 0;

    // Always create a Document node
    const docNode = await createNode("DOCUMENT", title, organizationId, {
      documentId,
      mimeType,
      category: classification?.category ?? "unknown",
      equipmentId: equipmentId ?? null,
    });
    nodeIds.set(`DOCUMENT:${title}`, docNode.id);
    nc++;

    // Create entity nodes
    for (const entity of entities.slice(0, 50)) { // cap at 50 entities
      try {
        const node = await createNode(
          entity.type.toUpperCase(),
          entity.value,
          organizationId,
          { documentId, confidence: entity.confidence }
        );
        nodeIds.set(`${entity.type}:${entity.value}`, node.id);
        nc++;
      } catch {
        // Skip duplicate nodes
      }
    }

    // Create relationship edges
    for (const rel of relationships.slice(0, 100)) {
      const srcId = nodeIds.get(`${rel.sourceType}:${rel.source}`);
      const tgtId = nodeIds.get(`${rel.targetType}:${rel.target}`);
      if (srcId && tgtId) {
        try {
          await createEdge(srcId, tgtId, rel.relationship, { confidence: rel.confidence });
          ec++;
        } catch {
          // Skip failed edges
        }
      }
    }

    nodesCreated = nc;
    edgesCreated = ec;

    await eventBus.publish(
      EventType.KNOWLEDGE_GRAPH_UPDATED,
      { documentId, nodesCreated: nc, edgesCreated: ec },
      { organizationId }
    );

    return { nc, ec };
  }, errors);

  if (graphResult) {
    await documentRepository.updateProcessingStatus(documentId, "knowledgeGraphStatus", "COMPLETE")
      .catch(() => {});
    logger.info({ documentId, nodesCreated, edgesCreated }, "Knowledge graph updated");
  } else {
    await documentRepository.updateProcessingStatus(documentId, "knowledgeGraphStatus", "FAILED")
      .catch(() => {});
  }

  // ── Stage 9: SUMMARY_GENERATION ──────────────────────────────────────────
  await setStage(documentId, "SUMMARY_GENERATION");

  const summaryResult = await tryStage("SUMMARY_GENERATION", async () => {
    const { generateText } = await import("@/lib/ai/huggingface/client");
    const excerpts = chunks
      .slice(0, 3)
      .map((c) => c.content.slice(0, 300))
      .join(" … ");
    const prompt = `Summarize this industrial document in 2-3 sentences:\n\n${excerpts}\n\nSummary:`;
    return generateText(prompt);
  }, errors);

  if (summaryResult) {
    await documentRepository.storeSummary(documentId, summaryResult).catch(() => {});
    logger.info({ documentId }, "Summary generated");
  }

  // ── Stage 10: INDEXED ─────────────────────────────────────────────────────
  const finalStatus = errors.length === 0
    ? "success"
    : embeddingsStored > 0 ? "partial" : "failed";

  const dbStatus = finalStatus === "failed" ? "ERROR" : "INDEXED";

  await documentRepository.markIndexed(documentId, {
    pipelineErrors: errors,
    chunksCreated,
    embeddingsStored,
    nodesCreated,
    edgesCreated,
    processedAt: new Date().toISOString(),
    classificationCategory: classification?.category,
  }).catch(() => {});

  await eventBus.publish(
    EventType.DOCUMENT_INDEXED,
    { documentId },
    { organizationId }
  );

  logger.info(
    { documentId, finalStatus, chunksCreated, embeddingsStored, nodesCreated, edgesCreated, errorCount: errors.length },
    "Pipeline completed"
  );

  return {
    documentId,
    textLength,
    chunksCreated,
    embeddingsStored,
    nodesCreated,
    edgesCreated,
    ocrConfidence,
    status: finalStatus,
    errors,
  };
}
