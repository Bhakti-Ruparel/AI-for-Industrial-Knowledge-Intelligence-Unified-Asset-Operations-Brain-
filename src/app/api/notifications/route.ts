// GET /api/notifications — List notifications from Prisma
// PATCH /api/notifications/:id — Mark as read (via query param ?id=&action=read)
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request: NextRequest, ctx) => {
  try {
    if (!prisma) return successResponse([]);

    const notifications = await prisma.notification.findMany({
      where:   { organizationId: ctx.organizationId, userId: ctx.userId },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take:    50,
    });

    return successResponse(notifications.map((n) => ({
      id:        n.id,
      title:     n.title,
      message:   n.message,
      type:      n.type,
      read:      n.read,
      actionUrl: n.actionUrl,
      createdAt: n.createdAt.toISOString(),
    })));
  } catch (error) {
    return errorResponse(error);
  }
});

export const PATCH = withAuth(async (request: NextRequest, ctx) => {
  try {
    if (!prisma) return successResponse(null);

    const { id, markAll } = await request.json().catch(() => ({})) as {
      id?: string;
      markAll?: boolean;
    };

    if (markAll) {
      await prisma.notification.updateMany({
        where: { organizationId: ctx.organizationId, userId: ctx.userId, read: false },
        data:  { read: true },
      });
      return successResponse(null, "All notifications marked as read");
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, organizationId: ctx.organizationId, userId: ctx.userId },
        data:  { read: true },
      });
      return successResponse(null, "Notification marked as read");
    }

    return successResponse(null);
  } catch (error) {
    return errorResponse(error);
  }
});
