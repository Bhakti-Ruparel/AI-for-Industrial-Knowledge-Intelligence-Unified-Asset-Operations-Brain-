// GET /api/notifications — List notifications
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    // TODO: Query from DB when connected
    return successResponse([
      { id: "1", title: "Maintenance Overdue", message: "SURFGRIND-600 maintenance is 22 days overdue", type: "WARNING", read: false, createdAt: new Date().toISOString() },
      { id: "2", title: "New Lead", message: "Hot lead received - Automotive Die Mould", type: "SUCCESS", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "3", title: "Compliance Alert", message: "ISO 9001 audit due in 15 days", type: "INFO", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    ]);
  } catch (error) {
    return errorResponse(error);
  }
});
