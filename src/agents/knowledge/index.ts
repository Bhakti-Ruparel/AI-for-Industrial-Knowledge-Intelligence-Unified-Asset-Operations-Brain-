// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Agent — Fetches real data from Prisma, uses LLM to synthesize answers
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { synthesize } from "@/lib/ai/llm-synthesizer";
import { getSupabaseServer } from "@/lib/database/supabase/client";
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

  // ── ALWAYS search document content for the answer ───────────────────────
  // This is the primary knowledge source — search by title keywords + document chunks
  const terms = extractSearchTerms(query);
  if (terms.length > 0) {
    // Search documents by title
    const matchedDocs = await (prisma as any).document.findMany({
      where: {
        organizationId, deletedAt: null,
        OR: terms.map((t: string) => ({ title: { contains: t, mode: "insensitive" } })),
      },
      select: { id: true, title: true, type: true, status: true, size: true, filename: true, summary: true, extractedText: true, createdAt: true, storagePath: true, bucketName: true, mimeType: true },
      take: 3,
    }).catch(() => []);

    if (matchedDocs.length > 0) {
      context.matchedDocuments = matchedDocs;

      // Try to get document text content
      let textContent = "";

      // Option 1: Use extractedText if available and valid
      for (const d of matchedDocs) {
        if (d.extractedText && d.extractedText.length > 100 && !d.extractedText.includes("pending") && !d.extractedText.includes("integrate pdf")) {
          textContent += `=== ${d.title} ===\n${d.extractedText.slice(0, 3000)}\n\n`;
        }
      }

      // Option 2: Search document chunks table
      if (!textContent) {
        const chunks = await (prisma as any).documentChunk.findMany({
          where: {
            document: { organizationId, deletedAt: null, id: { in: matchedDocs.map((d: any) => d.id) } },
          },
          select: { content: true },
          orderBy: { chunkIndex: "asc" },
          take: 10,
        }).catch(() => []);

        if (chunks.length > 0) {
          textContent = chunks.map((c: any) => c.content).join("\n\n");
        }
      }

      // Option 3: Live extract from storage (on-demand)
      if (!textContent && matchedDocs[0]?.storagePath && matchedDocs[0]?.mimeType === "application/pdf") {
        try {
          const { extractText } = await import("@/lib/ai/ocr");
          const supabase = getSupabaseServer();
          const doc = matchedDocs[0];
          logger.info({ docId: doc.id, path: doc.storagePath, bucket: doc.bucketName }, "Downloading PDF for live extraction");
          
          const { data: fileData, error: dlError } = await supabase.storage
            .from(doc.bucketName || "industrial-documents")
            .download(doc.storagePath);

          if (dlError) {
            logger.error({ error: dlError.message }, "Supabase download failed");
          } else if (fileData) {
            const buffer = Buffer.from(await fileData.arrayBuffer());
            logger.info({ bufferSize: buffer.length }, "PDF downloaded, extracting text");
            
            const ocrResult = await extractText(buffer, doc.mimeType);
            logger.info({ textLength: ocrResult.text.length, confidence: ocrResult.confidence, first100: ocrResult.text.slice(0, 100) }, "OCR result");
            
            if (ocrResult.text && ocrResult.confidence > 0) {
              textContent = `=== ${doc.title} ===\n${ocrResult.text.slice(0, 3000)}`;
              // Save extracted text to DB for future queries
              await (prisma as any).document.update({
                where: { id: doc.id },
                data: { extractedText: ocrResult.text, pages: ocrResult.pages, ocrStatus: "COMPLETE", status: "INDEXED" },
              }).catch((e: any) => logger.warn({ e: e.message }, "Failed to save extracted text to DB"));
            }
          }
        } catch (e: any) {
          logger.error({ error: e?.message, stack: e?.stack?.slice(0, 300) }, "Live PDF extraction failed");
        }
      }

      if (textContent) {
        context.documentContent = textContent;
      }
    }
  }

  // Fetch documents list if query explicitly asks about documents
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

  return context;
}

// ── Build structured fallback when LLM is unavailable ─────────────────────────

function buildFallback(query: string, context: Record<string, any>): string {
  const lines: string[] = [];

  // If we have actual document content, show relevant excerpts
  if (context.documentContent && !context.documentContent.includes("pending") && !context.documentContent.includes("integrate pdf") && context.documentContent.length > 100) {
    const docTitles = context.matchedDocuments?.map((d: any) => d.title).filter(Boolean) ?? [];
    if (docTitles.length) {
      lines.push(`📄 Found in: ${docTitles.join(", ")}\n`);
    }
    // Show first 800 chars of content as the answer
    const content = context.documentContent.slice(0, 800);
    lines.push(content);
    if (context.documentContent.length > 800) {
      lines.push("\n\n(document continues — ask a more specific question for detailed info)");
    }
    return lines.join("\n");
  }

  if (context.matchedDocuments?.length) {
    const docs = context.matchedDocuments;
    if (docs.length === 1) {
      const d = docs[0];
      lines.push(`📄 ${d.title}\n`);
      lines.push(`Type: ${String(d.type).replace("_", " ")}`);
      lines.push(`File: ${d.filename} (${(d.size / 1024).toFixed(0)} KB)`);
      lines.push(`Uploaded: ${new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`);
      lines.push("");
      lines.push("I found this document but its text hasn't been fully extracted yet. The content will be available after processing completes. Please try again shortly or re-upload the file.");
    } else {
      lines.push(`Found ${docs.length} matching documents:\n`);
      docs.forEach((d: any, i: number) => lines.push(`${i + 1}. ${d.title} — ${String(d.type).replace("_", " ")}`));
      lines.push("\nDocument text is still being processed. Try again in a moment.");
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
