// GET  /api/maintenance — List maintenance records
// POST /api/maintenance — Create maintenance record
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation, validateQuery } from "@/middlewares/with-validation";
import { paginationSchema, createMaintenanceSchema } from "@/validators";
import { getMaintenanceList, createMaintenanceRecord } from "@/services/maintenance";
import { paginatedResponse, createdResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request: NextRequest, ctx) => {
  try {
    const params = validateQuery(paginationSchema, request.nextUrl.searchParams);
    const status   = request.nextUrl.searchParams.get("status")   || undefined;
    const priority = request.nextUrl.searchParams.get("priority") || undefined;
    const search   = request.nextUrl.searchParams.get("search")   || undefined;

    const result = await getMaintenanceList(ctx.organizationId, {
      ...params, status, priority, search,
    });
    return paginatedResponse(result.data, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
});

export const POST = withAuth(async (request: NextRequest, ctx) => {
  try {
    const body   = await withValidation(createMaintenanceSchema)(request);
    const record = await createMaintenanceRecord(body, ctx.organizationId);
    return createdResponse(record, "Maintenance record created");
  } catch (error) {
    return errorResponse(error);
  }
});
