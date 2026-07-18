// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Agent — RAG-powered information retrieval with graceful fallback
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { executeRAG } from "@/lib/ai/rag/pipeline";
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

      const ragResult = await executeRAG({
        question:           input.query,
        organizationId:     input.organizationId,
        conversationHistory: input.conversationHistory,
      });

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
