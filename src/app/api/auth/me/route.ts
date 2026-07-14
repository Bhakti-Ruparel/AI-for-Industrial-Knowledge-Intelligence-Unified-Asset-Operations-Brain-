// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me — Return current authenticated user with org info
//
// Self-healing: if the Supabase session is valid but the Prisma user record is
// missing (Case D — orphan Supabase user), a placeholder org + user are created
// automatically so the user is never left in a broken state after login.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { UnauthorizedError } from "@/utils/errors";

function log(
  label: string,
  status: "info" | "success" | "failure",
  extra?: Record<string, unknown>
) {
  const ts = new Date().toISOString();
  const prefix = `[ME][${status.toUpperCase()}]`;
  if (status === "failure") {
    console.error(`${ts} ${prefix} ${label}`, extra ?? "");
  } else {
    console.log(`${ts} ${prefix} ${label}`, extra ?? "");
  }
}

/** Derive a unique org slug from an email address (e.g. "john@acme.com" → "acme") */
function slugFromEmail(email: string): string {
  const domain = email.split("@")[1] ?? email;
  const base = domain
    .split(".")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);
  return `${base}-${Date.now()}`;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedError("No active session");
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, message: "Database unavailable", data: null, timestamp: new Date().toISOString() },
        { status: 503 }
      );
    }

    // ── Primary lookup ────────────────────────────────────────────────────────
    let dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, plan: true, logo: true },
        },
      },
    });

    // ── Self-heal: Case D — Supabase ✅, Prisma ❌ ────────────────────────────
    if (!dbUser) {
      const email = (user.email ?? "").toLowerCase();
      log("Prisma user missing for authenticated Supabase user — self-healing", "info", {
        supabaseId: user.id,
        email,
      });

      try {
        // Check if a Prisma user exists by email (edge case: supabaseId not linked yet)
        const byEmail = await prisma.user.findUnique({
          where: { email },
          include: {
            organization: {
              select: { id: true, name: true, slug: true, plan: true, logo: true },
            },
          },
        });

        if (byEmail) {
          // Found by email but supabaseId was missing — link it now
          log("Found Prisma user by email without supabaseId — linking", "info", {
            prismaId: byEmail.id,
            supabaseId: user.id,
          });
          dbUser = await prisma.user.update({
            where: { id: byEmail.id },
            data: { supabaseId: user.id },
            include: {
              organization: {
                select: { id: true, name: true, slug: true, plan: true, logo: true },
              },
            },
          });
          log("Prisma user linked to Supabase account", "success", { prismaId: dbUser.id });
        } else {
          // Truly missing — create a new org + user from Supabase metadata
          const fullName =
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            email.split("@")[0];

          const orgName = `${fullName}'s Organization`;
          const slug = slugFromEmail(email);

          log("Creating placeholder org and user for self-heal", "info", { email, orgName, slug });

          const org = await prisma.organization.create({
            data: { name: orgName, slug, plan: "free" },
            select: { id: true, name: true, slug: true, plan: true, logo: true },
          });

          dbUser = await prisma.user.create({
            data: {
              supabaseId: user.id,
              email,
              name: fullName,
              role: "ADMIN",
              organizationId: org.id,
            },
            include: {
              organization: {
                select: { id: true, name: true, slug: true, plan: true, logo: true },
              },
            },
          });

          log("Self-heal complete — Prisma user and org created", "success", {
            userId: dbUser.id,
            organizationId: org.id,
          });
        }
      } catch (healErr: unknown) {
        const e = healErr as Error;
        log("Self-heal failed", "failure", { message: e?.message });
        // Fall through — dbUser is still null, return 404-equivalent via UnauthorizedError
        throw new UnauthorizedError("User account not found and could not be recovered");
      }
    }

    // dbUser is guaranteed non-null here
    return successResponse({
      id: dbUser!.id,
      supabaseId: dbUser!.supabaseId,
      email: dbUser!.email,
      name: dbUser!.name,
      avatar: dbUser!.avatar,
      role: dbUser!.role,
      organizationId: dbUser!.organizationId,
      organizationName: dbUser!.organization.name,
      organizationSlug: dbUser!.organization.slug,
      createdAt: dbUser!.createdAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
