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
    // Skip for "all" — that's a UI signal meaning "load everything"
    if (query && query !== "all") {
      const graphResults = await searchNodes(query, ctx.organizationId);
      if (graphResults.length > 0) {
        return successResponse({ nodes: graphResults, edges: [] });
      }
    }

    // Auto-generate nodes + edges from real DB entities
    if (!prisma) return successResponse({ nodes: [], edges: [] });

    const nodes: { id: string; type: string; label: string; properties: Record<string, unknown> }[] = [];
    const edges: { from: string; to: string; label: string }[] = [];

    // ── Equipment ─────────────────────────────────────────────────────────
    const equipment = await (prisma as any).equipment.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, name: true, model: true, status: true, healthScore: true, location: true, categoryId: true },
      take: 20,
    });
    for (const eq of equipment) {
      nodes.push({
        id: eq.id, type: "EQUIPMENT", label: eq.name,
        properties: { model: eq.model, status: eq.status, healthScore: eq.healthScore, location: eq.location },
      });
    }

    // ── Documents ─────────────────────────────────────────────────────────
    const documents = await (prisma as any).document.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, title: true, type: true, status: true, mimeType: true, equipmentId: true, uploadedById: true },
      take: 20,
    });
    for (const doc of documents) {
      nodes.push({
        id: doc.id, type: "DOCUMENT", label: doc.title,
        properties: { docType: doc.type, status: doc.status, mimeType: doc.mimeType },
      });
      // Document → Equipment edge
      if (doc.equipmentId) {
        edges.push({ from: doc.id, to: doc.equipmentId, label: "Documents" });
      }
      // User → Document edge
      if (doc.uploadedById) {
        edges.push({ from: doc.uploadedById, to: doc.id, label: "Uploaded" });
      }
    }

    // ── Incidents ─────────────────────────────────────────────────────────
    const incidents = await (prisma as any).incident.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, title: true, severity: true, status: true, equipmentId: true, reportedById: true },
      take: 15,
    });
    for (const inc of incidents) {
      nodes.push({
        id: inc.id, type: "INCIDENT", label: inc.title,
        properties: { severity: inc.severity, status: inc.status },
      });
      // Incident → Equipment edge
      if (inc.equipmentId) {
        edges.push({ from: inc.id, to: inc.equipmentId, label: "Affects" });
      }
      // User → Incident edge
      if (inc.reportedById) {
        edges.push({ from: inc.reportedById, to: inc.id, label: "Reported" });
      }
    }

    // ── Compliance records as Regulation nodes ─────────────────────────────
    const compliance = await (prisma as any).complianceRecord.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, regulation: true, category: true, status: true, score: true },
      take: 10,
    });
    for (const c of compliance) {
      nodes.push({
        id: c.id, type: "REGULATION", label: c.regulation,
        properties: { category: c.category, status: c.status, score: c.score },
      });
      // Equipment → Regulation edges (all equipment governed by all regulations)
      for (const eq of equipment) {
        edges.push({ from: eq.id, to: c.id, label: "Governed By" });
      }
    }

    // ── Maintenance records ───────────────────────────────────────────────
    const maintenance = await (prisma as any).maintenanceRecord.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null, status: { not: "COMPLETED" } },
      select: { id: true, title: true, type: true, status: true, priority: true, equipmentId: true, assignedToId: true },
      take: 10,
    });
    for (const m of maintenance) {
      nodes.push({
        id: m.id, type: "MAINTENANCE", label: m.title,
        properties: { type: m.type, status: m.status, priority: m.priority },
      });
      // Maintenance → Equipment edge
      if (m.equipmentId) {
        edges.push({ from: m.id, to: m.equipmentId, label: "Scheduled For" });
      }
      // User → Maintenance edge
      if (m.assignedToId) {
        edges.push({ from: m.assignedToId, to: m.id, label: "Assigned To" });
      }
    }

    // ── Users as Person nodes ──────────────────────────────────────────────
    const users = await (prisma as any).user.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, name: true, role: true, email: true },
      take: 10,
    });
    for (const u of users) {
      nodes.push({
        id: u.id, type: "PERSON", label: u.name,
        properties: { role: u.role, email: u.email },
      });
    }

    // Filter by search query if provided (not "all")
    const nodeIds = new Set(nodes.map((n) => n.id));
    const filteredNodes = query && query !== "all"
      ? nodes.filter((n) =>
          n.label.toLowerCase().includes(query.toLowerCase()) ||
          n.type.toLowerCase().includes(query.toLowerCase())
        )
      : nodes;

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = edges.filter(
      (e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
    );

    return successResponse({ nodes: filteredNodes, edges: filteredEdges });
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
