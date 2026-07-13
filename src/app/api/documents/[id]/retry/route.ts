// POST /api/documents/:id/retry — Re-queue failed document for processing

import { NextRequest }      from "next/server";
import { withAuth }          from "@/middlewares/with-auth";
import { retryDocument }     from "@/services/document";
import { successResponse, errorResponse } from "@/utils/response";

export const POST = withAuth(async (request: NextRequest, ctx) => {
  try {
    // id is the second-to-last segment: /api/documents/:id/retry
    const segments = request.nextUrl.pathname.split("/");
    const id       = segments[segments.length - 2];
    const result   = await retryDocument(id, ctx.organizationId);
    return successResponse(result, "Document processing retry queued");
  } catch (error) {
    return errorResponse(error);
  }
});
