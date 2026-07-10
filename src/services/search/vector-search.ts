// ═══════════════════════════════════════════════════════════════════════════════
// Vector Search — Semantic similarity via Qdrant
// ═══════════════════════════════════════════════════════════════════════════════

import { embed } from "@/lib/ai/embeddings";
import { searchSimilar } from "@/lib/ai/retriever/qdrant";
import type { SearchResult } from "./types";

export async function vectorSearch(query: string, organizationId: string, limit = 10): Promise<SearchResult[]> {
  const queryVector = await embed(query);
  const results = await searchSimilar(queryVector, limit, {
    must: [{ key: "organizationId", match: { value: organizationId } }],
  });

  return results.map((r) => ({
    id: r.id,
    type: "document",
    title: (r.payload.documentTitle as string) || "Unknown",
    snippet: ((r.payload.content as string) || "").substring(0, 200),
    relevance: r.score,
    source: "vector",
  }));
}
