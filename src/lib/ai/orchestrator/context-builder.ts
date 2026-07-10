// ═══════════════════════════════════════════════════════════════════════════════
// Context Builder — Assembles context for AI agent execution
// ═══════════════════════════════════════════════════════════════════════════════

import { searchSimilar } from "@/lib/ai/retriever/qdrant";
import { embed } from "@/lib/ai/embeddings";
import { createLogger } from "@/utils/logger";

const logger = createLogger("orchestrator:context");

export interface AgentContext {
  relevantChunks: string[];
  equipmentContext: string[];
  conversationHistory: string[];
  organizationContext: Record<string, unknown>;
}

export async function buildContext(
  query: string,
  organizationId: string,
  conversationHistory: string[] = []
): Promise<AgentContext> {
  let relevantChunks: string[] = [];

  // Retrieve relevant document chunks via vector search
  try {
    const queryVector = await embed(query);
    const results = await searchSimilar(queryVector, 5, {
      must: [{ key: "organizationId", match: { value: organizationId } }],
    });
    relevantChunks = results.map((r) => r.payload.content as string).filter(Boolean);
  } catch (error) {
    logger.warn({ error }, "Vector search unavailable for context building");
  }

  return {
    relevantChunks,
    equipmentContext: [], // TODO: Load from equipment memory
    conversationHistory: conversationHistory.slice(-6),
    organizationContext: { organizationId },
  };
}
