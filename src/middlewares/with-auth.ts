// ═══════════════════════════════════════════════════════════════════════════════
// API Route Auth Middleware — Supabase JWT verification
// Supports both:
//   - Cookie-based sessions (browser requests via @supabase/ssr)
//   - Bearer token (programmatic/mobile clients via Authorization header)
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabaseServer } from "@/lib/database/supabase/client";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { errorResponse } from "@/utils/response";
import type { UserRole } from "@/types/auth";
import { hasRole, hasPermission } from "@/types/auth";

export interface AuthContext {
  userId: string;         // Prisma User ID (cuid)
  supabaseId: string;     // Supabase auth UUID
  organizationId: string;
  role: UserRole;
  email: string;
  name: string;
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<Response>;

// ── Core: verify identity — cookie session OR Bearer token ───────────────────

async function resolveUser(request: NextRequest): Promise<AuthContext> {
  if (!prisma) {
    throw new UnauthorizedError("Database unavailable");
  }

  let supabaseUserId: string | null = null;

  // ── Try Bearer token first (Authorization header) ────────────────────────
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      const adminClient = getSupabaseServer();
      const { data: { user }, error } = await adminClient.auth.getUser(token);
      if (!error && user) {
        supabaseUserId = user.id;
      }
    }
  }

  // ── Fall back to cookie-based session (browser requests) ─────────────────
  if (!supabaseUserId) {
    // Build an SSR client that reads cookies from the request
    // Route Handlers don't have writable cookies so we only read
    const cookieHeader = request.headers.get("cookie") ?? "";
    const parsedCookies = parseCookieHeader(cookieHeader);

    const ssrClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            Object.entries(parsedCookies).map(([name, value]) => ({ name, value })),
          setAll: () => {
            // Route Handlers cannot write cookies — session refresh is handled by proxy.ts
          },
        },
      }
    );

    const { data: { user }, error } = await ssrClient.auth.getUser();
    if (!error && user) {
      supabaseUserId = user.id;
    }
  }

  if (!supabaseUserId) {
    throw new UnauthorizedError("Authentication required");
  }

  // ── Load user from PostgreSQL ────────────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
      deletedAt: true,
    },
  });

  if (!dbUser) {
    throw new UnauthorizedError("User account not found");
  }

  if (dbUser.deletedAt) {
    throw new UnauthorizedError("Account has been deactivated");
  }

  return {
    userId: dbUser.id,
    supabaseId: supabaseUserId,
    organizationId: dbUser.organizationId,
    role: dbUser.role as UserRole,
    email: dbUser.email,
    name: dbUser.name,
  };
}

// ── Simple cookie header parser ───────────────────────────────────────────────
function parseCookieHeader(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx < 0) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val.replace(/^"|"$/g, ""));
  });
  return cookies;
}

// ── withAuth: basic authentication required ──────────────────────────────────

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    try {
      const ctx = await resolveUser(request);
      return handler(request, ctx);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

// ── withRole: require minimum role level ─────────────────────────────────────

export function withRole(requiredRole: UserRole, handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    try {
      const ctx = await resolveUser(request);
      if (!hasRole(ctx.role, requiredRole)) {
        throw new ForbiddenError(`This action requires ${requiredRole} role or higher`);
      }
      return handler(request, ctx);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

// ── withPermission: require specific permission ───────────────────────────────

export function withPermission(permission: string, handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    try {
      const ctx = await resolveUser(request);
      if (!hasPermission(ctx.role, permission)) {
        throw new ForbiddenError("You do not have permission to perform this action");
      }
      return handler(request, ctx);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

// ── Inline helpers (throw — do not wrap) ─────────────────────────────────────

export function requireRole(context: AuthContext, requiredRole: UserRole): void {
  if (!hasRole(context.role, requiredRole)) {
    throw new ForbiddenError(`Requires ${requiredRole} role or higher`);
  }
}

export function requirePermission(context: AuthContext, permission: string): void {
  if (!hasPermission(context.role, permission)) {
    throw new ForbiddenError("Insufficient permissions");
  }
}
