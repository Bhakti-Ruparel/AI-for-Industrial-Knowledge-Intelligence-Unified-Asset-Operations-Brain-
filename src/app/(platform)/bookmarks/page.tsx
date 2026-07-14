"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/page-skeleton";
import {
  Bookmark, LayoutDashboard, FileText, Wrench,
  Calendar, AlertTriangle, Shield, BarChart3,
  Bot, Lightbulb, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Quick-access shortcuts that act as "pinned bookmarks" until full bookmark persistence is built
const quickLinks = [
  { label: "Dashboard",    href: "/dashboard",      icon: LayoutDashboard, description: "Live KPIs and system overview"                  },
  { label: "Documents",    href: "/documents",      icon: FileText,        description: "Upload and manage knowledge base documents"      },
  { label: "Equipment",    href: "/equipment",      icon: Wrench,          description: "Equipment health scores and maintenance history" },
  { label: "Maintenance",  href: "/maintenance",    icon: Calendar,        description: "Work orders, scheduling, and AI recommendations" },
  { label: "Incidents",    href: "/incidents",      icon: AlertTriangle,   description: "Active incidents and root cause analysis"         },
  { label: "Compliance",   href: "/compliance",     icon: Shield,          description: "Regulatory framework tracking and audit scores"  },
  { label: "Analytics",    href: "/analytics",      icon: BarChart3,       description: "Charts, trends, and performance metrics"          },
  { label: "AI Insights",  href: "/insights",       icon: Lightbulb,       description: "Actionable AI-generated recommendations"          },
  { label: "AI Copilot",   href: "/copilot",        icon: Bot,             description: "RAG-powered industrial knowledge assistant"       },
];

export default function BookmarksPage() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Bookmarks"
        subtitle="Quick access to your most-used pages and saved items."
      />

      {/* Quick links section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Quick Links</span>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center gap-3.5 rounded-2xl border border-zinc-200/70 bg-white p-4 transition-all duration-200",
                  "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
                  "hover:border-[#FFD6BE] hover:-translate-y-0.5"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF2EB] transition-colors group-hover:bg-[#FF6B2C]">
                  <Icon className="h-4 w-4 text-[#FF6B2C] transition-colors group-hover:text-white" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-900 group-hover:text-[#FF6B2C] transition-colors">{link.label}</p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{link.description}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-[#FF6B2C] transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Saved bookmarks section — empty state */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Saved Items</span>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>
        <EmptyState
          icon={<Bookmark className="h-5 w-5" />}
          title="No saved bookmarks yet"
          description="Bookmark specific equipment, documents, or incidents from their detail pages for quick access here."
        />
      </div>
    </div>
  );
}
