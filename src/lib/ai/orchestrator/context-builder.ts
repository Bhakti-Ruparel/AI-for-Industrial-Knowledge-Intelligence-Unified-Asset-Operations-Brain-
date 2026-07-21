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

  // Retrieve relevant document chunks via vector search (5s timeout)
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Context building timed out")), 5000)
    );
    const searchPromise = (async () => {
      const queryVector = await embed(query);
      return searchSimilar(queryVector, 5, {
        must: [{ key: "organizationId", match: { value: organizationId } }],
      });
    })();

    const results = await Promise.race([searchPromise, timeoutPromise]);
    relevantChunks = results.map((r) => r.payload.content as string).filter(Boolean);
  } catch (error: any) {
    logger.warn({ error: error?.message }, "Vector search unavailable — skipping context");
  }

  return {
    relevantChunks,
    equipmentContext: [],
    conversationHistory: conversationHistory.slice(-6),
    organizationContext: { organizationId },
  };
}
