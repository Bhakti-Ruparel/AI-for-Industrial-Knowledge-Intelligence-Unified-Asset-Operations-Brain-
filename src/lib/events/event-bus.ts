// ═══════════════════════════════════════════════════════════════════════════════
// Event Bus — In-process pub/sub (upgradeable to Redis/Kafka later)
// ═══════════════════════════════════════════════════════════════════════════════

import { v4 as uuid } from "uuid";
import { createLogger } from "@/utils/logger";
import type { DomainEvent, EventType } from "./events";

const logger = createLogger("event-bus");

type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;

class EventBus {
  private handlers = new Map<EventType, EventHandler[]>();
  private deadLetterQueue: DomainEvent[] = [];

  subscribe<T>(eventType: EventType, handler: EventHandler<T>): () => void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as EventHandler);
    this.handlers.set(eventType, handlers);

    logger.debug({ eventType, handlerCount: handlers.length }, "Handler subscribed");

    // Return unsubscribe function
    return () => {
      const current = this.handlers.get(eventType) || [];
      this.handlers.set(eventType, current.filter((h) => h !== handler));
    };
  }

  async publish<T>(eventType: EventType, payload: T, context: { organizationId: string; userId?: string }): Promise<void> {
    const event: DomainEvent<T> = {
      id: uuid(),
      type: eventType,
      timestamp: new Date().toISOString(),
      organizationId: context.organizationId,
      userId: context.userId,
      payload,
    };

    const handlers = this.handlers.get(eventType) || [];
    logger.info({ eventType, eventId: event.id, handlerCount: handlers.length }, "Event published");

    for (const handler of handlers) {
      try {
        await handler(event as DomainEvent);
      } catch (error) {
        logger.error({ eventType, eventId: event.id, error }, "Event handler failed");
        this.deadLetterQueue.push(event as DomainEvent);
      }
    }
  }

  getDeadLetterQueue(): DomainEvent[] {
    return [...this.deadLetterQueue];
  }

  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  getSubscriberCount(eventType: EventType): number {
    return (this.handlers.get(eventType) || []).length;
  }
}

// Singleton
export const eventBus = new EventBus();
