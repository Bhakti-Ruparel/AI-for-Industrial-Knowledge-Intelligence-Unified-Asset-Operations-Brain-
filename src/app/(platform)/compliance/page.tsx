"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCompliance, createComplianceRecord, type ComplianceRecord } from "@/services/api/compliance";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { useToast } from "@/components/ui/toast";
import {
  Shield, CheckCircle, AlertTriangle, Clock, XCircle, ArrowUpRight,
  ChevronDown, ChevronUp, Plus, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Add Compliance Record Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AddComplianceModalProps {
  open: boolean;
  onClose: () => void;
}

function AddComplianceModal({ open, onClose }: AddComplianceModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    regulation:    "",
    category:      "ISO" as ComplianceRecord["category"],
    status:        "PENDING_REVIEW" as ComplianceRecord["status"],
    riskLevel:     "MEDIUM" as ComplianceRecord["riskLevel"],
    lastAuditDate: "",
    nextAuditDate: "",
    score:         "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => createComplianceRecord({
      regulation:    form.regulation,
      category:      form.category,
      status:        form.status,
      riskLevel:     form.riskLevel,
      lastAuditDate: form.lastAuditDate || undefined,
      nextAuditDate: form.nextAuditDate || undefined,
      score:         form.score ? Number(form.score) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Compliance record created");
      setForm({ regulation: "", category: "ISO", status: "PENDING_REVIEW", riskLevel: "MEDIUM", lastAuditDate: "", nextAuditDate: "", score: "" });
      setErrors({});
      onClose();
    },
    onError: () => {
      toast.error("Failed to create compliance record.");
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.regulation.trim()) e.regulation = "Regulation name is required";
    if (form.score && (Number(form.score) < 0 || Number(form.score) > 100))
      e.score = "Score must be 0â€“100";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  if (!open) return null;

  const categories = [
    { value: "FACTORY_ACT", label: "Factory Act" },
    { value: "ISO",          label: "ISO"          },
    { value: "PESO",         label: "PESO"         },
    { value: "OISD",         label: "OISD"         },
    { value: "ENVIRONMENTAL", label: "Environmental" },
  ] as const;

  const statuses = [
    { value: "COMPLIANT",      label: "Compliant",      color: "text-emerald-700" },
    { value: "NON_COMPLIANT",  label: "Non-Compliant",  color: "text-red-700"     },
    { value: "PENDING_REVIEW", label: "Pending Review", color: "text-amber-700"   },
    { value: "EXPIRING",       label: "Expiring",       color: "text-orange-700"  },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-zinc-900">Add Compliance Record</h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">Track a regulatory framework or compliance requirement.</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Regulation name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Regulation / Standard <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.regulation}
              onChange={(e) => setForm((f) => ({ ...f, regulation: e.target.value }))}
              placeholder="e.g. ISO 9001:2015, Factory Act Section 7"
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-300",
                "focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all",
                errors.regulation ? "border-red-400" : "border-zinc-200"
              )}
            />
            {errors.regulation && <p className="text-[11px] text-red-500 mt-1">{errors.regulation}</p>}
          </div>

          {/* Category + Risk Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof form.category }))}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all"
              >
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Risk Level</label>
              <select
                value={form.riskLevel}
                onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value as typeof form.riskLevel }))}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all"
              >
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Initial Status</label>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s.value }))}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[11px] font-semibold text-left transition-all",
                    form.status === s.value
                      ? cn("border-zinc-300 bg-zinc-50 ring-2 ring-offset-1 ring-zinc-300", s.color)
                      : "border-zinc-200 text-zinc-400 hover:border-zinc-300 bg-white"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Compliance Score (0â€“100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
              placeholder="e.g. 87"
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-300",
                "focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all",
                errors.score ? "border-red-400" : "border-zinc-200"
              )}
            />
            {errors.score && <p className="text-[11px] text-red-500 mt-1">{errors.score}</p>}
          </div>

          {/* Audit dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Last Audit</label>
              <input
                type="date"
                value={form.lastAuditDate}
                onChange={(e) => setForm((f) => ({ ...f, lastAuditDate: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Next Audit</label>
              <input
                type="date"
                value={form.nextAuditDate}
                onChange={(e) => setForm((f) => ({ ...f, nextAuditDate: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-xl bg-[#FF6B2C] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#FF824E] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Shield className="h-3.5 w-3.5" />
              )}
              {mutation.isPending ? "Savingâ€¦" : "Add Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€ Score bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Compliance row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <p className="text-[12px] font-bold text-zinc-700 mt-1">{item.lastAuditDate ?? "â€”"}</p>
        </div>

        {/* Next Audit */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Next Audit</p>
          <p className={cn(
            "text-[12px] font-bold mt-1",
            item.status === "NON_COMPLIANT" || item.status === "EXPIRING" ? "text-red-600" : "text-zinc-700"
          )}>
            {item.nextAuditDate ?? "â€”"}
          </p>
        </div>

        {/* Score + expand */}
        <div className="col-span-12 md:col-span-2 flex items-center justify-between gap-3">
          {item.score != null ? (
            <div className="flex-1"><ScoreBar score={item.score} /></div>
          ) : (
            <span className="text-[11px] text-zinc-300">â€”</span>
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

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
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
  const records: ComplianceRecord[] = apiData ?? [];

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
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B2C] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#FF824E] transition-all shadow-[0_2px_8px_rgba(255,107,44,0.3)] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Record
          </button>
        }
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
                    <p className="text-[11px] font-bold text-red-600 mt-0.5">{v.nextAuditDate ?? "â€”"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by regulation or categoryâ€¦"
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

      {/* Add compliance modal */}
      <AddComplianceModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
