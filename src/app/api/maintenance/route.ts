// GET /api/maintenance — List maintenance records
// POST /api/maintenance — Create maintenance record
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation, validateQuery } from "@/middlewares/with-validation";
import { paginationSchema, createMaintenanceSchema } from "@/validators";
import { successResponse, createdResponse, paginatedResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    // TODO: Call maintenance service when Prisma is connected
    const params = validateQuery(paginationSchema, request.nextUrl.searchParams);
    return paginatedResponse([], 0, params.page, params.limit);
  } catch (error) {
    return errorResponse(error);
  }
});

export const POST = withAuth(async (request, ctx) => {
  try {
    const body = await withValidation(createMaintenanceSchema)(request);
    // TODO: Call maintenance service
    return createdResponse({ id: "placeholder", ...body, organizationId: ctx.organizationId });
  } catch (error) {
    return errorResponse(error);
  }
});
