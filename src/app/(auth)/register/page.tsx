"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  organizationName?: string;
  form?: string;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const strength = passed <= 1 ? "Weak" : passed <= 3 ? "Fair" : passed === 4 ? "Good" : "Strong";
  const colors = ["", "#DC2626", "#F59E0B", "#3B82F6", "#3B82F6", "#16A34A"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ backgroundColor: i <= passed ? colors[passed] : "#E5E7EB" }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-[10px] ${c.ok ? "text-[#16A34A]" : "text-[#9CA3AF]"}`}
          >
            {c.ok ? "✓" : "·"} {c.label}
          </span>
        ))}
      </div>
      <p className="text-[10px] font-medium" style={{ color: colors[passed] }}>
        {strength}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [registered, setRegistered] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!form.organizationName.trim()) errs.organizationName = "Organization name is required";
    if (!form.password) errs.password = "Password is required";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.meta?.errors) {
          setErrors(data.meta.errors);
        } else {
          setErrors({ form: data.message || "Registration failed. Please try again." });
        }
        return;
      }

      setRegistered(true);
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="relative z-10 w-full max-w-[420px] px-4">
        <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#F3F4F6] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4]">
            <CheckCircle2 className="h-7 w-7 text-[#16A34A]" />
          </div>
          <h2 className="mt-5 text-[20px] font-bold text-[#111827]">Check your email</h2>
          <p className="mt-2 text-[13px] text-[#6B7280]">
            We sent a verification link to <strong className="text-[#111827]">{form.email}</strong>.
            Click the link to activate your account.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-xl bg-[#FF6B2C] py-3 text-[13px] font-semibold text-white hover:bg-[#FF824E] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-[420px] px-4">
      <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#F3F4F6]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E] shadow-lg shadow-[#FF6B2C]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[22px] font-bold text-[#111827]">Create account</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">Get started with PlantMind AI</p>
        </div>

        {/* Form-level error */}
        {errors.form && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3">
            <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#DC2626]">{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[#374151]">First Name</label>
              <input
                value={form.firstName}
                onChange={update("firstName")}
                placeholder="John"
                autoComplete="given-name"
                disabled={isLoading}
                className={`mt-1.5 w-full rounded-xl border bg-[#FAFAFA] px-4 py-3 text-[13px] outline-none transition-all placeholder:text-[#9CA3AF] disabled:opacity-50 focus:ring-2 focus:ring-[#FF6B2C]/10 ${
                  errors.firstName ? "border-[#DC2626] focus:border-[#DC2626]" : "border-[#E5E7EB] focus:border-[#FF6B2C]"
                }`}
              />
              {errors.firstName && <p className="mt-1 text-[11px] text-[#DC2626]">{errors.firstName}</p>}
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#374151]">Last Name</label>
              <input
                value={form.lastName}
                onChange={update("lastName")}
                placeholder="Doe"
                autoComplete="family-name"
                disabled={isLoading}
                className={`mt-1.5 w-full rounded-xl border bg-[#FAFAFA] px-4 py-3 text-[13px] outline-none transition-all placeholder:text-[#9CA3AF] disabled:opacity-50 focus:ring-2 focus:ring-[#FF6B2C]/10 ${
                  errors.lastName ? "border-[#DC2626] focus:border-[#DC2626]" : "border-[#E5E7EB] focus:border-[#FF6B2C]"
                }`}
              />
              {errors.lastName && <p className="mt-1 text-[11px] text-[#DC2626]">{errors.lastName}</p>}
            </div>
          </div>

          {/* Organization */}
          <div>
            <label className="text-[12px] font-medium text-[#374151]">Organization Name</label>
            <input
              value={form.organizationName}
              onChange={update("organizationName")}
              placeholder="Cosmos CNC Machines"
              autoComplete="organization"
              disabled={isLoading}
              className={`mt-1.5 w-full rounded-xl border bg-[#FAFAFA] px-4 py-3 text-[13px] outline-none transition-all placeholder:text-[#9CA3AF] disabled:opacity-50 focus:ring-2 focus:ring-[#FF6B2C]/10 ${
                errors.organizationName ? "border-[#DC2626] focus:border-[#DC2626]" : "border-[#E5E7EB] focus:border-[#FF6B2C]"
              }`}
            />
            {errors.organizationName && (
              <p className="mt-1 text-[11px] text-[#DC2626]">{errors.organizationName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-[12px] font-medium text-[#374151]">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isLoading}
              className={`mt-1.5 w-full rounded-xl border bg-[#FAFAFA] px-4 py-3 text-[13px] outline-none transition-all placeholder:text-[#9CA3AF] disabled:opacity-50 focus:ring-2 focus:ring-[#FF6B2C]/10 ${
                errors.email ? "border-[#DC2626] focus:border-[#DC2626]" : "border-[#E5E7EB] focus:border-[#FF6B2C]"
              }`}
            />
            {errors.email && <p className="mt-1 text-[11px] text-[#DC2626]">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="text-[12px] font-medium text-[#374151]">Password</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                className={`w-full rounded-xl border bg-[#FAFAFA] px-4 py-3 pr-11 text-[13px] outline-none transition-all placeholder:text-[#9CA3AF] disabled:opacity-50 focus:ring-2 focus:ring-[#FF6B2C]/10 ${
                  errors.password ? "border-[#DC2626] focus:border-[#DC2626]" : "border-[#E5E7EB] focus:border-[#FF6B2C]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-[11px] text-[#DC2626]">{errors.password}</p>}
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-[12px] font-medium text-[#374151]">Confirm Password</label>
            <div className="relative mt-1.5">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                className={`w-full rounded-xl border bg-[#FAFAFA] px-4 py-3 pr-11 text-[13px] outline-none transition-all placeholder:text-[#9CA3AF] disabled:opacity-50 focus:ring-2 focus:ring-[#FF6B2C]/10 ${
                  errors.confirmPassword ? "border-[#DC2626] focus:border-[#DC2626]" : "border-[#E5E7EB] focus:border-[#FF6B2C]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-[#DC2626]">{errors.confirmPassword}</p>
            )}
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
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#FF6B2C] hover:text-[#FF824E]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
