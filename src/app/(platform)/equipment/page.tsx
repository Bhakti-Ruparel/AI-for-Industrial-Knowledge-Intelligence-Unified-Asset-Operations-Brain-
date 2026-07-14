"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEquipment } from "@/services/api/equipment";
import { CardGridSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { useToast } from "@/components/ui/toast";
import {
  Wrench, FileText, Calendar, SlidersHorizontal,
  MapPin, Tag, TrendingUp, TrendingDown, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Local API equipment type (reflects actual API response) ──────────────────
interface ApiEquipment {
  id:              string;
  name:            string;
  model:           string;
  series:          string;
  category:        string;
  status:          string;
  healthScore:     number;
  location?:       string;
  nextMaintenance?: string;
  documents?:      unknown[];
}

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  operational: { label: "Operational",    dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50"  },
  maintenance: { label: "In Maintenance", dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50"    },
  offline:     { label: "Offline",        dot: "bg-zinc-400",    text: "text-zinc-600",    bg: "bg-zinc-50"     },
  critical:    { label: "Critical",       dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50"      },
};

// ── Health ring ───────────────────────────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const radius       = 22;
  const circumference = 2 * Math.PI * radius;
  const offset       = circumference - (score / 100) * circumference;
  const color =
    score >= 85 ? "#10b981" :
    score >= 65 ? "#f59e0b" :
    "#ef4444";

  return (
    <div className="relative flex h-14 w-14 items-center justify-center shrink-0">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
        <circle
          cx="28" cy="28" r={radius}
          fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[13px] font-bold text-zinc-900 tabular-nums">{score}</span>
        <span className="text-[8px] font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">Health</span>
      </div>
    </div>
  );
}

// ── Equipment card ────────────────────────────────────────────────────────────
function EquipmentCard({ eq }: { eq: ApiEquipment }) {
  const statusKey = (eq.status ?? "").toLowerCase();
  const status    = statusConfig[statusKey] ?? statusConfig["offline"];
  const docs      = eq.documents ?? [];
  const score     = eq.healthScore ?? 0;
  const trend     = score >= 85 ? "up" : score >= 65 ? "neutral" : "down";

  return (
    <div className="group rounded-2xl border border-zinc-200/70 bg-white hover:border-zinc-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300 overflow-hidden cursor-pointer">
      {/* Top health accent bar */}
      <div className={cn(
        "h-1 w-full",
        score >= 85 ? "bg-emerald-400" :
        score >= 65 ? "bg-amber-400" :
        "bg-red-400"
      )} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14px] font-bold text-zinc-900 tracking-tight group-hover:text-[#FF6B2C] transition-colors truncate">
                {eq.name}
              </h3>
              <span className="inline-flex items-center rounded-md border border-zinc-200/60 bg-zinc-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                {eq.category}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {eq.series && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Tag className="h-3 w-3" />
                  {eq.series}
                </span>
              )}
              {eq.location && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <span className="text-zinc-300">·</span>
                  <MapPin className="h-3 w-3" />
                  {eq.location}
                </span>
              )}
            </div>
          </div>
          <HealthRing score={score} />
        </div>

        {/* Status badge */}
        <div className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold",
          status.bg, status.text
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-100 bg-white text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Next Service</p>
              <p className="text-[11px] font-bold text-zinc-700 truncate mt-0.5">
                {eq.nextMaintenance ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-100 bg-white text-zinc-400">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Documents</p>
              <p className="text-[11px] font-bold text-zinc-700 truncate mt-0.5">
                {docs.length} linked
              </p>
            </div>
          </div>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-50">
          {trend === "up"   && <TrendingUp  className="h-3.5 w-3.5 text-emerald-500" />}
          {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          {trend === "neutral" && <Activity className="h-3.5 w-3.5 text-amber-500" />}
          <span className={cn(
            "text-[11px] font-semibold",
            trend === "up"      ? "text-emerald-600" :
            trend === "down"    ? "text-red-600" :
            "text-amber-600"
          )}>
            {trend === "up"      ? "Healthy — no immediate action" :
             trend === "down"    ? "Action required" :
             "Monitor closely"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EquipmentPage() {
  const [search, setSearch] = useState("");
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["equipment"],
    queryFn:  () => fetchEquipment(1, 50),
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load equipment", "Check your connection and try again.");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const equipment = (data?.data ?? []) as unknown as ApiEquipment[];

  const filtered = equipment.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const counts = equipment.reduce((acc, e) => {
    const key = (e.status ?? "").toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSummary = [
    { key: "operational", label: "Operational",   color: "bg-emerald-500" },
    { key: "maintenance", label: "In Maintenance", color: "bg-amber-500"  },
    { key: "critical",    label: "Critical",       color: "bg-red-500"    },
    { key: "offline",     label: "Offline",        color: "bg-zinc-400"   },
  ].filter((s) => (counts[s.key] ?? 0) > 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Equipment"
        subtitle="Monitor health scores, maintenance schedules, and documentation for all plant equipment."
        action={
          statusSummary.length > 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              {statusSummary.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5 border-r last:border-0 border-zinc-200 pr-3 last:pr-0">
                  <div className={cn("h-2 w-2 rounded-full", s.color)} />
                  <span className="text-[11px] font-bold text-zinc-700">{counts[s.key]}</span>
                  <span className="text-[11px] text-zinc-400 hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>
          ) : undefined
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search equipment by name or category…"
      >
        <button className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-[12px] font-semibold text-zinc-600 hover:bg-zinc-50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
      </FilterBar>

      {isError   && <ErrorState message="Failed to load equipment." onRetry={refetch} />}
      {isLoading && <CardGridSkeleton count={6} />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Wrench className="h-6 w-6" />}
          title={search ? "No equipment matched your search." : "No equipment found."}
          description={search ? "Try a different search term." : "Equipment will appear here once added."}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((eq) => <EquipmentCard key={eq.id} eq={eq} />)}
        </div>
      )}
    </div>
  );
}
