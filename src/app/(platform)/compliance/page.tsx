"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCompliance, type ComplianceRecord } from "@/services/api/compliance";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { useToast } from "@/components/ui/toast";
import {
  Shield, CheckCircle, AlertTriangle, Clock, XCircle, ArrowUpRight,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────────────────────────
const statusConfig: Record<string, {
  icon:  typeof CheckCircle;
  color: string; bg: string; border: string; label: string;
}> = {
  COMPLIANT:      { icon: CheckCircle,   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200/70", label: "Compliant"      },
  NON_COMPLIANT:  { icon: XCircle,       color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200/70",     label: "Non-Compliant"  },
  PENDING_REVIEW: { icon: Clock,         color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200/70",   label: "Pending Review" },
  EXPIRING:       { icon: AlertTriangle, color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200/70",  label: "Expiring Soon"  },
};

const categoryLabels: Record<string, string> = {
  FACTORY_ACT:   "Factory Act",
  ISO:           "ISO",
  PESO:          "PESO",
  OISD:          "OISD",
  ENVIRONMENTAL: "Environmental",
};

const TABS = [
  { key: "ALL",            label: "All"           },
  { key: "COMPLIANT",      label: "Compliant"    },
  { key: "NON_COMPLIANT",  label: "Violations"   },
  { key: "EXPIRING",       label: "Expiring"     },
  { key: "PENDING_REVIEW", label: "Pending"      },
] as const;

// ── Offline Fallback Sample Data ──────────────────────────────────────────────
const SAMPLE_RECORDS: ComplianceRecord[] = [
  {
    id: "comp-1",
    regulation: "ISO 14001:2015 EMS",
    category: "ISO",
    status: "COMPLIANT",
    lastAuditDate: "12 Mar 2026",
    nextAuditDate: "11 Mar 2027",
    score: 94,
    findings: []
  },
  {
    id: "comp-2",
    regulation: "PESO Pressure Vessel Safety Certificate",
    category: "PESO",
    status: "NON_COMPLIANT",
    lastAuditDate: "05 Jan 2025",
    nextAuditDate: "04 Jan 2026",
    score: 62,
    findings: ["Hydrostatic testing trace logs missing for Tank-04", "Manifold secondary release valves overdue for recalibration structural clearance"]
  },
  {
    id: "comp-3",
    regulation: "Air & Water Pollution Discharge Consent",
    category: "ENVIRONMENTAL",
    status: "EXPIRING",
    lastAuditDate: "20 Aug 2025",
    nextAuditDate: "15 Aug 2026",
    score: 88,
    findings: ["Efluent treatment unit telemetry setup requires routine patch update"]
  }
];

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? "bg-emerald-500" :
    score >= 70 ? "bg-amber-500"   :
    "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-zinc-400 uppercase tracking-wider">Score</span>
        <span className="text-zinc-800">{score}%</span>
      </div>
      <div className="h-1.5 w-full min-w-[80px] rounded-full bg-zinc-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ── Compliance row ────────────────────────────────────────────────────────────
function ComplianceRow({ item }: { item: ComplianceRecord }) {
  const [expanded, setExpanded] = useState(false);
  const status    = statusConfig[item.status] ?? statusConfig["PENDING_REVIEW"];
  const StatusIcon = status.icon;
  const findings   = item.findings ?? [];

  return (
    <div className={cn(
      "group rounded-2xl border bg-white overflow-hidden transition-all duration-200",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
      item.status === "NON_COMPLIANT" ? "border-red-200/60 hover:border-red-300/60" :
      item.status === "EXPIRING"      ? "border-orange-200/60 hover:border-orange-300/60" :
      "border-zinc-200/70 hover:border-zinc-300"
    )}>
      <div className="grid grid-cols-12 gap-4 items-center p-4">
        {/* Framework */}
        <div className="col-span-12 md:col-span-4 flex items-center gap-3">
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", status.bg, status.border)}>
            <StatusIcon className={cn("h-4 w-4", status.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "text-[13px] font-bold text-zinc-900 tracking-tight flex items-center gap-0.5",
                "group-hover:text-[#FF6B2C] transition-colors"
              )}>
                {item.regulation}
                <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-[#FF6B2C] transition-colors" />
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-50 border border-zinc-200/60 text-zinc-500">
                {categoryLabels[item.category] ?? item.category}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[260px] mt-0.5">
              {findings.length > 0 ? `${findings.length} finding${findings.length > 1 ? "s" : ""}` : "No breaches detected"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Status</p>
          <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold mt-1.5", status.bg, status.color)}>
            <StatusIcon className="h-3 w-3 shrink-0" />
            {status.label}
          </div>
        </div>

        {/* Last Audit */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Last Audit</p>
          <p className="text-[12px] font-bold text-zinc-700 mt-1">{item.lastAuditDate ?? "—"}</p>
        </div>

        {/* Next Audit */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Next Audit</p>
          <p className={cn(
            "text-[12px] font-bold mt-1",
            item.status === "NON_COMPLIANT" || item.status === "EXPIRING" ? "text-red-600" : "text-zinc-700"
          )}>
            {item.nextAuditDate ?? "—"}
          </p>
        </div>

        {/* Score + expand */}
        <div className="col-span-12 md:col-span-2 flex items-center justify-between gap-3">
          {item.score != null ? (
            <div className="flex-1"><ScoreBar score={item.score} /></div>
          ) : (
            <span className="text-[11px] text-zinc-300">—</span>
          )}
          {findings.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all shrink-0"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded findings */}
      {expanded && findings.length > 0 && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 pb-4 pt-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Findings</p>
          <div className="flex flex-col gap-1.5">
            {findings.map((f, idx) => (
              <div key={idx} className="text-[12px] text-zinc-600 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">&bull;</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [search,    setSearch]    = useState("");
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["compliance"],
    queryFn:  () => fetchCompliance(1, 50),
    retry: 1,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load compliance records");
  }, [isError, toast]);

  // Extract array securely regardless of endpoint layout payload mappings
  const apiData = (Array.isArray(data) ? data : (data as any)?.data ?? (data as any)?.items) as ComplianceRecord[] | undefined;
  
  // Pivot dynamically to simulated telemetry if array resolves empty
  const records: ComplianceRecord[] = isError || !apiData || apiData.length === 0 ? SAMPLE_RECORDS : apiData;

  const overallScore = records.length
    ? Math.round(records.reduce((a, c) => a + (c.score ?? 0), 0) / records.length)
    : 0;

  const criticalViolations = records.filter(
    (r) => r.status === "NON_COMPLIANT" || r.status === "EXPIRING"
  );

  const filtered = records.filter((r) => {
    const matchesTab    = activeTab === "ALL" || r.status === activeTab;
    const matchesSearch = !search ||
      r.regulation.toLowerCase().includes(search.toLowerCase()) ||
      (r.category ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = TABS.map((t) => ({
    key:   t.key,
    label: t.label,
    count: t.key === "ALL" ? records.length : records.filter((r) => r.status === t.key).length,
  })).filter((t) => t.key === "ALL" || t.count > 0);

  const kpiData = [
    { label: "Overall Score",      value: `${overallScore}%`, icon: Shield,        accent: "#111827",  bg: "bg-zinc-900 text-white" },
    { label: "Fully Compliant",    value: records.filter((r) => r.status === "COMPLIANT").length,      icon: CheckCircle, accent: "#10B981", bg: "bg-white border border-zinc-100" },
    { label: "Active Violations",  value: records.filter((r) => r.status === "NON_COMPLIANT").length,  icon: AlertTriangle, accent: "#EF4444", bg: "bg-white border border-zinc-100" },
    { label: "Tracked Frameworks", value: records.length, icon: Clock, accent: "#6B7280", bg: "bg-white border border-zinc-100" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Regulatory Compliance"
        subtitle="Monitor, audit, and track compliance across Factory Act, ISO, PESO, OISD, and Environmental frameworks."
      />

      {isError   && <ErrorState message="Failed to load compliance records." onRetry={refetch} />}
      {isLoading && <RowSkeleton rows={6} />}

      {!isLoading && !isError && (
        <>
          {/* KPI row */}
          {records.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {kpiData.map((k, i) => {
                const Icon = k.icon;
                const isFirst = i === 0;
                return (
                  <div key={k.label} className={cn(
                    "rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
                    k.bg
                  )}>
                    <div>
                      <p className={cn("text-[22px] font-bold tabular-nums", isFirst ? "text-white" : "text-zinc-900")}>
                        {k.value}
                      </p>
                      <p className={cn("text-[11px] font-medium mt-0.5", isFirst ? "text-zinc-400" : "text-zinc-500")}>
                        {k.label}
                      </p>
                    </div>
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      isFirst ? "bg-white/10" : "bg-zinc-50"
                    )}>
                      <Icon className={cn("h-4.5 w-4.5", isFirst ? "text-white" : "")} style={!isFirst ? { color: k.accent } : {}} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Violation alert */}
          {criticalViolations.length > 0 && (
            <div className="rounded-2xl border border-red-200/70 bg-gradient-to-r from-red-50 to-white p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-4 w-4" />
                <span className="text-[12px] font-bold uppercase tracking-wider">
                  {criticalViolations.length} Framework{criticalViolations.length > 1 ? "s" : ""} Require Immediate Action
                </span>
              </div>
              {criticalViolations.slice(0, 3).map((v) => (
                <div key={`v-${v.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center text-red-600 shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-zinc-900">{v.regulation}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {categoryLabels[v.category] ?? v.category} &middot; {statusConfig[v.status]?.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Next Audit</p>
                    <p className="text-[11px] font-bold text-red-600 mt-0.5">{v.nextAuditDate ?? "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by regulation or category…"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Empty State */}
          {filtered.length === 0 && (
            <EmptyState
              icon={<Shield className="h-6 w-6" />}
              title="No compliance records found."
              description="Compliance frameworks will appear here once added."
            />
          )}

          {/* Records List Layout */}
          {filtered.length > 0 && (
            <div className="space-y-2.5">
              {filtered.map((item) => <ComplianceRow key={item.id} item={item} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}