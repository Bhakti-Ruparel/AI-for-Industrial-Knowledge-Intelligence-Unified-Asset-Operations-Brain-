// GET /api/knowledge-graph/expand?nodeId=xxx — Expand a node's relationships
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { NotFoundError } from "@/utils/errors";

export const GET = withAuth(async (request: NextRequest, ctx) => {
  try {
    const nodeId = request.nextUrl.searchParams.get("nodeId");
    if (!nodeId) throw new NotFoundError("nodeId parameter required");

    // Try Neo4j first
    try {
      const { findRelated } = await import("@/lib/ai/knowledge-graph/neo4j");
      const graph = await findRelated(nodeId, 2);
      return successResponse({ ...graph, source: "neo4j" });
    } catch {
      // fallback
    }

    // Prisma fallback
    if (!prisma) return successResponse({ nodes: [], edges: [], source: "empty" });

    const edges = await prisma.knowledgeEdge.findMany({
      where: {
        OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }],
      },
      include: {
        fromNode: { select: { id: true, type: true, label: true, properties: true } },
        toNode:   { select: { id: true, type: true, label: true, properties: true } },
      },
    });

    const nodeMap = new Map<string, unknown>();
    const edgesOut = edges.map((e: typeof edges[number]) => {
      nodeMap.set(e.fromNode.id, { id: e.fromNode.id, type: e.fromNode.type, label: e.fromNode.label, properties: e.fromNode.properties ?? {} });
      nodeMap.set(e.toNode.id,   { id: e.toNode.id,   type: e.toNode.type,   label: e.toNode.label,   properties: e.toNode.properties   ?? {} });
      return {
        id: e.id, fromId: e.fromNodeId, toId: e.toNodeId,
        relationship: e.relationship, properties: e.properties ?? {},
      };
    });

    return successResponse({
      nodes:  Array.from(nodeMap.values()),
      edges:  edgesOut,
      source: "prisma",
    });
  } catch (error) {
    return errorResponse(error);
  }
});
