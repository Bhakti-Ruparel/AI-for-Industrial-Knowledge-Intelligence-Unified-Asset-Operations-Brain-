// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me — Return current authenticated user with org info
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { UnauthorizedError, NotFoundError } from "@/utils/errors";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedError("No active session");
    }

    if (!prisma) {
      return NextResponse.json({ success: false, message: "Database unavailable", data: null, timestamp: new Date().toISOString() }, { status: 503 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, plan: true, logo: true },
        },
      },
    });

    if (!dbUser) {
      throw new NotFoundError("User");
    }

    return successResponse({
      id: dbUser.id,
      supabaseId: dbUser.supabaseId,
      email: dbUser.email,
      name: dbUser.name,
      avatar: dbUser.avatar,
      role: dbUser.role,
      organizationId: dbUser.organizationId,
      organizationName: dbUser.organization.name,
      organizationSlug: dbUser.organization.slug,
      createdAt: dbUser.createdAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
