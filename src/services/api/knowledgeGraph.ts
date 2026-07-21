// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Graph API Service — Client-side fetch wrappers
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";

const API = "/api";

export interface KGNode {
  id: string;
  type: string;
  label: string;
  properties?: Record<string, unknown>;
  neo4jId?: string;
}

export interface KGEdge {
  from:  string;
  to:    string;
  label: string;
}

export interface KGGraphData {
  nodes: KGNode[];
  edges: KGEdge[];
}

export async function fetchGraphNodes(query = ""): Promise<KGGraphData> {
  const params = query ? `?query=${encodeURIComponent(query)}` : "?query=all";
  const res = await authFetch(`${API}/knowledge-graph${params}`);
  if (!res.ok) throw new Error(`Failed to fetch knowledge graph: ${res.status}`);
  const json = await res.json();
  // Handle both { nodes, edges } shape and legacy flat array
  if (Array.isArray(json.data)) return { nodes: json.data, edges: [] };
  return { nodes: json.data?.nodes ?? [], edges: json.data?.edges ?? [] };
}

export async function createGraphNode(data: {
  type: string;
  label: string;
  properties?: Record<string, unknown>;
}): Promise<KGNode> {
  const res = await authFetch(`${API}/knowledge-graph`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create graph node: ${res.status}`);
  const json = await res.json();
  return json.data;
}
