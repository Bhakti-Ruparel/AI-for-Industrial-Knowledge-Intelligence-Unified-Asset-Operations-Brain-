// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Agent — RAG-powered + direct Prisma document lookup
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { executeRAG } from "@/lib/ai/rag/pipeline";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/utils/logger";

const logger = createLogger("knowledge-agent");

export const knowledgeAgent: AgentDefinition = {
  id: "knowledge",
  name: "Knowledge Agent",
  description: "Retrieves and synthesizes information from the industrial knowledge base using RAG",
  capabilities: ["search", "explain", "summarize", "recommend_documents"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    try {
      logger.info({ query: input.query.slice(0, 80), orgId: input.organizationId }, "Knowledge agent executing");

      // ── Check if this is a document-specific query ──────────────────────
      const lower = input.query.toLowerCase();
      const isDocQuery = lower.includes("document") || lower.includes("tell me about") ||
        lower.includes("what is") || lower.includes("explain") || lower.includes("describe") ||
        lower.includes("show me") || lower.includes("find");

      // Try direct document lookup from Prisma first
      if (prisma && isDocQuery) {
        const docResult = await tryDocumentLookup(input.query, input.organizationId);
        if (docResult) return docResult;
      }

      // Fall through to RAG pipeline
      const ragResult = await executeRAG({
        question:           input.query,
        organizationId:     input.organizationId,
        conversationHistory: input.conversationHistory,
      });

      // If RAG returned the generic fallback, try document lookup as last resort
      if (ragResult.confidence < 0.3 && prisma) {
        const docResult = await tryDocumentLookup(input.query, input.organizationId);
        if (docResult) return docResult;
      }

      return {
        response:   ragResult.answer,
        confidence: ragResult.confidence,
        sources:    ragResult.sources,
        actions: [
          { type: "open_graph",    label: "View in Knowledge Graph" },
          { type: "related_docs",  label: "Show Related Documents"  },
          { type: "upload_docs",   label: "Upload Documents"        },
        ],
      };
    } catch (error) {
      logger.error({ error }, "Knowledge agent failed");
      return {
        response: (
          "I encountered an error processing your request.\n\n" +
          "**Possible causes:**\n" +
          "- No documents indexed yet (upload documents in the Knowledge Base page)\n" +
          "- Qdrant vector DB is not reachable (check QDRANT_URL)\n" +
          "- Hugging Face API key missing (check HUGGINGFACE_API_KEY)\n\n" +
          "For operational data (maintenance, incidents, compliance), use the specialized agents."
        ),
        confidence: 0.1,
        sources:    [],
        actions: [
          { type: "upload_docs",  label: "Upload Documents" },
          { type: "view_docs",    label: "Knowledge Base"   },
        ],
      };
    }
  },
};

// ── Direct document lookup from Prisma ────────────────────────────────────────
async function tryDocumentLookup(query: string, organizationId: string): Promise<AgentOutput | null> {
  if (!prisma) return null;

  try {
    // Extract search terms (remove common words)
    const stopWords = new Set(["tell", "me", "about", "the", "what", "is", "show", "find", "document", "explain", "describe", "can", "you", "a", "an"]);
    const terms = query.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    if (terms.length === 0) return null;

    // Search documents by title match
    const docs = await (prisma as any).document.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: terms.map((term) => ({
          title: { contains: term, mode: "insensitive" },
        })),
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        filename: true,
        size: true,
        pages: true,
        summary: true,
        extractedText: true,
        mimeType: true,
        createdAt: true,
        equipment: { select: { name: true } },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (docs.length === 0) return null;

    // Format response
    const lines: string[] = [];

    if (docs.length === 1) {
      const doc = docs[0];
      lines.push(`**📄 ${doc.title}**\n`);
      lines.push(`| Property | Value |`);
      lines.push(`|----------|-------|`);
      lines.push(`| **Type** | ${String(doc.type).replace("_", " ")} |`);
      lines.push(`| **Status** | ${String(doc.status).toLowerCase()} |`);
      lines.push(`| **File** | ${doc.filename} |`);
      lines.push(`| **Size** | ${(doc.size / 1024).toFixed(0)} KB |`);
      if (doc.pages) lines.push(`| **Pages** | ${doc.pages} |`);
      if (doc.equipment?.name) lines.push(`| **Equipment** | ${doc.equipment.name} |`);
      lines.push(`| **Uploaded** | ${new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} |`);

      if (doc.summary) {
        lines.push(`\n**Summary:**\n${doc.summary}`);
      } else if (doc.extractedText && !doc.extractedText.includes("pending")) {
        lines.push(`\n**Preview:**\n${doc.extractedText.slice(0, 500)}…`);
      } else {
        lines.push(`\n*This document hasn't been fully processed yet. Text extraction is pending.*`);
      }
    } else {
      lines.push(`**Found ${docs.length} matching documents:**\n`);
      docs.forEach((doc: any, i: number) => {
        const size = `${(doc.size / 1024).toFixed(0)} KB`;
        const status = String(doc.status).toLowerCase();
        lines.push(`${i + 1}. **${doc.title}** — ${String(doc.type).replace("_", " ")} · ${size} · ${status}`);
      });
      lines.push(`\nAsk me about a specific document by name for more details.`);
    }

    return {
      response:   lines.join("\n"),
      confidence: 0.85,
      sources:    docs.map((d: any) => ({
        documentId: d.id,
        title:      d.title,
        chunk:      d.summary || `${d.type} document: ${d.filename}`,
        relevance:  0.9,
      })),
      actions: [
        { type: "view_document", label: "Open Document" },
        { type: "open_graph",    label: "View in Knowledge Graph" },
      ],
    };
  } catch (e) {
    logger.warn({ e }, "Document lookup failed");
    return null;
  }
}
