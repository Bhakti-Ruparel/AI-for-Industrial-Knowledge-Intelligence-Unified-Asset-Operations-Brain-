// POST /api/documents/:id/retry — Reset failed document and re-trigger pipeline

import { NextRequest }        from "next/server";
import { withAuth }           from "@/middlewares/with-auth";
import { retryDocument }      from "@/services/document";
import { successResponse, errorResponse } from "@/utils/response";
import { NotFoundError }      from "@/utils/errors";

export const POST = withAuth(async (request: NextRequest, ctx) => {
  try {
    const segments = request.nextUrl.pathname.split("/");
    // Path: /api/documents/[id]/retry  →  segments[-2] = id
    const id = segments[segments.length - 2];
    if (!id) throw new NotFoundError("Document");

    const result = await retryDocument(id, ctx.organizationId);
    return successResponse(result, "Document retry queued");
  } catch (error) {
    return errorResponse(error);
  }
});
