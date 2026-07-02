"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, MessageSquare, FileText, Network, Wrench,
  Calendar, AlertTriangle, Shield, BarChart3, Bot, Bell,
  Settings, Bookmark, FileBarChart, Plug, Sparkles,
} from "lucide-react";

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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-border bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-7 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E] shadow-sm">
          <Sparkles className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-[#111827] tracking-tight">PlantMind AI</h1>
          <p className="text-[11px] text-[#6B7280] font-medium">Industrial Intelligence</p>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Main Menu</p>
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
                <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-[#FF6B2C]")} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Workspace */}
        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Workspace</p>
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

      {/* Upgrade Card */}
      <div className="px-4 pb-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#FFF7ED] to-[#FFF2EB] p-4 border border-[#FFEDD5]">
          <p className="text-[13px] font-semibold text-[#111827]">Upgrade to Pro</p>
          <p className="mt-1 text-[11px] text-[#6B7280] leading-relaxed">Unlock advanced analytics, custom reports and more.</p>
          <button className="mt-3 rounded-xl bg-[#FF6B2C] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#FF824E] hover:shadow-md active:scale-[0.98]">
            Upgrade Now
          </button>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF2EB] text-[11px] font-bold text-[#FF6B2C]">
            AU
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#111827] truncate">Admin User</p>
            <p className="text-[11px] text-[#6B7280] truncate">admin@cosmos.com</p>
          </div>
          <Settings className="h-4 w-4 text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer transition-colors" />
        </div>
      </div>
    </aside>
  );
}
