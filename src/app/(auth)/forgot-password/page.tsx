"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/database/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[420px] px-4">
      <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#F3F4F6]">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E] shadow-lg shadow-[#FF6B2C]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[22px] font-bold text-[#111827]">Reset password</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {sent
              ? "Check your email for the reset link"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-[#16A34A] mt-0.5 shrink-0" />
              <p className="text-[12px] text-[#15803D]">
                We sent a password reset link to <strong>{email}</strong>. Check your inbox (and spam folder).
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full rounded-xl border border-[#E5E7EB] py-3 text-[13px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3">
                <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
                <p className="text-[12px] text-[#DC2626]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="text-[12px] font-medium text-[#374151]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] text-[#111827] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF] disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B2C] py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#FF824E] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-[#FF6B2C] hover:text-[#FF824E]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
