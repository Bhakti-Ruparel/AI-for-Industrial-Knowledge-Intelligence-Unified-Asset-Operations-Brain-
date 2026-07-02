"use client";

import { Bell, Search, Plus, Calendar, ChevronDown } from "lucide-react";
import { useStore } from "@/hooks/use-store";

export function TopNav() {
  const { user, notifications, setCommandOpen } = useStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-white/80 backdrop-blur-xl px-8">
      {/* Search */}
      <button
        onClick={() => setCommandOpen(true)}
        className="flex items-center gap-3 rounded-2xl border border-border bg-[#FAFAFA] px-5 py-2.5 text-sm text-[#9CA3AF] transition-all hover:border-[#D1D5DB] hover:shadow-sm w-[320px]"
      >
        <Search className="h-4 w-4" />
        <span className="text-[13px]">Search anything...</span>
        <kbd className="ml-auto flex items-center gap-0.5 rounded-lg border border-border bg-white px-2 py-0.5 text-[10px] font-medium text-[#9CA3AF] shadow-sm">
          ⌘K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Quick Create */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B2C] text-white shadow-sm transition-all hover:bg-[#FF824E] hover:shadow-md active:scale-95">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>

        {/* Calendar */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#111827]">
          <Calendar className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#111827]">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#FF6B2C] text-[9px] font-bold text-white shadow-sm">
              {unread}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-border mx-1" />

        {/* Profile */}
        <button className="flex items-center gap-3 rounded-2xl border border-border px-3 py-1.5 transition-all hover:bg-[#F9FAFB] hover:shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF2EB] text-[11px] font-bold text-[#FF6B2C]">
            AU
          </div>
          <div className="text-left">
            <p className="text-[12px] font-semibold text-[#111827]">{user?.name || "Admin User"}</p>
            <p className="text-[10px] text-[#9CA3AF]">Administrator</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
        </button>
      </div>
    </header>
  );
}
