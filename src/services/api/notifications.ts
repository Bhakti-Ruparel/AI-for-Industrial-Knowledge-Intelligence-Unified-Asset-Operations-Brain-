// ═══════════════════════════════════════════════════════════════════════════════
// Notifications API Service — Client-side fetch wrappers
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";

const API = "/api";

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "AI_INSIGHT" | "MAINTENANCE_DUE" | "INCIDENT_ALERT" | "COMPLIANCE_ALERT";
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  const res = await authFetch(`${API}/notifications`);
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await authFetch(`${API}/notifications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await authFetch(`${API}/notifications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markAll: true }),
  });
}
