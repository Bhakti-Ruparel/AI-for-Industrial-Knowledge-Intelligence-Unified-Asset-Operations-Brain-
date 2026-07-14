// ═══════════════════════════════════════════════════════════════════════════════
// Analytics API Service — client-side fetch wrappers
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";

const API = "/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  equipment:   { total: number; operational: number; critical: number; averageHealth: number };
  maintenance: { total: number; overdue: number; dueSoon: number; completed: number };
  incidents:   { open: number; investigating: number; resolved: number; mttr: number };
  documents:   { total: number; indexed: number; processing: number };
  compliance:  { overallScore: number; compliant: number; nonCompliant: number; expiring: number };
  ai:          { queriesTotal: number; queriesToday: number; avgConfidence: number };
}

export interface HealthTrendPoint  { date: string; value: number }
export interface IncidentTrendPoint { date: string; value: number }
export interface DocByTypePoint    { name: string; value: number }
export interface MaintenanceCostPoint { month: string; preventive: number; corrective: number; predictive: number }
export interface ActionableInsight {
  id:          string;
  title:       string;
  description: string;
  href:        string;
  variant:     "danger" | "warning" | "info" | "success";
}

// ── Core metrics ──────────────────────────────────────────────────────────────

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await authFetch(`${API}/analytics`);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// ── Charts ────────────────────────────────────────────────────────────────────

export async function fetchHealthTrend(days = 30): Promise<HealthTrendPoint[]> {
  const res = await authFetch(`${API}/analytics?type=health-trend&days=${days}`);
  if (!res.ok) throw new Error(`Failed to fetch health trend: ${res.status}`);
  return (await res.json()).data ?? [];
}

export async function fetchIncidentTrend(days = 30): Promise<IncidentTrendPoint[]> {
  const res = await authFetch(`${API}/analytics?type=incident-trend&days=${days}`);
  if (!res.ok) throw new Error(`Failed to fetch incident trend: ${res.status}`);
  return (await res.json()).data ?? [];
}

export async function fetchDocsByType(): Promise<DocByTypePoint[]> {
  const res = await authFetch(`${API}/analytics?type=docs-by-type`);
  if (!res.ok) throw new Error(`Failed to fetch docs-by-type: ${res.status}`);
  return (await res.json()).data ?? [];
}

export async function fetchMaintenanceCost(months = 6): Promise<MaintenanceCostPoint[]> {
  const res = await authFetch(`${API}/analytics?type=maintenance-cost&months=${months}`);
  if (!res.ok) throw new Error(`Failed to fetch maintenance cost: ${res.status}`);
  return (await res.json()).data ?? [];
}

// ── Actionable insights ───────────────────────────────────────────────────────

export async function fetchActionableInsights(): Promise<ActionableInsight[]> {
  const res = await authFetch(`${API}/insights`);
  if (!res.ok) throw new Error(`Failed to fetch insights: ${res.status}`);
  return (await res.json()).data ?? [];
}
