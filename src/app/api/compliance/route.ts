// GET /api/compliance — List compliance records
// POST /api/compliance — Create compliance record
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation, validateQuery } from "@/middlewares/with-validation";
import { paginationSchema, createComplianceSchema } from "@/validators";
import { getComplianceList, createComplianceRecord } from "@/services/compliance";
import { createdResponse, paginatedResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const params   = validateQuery(paginationSchema, request.nextUrl.searchParams);
    const status   = request.nextUrl.searchParams.get("status")   || undefined;
    const category = request.nextUrl.searchParams.get("category") || undefined;
    const search   = request.nextUrl.searchParams.get("search")   || undefined;

    const result = await getComplianceList(ctx.organizationId, {
      ...params, status, category, search,
    });
    return paginatedResponse(result.data, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
});

export const POST = withAuth(async (request, ctx) => {
  try {
    const body   = await withValidation(createComplianceSchema)(request);
    const record = await createComplianceRecord(body, ctx.organizationId);
    return createdResponse(record, "Compliance record created");
  } catch (error) {
    return errorResponse(error);
  }
});
