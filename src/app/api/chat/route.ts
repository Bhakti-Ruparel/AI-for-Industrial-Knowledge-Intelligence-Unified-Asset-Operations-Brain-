// POST /api/chat — AI Copilot with full error isolation
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { chatMessageSchema } from "@/validators";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30; // Vercel Pro: extend timeout to 30s

export const POST = withAuth(async (request: NextRequest, ctx) => {
  const startTime = Date.now();
  const log: string[] = [];

  function step(name: string, status: "PASS" | "FAIL", detail?: string) {
    const ms = Date.now() - startTime;
    const msg = `${status === "PASS" ? "✓" : "✗"} ${name.padEnd(20)} ${status} (${ms}ms)${detail ? " — " + detail : ""}`;
    log.push(msg);
    console.log(`[CHAT] ${msg}`);
  }

  try {
    // ── Parse body ────────────────────────────────────────────────────────
    let body: { message: string; conversationId?: string; agentType?: string };
    try {
      const raw = await request.json();
      const parsed = chatMessageSchema.parse(raw);
      body = parsed;
      step("PARSE_BODY", "PASS", `message="${body.message.slice(0, 40)}..."`);
    } catch (e: any) {
      step("PARSE_BODY", "FAIL", e?.message);
      return NextResponse.json({ success: false, error: "Invalid request body", details: e?.message, log }, { status: 400 });
    }

    // ── Check env vars ────────────────────────────────────────────────────
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      HUGGINGFACE_API_KEY: !!process.env.HUGGINGFACE_API_KEY,
      QDRANT_URL: !!process.env.QDRANT_URL,
      NEO4J_URI: !!process.env.NEO4J_URI,
    };
    step("ENV_CHECK", "PASS", JSON.stringify(envCheck));

    // ── Initialize agents ─────────────────────────────────────────────────
    try {
      const { initializeAgents } = await import("@/agents");
      initializeAgents();
      step("INIT_AGENTS", "PASS");
    } catch (e: any) {
      step("INIT_AGENTS", "FAIL", e?.message);
      return NextResponse.json({ success: false, error: "Agent initialization failed", details: e?.message, log }, { status: 500 });
    }

    // ── Save conversation to DB (non-blocking) ────────────────────────────
    let dbConversationId: string | null = null;
    if (prisma) {
      try {
        if (body.conversationId && !body.conversationId.startsWith("conv_")) {
          const existing = await prisma.conversation.findFirst({
            where: { id: body.conversationId, userId: ctx.userId, organizationId: ctx.organizationId, deletedAt: null },
          });
          if (existing) dbConversationId = existing.id;
        }
        if (!dbConversationId) {
          const conv = await prisma.conversation.create({
            data: { userId: ctx.userId, organizationId: ctx.organizationId, agentType: body.agentType ?? null, title: body.message.slice(0, 80) },
          });
          dbConversationId = conv.id;
        }
        await prisma.message.create({ data: { conversationId: dbConversationId, role: "USER", content: body.message } });
        step("DB_CONVERSATION", "PASS", `id=${dbConversationId}`);
      } catch (e: any) {
        step("DB_CONVERSATION", "FAIL", e?.message?.slice(0, 100));
        // Non-fatal — continue without DB persistence
      }
    } else {
      step("DB_CONVERSATION", "FAIL", "prisma is null");
    }

    // ── Run orchestrator ──────────────────────────────────────────────────
    let result: { response: string; confidence: number; agentUsed: string; plan: any; sources: any[]; actions: any[] };
    try {
      const { orchestrate } = await import("@/lib/ai/orchestrator");
      result = await orchestrate({
        query: body.message,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        conversationId: dbConversationId ?? body.conversationId,
        agentHint: body.agentType,
      });
      step("ORCHESTRATE", "PASS", `agent=${result.agentUsed} confidence=${result.confidence}`);
    } catch (e: any) {
      step("ORCHESTRATE", "FAIL", `${e?.name}: ${e?.message?.slice(0, 150)}`);
      // Return a safe response instead of 500
      result = {
        response: `I encountered an error processing your request. Error: ${e?.message?.slice(0, 100) || "Unknown"}. Please try again.`,
        confidence: 0,
        agentUsed: "error",
        plan: { primaryAgent: "error", reasoning: e?.message?.slice(0, 100) },
        sources: [],
        actions: [],
      };
    }

    // ── Save assistant response (non-blocking) ────────────────────────────
    if (prisma && dbConversationId && result.response) {
      try {
        await prisma.message.create({
          data: { conversationId: dbConversationId, role: "ASSISTANT", content: result.response, confidence: result.confidence, sources: result.sources as any },
        });
        await prisma.conversation.update({ where: { id: dbConversationId }, data: { updatedAt: new Date() } });
        step("DB_SAVE_RESPONSE", "PASS");
      } catch (e: any) {
        step("DB_SAVE_RESPONSE", "FAIL", e?.message?.slice(0, 100));
      }
    }

    step("COMPLETE", "PASS", `total=${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        messageId: `msg_${Date.now()}`,
        conversationId: dbConversationId ?? body.conversationId ?? `conv_${Date.now()}`,
        content: result.response,
        confidence: result.confidence,
        agentUsed: result.agentUsed,
        plan: result.plan,
        sources: result.sources,
        actions: result.actions,
      },
      meta: { duration: Date.now() - startTime, log },
    });
  } catch (e: any) {
    // This should NEVER be reached — but if it is, return a proper error
    const errorInfo = {
      name: e?.name,
      message: e?.message,
      stack: e?.stack?.split("\n").slice(0, 5),
    };
    console.error("[CHAT] UNHANDLED ERROR:", errorInfo);
    return NextResponse.json({
      success: false,
      error: "Unhandled server error",
      details: errorInfo,
      log,
    }, { status: 500 });
  }
});
