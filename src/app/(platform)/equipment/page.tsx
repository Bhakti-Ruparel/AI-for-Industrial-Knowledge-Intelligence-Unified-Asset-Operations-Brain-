"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEquipment } from "@/services/api/equipment";
import { CardGridSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, SlidersHorizontal, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  operational: { label: "Operational", color: "bg-[#10b981]", textColor: "text-[#10b981]" },
  maintenance:  { label: "In Maintenance", color: "bg-[#f59e0b]", textColor: "text-[#f59e0b]" },
  offline:      { label: "Offline",        color: "bg-[#71717a]", textColor: "text-[#71717a]" },
  critical:     { label: "Critical",       color: "bg-[#ef4444]", textColor: "text-[#ef4444]" },
  // API may return uppercase values
  OPERATIONAL:  { label: "Operational",    color: "bg-[#10b981]", textColor: "text-[#10b981]" },
  MAINTENANCE:  { label: "In Maintenance", color: "bg-[#f59e0b]", textColor: "text-[#f59e0b]" },
  OFFLINE:      { label: "Offline",        color: "bg-[#71717a]", textColor: "text-[#71717a]" },
  CRITICAL:     { label: "Critical",       color: "bg-[#ef4444]", textColor: "text-[#ef4444]" },
} as Record<string, { label: string; color: string; textColor: string }>;

function HealthRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? "#10b981" : score >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex h-11 w-11 items-center justify-center font-sans">
      <svg className="h-11 w-11 -rotate-90">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="3" />
        <circle cx="22" cy="22" r={radius} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-500 ease-out" />
      </svg>
      <span className="absolute text-[11px] font-bold text-zinc-900 tracking-tight">{score}</span>
    </div>
  );
}

export default function EquipmentPage() {
  const [search, setSearch] = useState("");
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => fetchEquipment(1, 50),
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load equipment", "Check your connection and try again.");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const equipment = data?.data ?? [];

  const filtered = equipment.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  // status counter
  const counts = equipment.reduce((acc, e) => {
    const key = (e.status || "").toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 p-1 antialiased font-sans max-w-[1600px] mx-auto text-zinc-900">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-zinc-900">Equipment</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Monitor health, maintenance, and documentation for all machines.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/60 border border-zinc-100 px-4 py-2 rounded-xl shadow-3xs mt-2">
          {Object.entries(statusConfig)
            .filter(([k]) => !["OPERATIONAL","MAINTENANCE","OFFLINE","CRITICAL"].includes(k))
            .map(([key, cfg]) => {
              const count = counts[key] ?? 0;
              if (count === 0) return null;
              return (
                <div key={key} className="flex items-center gap-1.5 border-r last:border-0 border-zinc-200 pr-3 last:pr-0">
                  <div className={cn("h-2 w-2 rounded-full", cfg.color)} />
                  <span className="text-[11px] font-bold text-zinc-800">{count}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment..."
            className="pl-10 h-10 bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-xl text-xs font-medium placeholder:text-zinc-400 shadow-3xs"
          />
        </div>
        <button className="flex items-center gap-2 px-3.5 h-10 border border-zinc-200 bg-white rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-50 shadow-3xs transition-all">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Error */}
      {isError && <ErrorState message="Failed to load equipment." onRetry={refetch} />}

      {/* Loading */}
      {isLoading && <CardGridSkeleton count={6} />}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Wrench className="h-5 w-5" />}
          title={search ? "No equipment matched your search." : "No equipment found."}
          description={search ? "Try a different search term." : "Equipment will appear here once added."}
        />
      )}

      {/* Grid */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((eq) => {
            const statusKey = (eq.status || "").toLowerCase();
            const status = statusConfig[statusKey] ?? statusConfig["offline"];
            return (
              <Card key={eq.id} className="border border-zinc-200/70 bg-white hover:shadow-xs hover:border-zinc-300 transition-all duration-200 rounded-2xl overflow-hidden cursor-pointer group">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-zinc-900 tracking-tight group-hover:text-blue-600 transition-colors">
                          {eq.name}
                        </h3>
                        <Badge variant="secondary" className="text-[9px] font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md border-transparent tracking-wide">
                          {eq.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-400">
                        {eq.series} <span className="mx-1 text-zinc-300">•</span> {eq.location}
                      </p>
                    </div>
                    <HealthRing score={eq.healthScore ?? 0} />
                  </div>

                  <div className="flex items-center gap-2 border-t border-zinc-50 pt-2">
                    <div className={cn("h-2 w-2 rounded-full", status.color)} />
                    <span className={cn("text-xs font-bold tracking-tight", status.textColor)}>
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5">
                      <div className="p-1.5 bg-white rounded-lg border border-zinc-100 shrink-0 text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Next Service</p>
                        <p className="text-xs font-bold text-zinc-700 truncate mt-0.5">
                          {eq.nextMaintenance || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5">
                      <div className="p-1.5 bg-white rounded-lg border border-zinc-100 shrink-0 text-zinc-400">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Documents</p>
                        <p className="text-xs font-bold text-zinc-700 truncate mt-0.5">
                          {(eq.documents ?? []).length} linked
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
