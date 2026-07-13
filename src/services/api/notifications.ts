// ═══════════════════════════════════════════════════════════════════════════════
// Notifications API Service — Client-side fetch wrappers
// ═══════════════════════════════════════════════════════════════════════════════

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
  const res = await fetch(`${API}/notifications`);
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}
