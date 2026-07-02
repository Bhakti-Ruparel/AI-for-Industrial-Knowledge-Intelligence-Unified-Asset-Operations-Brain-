// GET /api/search — Global search across all entities
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { successResponse, errorResponse } from "@/utils/response";
import { embed } from "@/lib/ai/embeddings";
import { searchSimilar } from "@/lib/ai/retriever/qdrant";

export const GET = withAuth(async (request, ctx) => {
  try {
    const query = request.nextUrl.searchParams.get("q") || "";
    const types = request.nextUrl.searchParams.get("types")?.split(",") || [];
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");

    if (!query) return successResponse([], "Provide a search query via ?q=");

    // Semantic search via vector DB
    let vectorResults: any[] = [];
    try {
      const queryVector = await embed(query);
      vectorResults = await searchSimilar(queryVector, limit, {
        must: [{ key: "organizationId", match: { value: ctx.organizationId } }],
      });
    } catch {
      // Qdrant not available — fall back to empty
    }

    // TODO: Add keyword search via Prisma full-text when DB connected
    const results = vectorResults.map((r) => ({
      id: r.id,
      type: r.payload.type || "document",
      title: r.payload.documentTitle || r.payload.label || "Unknown",
      snippet: (r.payload.content as string || "").substring(0, 200),
      relevance: r.score,
    }));

    return successResponse(results, `Found ${results.length} results`);
  } catch (error) {
    return errorResponse(error);
  }
});
