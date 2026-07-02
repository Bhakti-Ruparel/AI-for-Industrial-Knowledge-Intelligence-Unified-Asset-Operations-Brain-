// GET /api/knowledge-graph — Search graph
// POST /api/knowledge-graph — Create node
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation } from "@/middlewares/with-validation";
import { createNodeSchema, searchSchema } from "@/validators";
import { createNode, searchNodes } from "@/services/graph";
import { successResponse, createdResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const query = request.nextUrl.searchParams.get("query") || "";
    if (!query) return successResponse([], "Provide a query parameter");
    const results = await searchNodes(query, ctx.organizationId);
    return successResponse(results);
  } catch (error) {
    return errorResponse(error);
  }
});

export const POST = withAuth(async (request, ctx) => {
  try {
    const body = await withValidation(createNodeSchema)(request);
    const node = await createNode(body.type, body.label, ctx.organizationId, body.properties);
    return createdResponse(node);
  } catch (error) {
    return errorResponse(error);
  }
});
