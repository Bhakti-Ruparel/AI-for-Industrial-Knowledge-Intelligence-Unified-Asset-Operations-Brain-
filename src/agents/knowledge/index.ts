// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Agent — RAG-powered information retrieval
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { executeRAG } from "@/lib/ai/rag/pipeline";
import { KNOWLEDGE_PROMPT } from "./prompt";

export const knowledgeAgent: AgentDefinition = {
  id: "knowledge",
  name: "Knowledge Agent",
  description: "Retrieves and synthesizes information from the industrial knowledge base using RAG",
  capabilities: ["search", "explain", "summarize", "recommend_documents"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const ragResult = await executeRAG({
      question: input.query,
      organizationId: input.organizationId,
      conversationHistory: input.conversationHistory,
    });

    return {
      response: ragResult.answer,
      confidence: ragResult.confidence,
      sources: ragResult.sources,
      actions: [
        { type: "open_graph", label: "View in Knowledge Graph" },
        { type: "related_docs", label: "Show Related Documents" },
      ],
    };
  },
};
