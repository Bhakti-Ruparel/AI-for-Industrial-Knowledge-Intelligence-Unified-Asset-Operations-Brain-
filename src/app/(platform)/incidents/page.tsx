"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIncidents, createIncident, type IncidentRecord,
} from "@/services/api/incidents";
import { fetchEquipment } from "@/services/api/equipment";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { useToast } from "@/components/ui/toast";
import {
  AlertTriangle, Clock, CheckCircle, FileImage,
  FileText, Database, ArrowUpRight, ChevronDown, ChevronUp,
  Plus, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  LOW:      { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200/70"   },
  MEDIUM:   { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200/70"  },
  HIGH:     { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200/70" },
  CRITICAL: { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200/70"    },
};

const statusConfig: Record<string, {
  icon: typeof AlertTriangle; bg: string; text: string; label: string;
}> = {
  OPEN:          { icon: AlertTriangle, bg: "bg-red-50 text-red-700",         text: "text-red-700",     label: "Open"          },
  INVESTIGATING: { icon: Clock,         bg: "bg-amber-50 text-amber-700",     text: "text-amber-700",   label: "Investigating" },
  RESOLVED:      { icon: CheckCircle,   bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700", label: "Resolved"      },
  CLOSED:        { icon: CheckCircle,   bg: "bg-zinc-100 text-zinc-600",      text: "text-zinc-600",    label: "Closed"        },
};

const TABS = [
  { key: "ALL",           label: "All"           },
  { key: "OPEN",          label: "Open"          },
  { key: "INVESTIGATING", label: "Investigating" },
  { key: "RESOLVED",      label: "Resolved"      },
] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// â”€â”€ Report Incident Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ReportIncidentModal({ open, onClose, onSuccess }: ReportModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: eqData } = useQuery({
    queryKey: ["equipment"],
    queryFn:  () => fetchEquipment(1, 100),
  });
  const equipment = (eqData?.data ?? []) as { id: string; name: string }[];

  const [form, setForm] = useState({
    title:       "",
    description: "",
    equipmentId: "",
    severity:    "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: typeof form) => createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Incident reported successfully");
      setForm({ title: "", description: "", equipmentId: "", severity: "MEDIUM" });
      setErrors({});
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error("Failed to report incident. Please try again.");
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim())       e.title       = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.equipmentId)        e.equipmentId = "Equipment is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-zinc-900">Report Incident</h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">Log a new equipment failure or operational incident.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Incident Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Spindle vibration at high speed"
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-300",
                "focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all",
                errors.title ? "border-red-400" : "border-zinc-200"
              )}
            />
            {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Equipment <span className="text-red-500">*</span>
            </label>
            <select
              value={form.equipmentId}
              onChange={(e) => setForm((f) => ({ ...f, equipmentId: e.target.value }))}
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-zinc-900",
                "focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all bg-white",
                errors.equipmentId ? "border-red-400" : "border-zinc-200"
              )}
            >
              <option value="">Select equipmentâ€¦</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
            {errors.equipmentId && <p className="text-[11px] text-red-500 mt-1">{errors.equipmentId}</p>}
          </div>

          {/* Severity */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Severity <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((s) => {
                const cfg = severityConfig[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, severity: s }))}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                      form.severity === s
                        ? cn(cfg.bg, cfg.color, cfg.border, "ring-2 ring-offset-1", s === "CRITICAL" ? "ring-red-400" : s === "HIGH" ? "ring-orange-400" : s === "MEDIUM" ? "ring-amber-400" : "ring-blue-400")
                        : "border-zinc-200 text-zinc-400 hover:border-zinc-300 bg-white"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the incident in detail â€” what happened, when, observed symptomsâ€¦"
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-300 resize-none",
                "focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/30 focus:border-[#FF6B2C] transition-all",
                errors.description ? "border-red-400" : "border-zinc-200"
              )}
            />
            {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Actions */}
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
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {mutation.isPending ? "Reportingâ€¦" : "Report Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€ Incident row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function IncidentRow({ incident }: { incident: IncidentRecord }) {
  const [expanded, setExpanded] = useState(false);
  const severity   = severityConfig[incident.severity] ?? severityConfig["MEDIUM"];
  const status     = statusConfig[incident.status]     ?? statusConfig["OPEN"];
  const StatusIcon = status.icon;
  const evidence   = incident.evidence ?? [];
  const timeline   = incident.timeline ?? [];

  return (
    <div className={cn(
      "group rounded-2xl border bg-white overflow-hidden transition-all duration-200",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
      incident.status === "OPEN" || incident.status === "INVESTIGATING"
        ? "border-red-200/60 hover:border-red-300/60"
        : "border-zinc-200/70 hover:border-zinc-300"
    )}>
      <div className="grid grid-cols-12 gap-4 items-center p-4">
        {/* Title + equipment */}
        <div className="col-span-12 md:col-span-4 flex items-center gap-3">
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", severity.bg, severity.border)}>
            <AlertTriangle className={cn("h-4 w-4", severity.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={cn(
                "text-[13px] font-bold text-zinc-900 tracking-tight flex items-center gap-0.5",
                "group-hover:text-[#FF6B2C] transition-colors"
              )}>
                {incident.title}
                <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-[#FF6B2C] transition-colors" />
              </h3>
              <span className={cn(
                "text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                severity.bg, severity.color
              )}>
                {incident.severity}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[220px] mt-0.5">{incident.description}</p>
          </div>
        </div>

        {/* Equipment */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Equipment</p>
          <p className="text-[12px] font-bold text-zinc-700 mt-1 truncate">
            {incident.equipmentName || incident.equipmentId}
          </p>
        </div>

        {/* Status */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Status</p>
          <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold mt-1.5", status.bg)}>
            <StatusIcon className="h-3 w-3 shrink-0" />
            {status.label}
          </div>
        </div>

        {/* Reported */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Reported</p>
          <p className="text-[12px] font-bold text-zinc-700 mt-1">
            {new Date(incident.reportedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
          <p className="text-[10px] text-zinc-400">{timeAgo(incident.reportedAt)}</p>
        </div>

        {/* Evidence + expand */}
        <div className="col-span-12 md:col-span-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {evidence.length > 0 ? (
              evidence.slice(0, 2).map((ev) => (
                <div key={ev.id} className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-lg px-1.5 py-0.5">
                  {ev.type === "image"      && <FileImage   className="h-2.5 w-2.5 text-zinc-400" />}
                  {ev.type === "document"    && <FileText    className="h-2.5 w-2.5 text-zinc-400" />}
                  {ev.type === "sensor_data" && <Database    className="h-2.5 w-2.5 text-zinc-400" />}
                  <span className="truncate max-w-[60px]">{ev.title}</span>
                </div>
              ))
            ) : (
              <span className="text-[10px] text-zinc-300 italic">No evidence</span>
            )}
          </div>
          {(incident.rootCause || timeline.length > 0) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all shrink-0"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded: RCA + timeline */}
      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 pb-4 pt-3 space-y-3">
          {incident.rootCause && (
            <div className="flex items-start gap-2.5 rounded-xl bg-white border border-zinc-200/70 p-3">
              <span className="inline-block shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-600 border border-blue-200/60">
                RCA
              </span>
              <p className="text-[12px] text-zinc-600 leading-relaxed">{incident.rootCause}</p>
            </div>
          )}
          {timeline.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Timeline</p>
              <div className="space-y-1.5">
                {timeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-300 shrink-0" />
                    <div>
                      <p className="text-[12px] text-zinc-700">{event.description}</p>
                      <p className="text-[10px] text-zinc-400">
                        {event.user} &middot; {new Date(event.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function IncidentsPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["incidents"],
    queryFn:  () => fetchIncidents(1, 50),
    retry: 1,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load incidents");
  }, [isError, toast]);

  // Handle structural mutations safely from remote database arrays
  const apiData = (Array.isArray(data) ? data : (data as any)?.data ?? (data as any)?.items) as IncidentRecord[] | undefined;
  const allIncidents: IncidentRecord[] = apiData ?? [];

  const criticalUnresolved = allIncidents.filter(
    (i) => (i.severity === "CRITICAL" || i.severity === "HIGH") &&
            i.status !== "RESOLVED" && i.status !== "CLOSED"
  );

  const filtered = allIncidents.filter((i) => {
    const matchesTab = activeTab === "ALL" || i.status === activeTab;
    const matchesSearch =
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.equipmentName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (i.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = TABS.map((t) => ({
    key:   t.key,
    label: t.label,
    count: t.key === "ALL" ? allIncidents.length : allIncidents.filter((i) => i.status === t.key).length,
  }));

  const activeCount = allIncidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING").length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Incidents"
        subtitle="Track, investigate, and resolve equipment failures and operational incidents."
        badge={
          activeCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white">
              {activeCount} active
            </span>
          ) : undefined
        }
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B2C] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#FF824E] transition-all shadow-[0_2px_8px_rgba(255,107,44,0.3)] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Report Incident
          </button>
        }
      />

      {isError   && <ErrorState message="Failed to load incidents." onRetry={refetch} />}
      {isLoading && <RowSkeleton rows={5} />}

      {!isLoading && !isError && (
        <>
          {/* Critical banner */}
          {criticalUnresolved.length > 0 && (
            <div className="rounded-2xl border border-red-200/70 bg-gradient-to-r from-red-50 to-white p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-[12px] font-bold uppercase tracking-wider">
                  {criticalUnresolved.length} Critical Incident{criticalUnresolved.length > 1 ? "s" : ""} Requiring Immediate Attention
                </span>
              </div>
              {criticalUnresolved.slice(0, 2).map((inc) => (
                <div key={`crit-${inc.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center text-red-600 shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-bold text-zinc-900">{inc.title}</p>
                        <span className="bg-red-600 text-white text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full uppercase">
                          {inc.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {inc.equipmentName || inc.equipmentId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</p>
                    <p className="text-[11px] font-bold text-red-600 mt-0.5 capitalize">{inc.status.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by title, equipment, or descriptionâ€¦"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Empty State */}
          {filtered.length === 0 && (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6" />}
              title={search || activeTab !== "ALL" ? "No incidents matched your filters." : "No incidents reported yet."}
              description={
                search || activeTab !== "ALL"
                  ? "Try adjusting your search or filters."
                  : "All incidents will appear here once logged. Use the button above to report one."
              }
            />
          )}

          {/* List Display Output */}
          {filtered.length > 0 && (
            <div className="space-y-2.5">
              {filtered.map((inc) => <IncidentRow key={inc.id} incident={inc} />)}
            </div>
          )}
        </>
      )}

      {/* Report incident modal */}
      <ReportIncidentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}

