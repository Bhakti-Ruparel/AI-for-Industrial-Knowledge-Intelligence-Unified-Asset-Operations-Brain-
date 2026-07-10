// ═══════════════════════════════════════════════════════════════════════════════
// RAG Pipeline — Question → Answer with sources
// ═══════════════════════════════════════════════════════════════════════════════

import { embed } from "@/lib/ai/embeddings";
import { searchSimilar } from "@/lib/ai/retriever/qdrant";
import { findRelated } from "@/lib/ai/knowledge-graph/neo4j";
import { generateText } from "@/lib/ai/huggingface/client";
import { createLogger } from "@/utils/logger";

const logger = createLogger("rag-pipeline");

export interface RAGInput {
  question: string;
  organizationId: string;
  conversationHistory?: string[];
  filters?: Record<string, unknown>;
}

export interface RAGOutput {
  answer: string;
  confidence: number;
  sources: RAGSource[];
  referencedEquipment: string[];
  relatedDocuments: string[];
  graphContext: string[];
}

export interface RAGSource {
  documentId: string;
  title: string;
  chunk: string;
  relevance: number;
  pageNumber?: number;
}

export async function executeRAG(input: RAGInput): Promise<RAGOutput> {
  const { question, organizationId, filters } = input;

  logger.info({ question, organizationId }, "RAG pipeline started");

  // Step 1: Generate query embedding
  const queryEmbedding = await embed(question);

  // Step 2: Vector search in Qdrant
  const vectorResults = await searchSimilar(queryEmbedding, 5, {
    must: [{ key: "organizationId", match: { value: organizationId } }],
    ...(filters || {}),
  });

  // Step 3: Expand context via Knowledge Graph
  let graphContext: string[] = [];
  try {
    for (const result of vectorResults.slice(0, 2)) {
      const nodeId = result.payload.knowledgeNodeId as string;
      if (nodeId) {
        const related = await findRelated(nodeId, 1);
        graphContext = related.nodes.map((n) => `${n.type}: ${n.label}`);
      }
    }
  } catch (e) {
    logger.warn({ error: e }, "Graph expansion skipped — Neo4j unavailable");
  }

  // Step 4: Build context
  const contextChunks = vectorResults.map((r) => r.payload.content as string).filter(Boolean);
  const context = contextChunks.join("\n\n---\n\n");

  // Step 5: Build prompt
  const prompt = buildPrompt(question, context, graphContext, input.conversationHistory);

  // Step 6: Generate answer
  let answer: string;
  try {
    answer = await generateText(prompt);
  } catch {
    answer = "I'm unable to generate a response at the moment. Please check that the AI service is configured correctly.";
  }

  // Step 7: Calculate confidence
  const avgScore = vectorResults.reduce((sum, r) => sum + r.score, 0) / (vectorResults.length || 1);
  const confidence = Math.round(avgScore * 100) / 100;

  // Step 8: Extract sources
  const sources: RAGSource[] = vectorResults.map((r) => ({
    documentId: r.payload.documentId as string || "",
    title: r.payload.documentTitle as string || "Unknown",
    chunk: (r.payload.content as string || "").substring(0, 200),
    relevance: r.score,
    pageNumber: r.payload.pageNumber as number | undefined,
  }));

  const referencedEquipment = [...new Set(vectorResults.map((r) => r.payload.equipmentId as string).filter(Boolean))];
  const relatedDocuments = [...new Set(vectorResults.map((r) => r.payload.documentId as string).filter(Boolean))];

  logger.info({ confidence, sourcesCount: sources.length }, "RAG pipeline completed");

  return { answer, confidence, sources, referencedEquipment, relatedDocuments, graphContext };
}

function buildPrompt(question: string, context: string, graphContext: string[], history?: string[]): string {
  const systemPrompt = `You are PlantMind AI, an industrial knowledge intelligence assistant. Answer questions about equipment, maintenance, compliance, and industrial processes using the provided context. Be precise, cite sources, and suggest next actions when appropriate.`;

  const historyBlock = history?.length ? `\nConversation History:\n${history.slice(-4).join("\n")}\n` : "";
  const graphBlock = graphContext.length ? `\nKnowledge Graph Context:\n${graphContext.join("\n")}\n` : "";

  return `${systemPrompt}\n${historyBlock}\nRelevant Context:\n${context}\n${graphBlock}\nQuestion: ${question}\n\nAnswer:`;
}
