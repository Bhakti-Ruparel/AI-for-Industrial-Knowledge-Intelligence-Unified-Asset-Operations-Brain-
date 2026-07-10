// POST /api/booking — Create booking / lead
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation } from "@/middlewares/with-validation";
import { createBookingSchema } from "@/validators";
import { createBooking } from "@/services/booking";
import { createdResponse, errorResponse } from "@/utils/response";

export const POST = withAuth(async (request, ctx) => {
  try {
    const body = await withValidation(createBookingSchema)(request);
    const result = await createBooking({ ...body, organizationId: ctx.organizationId, userId: ctx.userId });
    return createdResponse(result, "Booking created successfully");
  } catch (error) {
    return errorResponse(error);
  }
});
