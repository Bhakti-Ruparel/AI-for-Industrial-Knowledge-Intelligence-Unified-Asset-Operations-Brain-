// ═══════════════════════════════════════════════════════════════════════════════
// Equipment API Service
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";
import type { Equipment } from "@/types";

const API = "/api";

export interface EquipmentListResponse {
  data:  Equipment[];
  total: number;
  page:  number;
  limit: number;
}

export async function fetchEquipment(page = 1, limit = 20): Promise<EquipmentListResponse> {
  const res = await authFetch(`${API}/equipment?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch equipment: ${res.status}`);
  const json = await res.json();
  return { data: json.data ?? [], total: json.meta?.pagination?.total ?? 0, page, limit };
}

export async function createEquipment(data: Partial<Equipment>): Promise<Equipment> {
  const res = await authFetch(`${API}/equipment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create equipment: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function getMachineData(): Promise<Record<string, unknown>> {
  // Public endpoint — no auth required
  const res = await fetch(`${API}/machine-data`);
  if (!res.ok) throw new Error(`Failed to fetch machine data: ${res.status}`);
  return res.json();
}

export async function filterMachines(
  category: string,
  series: string,
  params: Record<string, number>
): Promise<unknown> {
  // Public endpoint — no auth required
  const res = await fetch(`${API}/machines/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, series, params }),
  });
  if (!res.ok) throw new Error(`Failed to filter machines: ${res.status}`);
  return res.json();
}
