// GET /api/analytics — Dashboard metrics + chart data
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import {
  getDashboardMetrics,
  getEquipmentHealthTrend,
  getIncidentTrend,
  getDocsByType,
  getMaintenanceCost,
} from "@/services/analytics";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const type  = request.nextUrl.searchParams.get("type") || "dashboard";
    const days  = parseInt(request.nextUrl.searchParams.get("days")   || "30");
    const months = parseInt(request.nextUrl.searchParams.get("months") || "6");

    switch (type) {
      case "health-trend":
        return successResponse(await getEquipmentHealthTrend(ctx.organizationId, days));
      case "incident-trend":
        return successResponse(await getIncidentTrend(ctx.organizationId, days));
      case "docs-by-type":
        return successResponse(await getDocsByType(ctx.organizationId));
      case "maintenance-cost":
        return successResponse(await getMaintenanceCost(ctx.organizationId, months));
      default:
        return successResponse(await getDashboardMetrics(ctx.organizationId));
    }
  } catch (error) {
    return errorResponse(error);
  }
});
