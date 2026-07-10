// POST /api/chat — AI Copilot (via Orchestrator)
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { withValidation } from "@/middlewares/with-validation";
import { chatMessageSchema } from "@/validators";
import { orchestrate } from "@/lib/ai/orchestrator";
import { initializeAgents } from "@/agents";
import { successResponse, errorResponse } from "@/utils/response";

export const POST = withAuth(async (request, ctx) => {
  try {
    // Ensure agents are registered
    initializeAgents();

    const body = await withValidation(chatMessageSchema)(request);

    const result = await orchestrate({
      query: body.message,
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      conversationId: body.conversationId,
      agentHint: body.agentType,
    });

    return successResponse({
      messageId: `msg_${Date.now()}`,
      conversationId: body.conversationId || `conv_${Date.now()}`,
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
