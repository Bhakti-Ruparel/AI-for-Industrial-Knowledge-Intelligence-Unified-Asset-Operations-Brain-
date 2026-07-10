// GET /api/documents — List documents
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { validateQuery } from "@/middlewares/with-validation";
import { paginationSchema } from "@/validators";
import { getDocuments } from "@/services/document";
import { successResponse, paginatedResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const params = validateQuery(paginationSchema, request.nextUrl.searchParams);
    const result = await getDocuments(ctx.organizationId, params);
    return paginatedResponse(result.data, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
});
