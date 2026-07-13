"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/database/supabase/client";
import { useAuthStore } from "@/hooks/use-auth-store";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  // Show messages from URL params (e.g., after email verification)
  useEffect(() => {
    const urlError = searchParams.get("error");
    const urlMsg = searchParams.get("message");
    if (urlError) setError(decodeURIComponent(urlError));
    if (urlMsg) setSuccessMessage(decodeURIComponent(urlMsg));
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowser();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        // Map Supabase error messages to user-friendly ones
        const msg = signInError.message.toLowerCase();
        if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
          setError("Incorrect email or password. Please try again.");
        } else if (msg.includes("email not confirmed")) {
          setError("Please verify your email address before logging in. Check your inbox.");
        } else if (msg.includes("too many requests")) {
          setError("Too many login attempts. Please wait a few minutes and try again.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Session established — AuthProvider's onAuthStateChange will handle
      // loading the user profile and redirecting
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[420px] px-4">
      <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#F3F4F6]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E] shadow-lg shadow-[#FF6B2C]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[22px] font-bold text-[#111827]">Welcome back</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">Sign in to PlantMind AI</p>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#15803D]">{successMessage}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3">
            <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#DC2626]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="text-[12px] font-medium text-[#374151]">
              Email
            </label>
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-[#374151]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-medium text-[#FF6B2C] hover:text-[#FF824E]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 pr-11 text-[13px] text-[#111827] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={rememberMe}
              onClick={() => setRememberMe(!rememberMe)}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                rememberMe
                  ? "border-[#FF6B2C] bg-[#FF6B2C]"
                  : "border-[#D1D5DB] bg-white hover:border-[#FF6B2C]"
              }`}
            >
              {rememberMe && (
                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="text-[12px] text-[#6B7280]">Remember me for 30 days</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B2C] py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#FF824E] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-[#FF6B2C] hover:text-[#FF824E]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
