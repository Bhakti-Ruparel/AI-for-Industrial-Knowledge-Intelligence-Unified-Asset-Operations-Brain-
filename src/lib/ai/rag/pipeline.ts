// ═══════════════════════════════════════════════════════════════════════════════
// RAG Pipeline — Question → Answer with sources
// Gracefully degrades when Qdrant or HuggingFace are unavailable
// ═══════════════════════════════════════════════════════════════════════════════

import { embed } from "@/lib/ai/embeddings";
import { searchSimilar } from "@/lib/ai/retriever/qdrant";
import { findRelated } from "@/lib/ai/knowledge-graph/neo4j";
import { generateText } from "@/lib/ai/huggingface/client";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/utils/logger";

const logger = createLogger("rag-pipeline");

export interface RAGInput {
  question:            string;
  organizationId:      string;
  conversationHistory?: string[];
  filters?:            Record<string, unknown>;
}

export interface RAGOutput {
  answer:               string;
  confidence:           number;
  sources:              RAGSource[];
  referencedEquipment:  string[];
  relatedDocuments:     string[];
  graphContext:         string[];
}

export interface RAGSource {
  documentId:   string;
  title:        string;
  chunk:        string;
  relevance:    number;
  pageNumber?:  number;
}

export async function executeRAG(input: RAGInput): Promise<RAGOutput> {
  const { question, organizationId } = input;
  logger.info({ question, organizationId }, "RAG pipeline started");

  // ── Step 1: Vector search (Qdrant) — optional, graceful fallback ──────────
  let vectorResults: Awaited<ReturnType<typeof searchSimilar>> = [];
  let vectorAvailable = false;

  try {
    const queryEmbedding = await embed(question);
    vectorResults = await searchSimilar(queryEmbedding, 5, {
      must: [{ key: "organizationId", match: { value: organizationId } }],
      ...(input.filters || {}),
    });
    vectorAvailable = true;
    logger.info({ hits: vectorResults.length }, "Vector search completed");
  } catch (e) {
    logger.warn({ error: e }, "Vector search unavailable — using Prisma fallback context");
  }

  // ── Step 2: Knowledge Graph expansion — optional ──────────────────────────
  let graphContext: string[] = [];
  try {
    for (const result of vectorResults.slice(0, 2)) {
      const nodeId = result.payload.knowledgeNodeId as string;
      if (nodeId) {
        const related = await findRelated(nodeId, 1);
        graphContext = related.nodes.map((n) => `${n.type}: ${n.label}`);
      }
    }
  } catch {
    logger.warn("Graph expansion skipped — Neo4j unavailable");
  }

  // ── Step 3: Build context ─────────────────────────────────────────────────
  let contextChunks: string[] = vectorResults
    .map((r) => r.payload.content as string)
    .filter(Boolean);

  // If Qdrant returned nothing, fall back to Prisma document text
  if (!contextChunks.length && prisma) {
    try {
      const docs = await prisma.document.findMany({
        where: {
          organizationId,
          status: "INDEXED",
          deletedAt: null,
          extractedText: { not: null },
        },
        select: { title: true, summary: true, extractedText: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      });
      contextChunks = docs
        .filter((d) => d.extractedText && !d.extractedText.includes("pending"))
        .map((d) => [
          `Document: ${d.title}`,
          d.summary || "",
          (d.extractedText || "").slice(0, 400),
        ].filter(Boolean).join("\n"))
        .filter(Boolean);
      logger.info({ docs: contextChunks.length }, "Using Prisma document fallback context");
    } catch (e) {
      logger.warn({ error: e }, "Prisma document fallback also failed");
    }
  }

  const context = contextChunks.join("\n\n---\n\n");

  // ── Step 4: Generate answer via HuggingFace ───────────────────────────────
  let answer: string;
  try {
    const prompt = buildPrompt(question, context, graphContext, input.conversationHistory);
    const raw = await generateText(prompt);

    // Clean up the generated text — strip re-echoed prompt if model returns it
    answer = cleanAnswer(raw, question);
  } catch (e) {
    logger.warn({ error: e }, "HuggingFace unavailable — using fallback answer");
    answer = buildFallbackAnswer(question, contextChunks, vectorAvailable);
  }

  // ── Step 5: Confidence & sources ─────────────────────────────────────────
  const avgScore = vectorResults.length
    ? vectorResults.reduce((sum, r) => sum + r.score, 0) / vectorResults.length
    : contextChunks.length ? 0.5 : 0.2;

  const confidence = Math.round(Math.min(0.99, Math.max(0.1, avgScore)) * 100) / 100;

  const sources: RAGSource[] = vectorResults.map((r) => ({
    documentId:  r.payload.documentId as string  || "",
    title:       r.payload.documentTitle as string || "Document",
    chunk:       (r.payload.content as string     || "").substring(0, 200),
    relevance:   r.score,
    pageNumber:  r.payload.pageNumber as number | undefined,
  }));

  const referencedEquipment = [...new Set(
    vectorResults.map((r) => r.payload.equipmentId as string).filter(Boolean)
  )];
  const relatedDocuments = [...new Set(
    vectorResults.map((r) => r.payload.documentId as string).filter(Boolean)
  )];

  logger.info({ confidence, sourcesCount: sources.length, vectorAvailable }, "RAG pipeline completed");

  return { answer, confidence, sources, referencedEquipment, relatedDocuments, graphContext };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPrompt(
  question: string,
  context: string,
  graphContext: string[],
  history?: string[]
): string {
  const system = `You are PlantMind AI, an industrial knowledge intelligence assistant for CNC manufacturing plants. Answer questions about equipment, maintenance, compliance, and industrial processes using ONLY the provided context. Be concise, precise, and technical. If the context does not contain enough information, say so clearly rather than guessing.`;

  const historyBlock = history?.length
    ? `\n[Conversation History]\n${history.slice(-4).join("\n")}\n`
    : "";

  const contextBlock = context
    ? `\n[Relevant Documents]\n${context}\n`
    : "\n[No documents indexed yet. Upload documents to enable knowledge-based answers.]\n";

  const graphBlock = graphContext.length
    ? `\n[Knowledge Graph]\n${graphContext.join("\n")}\n`
    : "";

  return `${system}\n${historyBlock}${contextBlock}${graphBlock}\n[Question]\n${question}\n\n[Answer]`;
}

function cleanAnswer(raw: string, question: string): string {
  if (!raw?.trim()) return "I was unable to generate a response. Please try again.";

  let text = raw.trim();

  // Some models echo the prompt — strip everything before [Answer] marker
  const answerMarker = text.lastIndexOf("[Answer]");
  if (answerMarker !== -1) {
    text = text.slice(answerMarker + 8).trim();
  }

  // Strip the question if echoed back
  const qIndex = text.toLowerCase().indexOf(question.toLowerCase().slice(0, 30));
  if (qIndex === 0) {
    text = text.slice(question.length).trim();
  }

  return text || "I was unable to generate a helpful response. Please rephrase your question.";
}

function buildFallbackAnswer(
  question: string,
  contextChunks: string[],
  vectorAvailable: boolean
): string {
  if (!vectorAvailable && !contextChunks.length) {
    return (
      "I can help you with your plant operations! Here's what I can do:\n\n" +
      "🔧 **Maintenance** — Ask about overdue tasks, schedules, or equipment status\n" +
      "📋 **Compliance** — Check ISO, Factory Act, PESO compliance status\n" +
      "🔍 **Incidents** — View open incidents, get root cause analysis\n" +
      "🏭 **Equipment** — Get machine recommendations and health info\n\n" +
      "Try selecting a specific **agent** above (Maintenance, Compliance, Root Cause) for live database queries.\n\n" +
      "For document-based answers, upload files in the **Knowledge Base** page and wait for indexing to complete."
    );
  }

  if (contextChunks.length) {
    return (
      `I found relevant information for your question:\n\n` +
      contextChunks.slice(0, 2).map((c, i) => `**Source ${i + 1}:**\n${c.slice(0, 300)}…`).join("\n\n") +
      "\n\n💡 *For more precise answers, try the Maintenance, Compliance, or RCA agents which work with live operational data.*"
    );
  }

  return (
    "I couldn't find relevant documents for this question.\n\n" +
    "**Try:**\n" +
    "- Switch to the **Maintenance Agent** for maintenance tasks and schedules\n" +
    "- Switch to the **Compliance Agent** for regulatory status\n" +
    "- Switch to the **RCA Agent** for incident analysis\n" +
    "- Upload relevant documents in the Knowledge Base for document-based answers"
  );
}
