// ═══════════════════════════════════════════════════════════════════════════════
// Notification Service — Routes to appropriate providers
// ═══════════════════════════════════════════════════════════════════════════════

import { createLogger } from "@/utils/logger";
import type { NotificationPayload, NotificationProvider, NotificationChannel } from "./types";

const logger = createLogger("notifications");

class NotificationService {
  private providers = new Map<NotificationChannel, NotificationProvider>();

  registerProvider(provider: NotificationProvider): void {
    this.providers.set(provider.channel, provider);
    logger.info({ channel: provider.channel }, "Notification provider registered");
  }

  async send(payload: NotificationPayload): Promise<Record<NotificationChannel, boolean>> {
    const results: Record<string, boolean> = {};

    for (const channel of payload.channel) {
      const provider = this.providers.get(channel);
      if (provider) {
        try {
          results[channel] = await provider.send(payload);
        } catch (error) {
          logger.error({ channel, error }, "Notification send failed");
          results[channel] = false;
        }
      } else {
        logger.warn({ channel }, "No provider registered for channel");
        results[channel] = false;
      }
    }

    return results as Record<NotificationChannel, boolean>;
  }
}

export const notificationService = new NotificationService();
export type { NotificationPayload, NotificationChannel } from "./types";
