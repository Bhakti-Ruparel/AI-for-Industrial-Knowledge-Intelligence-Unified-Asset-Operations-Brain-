// GET  /api/documents — List documents with full filtering + pagination
import { withAuth }       from "@/middlewares/with-auth";
import { validateQuery }  from "@/middlewares/with-validation";
import { documentQuerySchema } from "@/validators";
import { getDocuments }   from "@/services/document";
import { paginatedResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const params = validateQuery(documentQuerySchema, request.nextUrl.searchParams);
    const result = await getDocuments(ctx.organizationId, params);
    return paginatedResponse(result.data, result.total, result.page, result.limit);
  } catch (error) {
    return errorResponse(error);
  }
});
