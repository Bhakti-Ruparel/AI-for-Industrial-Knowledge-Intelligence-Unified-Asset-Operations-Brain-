// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout — Server-side sign out
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { successResponse } from "@/utils/response";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return successResponse(null, "Logged out successfully");
  } catch {
    // Even if signOut fails, return success so client can clear local state
    return successResponse(null, "Logged out");
  }
}
