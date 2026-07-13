// ═══════════════════════════════════════════════════════════════════════════════
// Incidents API Service
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";

const API = "/api";

export interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  equipmentId: string;
  equipmentName?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  rootCause?: string;
  resolution?: string;
  evidence?: { id: string; type: string; title: string; url: string }[];
  timeline?: { id: string; timestamp: string; description: string; user: string; type: string }[];
  aiAnalysis?: string;
  downtime?: number;
  cost?: number;
  reportedAt: string;
  resolvedAt?: string;
  organizationId: string;
  createdAt: string;
}

export interface IncidentListResponse {
  data:  IncidentRecord[];
  total: number;
  page:  number;
  limit: number;
}

export async function fetchIncidents(page = 1, limit = 20): Promise<IncidentListResponse> {
  const res = await authFetch(`${API}/incidents?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.status}`);
  const json = await res.json();
  return { data: json.data ?? [], total: json.meta?.pagination?.total ?? 0, page, limit };
}

export async function createIncident(data: Partial<IncidentRecord>): Promise<IncidentRecord> {
  const res = await authFetch(`${API}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create incident: ${res.status}`);
  const json = await res.json();
  return json.data;
}
