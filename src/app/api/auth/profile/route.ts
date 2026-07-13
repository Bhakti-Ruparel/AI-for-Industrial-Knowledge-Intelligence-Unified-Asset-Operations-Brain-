// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/auth/profile — Update authenticated user's profile
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { getSupabaseServer } from "@/lib/database/supabase/client";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { UnauthorizedError, NotFoundError, ValidationError } from "@/utils/errors";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional().nullable(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new UnauthorizedError();
    if (!prisma) {
      return NextResponse.json({ success: false, message: "Database unavailable", data: null, timestamp: new Date().toISOString() }, { status: 503 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "change_password") {
      // Validate
      const result = ChangePasswordSchema.safeParse(body);
      if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((e) => {
          const key = e.path.join(".") || "form";
          if (!errors[key]) errors[key] = [];
          errors[key].push(e.message);
        });
        throw new ValidationError("Validation failed", errors);
      }

      // Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: result.data.currentPassword,
      });

      if (signInError) {
        throw new ValidationError("Validation failed", {
          currentPassword: ["Current password is incorrect"],
        });
      }

      // Update password via admin client
      const adminSupabase = getSupabaseServer();
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        user.id,
        { password: result.data.newPassword }
      );

      if (updateError) throw new Error("Failed to update password");

      return successResponse(null, "Password changed successfully");
    }

    // Profile update
    const result = UpdateProfileSchema.safeParse(body);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((e) => {
        const key = e.path.join(".") || "form";
        if (!errors[key]) errors[key] = [];
        errors[key].push(e.message);
      });
      throw new ValidationError("Validation failed", errors);
    }

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) throw new NotFoundError("User");

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        ...(result.data.name && { name: result.data.name }),
        ...(result.data.avatar !== undefined && { avatar: result.data.avatar }),
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    // Sync name to Supabase auth metadata
    if (result.data.name) {
      await supabase.auth.updateUser({ data: { full_name: result.data.name } });
    }

    return successResponse({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar,
      role: updated.role,
      organizationId: updated.organizationId,
      organizationName: updated.organization.name,
    }, "Profile updated");
  } catch (error) {
    return errorResponse(error);
  }
}
