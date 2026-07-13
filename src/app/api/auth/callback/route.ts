// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/callback — Supabase email verification & OAuth callback
// ═══════════════════════════════════════════════════════════════════════════════

import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // If Supabase returned an error
  if (errorParam) {
    const url = new URL(`${origin}/login`);
    url.searchParams.set("error", errorDescription ?? "Authentication failed");
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`);
    }

    const url = new URL(`${origin}/login`);
    url.searchParams.set("error", "Could not verify your email. Please try again.");
    return NextResponse.redirect(url);
  }

  // No code — redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
