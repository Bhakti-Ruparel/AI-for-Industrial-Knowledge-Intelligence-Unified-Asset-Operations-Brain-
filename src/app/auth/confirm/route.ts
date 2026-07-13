// ═══════════════════════════════════════════════════════════════════════════════
// GET /auth/confirm — Supabase PKCE email confirmation handler
// ═══════════════════════════════════════════════════════════════════════════════

import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "recovery" | "invite" | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const url = new URL(`${origin}/login`);
  url.searchParams.set("error", "The link has expired or is invalid. Please try again.");
  return NextResponse.redirect(url);
}
