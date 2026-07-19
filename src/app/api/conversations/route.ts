// GET /api/conversations — List recent conversations for the current user
import { withAuth } from "@/middlewares/with-auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    if (!prisma) return successResponse([]);

    const conversations = await prisma.conversation.findMany({
      where:   { userId: ctx.userId, organizationId: ctx.organizationId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take:    20,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, role: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return successResponse(
      conversations.map((c) => ({
        id:           c.id,
        title:        c.title || c.messages[0]?.content?.slice(0, 60) || "Untitled",
        lastMessage:  c.messages[0]?.content?.slice(0, 80) || "",
        timestamp:    c.updatedAt.toISOString(),
        messageCount: c._count.messages,
        agentType:    c.agentType,
      }))
    );
  } catch (error) {
    return errorResponse(error);
  }
});
