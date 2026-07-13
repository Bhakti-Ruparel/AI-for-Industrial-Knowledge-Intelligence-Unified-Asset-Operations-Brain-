// ═══════════════════════════════════════════════════════════════════════════════
// Compliance API Service
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";

const API = "/api";

export interface ComplianceRecord {
  id: string;
  regulation: string;
  category: "FACTORY_ACT" | "ISO" | "PESO" | "OISD" | "ENVIRONMENTAL";
  status: "COMPLIANT" | "NON_COMPLIANT" | "PENDING_REVIEW" | "EXPIRING";
  organizationId: string;
  lastAuditDate?: string;
  nextAuditDate?: string;
  score?: number;
  findings?: string[];
  evidence?: unknown[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
}

export interface ComplianceListResponse {
  data:  ComplianceRecord[];
  total: number;
  page:  number;
  limit: number;
}

export async function fetchCompliance(page = 1, limit = 20): Promise<ComplianceListResponse> {
  const res = await authFetch(`${API}/compliance?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch compliance: ${res.status}`);
  const json = await res.json();
  return { data: json.data ?? [], total: json.meta?.pagination?.total ?? 0, page, limit };
}

export async function createComplianceRecord(data: Partial<ComplianceRecord>): Promise<ComplianceRecord> {
  const res = await authFetch(`${API}/compliance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create compliance record: ${res.status}`);
  const json = await res.json();
  return json.data;
}
