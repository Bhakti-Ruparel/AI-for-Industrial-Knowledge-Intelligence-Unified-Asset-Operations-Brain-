// ═══════════════════════════════════════════════════════════════════════════════
// Chat Service — AI Copilot conversation management with DB persistence
// ═══════════════════════════════════════════════════════════════════════════════

import { executeRAG } from "@/lib/ai/rag/pipeline";
import { prisma } from "@/lib/prisma";
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

  // ── Resolve or create conversation ────────────────────────────────────────
  let resolvedConversationId = conversationId;
  if (prisma) {
    try {
      if (conversationId) {
        // Verify it exists and belongs to this user/org
        const existing = await prisma.conversation.findFirst({
          where: { id: conversationId, userId, organizationId, deletedAt: null },
        });
        if (!existing) resolvedConversationId = undefined; // Reset — will create new
      }
      if (!resolvedConversationId) {
        const conv = await prisma.conversation.create({
          data: {
            userId,
            organizationId,
            agentType: agentType ?? null,
            title: message.slice(0, 80),
          },
        });
        resolvedConversationId = conv.id;
      }

      // Save user message
      await prisma.message.create({
        data: {
          conversationId: resolvedConversationId!,
          role: "USER",
          content: message,
          metadata: agentType ? { agentType } : undefined,
        },
      });
    } catch (err) {
      logger.warn({ err }, "Failed to persist user message — continuing without DB");
    }
  }

  if (!resolvedConversationId) {
    resolvedConversationId = `conv_${Date.now()}`;
  }

  // ── Execute RAG pipeline ──────────────────────────────────────────────────
  const ragResult = await executeRAG({ question: message, organizationId });
  const actions = generateActions(ragResult.answer, agentType);
  const messageId = `msg_${Date.now()}`;

  // ── Save assistant message ────────────────────────────────────────────────
  if (prisma && !resolvedConversationId.startsWith("conv_")) {
    try {
      const saved = await prisma.message.create({
        data: {
          conversationId: resolvedConversationId,
          role: "ASSISTANT",
          content: ragResult.answer,
          confidence: ragResult.confidence,
          sources: ragResult.sources as any,
          metadata: { agentUsed: agentType ?? "knowledge" },
        },
      });
      // Update conversation updatedAt by touching it
      await prisma.conversation.update({
        where: { id: resolvedConversationId },
        data: { updatedAt: new Date() },
      });
    } catch (err) {
      logger.warn({ err }, "Failed to persist assistant message");
    }
  }

  return {
    messageId,
    conversationId: resolvedConversationId,
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
