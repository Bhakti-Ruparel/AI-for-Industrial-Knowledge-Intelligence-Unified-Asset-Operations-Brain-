// GET /api/knowledge-graph/nodes — Full graph for the org (nodes + edges)
// Tries Neo4j first; falls back to Prisma KnowledgeNode table if Neo4j is down
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request: NextRequest, ctx) => {
  try {
    const type   = request.nextUrl.searchParams.get("type") ?? "";
    const search = request.nextUrl.searchParams.get("search") ?? "";
    const limit  = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "200"), 500);

    // ── Try Neo4j ──────────────────────────────────────────────────────────
    try {
      const { findRelated, searchGraph } = await import("@/lib/ai/knowledge-graph/neo4j");

      if (search) {
        const nodes = await searchGraph(search, ctx.organizationId);
        return successResponse({ nodes, edges: [], source: "neo4j" });
      }

      // Get a seed node of the requested type then expand
      if (type) {
        const seedNodes = await searchGraph(type, ctx.organizationId);
        if (seedNodes.length > 0) {
          const graph = await findRelated(seedNodes[0].id, 3);
          return successResponse({ ...graph, source: "neo4j" });
        }
      }
    } catch {
      // Neo4j not configured — fall through to Prisma
    }

    // ── Fallback: Prisma KnowledgeNode ─────────────────────────────────────
    if (!prisma) return successResponse({ nodes: [], edges: [], source: "empty" });

    const where: Record<string, unknown> = {
      organizationId: ctx.organizationId,
      deletedAt: null,
    };
    if (type)   where["type"]  = type.toUpperCase();
    if (search) where["label"] = { contains: search, mode: "insensitive" };

    const [dbNodes, dbEdges] = await Promise.all([
      prisma.knowledgeNode.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, type: true, label: true, properties: true,
          neo4jId: true, equipmentId: true, createdAt: true,
        },
      }),
      prisma.knowledgeEdge.findMany({
        where: {
          fromNode: { organizationId: ctx.organizationId, deletedAt: null },
        },
        take: limit * 2,
        select: {
          id: true, fromNodeId: true, toNodeId: true,
          relationship: true, weight: true, properties: true,
        },
      }),
    ]);

    return successResponse({
      nodes: dbNodes.map((n: typeof dbNodes[number]) => ({
        id:         n.id,
        type:       n.type,
        label:      n.label,
        properties: (n.properties as Record<string, unknown>) ?? {},
        neo4jId:    n.neo4jId,
      })),
      edges: dbEdges.map((e: typeof dbEdges[number]) => ({
        id:           e.id,
        fromId:       e.fromNodeId,
        toId:         e.toNodeId,
        relationship: e.relationship,
        properties:   (e.properties as Record<string, unknown>) ?? {},
      })),
      source: "prisma",
    });
  } catch (error) {
    return errorResponse(error);
  }
});
