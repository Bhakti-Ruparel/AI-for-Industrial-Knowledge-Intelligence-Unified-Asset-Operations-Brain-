// GET    /api/documents/:id   — Get single document (optionally with signed URL)
// DELETE /api/documents/:id   — Soft delete + storage + vector cleanup

import { NextRequest }       from "next/server";
import { withAuth }           from "@/middlewares/with-auth";
import { getDocumentById, deleteDocument, getDocumentDownloadUrl } from "@/services/document";
import { successResponse, errorResponse } from "@/utils/response";
import { NotFoundError }      from "@/utils/errors";

// GET /api/documents/:id
export const GET = withAuth(async (request: NextRequest, ctx) => {
  try {
    const id  = request.nextUrl.pathname.split("/").at(-1)!;
    const doc = await getDocumentById(id, ctx.organizationId);
    if (!doc) throw new NotFoundError("Document", id);

    let downloadUrl: string | null = null;
    if (request.nextUrl.searchParams.get("download") === "true") {
      downloadUrl = await getDocumentDownloadUrl(id, ctx.organizationId).catch(() => null);
    }

    return successResponse({ ...doc, downloadUrl });
  } catch (error) {
    return errorResponse(error);
  }
});

// DELETE /api/documents/:id
export const DELETE = withAuth(async (request: NextRequest, ctx) => {
  try {
    const id = request.nextUrl.pathname.split("/").at(-1)!;
    await deleteDocument(id, ctx.organizationId);
    return successResponse(null, "Document deleted successfully");
  } catch (error) {
    return errorResponse(error);
  }
});
