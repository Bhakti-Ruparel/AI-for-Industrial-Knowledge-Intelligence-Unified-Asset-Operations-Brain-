// GET /api/knowledge-graph — Search graph (Neo4j → Prisma nodes → auto-generated from entities)
// POST /api/knowledge-graph — Create node
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation } from "@/middlewares/with-validation";
import { createNodeSchema } from "@/validators";
import { createNode, searchNodes } from "@/services/graph";
import { prisma } from "@/lib/prisma";
import { successResponse, createdResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const query = request.nextUrl.searchParams.get("query") || "";

    // Try graph service first (Neo4j → Prisma knowledge_nodes)
    const graphResults = await searchNodes(query || "all", ctx.organizationId);
    if (graphResults.length > 0) {
      return successResponse(graphResults);
    }

    // If no knowledge_nodes exist, auto-generate from real DB entities
    if (!prisma) return successResponse([]);

    const nodes: { id: string; type: string; label: string; properties: Record<string, unknown> }[] = [];

    // Get equipment as nodes
    const equipment = await (prisma as any).equipment.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, name: true, model: true, status: true, healthScore: true, location: true },
      take: 20,
    });
    for (const eq of equipment) {
      nodes.push({
        id: eq.id,
        type: "EQUIPMENT",
        label: eq.name,
        properties: { model: eq.model, status: eq.status, healthScore: eq.healthScore, location: eq.location },
      });
    }

    // Get documents as nodes
    const documents = await (prisma as any).document.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, title: true, type: true, status: true, mimeType: true },
      take: 20,
    });
    for (const doc of documents) {
      nodes.push({
        id: doc.id,
        type: "DOCUMENT",
        label: doc.title,
        properties: { docType: doc.type, status: doc.status, mimeType: doc.mimeType },
      });
    }

    // Get incidents as nodes
    const incidents = await (prisma as any).incident.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, title: true, severity: true, status: true },
      take: 10,
    });
    for (const inc of incidents) {
      nodes.push({
        id: inc.id,
        type: "INCIDENT",
        label: inc.title,
        properties: { severity: inc.severity, status: inc.status },
      });
    }

    // Get compliance records as regulation nodes
    const compliance = await (prisma as any).complianceRecord.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, regulation: true, category: true, status: true, score: true },
      take: 10,
    });
    for (const c of compliance) {
      nodes.push({
        id: c.id,
        type: "REGULATION",
        label: c.regulation,
        properties: { category: c.category, status: c.status, score: c.score },
      });
    }

    // Get users as person nodes
    const users = await (prisma as any).user.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, name: true, role: true, email: true },
      take: 10,
    });
    for (const u of users) {
      nodes.push({
        id: u.id,
        type: "PERSON",
        label: u.name,
        properties: { role: u.role, email: u.email },
      });
    }

    // Filter by query if provided
    const filtered = query && query !== "all"
      ? nodes.filter((n) =>
          n.label.toLowerCase().includes(query.toLowerCase()) ||
          n.type.toLowerCase().includes(query.toLowerCase())
        )
      : nodes;

    return successResponse(filtered);
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
