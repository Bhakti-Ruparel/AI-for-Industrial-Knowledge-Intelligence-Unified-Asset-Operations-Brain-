// GET /api/pipeline — List documents currently in processing pipeline
import { withAuth } from "@/middlewares/with-auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (_request, ctx) => {
  try {
    if (!prisma) return successResponse([], "No database");

    // Fetch all non-deleted documents, ordered newest first
    const docs = await prisma.document.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, title: true, filename: true, mimeType: true, size: true,
        status: true, processingStage: true,
        ocrStatus: true, embeddingStatus: true, knowledgeGraphStatus: true,
        pages: true, summary: true,
        createdAt: true, updatedAt: true,
        uploadedBy: { select: { name: true } },
        _count: { select: { chunks: true } },
      },
    });

    return successResponse(docs);
  } catch (error) {
    return errorResponse(error);
  }
});
