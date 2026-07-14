// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/register — Create Supabase account + Org + User in Prisma
//
// Sync matrix (checked before every registration attempt):
//   Case A  Supabase ❌  Prisma ❌  → create normally
//   Case B  Supabase ✅  Prisma ✅  → conflict — user already exists
//   Case C  Supabase ❌  Prisma ✅  → orphan Prisma row — delete it, then create
//   Case D  Supabase ✅  Prisma ❌  → orphan Supabase user — rebuild Prisma row
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/database/supabase/client";
import { prisma } from "@/lib/prisma";
import { createdResponse, errorResponse } from "@/utils/response";
import { ValidationError, ConflictError } from "@/utils/errors";
import { z } from "zod";

// ── Validation Schema ─────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  organizationName: z.string().min(2, "Organization name is required").max(100),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  if (!prisma) return `${base}-${Date.now()}`;
  let slug = base;
  for (let i = 0; i < 10; i++) {
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${base}-${i + 1}`;
  }
  return `${base}-${Date.now()}`;
}

/** Structured step logger */
function log(
  step: number | string,
  label: string,
  status: "started" | "success" | "failure" | "info",
  extra?: Record<string, unknown>
) {
  const ts = new Date().toISOString();
  const prefix = `[REGISTER][${String(step).toUpperCase()}][${status.toUpperCase()}]`;
  if (status === "failure") {
    console.error(`${ts} ${prefix} ${label}`, extra ?? "");
  } else {
    console.log(`${ts} ${prefix} ${label}`, extra ?? "");
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const routeStart = Date.now();

  // ─── STEP 1: Parse request body ───────────────────────────────────────────
  log(1, "Parse request body", "started");
  const stepStart1 = Date.now();

  const body = await request.json().catch(() => null);
  if (!body) {
    log(1, "Parse request body", "failure", { reason: "Invalid or empty JSON" });
    return NextResponse.json(
      { success: false, message: "Invalid JSON body", data: null, timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }
  log(1, "Parse request body", "success", {
    durationMs: Date.now() - stepStart1,
    fields: Object.keys(body).filter((k) => k !== "password" && k !== "confirmPassword"),
  });

  // ─── STEP 2: Validate request body ────────────────────────────────────────
  log(2, "Validate request body", "started");
  const stepStart2 = Date.now();

  const result = RegisterSchema.safeParse(body);
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach((e) => {
      const key = e.path.join(".") || "form";
      if (!errors[key]) errors[key] = [];
      errors[key].push(e.message);
    });
    log(2, "Validate request body", "failure", { durationMs: Date.now() - stepStart2, errors });
    return errorResponse(new ValidationError("Validation failed", errors));
  }
  log(2, "Validate request body", "success", { durationMs: Date.now() - stepStart2 });

  const { firstName, lastName, email, password, organizationName } = result.data;
  const fullName = `${firstName} ${lastName}`.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // ─── STEP 3: Check database availability ──────────────────────────────────
  log(3, "Check database availability", "started");
  if (!prisma) {
    log(3, "Check database availability", "failure", {
      reason: "Prisma client is null — DATABASE_URL / DIRECT_URL may be missing",
      DIRECT_URL_set: !!process.env.DIRECT_URL,
      DATABASE_URL_set: !!process.env.DATABASE_URL,
    });
    return NextResponse.json(
      { success: false, message: "Database unavailable", data: null, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
  log(3, "Check database availability", "success");

  const supabaseAdmin = getSupabaseServer();

  // ─── STEP 4: Parallel lookup — Supabase Auth + Prisma ────────────────────
  log(4, "Sync check — lookup in Supabase Auth and Prisma", "started", { email: normalizedEmail });
  const stepStart4 = Date.now();

  let supabaseUser: { id: string; email?: string } | null = null;
  let prismaUser: { id: string; supabaseId: string | null; organizationId: string } | null = null;

  try {
    const [supabaseResult, prismaResult] = await Promise.all([
      // Supabase: list users filtered by email (admin API)
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      // Prisma: look up by email
      prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, supabaseId: true, organizationId: true },
      }),
    ]);

    if (supabaseResult.error) {
      log(4, "Sync check — Supabase lookup failed", "failure", {
        error: supabaseResult.error.message,
      });
      // Non-fatal: treat as Supabase ❌ and continue
    } else {
      supabaseUser =
        supabaseResult.data.users.find(
          (u) => u.email?.toLowerCase() === normalizedEmail
        ) ?? null;
    }

    prismaUser = prismaResult;

    log(4, "Sync check — lookup complete", "success", {
      durationMs: Date.now() - stepStart4,
      supabaseFound: !!supabaseUser,
      supabaseId: supabaseUser?.id ?? null,
      prismaFound: !!prismaUser,
      prismaId: prismaUser?.id ?? null,
    });
  } catch (err: unknown) {
    const e = err as Error;
    log(4, "Sync check — unexpected error", "failure", {
      durationMs: Date.now() - stepStart4,
      message: e?.message,
    });
    return errorResponse(err);
  }

  // ─── STEP 5: Evaluate sync state and resolve ──────────────────────────────

  // ── Case B: Both exist → genuine conflict ─────────────────────────────────
  if (supabaseUser && prismaUser) {
    log("SYNC-B", "Both Supabase and Prisma have this email — conflict", "info", {
      email: normalizedEmail,
      supabaseId: supabaseUser.id,
      prismaId: prismaUser.id,
    });
    return errorResponse(new ConflictError("An account with this email already exists"));
  }

  // ── Case C: Prisma ✅, Supabase ❌ → orphan Prisma row ────────────────────
  if (!supabaseUser && prismaUser) {
    log("SYNC-C", "Orphan Prisma user found (no matching Supabase account) — cleaning up", "info", {
      email: normalizedEmail,
      prismaId: prismaUser.id,
      organizationId: prismaUser.organizationId,
    });

    try {
      // Delete the orphan Prisma user
      await prisma.user.delete({ where: { id: prismaUser.id } });
      log("SYNC-C", "Orphan Prisma user deleted", "success", { prismaId: prismaUser.id });

      // Also delete the orphan organization if it has no remaining users
      const remainingUsers = await prisma.user.count({
        where: { organizationId: prismaUser.organizationId },
      });
      if (remainingUsers === 0) {
        await prisma.organization.delete({ where: { id: prismaUser.organizationId } });
        log("SYNC-C", "Orphan Organization deleted (no remaining users)", "success", {
          organizationId: prismaUser.organizationId,
        });
      } else {
        log("SYNC-C", "Organization retained (has other users)", "info", {
          organizationId: prismaUser.organizationId,
          remainingUsers,
        });
      }
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      log("SYNC-C", "Failed to delete orphan Prisma user", "failure", {
        message: e?.message,
        code: e?.code,
      });
      return errorResponse(err);
    }

    // Reset prismaUser so Case A path runs below
    prismaUser = null;
  }

  // ── Case D: Supabase ✅, Prisma ❌ → rebuild Prisma from Supabase user ─────
  if (supabaseUser && !prismaUser) {
    log("SYNC-D", "Supabase user exists but Prisma user is missing — rebuilding Prisma record", "info", {
      email: normalizedEmail,
      supabaseId: supabaseUser.id,
    });

    try {
      // Update the Supabase user's password to the one just submitted
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUser.id,
        { password, user_metadata: { full_name: fullName } }
      );
      if (pwError) {
        log("SYNC-D", "Failed to update Supabase user password", "failure", { error: pwError.message });
        // Non-fatal — continue with org + user creation
      } else {
        log("SYNC-D", "Supabase user password updated", "success", { supabaseId: supabaseUser.id });
      }

      // Create org + prisma user
      const slug = await uniqueSlug(slugify(organizationName));
      log("SYNC-D", "Creating Organization", "started", { organizationName, slug });

      const org = await prisma.organization.create({
        data: { name: organizationName, slug, plan: "free" },
        select: { id: true, name: true },
      });
      log("SYNC-D", "Organization created", "success", { organizationId: org.id });

      const dbUser = await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          email: normalizedEmail,
          name: fullName,
          role: "ADMIN",
          organizationId: org.id,
        },
        select: { id: true, email: true },
      });
      log("SYNC-D", "Prisma user rebuilt", "success", { userId: dbUser.id, organizationId: org.id });

      log("SYNC-D", "Registration complete via sync-D path", "success", {
        totalDurationMs: Date.now() - routeStart,
        userId: dbUser.id,
        organizationId: org.id,
      });

      return createdResponse(
        { userId: dbUser.id, organizationId: org.id, email: dbUser.email },
        "Account created successfully"
      );
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      log("SYNC-D", "Failed to rebuild Prisma record", "failure", {
        message: e?.message,
        code: e?.code,
      });
      return errorResponse(err);
    }
  }

  // ── Case A: Neither exists → standard registration path ───────────────────
  log("SYNC-A", "No existing records found — proceeding with standard registration", "info", {
    email: normalizedEmail,
  });

  // ─── STEP 6: Create Supabase Auth user ───────────────────────────────────
  log(6, "Create Supabase Auth user", "started", { email: normalizedEmail });
  const stepStart6 = Date.now();

  let supabaseId: string;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true, // skip email verification — user is active immediately
    user_metadata: { full_name: fullName },
  });

  if (authError || !authData?.user) {
    log(6, "Create Supabase Auth user", "failure", {
      durationMs: Date.now() - stepStart6,
      supabaseErrorMessage: authError?.message,
      supabaseErrorStatus: authError?.status,
      supabaseErrorCode: authError?.code,
      hasUser: !!authData?.user,
    });
    if (authError?.message?.toLowerCase().includes("already registered")) {
      return errorResponse(new ConflictError("An account with this email already exists"));
    }
    return NextResponse.json(
      {
        success: false,
        message: authError?.message ?? "Failed to create authentication account",
        data: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  supabaseId = authData.user.id;
  log(6, "Create Supabase Auth user", "success", {
    durationMs: Date.now() - stepStart6,
    supabaseId,
  });

  // ─── STEP 7: Generate unique organization slug ────────────────────────────
  log(7, "Generate organization slug", "started", { organizationName });
  const stepStart7 = Date.now();
  const slug = await uniqueSlug(slugify(organizationName));
  log(7, "Generate organization slug", "success", { durationMs: Date.now() - stepStart7, slug });

  // ─── STEP 8: Create Organization in Prisma ───────────────────────────────
  // NOTE: We do NOT use $transaction here because DATABASE_URL may point to
  // the Supabase PgBouncer pooler with pgbouncer=true (transaction mode),
  // which does NOT support Prisma interactive transactions. Instead we create
  // records sequentially and roll back manually on failure.
  log(8, "Create Organization in Prisma", "started", { organizationName, slug });
  const stepStart8 = Date.now();

  let organization: { id: string; name: string };
  try {
    organization = await prisma.organization.create({
      data: { name: organizationName, slug, plan: "free" },
      select: { id: true, name: true },
    });
    log(8, "Create Organization in Prisma", "success", {
      durationMs: Date.now() - stepStart8,
      organizationId: organization.id,
    });
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    log(8, "Create Organization in Prisma", "failure", {
      durationMs: Date.now() - stepStart8,
      errorType: e?.constructor?.name,
      message: e?.message,
      prismaCode: e?.code,
    });
    // Rollback: delete Supabase auth user to prevent orphan accounts
    log(8, "Rollback — deleting Supabase Auth user", "started", { supabaseId });
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseId);
    if (deleteError) {
      log(8, "Rollback — deleting Supabase Auth user", "failure", {
        supabaseId,
        deleteError,
        warning: "ORPHAN SUPABASE USER — manual cleanup required",
      });
    } else {
      log(8, "Rollback — deleting Supabase Auth user", "success", { supabaseId });
    }
    return errorResponse(err);
  }

  // ─── STEP 9: Create User in Prisma ───────────────────────────────────────
  log(9, "Create User in Prisma", "started", { email: normalizedEmail, organizationId: organization.id });
  const stepStart9 = Date.now();

  let dbUser: { id: string; email: string };
  try {
    dbUser = await prisma.user.create({
      data: {
        supabaseId,
        email: normalizedEmail,
        name: fullName,
        role: "ADMIN",
        organizationId: organization.id,
      },
      select: { id: true, email: true },
    });
    log(9, "Create User in Prisma", "success", {
      durationMs: Date.now() - stepStart9,
      userId: dbUser.id,
    });
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    log(9, "Create User in Prisma", "failure", {
      durationMs: Date.now() - stepStart9,
      errorType: e?.constructor?.name,
      message: e?.message,
      prismaCode: e?.code,
    });
    // Rollback: delete Organization and Supabase user
    log(9, "Rollback — deleting Organization", "started", { organizationId: organization.id });
    await prisma.organization.delete({ where: { id: organization.id } }).catch((delErr: unknown) => {
      log(9, "Rollback — deleting Organization", "failure", { delErr });
    });
    log(9, "Rollback — deleting Organization", "success", { organizationId: organization.id });

    log(9, "Rollback — deleting Supabase Auth user", "started", { supabaseId });
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseId);
    if (deleteError) {
      log(9, "Rollback — deleting Supabase Auth user", "failure", {
        supabaseId,
        deleteError,
        warning: "ORPHAN SUPABASE USER — manual cleanup required",
      });
    } else {
      log(9, "Rollback — deleting Supabase Auth user", "success", { supabaseId });
    }
    return errorResponse(err);
  }

  // ─── STEP 10: Return response ─────────────────────────────────────────────
  log(10, "Return success response", "success", {
    totalDurationMs: Date.now() - routeStart,
    userId: dbUser.id,
    organizationId: organization.id,
  });

  return createdResponse(
    {
      userId: dbUser.id,
      organizationId: organization.id,
      email: dbUser.email,
    },
    "Account created successfully"
  );
}
