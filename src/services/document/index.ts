// ═══════════════════════════════════════════════════════════════════════════════
// Document Service — Production Implementation
// ═══════════════════════════════════════════════════════════════════════════════

import crypto                  from "crypto";
import { documentRepository }  from "@/repositories";
import { config }              from "@/config";
import { createLogger }        from "@/utils/logger";
import { ValidationError }     from "@/utils/errors";
import { v4 as uuid }          from "uuid";
import {
  uploadFile, deleteFile, getSignedUrl,
  buildStoragePath, isStorageConfigured, DOCUMENT_BUCKET,
} from "@/lib/storage";
import { deletePoints }        from "@/lib/ai/retriever/qdrant";
import { eventBus, EventType } from "@/lib/events";
import type { DocumentQueryOptions } from "@/repositories/document.repository";

const logger = createLogger("document-service");

// ── Supported file extensions ─────────────────────────────────────────────────
const ALLOWED_EXTENSIONS = new Set([
  "pdf","docx","txt","csv","xlsx",
  "png","jpg","jpeg","webp","tiff",
]);

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png","image/jpeg","image/jpg","image/webp","image/tiff",
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// ── Input types ───────────────────────────────────────────────────────────────
export interface UploadDocumentInput {
  file:           Buffer;
  filename:       string;
  mimeType:       string;
  size:           number;
  title:          string;
  type:           string;
  organizationId: string;
  uploadedById:   string;
  equipmentId?:   string;
  tags?:          string[];
}

// ── Validate uploaded file ────────────────────────────────────────────────────
function validateFile(filename: string, mimeType: string, size: number) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ValidationError("Unsupported file type", {
      file: [`Extension .${ext} is not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`],
    });
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ValidationError("Unsupported MIME type", {
      file: [`MIME type ${mimeType} is not allowed`],
    });
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError("File too large", {
      file: [`Maximum file size is 50MB. Received ${(size / 1024 / 1024).toFixed(1)}MB`],
    });
  }
}

