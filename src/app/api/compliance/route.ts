// GET /api/compliance — List compliance records
// POST /api/compliance — Create compliance record
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation, validateQuery } from "@/middlewares/with-validation";
import { paginationSchema, createComplianceSchema } from "@/validators";
import { successResponse, createdResponse, paginatedResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const params = validateQuery(paginationSchema, request.nextUrl.searchParams);
    return paginatedResponse([], 0, params.page, params.limit);
  } catch (error) {
    return errorResponse(error);
  }
});

export const POST = withAuth(async (request, ctx) => {
  try {
    const body = await withValidation(createComplianceSchema)(request);
    return createdResponse({ id: "placeholder", ...body, organizationId: ctx.organizationId });
  } catch (error) {
    return errorResponse(error);
  }
});
