"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, MessageSquare, FileText, Network, Wrench,
  Calendar, AlertTriangle, Shield, BarChart3, Bot, Bell,
  Settings, Bookmark, FileBarChart, Plug, Sparkles, LogOut, User,
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { getSupabaseBrowser } from "@/lib/database/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Copilot", href: "/copilot", icon: MessageSquare },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Knowledge Graph", href: "/knowledge-graph", icon: Network },
  { name: "Equipment", href: "/equipment", icon: Wrench },
  { name: "Maintenance", href: "/maintenance", icon: Calendar },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI Agents", href: "/agents", icon: Bot },
];

const workspaceNav = [
  { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Integrations", href: "/integrations", icon: Plug },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      clearAuth();
      queryClient.clear();
      router.push("/login");
    }
  };

  const initials = user ? getInitials(user.name) : "?";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-border bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-7 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E] shadow-sm">
          <Sparkles className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-[#111827] tracking-tight">PlantMind AI</h1>
          {user?.organizationName && (
            <p className="text-[11px] text-[#6B7280] font-medium truncate max-w-[160px]">
              {user.organizationName}
            </p>
          )}
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
          Main Menu
        </p>
        <nav className="space-y-0.5">
          {mainNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#FFF2EB] text-[#FF6B2C] shadow-sm"
                    : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
                )}
              >
                <item.icon
                  className={cn("h-[18px] w-[18px]", isActive && "text-[#FF6B2C]")}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Workspace */}
        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
          Workspace
        </p>
        <nav className="space-y-0.5">
          {workspaceNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#FFF2EB] text-[#FF6B2C]"
                    : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User section */}
      <div className="border-t border-border px-4 py-4 space-y-1">
        {/* Profile link */}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
            pathname === "/profile"
              ? "bg-[#FFF2EB] text-[#FF6B2C]"
              : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
          )}
        >
          <User className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>Profile</span>
        </Link>

        {/* User info + logout */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-9 w-9 rounded-full object-cover border border-[#E5E7EB]"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF2EB] text-[11px] font-bold text-[#FF6B2C]">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#111827] truncate">
              {user?.name ?? "Loading…"}
            </p>
            <p className="text-[11px] text-[#6B7280] truncate">
              {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-all"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
