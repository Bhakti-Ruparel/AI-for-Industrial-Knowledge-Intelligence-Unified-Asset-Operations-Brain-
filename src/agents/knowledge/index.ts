// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Agent — Fetches real data from Prisma, uses LLM to synthesize answers
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { synthesize } from "@/lib/ai/llm-synthesizer";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/utils/logger";

const logger = createLogger("knowledge-agent");

const SYSTEM_PROMPT = `You are PlantMind AI, an industrial plant intelligence assistant. Answer the user's question based ONLY on the provided database data. Be concise, helpful, and format responses with markdown. If data is empty, say so clearly. Never make up information.`;

export const knowledgeAgent: AgentDefinition = {
  id: "knowledge",
  name: "Knowledge Agent",
  description: "Retrieves information from the knowledge base — documents, equipment, and general queries",
  capabilities: ["search", "explain", "summarize", "list_documents", "equipment_info"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;

    try {
      logger.info({ query: query.slice(0, 80) }, "Knowledge agent executing");

      if (!prisma) {
        return reply("Database is not available. Please check your connection.", 0.1);
      }

      // Fetch relevant data based on what seems to be asked
      const context = await gatherContext(query, organizationId);

      // Build a formatted fallback from the raw data
      const fallback = buildFallback(query, context);

      // Try LLM synthesis — if it fails, fallback is returned
      const response = await synthesize({
        question: query,
        systemPrompt: SYSTEM_PROMPT,
        data: context,
        fallback,
      });

      return reply(response, 0.85, buildSources(context));
    } catch (error) {
      logger.error({ error }, "Knowledge agent failed");
      return reply("I couldn't process your request. Try asking about documents, equipment, or maintenance.", 0.1);
    }
  },
};

// ── Gather relevant context from DB ───────────────────────────────────────────

async function gatherContext(query: string, organizationId: string) {
  const lower = query.toLowerCase();
  const context: Record<string, any> = {};

  // Always fetch a quick summary
  const [eqCount, docCount, incCount, maintCount] = await Promise.all([
    (prisma as any).equipment.count({ where: { organizationId, deletedAt: null } }).catch(() => 0),
    (prisma as any).document.count({ where: { organizationId, deletedAt: null } }).catch(() => 0),
    (prisma as any).incident.count({ where: { organizationId, deletedAt: null, status: { in: ["OPEN", "INVESTIGATING"] } } }).catch(() => 0),
    (prisma as any).maintenanceRecord.count({ where: { organizationId, deletedAt: null, status: { in: ["OVERDUE", "SCHEDULED"] } } }).catch(() => 0),
  ]);
  context.summary = { equipment: eqCount, documents: docCount, openIncidents: incCount, pendingMaintenance: maintCount };

  // Fetch documents if query relates
  if (matchesAny(lower, ["document", "file", "upload", "pdf", "manual", "report", "knowledge", "indexed", "latest", "recent"])) {
    context.documents = await (prisma as any).document.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, title: true, type: true, status: true, size: true, filename: true, createdAt: true, summary: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }).catch(() => []);
  }

  // Fetch equipment if query relates
  if (matchesAny(lower, ["equipment", "machine", "health", "status", "operational", "critical", "offline"])) {
    context.equipment = await (prisma as any).equipment.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true, model: true, status: true, healthScore: true, location: true },
      orderBy: { healthScore: "asc" },
      take: 10,
    }).catch(() => []);
  }

  // Fetch incidents if query relates
  if (matchesAny(lower, ["incident", "failure", "open", "critical", "alert", "problem"])) {
    context.incidents = await (prisma as any).incident.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, title: true, severity: true, status: true, reportedAt: true },
      orderBy: { reportedAt: "desc" },
      take: 5,
    }).catch(() => []);
  }

  // Fetch maintenance if query relates
  if (matchesAny(lower, ["maintenance", "overdue", "schedule", "task", "service", "repair"])) {
    context.maintenance = await (prisma as any).maintenanceRecord.findMany({
      where: { organizationId, deletedAt: null },
      include: { equipment: { select: { name: true } } },
      orderBy: [{ status: "asc" }, { scheduledDate: "asc" }],
      take: 10,
    }).catch(() => []);
  }

  // Fetch compliance if query relates
  if (matchesAny(lower, ["compliance", "regulation", "iso", "audit", "factory", "peso", "oisd"])) {
    context.compliance = await (prisma as any).complianceRecord.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, regulation: true, category: true, status: true, score: true, nextAuditDate: true },
      take: 10,
    }).catch(() => []);
  }

  // Specific document search by name
  const terms = extractSearchTerms(query);
  if (terms.length > 0 && !context.documents?.length) {
    context.matchedDocuments = await (prisma as any).document.findMany({
      where: {
        organizationId, deletedAt: null,
        OR: terms.map((t: string) => ({ title: { contains: t, mode: "insensitive" } })),
      },
      select: { id: true, title: true, type: true, status: true, size: true, filename: true, summary: true, createdAt: true },
      take: 5,
    }).catch(() => []);
  }

  return context;
}

