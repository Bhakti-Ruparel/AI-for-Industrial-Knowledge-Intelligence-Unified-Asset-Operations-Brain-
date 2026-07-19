// GET /api/incidents — List incidents
// POST /api/incidents — Create incident
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation, validateQuery } from "@/middlewares/with-validation";
import { paginationSchema, createIncidentSchema } from "@/validators";
import { getIncidentList, createIncident } from "@/services/incident";
import { createdResponse, paginatedResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const params   = validateQuery(paginationSchema, request.nextUrl.searchParams);
    const status   = request.nextUrl.searchParams.get("status")   || undefined;
    const severity = request.nextUrl.searchParams.get("severity") || undefined;
    const search   = request.nextUrl.searchParams.get("search")   || undefined;

    const result = await getIncidentList(ctx.organizationId, {
      ...params, status, severity, search,
    });
    return paginatedResponse(result.data, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
});

export const POST = withAuth(async (request, ctx) => {
  try {
    const body   = await withValidation(createIncidentSchema)(request);
    const record = await createIncident(body, ctx.organizationId, ctx.userId);
    return createdResponse(record, "Incident reported");
  } catch (error) {
    return errorResponse(error);
  }
});
