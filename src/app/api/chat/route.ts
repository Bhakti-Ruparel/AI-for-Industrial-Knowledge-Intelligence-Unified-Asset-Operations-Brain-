// POST /api/chat — AI Copilot (via Orchestrator) with DB persistence
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation } from "@/middlewares/with-validation";
import { chatMessageSchema } from "@/validators";
import { orchestrate } from "@/lib/ai/orchestrator";
import { initializeAgents } from "@/agents";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";

export const POST = withAuth(async (request, ctx) => {
  try {
    // Ensure agents are registered
    initializeAgents();

    const body = await withValidation(chatMessageSchema)(request);

    // ── Resolve or create conversation in DB ──────────────────────────────
    let dbConversationId: string | null = null;
    if (prisma) {
      try {
        if (body.conversationId && !body.conversationId.startsWith("conv_")) {
          // Existing DB conversation
          const existing = await prisma.conversation.findFirst({
            where: { id: body.conversationId, userId: ctx.userId, organizationId: ctx.organizationId, deletedAt: null },
          });
          if (existing) dbConversationId = existing.id;
        }
        if (!dbConversationId) {
          const conv = await prisma.conversation.create({
            data: {
              userId: ctx.userId,
              organizationId: ctx.organizationId,
              agentType: body.agentType ?? null,
              title: body.message.slice(0, 80),
            },
          });
          dbConversationId = conv.id;
        }
        // Save user message
        await prisma.message.create({
          data: {
            conversationId: dbConversationId,
            role: "USER",
            content: body.message,
          },
        });
      } catch {
        // Non-critical — continue even if DB save fails
      }
    }

    const result = await orchestrate({
      query: body.message,
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      conversationId: dbConversationId ?? body.conversationId,
      agentHint: body.agentType,
    });

    // ── Save assistant response to DB ─────────────────────────────────────
    if (prisma && dbConversationId) {
      try {
        await prisma.message.create({
          data: {
            conversationId: dbConversationId,
            role: "ASSISTANT",
            content: result.response,
            confidence: result.confidence,
            sources: result.sources as any,
          },
        });
        await prisma.conversation.update({
          where: { id: dbConversationId },
          data: { updatedAt: new Date() },
        });
      } catch {
        // Non-critical
      }
    }

    return successResponse({
      messageId: `msg_${Date.now()}`,
      conversationId: dbConversationId ?? body.conversationId ?? `conv_${Date.now()}`,
      content: result.response,
      confidence: result.confidence,
      agentUsed: result.agentUsed,
      plan: result.plan,
      sources: result.sources,
      actions: result.actions,
    }, "Response generated");
  } catch (error) {
    return errorResponse(error);
  }
});
