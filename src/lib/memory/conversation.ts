// ═══════════════════════════════════════════════════════════════════════════════
// Conversation Memory — Maintains context across AI interactions
// ═══════════════════════════════════════════════════════════════════════════════

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  agentUsed?: string;
}

class ConversationMemory {
  private conversations = new Map<string, ConversationTurn[]>();
  private maxTurns = 20;

  add(conversationId: string, turn: ConversationTurn): void {
    const history = this.conversations.get(conversationId) || [];
    history.push(turn);
    if (history.length > this.maxTurns) history.shift();
    this.conversations.set(conversationId, history);
  }

  get(conversationId: string): ConversationTurn[] {
    return this.conversations.get(conversationId) || [];
  }

  getFormatted(conversationId: string, lastN = 6): string[] {
    return this.get(conversationId)
      .slice(-lastN)
      .map((t) => `${t.role === "user" ? "Human" : "Assistant"}: ${t.content}`);
  }

  clear(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  getSummary(conversationId: string): string {
    const turns = this.get(conversationId);
    if (turns.length === 0) return "No conversation history.";
    return `${turns.length} messages. Last topic: ${turns[turns.length - 1].content.substring(0, 100)}`;
  }
}

export const conversationMemory = new ConversationMemory();
