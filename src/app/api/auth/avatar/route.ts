// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/avatar — Generate signed upload URL for avatar
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { getSupabaseServer } from "@/lib/database/supabase/client";
import { successResponse, errorResponse } from "@/utils/response";
import { UnauthorizedError } from "@/utils/errors";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new UnauthorizedError();

    const adminSupabase = getSupabaseServer();

    // Create signed upload URL for avatars bucket
    const path = `avatars/${user.id}`;
    const { data, error: urlError } = await adminSupabase.storage
      .from("avatars")
      .createSignedUploadUrl(path);

    if (urlError) {
      return NextResponse.json(
        { success: false, message: "Failed to generate upload URL: " + urlError.message, data: null, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    return successResponse({
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
