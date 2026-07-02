"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="relative z-10 w-full max-w-[420px] px-4">
      <div className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-[#F3F4F6]">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E] shadow-lg shadow-[#FF6B2C]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-[22px] font-bold text-[#111827]">Create account</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">Get started with PlantMind AI</p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[#374151]">First Name</label>
              <input placeholder="John" className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF]" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#374151]">Last Name</label>
              <input placeholder="Doe" className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF]" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#374151]">Email</label>
            <input type="email" placeholder="you@company.com" className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF]" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#374151]">Password</label>
            <input type="password" placeholder="••••••••" className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[13px] outline-none transition-all focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 placeholder:text-[#9CA3AF]" />
          </div>
          <Link href="/dashboard" className="block">
            <button className="w-full rounded-xl bg-[#FF6B2C] py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#FF824E] hover:shadow-md active:scale-[0.98]">
              Create Account
            </button>
          </Link>
        </div>
        <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#FF6B2C] hover:text-[#FF824E]">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
