// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/register — Create Supabase account + Org + User in Prisma
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
  step: number,
  label: string,
  status: "started" | "success" | "failure",
  extra?: Record<string, unknown>
) {
  const ts = new Date().toISOString();
  const prefix = `[REGISTER][STEP ${step}][${status.toUpperCase()}]`;
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

  // ─── STEP 4: Check existing user ─────────────────────────────────────────
  log(4, "Check existing user in Prisma", "started", { email });
  const stepStart4 = Date.now();

  let existingUser: { id: string } | null = null;
  try {
    existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    log(4, "Check existing user in Prisma", "failure", {
      durationMs: Date.now() - stepStart4,
      errorType: e?.constructor?.name,
      message: e?.message,
      prismaCode: e?.code,
      stack: e?.stack,
    });
    return errorResponse(err);
  }

  if (existingUser) {
    log(4, "Check existing user in Prisma", "failure", {
      durationMs: Date.now() - stepStart4,
      reason: "Email already exists",
    });
    return errorResponse(new ConflictError("An account with this email already exists"));
  }
  log(4, "Check existing user in Prisma", "success", { durationMs: Date.now() - stepStart4, found: false });

  // ─── STEP 5: Create Supabase Auth user ───────────────────────────────────
  log(5, "Create Supabase Auth user", "started", { email });
  const stepStart5 = Date.now();

  const supabaseAdmin = getSupabaseServer();
  let supabaseId: string;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authData?.user) {
    log(5, "Create Supabase Auth user", "failure", {
      durationMs: Date.now() - stepStart5,
      supabaseError: authError,
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
  log(5, "Create Supabase Auth user", "success", {
    durationMs: Date.now() - stepStart5,
    supabaseId,
  });

  // ─── STEP 6: Generate unique organization slug ────────────────────────────
  log(6, "Generate organization slug", "started", { organizationName });
  const stepStart6 = Date.now();
  const slug = await uniqueSlug(slugify(organizationName));
  log(6, "Generate organization slug", "success", { durationMs: Date.now() - stepStart6, slug });

  // ─── STEP 7: Create Organization in Prisma ───────────────────────────────
  // NOTE: We do NOT use $transaction here because DATABASE_URL may point to
  // the Supabase PgBouncer pooler with pgbouncer=true (transaction mode),
  // which does NOT support Prisma interactive transactions. Instead we create
  // records sequentially and roll back manually on failure.
  log(7, "Create Organization in Prisma", "started", { organizationName, slug });
  const stepStart7 = Date.now();

  let organization: { id: string; name: string };
  try {
    organization = await prisma.organization.create({
      data: { name: organizationName, slug, plan: "free" },
      select: { id: true, name: true },
    });
    log(7, "Create Organization in Prisma", "success", {
      durationMs: Date.now() - stepStart7,
      organizationId: organization.id,
    });
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    log(7, "Create Organization in Prisma", "failure", {
      durationMs: Date.now() - stepStart7,
      errorType: e?.constructor?.name,
      message: e?.message,
      prismaCode: e?.code,
      stack: e?.stack,
      requestPayload: { email, organizationName, fullName },
    });
    // Rollback: delete Supabase auth user to prevent orphan accounts
    log(7, "Rollback — deleting Supabase Auth user", "started", { supabaseId });
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseId);
    if (deleteError) {
      log(7, "Rollback — deleting Supabase Auth user", "failure", {
        supabaseId,
        deleteError,
        warning: "ORPHAN SUPABASE USER — manual cleanup required",
      });
    } else {
      log(7, "Rollback — deleting Supabase Auth user", "success", { supabaseId });
    }
    return errorResponse(err);
  }

  // ─── STEP 8: Create User in Prisma ───────────────────────────────────────
  log(8, "Create User in Prisma", "started", { email, organizationId: organization.id });
  const stepStart8 = Date.now();

  let dbUser: { id: string; email: string };
  try {
    dbUser = await prisma.user.create({
      data: {
        supabaseId,
        email,
        name: fullName,
        role: "ADMIN",
        organizationId: organization.id,
      },
      select: { id: true, email: true },
    });
    log(8, "Create User in Prisma", "success", {
      durationMs: Date.now() - stepStart8,
      userId: dbUser.id,
    });
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    log(8, "Create User in Prisma", "failure", {
      durationMs: Date.now() - stepStart8,
      errorType: e?.constructor?.name,
      message: e?.message,
      prismaCode: e?.code,
      stack: e?.stack,
      requestPayload: { email, organizationId: organization.id, fullName },
    });
    // Rollback: delete Organization and Supabase user
    log(8, "Rollback — deleting Organization", "started", { organizationId: organization.id });
    await prisma.organization.delete({ where: { id: organization.id } }).catch((delErr: unknown) => {
      log(8, "Rollback — deleting Organization", "failure", { delErr });
    });
    log(8, "Rollback — deleting Organization", "success", { organizationId: organization.id });

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

  // ─── STEP 9: Return response ──────────────────────────────────────────────
  log(9, "Return success response", "success", {
    totalDurationMs: Date.now() - routeStart,
    userId: dbUser.id,
    organizationId: organization.id,
  });

  return createdResponse(
    {
      userId: dbUser.id,
      organizationId: organization.id,
      email: dbUser.email,
      message: "Account created. Please check your email to verify your account.",
    },
    "Registration successful"
  );
}
