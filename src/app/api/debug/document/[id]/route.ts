// GET /api/debug/document/:id — Full diagnostic for a document's processing state
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request: NextRequest, ctx) => {
  try {
    if (!prisma) return errorResponse(new Error("Database unavailable"));

    const id = request.nextUrl.pathname.split("/").pop();
    if (!id) return errorResponse(new Error("No document ID provided"));

    const doc = await (prisma as any).document.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: {
        id: true,
        title: true,
        filename: true,
        storagePath: true,
        bucketName: true,
        mimeType: true,
        size: true,
        status: true,
        processingStage: true,
        ocrStatus: true,
        embeddingStatus: true,
        knowledgeGraphStatus: true,
        extractedText: true,
        summary: true,
        pages: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!doc) return errorResponse(new Error(`Document ${id} not found`));

    // Count chunks
    const chunkCount = await (prisma as any).documentChunk.count({
      where: { documentId: id },
    });

    // Get first chunk preview
    const firstChunk = await (prisma as any).documentChunk.findFirst({
      where: { documentId: id },
      orderBy: { chunkIndex: "asc" },
      select: { content: true, chunkIndex: true, qdrantPointId: true },
    });

    // Count qdrant vectors (chunks with qdrantPointId)
    const qdrantVectors = await (prisma as any).documentChunk.count({
      where: { documentId: id, qdrantPointId: { not: null } },
    });

    return successResponse({
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
      mimeType: doc.mimeType,
      size: doc.size,
      storagePath: doc.storagePath,
      bucketName: doc.bucketName,
      status: doc.status,
      processingStage: doc.processingStage,
      ocrStatus: doc.ocrStatus,
      embeddingStatus: doc.embeddingStatus,
      knowledgeGraphStatus: doc.knowledgeGraphStatus,
      extractedTextLength: doc.extractedText?.length ?? 0,
      extractedTextPreview: doc.extractedText?.slice(0, 500) ?? null,
      summary: doc.summary,
      pages: doc.pages,
      chunkCount,
      firstChunkPreview: firstChunk?.content?.slice(0, 200) ?? null,
      qdrantVectors,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      diagnosis: diagnosePipeline(doc, chunkCount, qdrantVectors),
    });
  } catch (error) {
    return errorResponse(error);
  }
});

function diagnosePipeline(doc: any, chunkCount: number, qdrantVectors: number): string {
  if (!doc.storagePath) return "FAIL: No storagePath — file was not uploaded to Supabase";
  if (doc.ocrStatus === "PENDING") return "FAIL: OCR never started — pipeline was not triggered";
  if (doc.ocrStatus === "IN_PROGRESS") return "FAIL: OCR started but never completed — pipeline crashed during extraction";
  if (doc.ocrStatus === "FAILED") return "FAIL: OCR explicitly failed — check server logs for pdf-parse errors";
  if (!doc.extractedText || doc.extractedText.length === 0) return "FAIL: ocrStatus says COMPLETE but extractedText is empty";
  if (doc.extractedText.includes("pending") || doc.extractedText.includes("integrate")) return "FAIL: extractedText contains placeholder text — old OCR stub was used instead of pdf-parse";
  if (doc.extractedText.length < 50) return "WARN: Very short extractedText — PDF may be scanned/image-only";
  if (chunkCount === 0) return "WARN: Text extracted but no chunks created — chunking stage failed";
  if (qdrantVectors === 0) return "WARN: Chunks exist but no Qdrant vectors — embedding stage failed";
  return "PASS: Pipeline completed successfully";
}