// ── SHA-256 checksum ──────────────────────────────────────────────────────────
function computeChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ── UPLOAD ────────────────────────────────────────────────────────────────────
export async function uploadDocument(input: UploadDocumentInput) {
  const { file, filename, mimeType, size, title, type, organizationId, uploadedById, equipmentId } = input;

  // 1. Validate
  validateFile(filename, mimeType, size);

  const checksum      = computeChecksum(file);
  const documentId    = uuid();
  const ext           = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const storedFilename = `${documentId}.${ext}`;
  const storagePath   = buildStoragePath(organizationId, documentId, storedFilename);

  logger.info({ documentId, filename, mimeType, size, organizationId }, "Upload started");

  // 2. Upload to Supabase Storage
  let finalStoragePath = storagePath;
  let bucket           = DOCUMENT_BUCKET;

  if (isStorageConfigured()) {
    try {
      const result = await uploadFile(bucket, storagePath, file, mimeType);
      finalStoragePath = result.path;
      logger.info({ documentId, path: finalStoragePath }, "File stored in Supabase");
    } catch (err: any) {
      logger.warn({ documentId, error: err.message }, "Storage upload failed — proceeding without file");
      // Non-fatal for dev: record is still created
    }
  } else {
    logger.warn({ documentId }, "Supabase not configured — file not stored. Set SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  // 3. Create PostgreSQL record
  const document = await documentRepository.create({
    id:             documentId,
    title,
    filename,
    storedFilename,
    bucketName:     bucket,
    storagePath:    finalStoragePath,
    mimeType,
    size,
    checksum,
    type:           type.toUpperCase(),
    status:         "UPLOADED",
    processingStage: "UPLOAD_COMPLETE",
    ocrStatus:       "PENDING",
    embeddingStatus: "PENDING",
    knowledgeGraphStatus: "PENDING",
    organizationId,
    uploadedById,
    equipmentId:    equipmentId ?? null,
  });

  logger.info({ documentId: document.id ?? documentId }, "Document record created in PostgreSQL");

  // 4. Publish upload event
  await eventBus.publish(
    EventType.DOCUMENT_UPLOADED,
    { documentId: document.id ?? documentId, filename, mimeType, size, storagePath: finalStoragePath },
    { organizationId, userId: uploadedById }
  ).catch(() => {});

  // 5. Trigger pipeline — run inline to guarantee execution
  const effectiveDocId = document.id ?? documentId;
  if (effectiveDocId !== "unconfigured") {
    logger.info({ documentId: effectiveDocId }, "[PIPELINE] Starting document processing...");
    try {
      const { processDocument } = await import("./pipeline");
      const result = await processDocument({
        documentId:     effectiveDocId,
        buffer:         file,
        mimeType,
        title,
        organizationId,
        equipmentId,
      });
      logger.info({
        documentId: effectiveDocId,
        status: result.status,
        textLength: result.textLength,
        chunks: result.chunksCreated,
        embeddings: result.embeddingsStored,
        errors: result.errors,
      }, "[PIPELINE] Document processing complete");
    } catch (err: any) {
      logger.error({ documentId: effectiveDocId, error: err.message, stack: err.stack?.slice(0, 500) }, "[PIPELINE] Pipeline crashed");
      documentRepository.markFailed(effectiveDocId, "PIPELINE_CRASH", err.message).catch(() => {});
    }
  }

  return {
    id:             effectiveDocId,
    title,
    filename,
    storedFilename,
    storagePath:    finalStoragePath,
    mimeType,
    size,
    checksum,
    type:           type.toUpperCase(),
    status:         "UPLOADED",
    processingStage: "UPLOAD_COMPLETE",
    organizationId,
    uploadedById,
    equipmentId:    equipmentId ?? null,
    createdAt:      new Date().toISOString(),
  };
}

// ── LIST with filters ─────────────────────────────────────────────────────────
export async function getDocuments(
  organizationId: string,
  options: DocumentQueryOptions
) {
  return documentRepository.findManyWithFilters(organizationId, options);
}

// ── GET single ────────────────────────────────────────────────────────────────
export async function getDocumentById(id: string, organizationId: string) {
  return documentRepository.findById(id, organizationId);
}

// ── GET signed download URL ───────────────────────────────────────────────────
export async function getDocumentDownloadUrl(
  id: string,
  organizationId: string
): Promise<string> {
  const doc = await documentRepository.findById(id, organizationId);
  if (!doc) throw new Error("Document not found");
  if (!isStorageConfigured()) throw new Error("Storage not configured");
  return getSignedUrl(doc.bucketName ?? DOCUMENT_BUCKET, doc.storagePath, 3600);
}

// ── DELETE (soft delete + storage cleanup) ────────────────────────────────────
export async function deleteDocument(id: string, organizationId: string) {
  // 1. Find the doc
  const doc = await documentRepository.findById(id, organizationId).catch(() => null);
  if (!doc) return;

  // 2. Soft delete in PostgreSQL
  await documentRepository.softDeleteWithCleanup(id, organizationId).catch(() => {});

  // 3. Delete from Supabase Storage
  if (isStorageConfigured() && doc.storagePath) {
    await deleteFile(doc.bucketName ?? DOCUMENT_BUCKET, doc.storagePath).catch((err) => {
      logger.warn({ id, error: err.message }, "Storage deletion failed — soft delete still applied");
    });
  }

  // 4. Delete Qdrant vectors (get point IDs from chunks)
  try {
    const chunks = await documentRepository.findChunks(id);
    const pointIds = (chunks as any[])
      .map((c: any) => c.qdrantPointId)
      .filter(Boolean);
    if (pointIds.length > 0) {
      await deletePoints(pointIds).catch(() => {});
      logger.info({ id, pointCount: pointIds.length }, "Qdrant vectors deleted");
    }
  } catch {
    // Non-fatal
  }

  // 5. Publish event
  await eventBus.publish(
    EventType.DOCUMENT_INDEXED, // reuse — TODO: add DOCUMENT_DELETED event
    { documentId: id, deleted: true },
    { organizationId }
  ).catch(() => {});

  logger.info({ id, organizationId }, "Document deleted");
}

// ── STATS for dashboard ───────────────────────────────────────────────────────
export async function getDocumentStats(organizationId: string) {
  return documentRepository.getStats(organizationId);
}

// ── RETRY failed document ─────────────────────────────────────────────────────
export async function retryDocument(id: string, organizationId: string) {
  const doc = await documentRepository.findById(id, organizationId).catch(() => null);
  if (!doc) throw new Error("Document not found");

  // Reset status
  await documentRepository.updateStage(id, "RETRY", {
    status:             "PROCESSING",
    ocrStatus:          "PENDING",
    embeddingStatus:    "PENDING",
    knowledgeGraphStatus: "PENDING",
  }).catch(() => {});

  logger.info({ id }, "Document retry queued");
  return { id, status: "PROCESSING", message: "Retry queued" };
}
