"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Plus, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useAuthStore } from "@/hooks/use-auth-store";
import { getSupabaseBrowser } from "@/lib/database/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/services/api/notifications";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Administrator",
    ENGINEER: "Engineer",
    TECHNICIAN: "Technician",
    OPERATOR: "Operator",
    VIEWER: "Viewer",
  };
  return map[role] ?? role;
}

export function TopNav() {
  const { setCommandOpen } = useStore();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);

  // Real unread count from DB
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn:  fetchNotifications,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const unread = (notificationsData ?? []).filter((n) => !n.read).length;
  const initials = user ? getInitials(user.name) : "?";

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      clearAuth();
      queryClient.clear();
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#F3F4F6] bg-white/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Search — hidden on small mobile, compact on tablet, full on desktop */}
      <button
        onClick={() => setCommandOpen(true)}
        className="hidden sm:flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-sm text-[#9CA3AF] transition-all hover:border-[#D1D5DB] hover:shadow-sm w-[240px] lg:w-[320px]"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="text-[13px]">Search anything…</span>
        <kbd className="ml-auto hidden lg:flex items-center gap-0.5 rounded-lg border border-[#E5E7EB] bg-white px-2 py-0.5 text-[10px] font-medium text-[#9CA3AF] shadow-sm">
          ⌘K
        </kbd>
      </button>

      {/* Mobile search icon only */}
      <button
        onClick={() => setCommandOpen(true)}
        className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] transition-all"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Create */}
        <button
          onClick={() => router.push("/documents")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B2C] text-white shadow-sm transition-all hover:bg-[#FF824E] hover:shadow-md active:scale-95"
          title="Upload document"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>

        {/* Notifications bell — links to notifications page */}
        <Link
          href="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#111827]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B2C] text-[9px] font-bold text-white shadow-sm">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-[#E5E7EB] mx-1" />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 rounded-2xl border border-[#E5E7EB] px-2.5 py-1.5 transition-all hover:bg-[#F9FAFB] hover:shadow-sm"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF2EB] text-[10px] font-bold text-[#FF6B2C]">
                {initials}
              </div>
            )}
            {/* Name only on sm+ */}
            <div className="hidden sm:block text-left">
              <p className="text-[12px] font-semibold text-[#111827] leading-none">
                {user?.name?.split(" ")[0] ?? "…"}
              </p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                {user?.role ? roleLabel(user.role) : ""}
              </p>
            </div>
            <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-[#9CA3AF] transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-[220px] rounded-2xl border border-[#F3F4F6] bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                <div className="px-3 py-2.5 border-b border-[#F3F4F6] mb-1">
                  <p className="text-[12px] font-semibold text-[#111827] truncate">{user?.name}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{user?.email}</p>
                  {user?.organizationName && (
                    <p className="mt-0.5 text-[10px] text-[#FF6B2C] font-medium truncate">{user.organizationName}</p>
                  )}
                </div>

                <button
                  onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-[#6B7280]" />
                  View profile
                </button>

                <button
                  onClick={() => { setProfileOpen(false); router.push("/settings"); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-[#6B7280]" />
                  Settings
                </button>

                <div className="my-1 h-px bg-[#F3F4F6]" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
