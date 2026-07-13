// ═══════════════════════════════════════════════════════════════════════════════
// Analytics API Service
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";

const API = "/api";

export interface DashboardMetrics {
  equipment:   { total: number; operational: number; critical: number; averageHealth: number };
  maintenance: { total: number; overdue: number; dueSoon: number; completed: number };
  incidents:   { open: number; investigating: number; resolved: number; mttr: number };
  documents:   { total: number; indexed: number; processing: number };
  compliance:  { overallScore: number; compliant: number; nonCompliant: number; expiring: number };
  ai:          { queriesTotal: number; queriesToday: number; avgConfidence: number };
}

export interface HealthTrendPoint {
  date: string;
  value: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await authFetch(`${API}/analytics`);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchHealthTrend(days = 30): Promise<HealthTrendPoint[]> {
  const res = await authFetch(`${API}/analytics?type=health-trend&days=${days}`);
  if (!res.ok) throw new Error(`Failed to fetch health trend: ${res.status}`);
  const json = await res.json();
  return json.data;
}
