// ═══════════════════════════════════════════════════════════════════════════════
// Chat Service — AI Copilot conversation management
// ═══════════════════════════════════════════════════════════════════════════════

import { executeRAG } from "@/lib/ai/rag/pipeline";
import { createLogger } from "@/utils/logger";

const logger = createLogger("chat-service");

export interface ChatInput {
  message: string;
  conversationId?: string;
  userId: string;
  organizationId: string;
  agentType?: string;
}

export interface ChatOutput {
  messageId: string;
  conversationId: string;
  content: string;
  confidence: number;
  sources: { documentId: string; title: string; chunk: string; relevance: number }[];
  referencedEquipment: string[];
  actions: { type: string; label: string; payload?: Record<string, unknown> }[];
}

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const { message, conversationId, userId, organizationId, agentType } = input;

  logger.info({ userId, agentType, messageLength: message.length }, "Chat request received");

  // Execute RAG pipeline
  const ragResult = await executeRAG({
    question: message,
    organizationId,
  });

  // Generate suggested actions based on content
  const actions = generateActions(ragResult.answer, agentType);

  // TODO: Save conversation and messages to DB when Prisma is connected
  const newConversationId = conversationId || `conv_${Date.now()}`;
  const messageId = `msg_${Date.now()}`;

  return {
    messageId,
    conversationId: newConversationId,
    content: ragResult.answer,
    confidence: ragResult.confidence,
    sources: ragResult.sources,
    referencedEquipment: ragResult.referencedEquipment,
    actions,
  };
}

function generateActions(answer: string, agentType?: string): { type: string; label: string }[] {
  const actions: { type: string; label: string }[] = [];

  if (answer.toLowerCase().includes("maintenance")) {
    actions.push({ type: "create_maintenance", label: "Create Maintenance Plan" });
  }
  if (answer.toLowerCase().includes("inspection") || answer.toLowerCase().includes("compliance")) {
    actions.push({ type: "generate_checklist", label: "Generate Checklist" });
  }
  if (answer.toLowerCase().includes("failure") || answer.toLowerCase().includes("incident")) {
    actions.push({ type: "generate_rca", label: "Generate RCA" });
  }

  actions.push({ type: "open_graph", label: "View in Knowledge Graph" });
  return actions;
}
