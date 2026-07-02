// ═══════════════════════════════════════════════════════════════════════════════
// Chat / Copilot Service — Client-side API calls
// ═══════════════════════════════════════════════════════════════════════════════

import type { ChatMessage, Conversation } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function sendMessage(message: string, conversationId?: string): Promise<ChatMessage> {
  // TODO: Connect to RAG pipeline when implemented
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `This is a placeholder response. The AI copilot will be connected to the RAG pipeline.`,
    timestamp: new Date().toISOString(),
    sources: [
      { id: "1", title: "Machine Manual - VMC Series", type: "document", relevance: 0.95 },
      { id: "2", title: "ISO 9001 Guidelines", type: "regulation", relevance: 0.87 },
    ],
  };
}

export async function getConversations(): Promise<Conversation[]> {
  // TODO: Load from Supabase when configured
  return [
    { id: "1", title: "VMC Machine Selection", lastMessage: "Based on your requirements...", timestamp: new Date().toISOString(), messageCount: 12 },
    { id: "2", title: "Maintenance Schedule Review", lastMessage: "The next scheduled maintenance...", timestamp: new Date(Date.now() - 86400000).toISOString(), messageCount: 8 },
  ];
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  return [];
}

export async function getSuggestedPrompts(): Promise<string[]> {
  return [
    "What machine is best for automotive die manufacturing?",
    "Show me overdue maintenance tasks",
    "Analyze compliance gaps for ISO 9001",
    "What caused the last VTL downtime incident?",
    "Recommend a VMC for 800x500x400mm workpiece",
  ];
}
