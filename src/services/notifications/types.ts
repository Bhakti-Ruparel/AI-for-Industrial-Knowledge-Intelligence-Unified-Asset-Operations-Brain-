// ═══════════════════════════════════════════════════════════════════════════════
// Notification System — Provider-independent abstraction
// ═══════════════════════════════════════════════════════════════════════════════

export interface NotificationPayload {
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  channel: NotificationChannel[];
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationChannel = "in_app" | "email" | "whatsapp" | "push";

export interface NotificationProvider {
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<boolean>;
}
