// GET /api/equipment — List equipment
// POST /api/equipment — Create equipment
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation, validateQuery } from "@/middlewares/with-validation";
import { paginationSchema, createEquipmentSchema } from "@/validators";
import { getEquipmentList, createEquipment } from "@/services/equipment";
import { successResponse, createdResponse, paginatedResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const params = validateQuery(paginationSchema, request.nextUrl.searchParams);
    const result = await getEquipmentList(ctx.organizationId, params);
    return paginatedResponse(result.data, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
});

export const POST = withAuth(async (request, ctx) => {
  try {
    const body = await withValidation(createEquipmentSchema)(request);
    const equipment = await createEquipment(body, ctx.organizationId);
    return createdResponse(equipment);
  } catch (error) {
    return errorResponse(error);
  }
});
