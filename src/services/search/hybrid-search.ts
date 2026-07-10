// ═══════════════════════════════════════════════════════════════════════════════
// Hybrid Search — Combines vector, graph, and keyword search
// ═══════════════════════════════════════════════════════════════════════════════

import { vectorSearch } from "./vector-search";
import { graphSearch } from "./graph-search";
import { createLogger } from "@/utils/logger";
import type { SearchResult } from "./types";

const logger = createLogger("search:hybrid");

export async function hybridSearch(
  query: string,
  organizationId: string,
  options: { limit?: number; types?: string[] } = {}
): Promise<SearchResult[]> {
  const { limit = 10, types } = options;

  // Execute searches in parallel
  const [vectorResults, graphResults] = await Promise.allSettled([
    vectorSearch(query, organizationId, limit),
    graphSearch(query, organizationId, limit),
  ]);

  const allResults: SearchResult[] = [];

  if (vectorResults.status === "fulfilled") allResults.push(...vectorResults.value);
  if (graphResults.status === "fulfilled") allResults.push(...graphResults.value);

  // Deduplicate by ID
  const seen = new Set<string>();
  const unique = allResults.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  // Filter by type if specified
  const filtered = types?.length ? unique.filter((r) => types.includes(r.type)) : unique;

  // Sort by relevance
  const sorted = filtered.sort((a, b) => b.relevance - a.relevance).slice(0, limit);

  // Mark as hybrid
  const results = sorted.map((r) => ({ ...r, source: "hybrid" as const }));

  logger.info({ query, resultCount: results.length, vectorHits: vectorResults.status === "fulfilled" ? vectorResults.value.length : 0 }, "Hybrid search completed");
  return results;
}
