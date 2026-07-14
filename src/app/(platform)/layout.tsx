"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { TopNav } from "@/components/navbar/top-nav";
import { CommandPalette } from "@/components/command-palette";
import { Menu, X, Sparkles } from "lucide-react";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────────── */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* ── Mobile header bar ───────────────────────────────────────────────── */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-50 h-14 flex items-center justify-between border-b border-[#F3F4F6] bg-white/90 backdrop-blur-xl px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B2C] to-[#FF824E]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[14px] font-bold text-[#111827]">PlantMind AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] transition-all"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile drawer overlay + sidebar ─────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          {/* Drawer */}
          <div className="lg:hidden fixed inset-y-0 left-0 z-[60] w-[280px] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.12)] flex flex-col animate-in slide-in-from-left duration-200">
            {/* Close button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E]">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-[14px] font-bold text-[#111827]">PlantMind AI</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-all"
                aria-label="Close navigation"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <AppSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <CommandPalette />

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="lg:ml-[280px]">
        <TopNav />
        {/* On mobile: offset below the fixed header bar */}
        <div className="pt-14 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