// ── Build structured fallback when LLM is unavailable ─────────────────────────

function buildFallback(query: string, context: Record<string, any>): string {
  const lines: string[] = [];

  if (context.matchedDocuments?.length) {
    const docs = context.matchedDocuments;
    if (docs.length === 1) {
      const d = docs[0];
      lines.push(`**📄 ${d.title}**\n`);
      lines.push(`- **Type:** ${String(d.type).replace("_", " ")}`);
      lines.push(`- **Status:** ${String(d.status).toLowerCase()}`);
      lines.push(`- **File:** ${d.filename} (${(d.size / 1024).toFixed(0)} KB)`);
      lines.push(`- **Uploaded:** ${new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`);
      if (d.summary) lines.push(`\n**Summary:** ${d.summary}`);
    } else {
      lines.push(`**Found ${docs.length} documents:**\n`);
      docs.forEach((d: any, i: number) => lines.push(`${i + 1}. **${d.title}** — ${String(d.type).replace("_", " ")} · ${String(d.status).toLowerCase()}`));
    }
    return lines.join("\n");
  }

  if (context.documents?.length) {
    lines.push(`**📄 ${context.documents.length} Documents in Knowledge Base:**\n`);
    context.documents.slice(0, 8).forEach((d: any, i: number) => {
      const icon = d.status === "INDEXED" ? "✅" : d.status === "PROCESSING" ? "⏳" : "📤";
      const date = new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      lines.push(`${i + 1}. ${icon} **${d.title}** — ${String(d.type).replace("_", " ")} · ${(d.size / 1024).toFixed(0)} KB · ${date}`);
    });
    return lines.join("\n");
  }

  if (context.equipment?.length) {
    lines.push(`**🏭 ${context.equipment.length} Equipment:**\n`);
    const icons: Record<string, string> = { OPERATIONAL: "🟢", MAINTENANCE: "🟡", CRITICAL: "🔴", OFFLINE: "⚫" };
    context.equipment.forEach((eq: any, i: number) => {
      lines.push(`${i + 1}. ${icons[eq.status] ?? "⚪"} **${eq.name}** (${eq.model}) — Health: ${eq.healthScore}%${eq.location ? ` · ${eq.location}` : ""}`);
    });
    return lines.join("\n");
  }

  if (context.incidents?.length) {
    lines.push(`**⚠️ ${context.incidents.length} Incidents:**\n`);
    context.incidents.forEach((inc: any, i: number) => {
      const icon = inc.severity === "CRITICAL" ? "🔴" : inc.severity === "HIGH" ? "🟠" : "🟡";
      lines.push(`${i + 1}. ${icon} **${inc.title}** — ${inc.severity} · ${String(inc.status).replace("_", " ")}`);
    });
    return lines.join("\n");
  }

  if (context.maintenance?.length) {
    lines.push(`**🔧 ${context.maintenance.length} Maintenance Tasks:**\n`);
    context.maintenance.forEach((m: any, i: number) => {
      lines.push(`${i + 1}. **${m.equipment?.name ?? m.equipmentId}** — ${m.title} · ${String(m.status).replace("_", " ")} · ${m.priority}`);
    });
    return lines.join("\n");
  }

  if (context.compliance?.length) {
    lines.push(`**📋 ${context.compliance.length} Compliance Records:**\n`);
    context.compliance.forEach((c: any, i: number) => {
      const icon = c.status === "COMPLIANT" ? "✅" : c.status === "NON_COMPLIANT" ? "🔴" : "⚠️";
      lines.push(`${i + 1}. ${icon} **${c.regulation}** — ${String(c.status).replace("_", " ")}${c.score ? ` · Score: ${c.score}%` : ""}`);
    });
    return lines.join("\n");
  }

  // System overview fallback
  const s = context.summary;
  lines.push("**📊 System Overview:**\n");
  lines.push(`🏭 Equipment: ${s.equipment} registered`);
  lines.push(`📄 Documents: ${s.documents} in knowledge base`);
  lines.push(`⚠️ Open Incidents: ${s.openIncidents}`);
  lines.push(`🔧 Pending Maintenance: ${s.pendingMaintenance}`);
  lines.push("\nAsk me anything — *\"show documents\"*, *\"equipment health\"*, *\"overdue maintenance\"*, *\"compliance status\"*");
  return lines.join("\n");
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

function extractSearchTerms(query: string): string[] {
  const stopWords = new Set(["tell", "me", "about", "the", "what", "is", "show", "find", "document", "documents", "explain", "describe", "can", "you", "a", "an", "are", "latest", "recent", "list", "all", "give", "get"]);
  return query.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
}

function buildSources(context: Record<string, any>) {
  const docs = context.matchedDocuments ?? context.documents ?? [];
  return docs.slice(0, 3).map((d: any) => ({
    documentId: d.id,
    title: d.title,
    chunk: d.summary || d.filename || "",
    relevance: 0.85,
  }));
}

function reply(response: string, confidence: number, sources: any[] = []): AgentOutput {
  return { response, confidence, sources, actions: [] };
}
