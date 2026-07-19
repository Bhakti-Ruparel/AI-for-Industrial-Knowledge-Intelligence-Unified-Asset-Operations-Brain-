// ═══════════════════════════════════════════════════════════════════════════════
// Chat / Copilot API Service
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";

const API = "/api";

export interface ChatResponse {
  messageId: string;
  conversationId: string;
  content: string;
  confidence: number;
  agentUsed: string;
  sources: {
    id?: string;
    documentId?: string;
    title: string;
    chunk?: string;
    relevance: number;
    pageNumber?: number;
  }[];
  actions: { type: string; label: string }[];
}

export async function sendChatMessage(
  message: string,
  conversationId?: string,
  agentType?: string
): Promise<ChatResponse> {
  const res = await authFetch(`${API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversationId, agentType }),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error((errJson as { message?: string }).message || `Chat request failed: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export interface ConversationSummary {
  id:           string;
  title:        string;
  lastMessage:  string;
  timestamp:    string;
  messageCount: number;
  agentType:    string | null;
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await authFetch(`${API}/conversations`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}
