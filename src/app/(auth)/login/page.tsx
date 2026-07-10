"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative z-10 w-full max-w-[420px] px-4">
      <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#F3F4F6]">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E] shadow-lg shadow-[#FF6B2C]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[22px] font-bold text-[#111827]">Welcome back</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">Sign in to PlantMind AI</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-[#374151]">Email</label>
            <input type="email" placeholder="admin@plantmind.ai" className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] text-[#111827] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF]" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#374151]">Password</label>
            <input type="password" placeholder="••••••••" className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] text-[#111827] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF]" />
          </div>
          <Link href="/dashboard" className="block">
            <button className="w-full rounded-xl bg-[#FF6B2C] py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#FF824E] hover:shadow-md active:scale-[0.98]">
              Sign In
            </button>
          </Link>
        </div>
        <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-[#FF6B2C] hover:text-[#FF824E]">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
