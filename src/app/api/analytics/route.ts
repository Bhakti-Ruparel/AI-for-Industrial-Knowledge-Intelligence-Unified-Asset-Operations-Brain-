// GET /api/analytics — Dashboard metrics
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { getDashboardMetrics, getEquipmentHealthTrend } from "@/services/analytics";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const type = request.nextUrl.searchParams.get("type") || "dashboard";

    if (type === "health-trend") {
      const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
      const data = await getEquipmentHealthTrend(ctx.organizationId, days);
      return successResponse(data);
    }

    const metrics = await getDashboardMetrics(ctx.organizationId);
    return successResponse(metrics);
  } catch (error) {
    return errorResponse(error);
  }
});
