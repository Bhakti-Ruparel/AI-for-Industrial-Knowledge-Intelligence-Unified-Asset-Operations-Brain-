// ═══════════════════════════════════════════════════════════════════════════════
// Document Service — Business logic layer
// ═══════════════════════════════════════════════════════════════════════════════

import { documentRepository } from "@/repositories";
import { uploadFile } from "@/lib/storage";
import { processDocument } from "./pipeline";
import { config } from "@/config";
import { createLogger } from "@/utils/logger";
import { v4 as uuid } from "uuid";
import type { PaginationOptions } from "@/repositories";

const logger = createLogger("document-service");

export interface UploadDocumentInput {
  file: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  title: string;
  type: string;
  organizationId: string;
  uploadedById: string;
  equipmentId?: string;
  tags?: string[];
}

export async function uploadDocument(input: UploadDocumentInput) {
  const { file, filename, mimeType, size, title, type, organizationId, uploadedById, equipmentId } = input;

  // 1. Upload to storage
  const storagePath = `${organizationId}/${uuid()}_${filename}`;
  const uploadResult = await uploadFile(config.storage.buckets.documents, storagePath, file, mimeType);

  // 2. Create database record
  const document = await documentRepository.create({
    title,
    filename,
    mimeType,
    size,
    storagePath,
    type,
    status: "PROCESSING",
    organizationId,
    uploadedById,
    equipmentId,
  });

  // 3. Trigger async processing pipeline
  processDocument({
    documentId: document.id,
    buffer: file,
    mimeType,
    title,
    organizationId,
    equipmentId,
  }).then(async (result) => {
    const newStatus = result.status === "success" ? "INDEXED" : result.status === "partial" ? "INDEXED" : "ERROR";
    await documentRepository.updateProcessingStatus(document.id, "status", newStatus);
    await documentRepository.updateProcessingStatus(document.id, "ocrStatus", result.ocrConfidence > 0 ? "COMPLETE" : "FAILED");
    await documentRepository.updateProcessingStatus(document.id, "embeddingStatus", result.embeddingsStored > 0 ? "COMPLETE" : "FAILED");
    logger.info({ documentId: document.id, status: newStatus }, "Document processing complete");
  }).catch((error) => {
    logger.error({ documentId: document.id, error }, "Document processing crashed");
    documentRepository.updateProcessingStatus(document.id, "status", "ERROR");
  });

  return document;
}

export async function getDocuments(organizationId: string, options: PaginationOptions) {
  return documentRepository.findMany(organizationId, options);
}

export async function getDocumentById(id: string, organizationId: string) {
  return documentRepository.findById(id, organizationId);
}

export async function deleteDocument(id: string, organizationId: string) {
  return documentRepository.softDelete(id, organizationId);
}
