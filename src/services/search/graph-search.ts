// ═══════════════════════════════════════════════════════════════════════════════
// Graph Search — Knowledge graph traversal
// ═══════════════════════════════════════════════════════════════════════════════

import { searchGraph } from "@/lib/ai/knowledge-graph/neo4j";
import type { SearchResult } from "./types";

export async function graphSearch(query: string, organizationId: string, limit = 10): Promise<SearchResult[]> {
  try {
    const nodes = await searchGraph(query, organizationId);
    return nodes.slice(0, limit).map((node) => ({
      id: node.id,
      type: node.type.toLowerCase(),
      title: node.label,
      snippet: JSON.stringify(node.properties).substring(0, 200),
      relevance: 0.8,
      source: "graph",
    }));
  } catch {
    return [];
  }
}
