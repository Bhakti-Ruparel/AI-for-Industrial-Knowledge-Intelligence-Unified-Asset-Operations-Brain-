"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActionableInsights, fetchDashboardMetrics } from "@/services/api/analytics";
import { useToast } from "@/components/ui/toast";
import { ActionableInsightCard, type InsightVariant } from "@/components/shared/actionable-insight-card";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  Sparkles, AlertTriangle, CheckCircle2, Clock, Bot,
  TrendingUp, Shield, Wrench, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANT_ICONS = {
  danger:  AlertTriangle,
  warning: Clock,
  success: CheckCircle2,
  info:    Bot,
} as const;

const SUGGESTIONS = [
  "How many open incidents are there?",
  "Which equipment needs maintenance soon?",
  "What is the compliance score?",
  "How many documents are indexed?",
  "Show critical equipment",
];

const FILTER_TABS = [
  { key: "all",     label: "All"      },
  { key: "danger",  label: "Critical" },
  { key: "warning", label: "Warning"  },
  { key: "info",    label: "Info"     },
  { key: "success", label: "Resolved" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function InsightsPage() {
  const toast = useToast();
  const [filter,      setFilter]      = useState<InsightVariant | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: insights = [], isLoading, isError, refetch } = useQuery({
    queryKey:        ["insights"],
    queryFn:         fetchActionableInsights,
    staleTime:       30_000,
    refetchInterval: 60_000,
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey:  ["analytics"],
    queryFn:   fetchDashboardMetrics,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load insights");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = insights.filter((ins) => {
    const matchVariant = filter === "all" || ins.variant === filter;
    const matchSearch  = !searchQuery ||
      ins.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchVariant && matchSearch;
  });

  const counts = {
    danger:  insights.filter((i) => i.variant === "danger").length,
    warning: insights.filter((i) => i.variant === "warning").length,
    info:    insights.filter((i) => i.variant === "info").length,
    success: insights.filter((i) => i.variant === "success").length,
  };

  const tabs = FILTER_TABS.map((t) => ({
    key:   t.key,
    label: t.label,
    count: t.key === "all" ? insights.length : counts[t.key as keyof typeof counts] ?? 0,
  })).filter((t) => t.key === "all" || t.count > 0);

  // Live indicator text
  const lastUpdated = timeAgo(new Date().toISOString());

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <PageHeader
        title="AI Insights"
        subtitle="Actionable recommendations derived from your live operational data."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live · {lastUpdated}
          </span>
        }
      />

      {/* Search + filter */}
      <FilterBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search insights…"
        tabs={tabs}
        activeTab={filter}
        onTabChange={(k) => setFilter(k as InsightVariant | "all")}
      />

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSearchQuery(s)}
            className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[11px] font-medium text-zinc-500 hover:border-[#FF6B2C]/30 hover:text-zinc-800 hover:bg-[#FFF8F5] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      {!loadingMetrics && metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Equipment Health", value: `${metrics.equipment.averageHealth}%`,       icon: TrendingUp, color: metrics.equipment.averageHealth  >= 70 ? "text-emerald-600" : "text-red-500",   bg: metrics.equipment.averageHealth  >= 70 ? "bg-emerald-50" : "bg-red-50"   },
            { label: "Compliance Score", value: `${metrics.compliance.overallScore}%`,        icon: Shield,     color: metrics.compliance.overallScore   >= 70 ? "text-emerald-600" : "text-amber-600", bg: metrics.compliance.overallScore   >= 70 ? "bg-emerald-50" : "bg-amber-50" },
            { label: "Open Incidents",   value: String(metrics.incidents.open),               icon: AlertTriangle, color: metrics.incidents.open > 0 ? "text-red-500" : "text-emerald-600",            bg: metrics.incidents.open > 0 ? "bg-red-50" : "bg-emerald-50"               },
            { label: "Docs Indexed",     value: metrics.documents.indexed.toLocaleString(),   icon: FileText,   color: "text-blue-600", bg: "bg-blue-50"                                                                                                                              },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-2xl border border-transparent p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]", s.bg)}>
              <p className={cn("text-[22px] font-bold tabular-nums leading-none", s.color)}>{s.value}</p>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                <s.icon className={cn("h-3 w-3", s.color)} />
                <p className="text-[11px] text-zinc-500 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights grid */}
      {isError   && <ErrorState message="Failed to load insights." onRetry={refetch} />}
      {isLoading && <RowSkeleton rows={4} />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title={searchQuery ? "No insights match your search" : "No insights available"}
          description={searchQuery ? "Try a different search term or clear filters." : "The system is fully healthy, or data is still loading."}
          action={
            searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-50 transition-all"
              >
                Clear search
              </button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ins) => (
            <ActionableInsightCard
              key={ins.id}
              icon={VARIANT_ICONS[ins.variant as InsightVariant] ?? Wrench}
              title={ins.title}
              description={ins.description}
              href={ins.href}
              variant={ins.variant as InsightVariant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
