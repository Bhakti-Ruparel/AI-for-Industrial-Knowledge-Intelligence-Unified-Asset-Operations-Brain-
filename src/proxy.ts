// ═══════════════════════════════════════════════════════════════════════════════
// Next.js 16 Proxy — Route protection & session refresh
// (Replaces "middleware" which is deprecated in Next.js 16)
// ═══════════════════════════════════════════════════════════════════════════════

import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/database/supabase/middleware";

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/confirm",
];

// Routes that authenticated users should NOT revisit (redirect to /dashboard)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Always allow public assets, browser internals & auth API routes ──────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/.well-known") ||
    pathname.match(/\.(svg|png|jpg|jpeg|ico|webp|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // ── Create Supabase proxy client (refreshes session in cookies) ──────────
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  // IMPORTANT: always call getUser() to refresh the session token
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // ── Root "/" — show landing page; authenticated users go to dashboard ────
  if (pathname === "/") {
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ── Unauthenticated user trying to access protected route ────────────────
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // ── Authenticated user visiting login/register → redirect to dashboard ───
  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("redirectTo");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
