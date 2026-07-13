// GET /api/documents/stats — Document counts for dashboard
import { withAuth }          from "@/middlewares/with-auth";
import { getDocumentStats }  from "@/services/document";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (_request, ctx) => {
  try {
    const stats = await getDocumentStats(ctx.organizationId);
    return successResponse(stats);
  } catch (error) {
    return errorResponse(error);
  }
});
