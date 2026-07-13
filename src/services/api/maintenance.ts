// ═══════════════════════════════════════════════════════════════════════════════
// Maintenance API Service
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";

const API = "/api";

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  title: string;
  description?: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignedToId?: string;
  checklist?: { label: string; completed: boolean }[];
  aiRecommendation?: string;
  organizationId: string;
  createdAt: string;
}

export interface MaintenanceListResponse {
  data:  MaintenanceRecord[];
  total: number;
  page:  number;
  limit: number;
}

export async function fetchMaintenance(page = 1, limit = 20): Promise<MaintenanceListResponse> {
  const res = await authFetch(`${API}/maintenance?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch maintenance: ${res.status}`);
  const json = await res.json();
  return { data: json.data ?? [], total: json.meta?.pagination?.total ?? 0, page, limit };
}

export async function createMaintenanceRecord(data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const res = await authFetch(`${API}/maintenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create maintenance record: ${res.status}`);
  const json = await res.json();
  return json.data;
}
