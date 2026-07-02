// ═══════════════════════════════════════════════════════════════════════════════
// Orchestrator Memory — Cross-conversation context
// ═══════════════════════════════════════════════════════════════════════════════

import { createLogger } from "@/utils/logger";

const logger = createLogger("orchestrator:memory");

interface MemoryEntry {
  key: string;
  value: unknown;
  timestamp: string;
  ttl?: number; // seconds
}

class OrchestratorMemory {
  private store = new Map<string, MemoryEntry>();

  set(scope: string, key: string, value: unknown, ttl?: number): void {
    const fullKey = `${scope}:${key}`;
    this.store.set(fullKey, { key: fullKey, value, timestamp: new Date().toISOString(), ttl });
  }

  get<T = unknown>(scope: string, key: string): T | null {
    const fullKey = `${scope}:${key}`;
    const entry = this.store.get(fullKey);
    if (!entry) return null;

    // Check TTL
    if (entry.ttl) {
      const age = (Date.now() - new Date(entry.timestamp).getTime()) / 1000;
      if (age > entry.ttl) {
        this.store.delete(fullKey);
        return null;
      }
    }

    return entry.value as T;
  }

  getConversationContext(conversationId: string): string[] {
    return this.get<string[]>("conversation", conversationId) || [];
  }

  appendConversation(conversationId: string, message: string): void {
    const history = this.getConversationContext(conversationId);
    history.push(message);
    // Keep last 20 messages
    this.set("conversation", conversationId, history.slice(-20), 3600);
  }

  setEquipmentContext(equipmentId: string, context: Record<string, unknown>): void {
    this.set("equipment", equipmentId, context, 1800);
  }

  getEquipmentContext(equipmentId: string): Record<string, unknown> | null {
    return this.get("equipment", equipmentId);
  }

  clear(scope?: string): void {
    if (scope) {
      for (const key of this.store.keys()) {
        if (key.startsWith(`${scope}:`)) this.store.delete(key);
      }
    } else {
      this.store.clear();
    }
  }
}

export const orchestratorMemory = new OrchestratorMemory();
