export interface SearchResult {
  id: string;
  type: string;
  title: string;
  snippet: string;
  relevance: number;
  source: "vector" | "graph" | "keyword" | "hybrid";
}
