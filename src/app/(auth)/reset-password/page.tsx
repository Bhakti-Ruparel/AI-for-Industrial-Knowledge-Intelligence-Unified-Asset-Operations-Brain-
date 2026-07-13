"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/database/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verify that the user arrived via a valid reset link
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsValidSession(!!session);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) { setError("Password is required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain an uppercase letter"); return; }
    if (!/[a-z]/.test(password)) { setError("Password must contain a lowercase letter"); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain a number"); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError("Password must contain a special character"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();
      router.push("/login?message=" + encodeURIComponent("Password updated successfully. Please sign in."));
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="relative z-10 flex w-full max-w-[420px] items-center justify-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF6B2C]" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="relative z-10 w-full max-w-[420px] px-4">
        <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#F3F4F6] text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
            <AlertCircle className="h-6 w-6 text-[#DC2626]" />
          </div>
          <h2 className="mt-5 text-[20px] font-bold text-[#111827]">Link expired</h2>
          <p className="mt-2 text-[13px] text-[#6B7280]">
            This password reset link is invalid or has expired. Request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 block w-full rounded-xl bg-[#FF6B2C] py-3 text-center text-[13px] font-semibold text-white hover:bg-[#FF824E] transition-colors"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-[420px] px-4">
      <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#F3F4F6]">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E] shadow-lg shadow-[#FF6B2C]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[22px] font-bold text-[#111827]">New password</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">Choose a strong password for your account</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3">
            <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#DC2626]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="text-[12px] font-medium text-[#374151]">New Password</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 pr-11 text-[13px] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#374151]">Confirm Password</label>
            <div className="relative mt-1.5">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 pr-11 text-[13px] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B2C] py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#FF824E] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
