"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMaintenance, type MaintenanceRecord } from "@/services/api/maintenance";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { useToast } from "@/components/ui/toast";
import {
  Calendar, CheckCircle2, Clock, AlertTriangle,
  Wrench, ArrowUpRight, Bot, LayoutList, Columns3,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────────────────────────
const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  LOW:      { color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200/70"   },
  MEDIUM:   { color: "text-zinc-600",   bg: "bg-zinc-50",   border: "border-zinc-200/70"   },
  HIGH:     { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200/70" },
  CRITICAL: { color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200/70"    },
};

const statusConfig: Record<string, {
  icon: typeof Calendar; bg: string; text: string; label: string; column: string;
}> = {
  SCHEDULED:   { icon: Calendar,      bg: "bg-blue-50 text-blue-700",     text: "text-blue-700",    label: "Scheduled",   column: "Scheduled"   },
  IN_PROGRESS: { icon: Clock,         bg: "bg-amber-50 text-amber-700",   text: "text-amber-700",   label: "In Progress", column: "In Progress" },
  COMPLETED:   { icon: CheckCircle2,  bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700", label: "Completed", column: "Completed"   },
  OVERDUE:     { icon: AlertTriangle, bg: "bg-red-50 text-red-700",       text: "text-red-700",     label: "Overdue",     column: "Overdue"     },
  CANCELLED:   { icon: Clock,         bg: "bg-zinc-100 text-zinc-600",    text: "text-zinc-600",    label: "Cancelled",   column: "Cancelled"   },
};

const KANBAN_COLUMNS = ["OVERDUE", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] as const;

const LIST_TABS = ["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "OVERDUE"] as const;
type ListTab = (typeof LIST_TABS)[number];

type ViewMode = "list" | "kanban";

// ── Task card (list view) ─────────────────────────────────────────────────────
function TaskRow({ task }: { task: MaintenanceRecord }) {
  const [expanded, setExpanded] = useState(false);
  const priority  = priorityConfig[task.priority] ?? priorityConfig["MEDIUM"];
  const status    = statusConfig[task.status]   ?? statusConfig["SCHEDULED"];
  const StatusIcon = status.icon;
  const checklist  = task.checklist ?? [];
  const completed  = checklist.filter((c) => c.completed).length;
  const progress   = checklist.length > 0 ? (completed / checklist.length) * 100 : 0;

  return (
    <div className={cn(
      "group rounded-2xl border bg-white transition-all duration-200 overflow-hidden",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
      task.status === "OVERDUE" ? "border-red-200/70" : "border-zinc-200/70 hover:border-zinc-300"
    )}>
      <div className="grid grid-cols-12 gap-4 items-center p-4">
        {/* Equipment + description */}
        <div className="col-span-12 md:col-span-5 flex items-center gap-3">
          <div className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
            priority.bg, priority.border
          )}>
            <Wrench className={cn("h-4 w-4", priority.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={cn(
                "text-[13px] font-bold text-zinc-900 tracking-tight",
                "group-hover:text-[#FF6B2C] transition-colors flex items-center gap-0.5"
              )}>
                {task.equipmentName || task.equipmentId}
                <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-[#FF6B2C] transition-colors" />
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-50 border border-zinc-200/60 text-zinc-400">
                {(task.type || "").toLowerCase()}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">
              {task.description || task.title}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="col-span-6 md:col-span-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Status</span>
          <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold mt-1.5", status.bg)}>
            <StatusIcon className="h-3 w-3 shrink-0" />
            <span>{status.label}</span>
          </div>
        </div>

        {/* Date */}
        <div className="col-span-6 md:col-span-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Target Date</span>
          <span className={cn(
            "text-[12px] font-bold block mt-1",
            task.status === "OVERDUE" ? "text-red-600" : "text-zinc-700"
          )}>
            {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
          </span>
        </div>

        {/* Priority */}
        <div className="col-span-6 md:col-span-1">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Priority</span>
          <span className={cn("text-[12px] font-bold block mt-1", priority.color)}>
            {task.priority}
          </span>
        </div>

        {/* Progress */}
        <div className="col-span-6 md:col-span-1">
          {checklist.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span className="text-zinc-400 uppercase tracking-wider">Tasks</span>
                <span className="text-zinc-700">{completed}/{checklist.length}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    task.status === "COMPLETED" ? "bg-emerald-500" : "bg-[#FF6B2C]"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-300 italic">—</span>
          )}
        </div>

        {/* Expand */}
        {task.aiRecommendation && (
          <div className="col-span-12 md:col-span-1 flex justify-end">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all"
              title={expanded ? "Hide AI recommendation" : "Show AI recommendation"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {/* AI recommendation */}
      {expanded && task.aiRecommendation && (
        <div className="mx-4 mb-4 rounded-xl bg-[#FFF8F5] border border-[#FFD6BE] p-3 flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FFF2EB]">
            <Bot className="h-3.5 w-3.5 text-[#FF6B2C]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B2C] mb-0.5">
              AI Recommendation
            </p>
            <p className="text-[12px] text-zinc-700 leading-relaxed">{task.aiRecommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────
function KanbanCard({ task }: { task: MaintenanceRecord }) {
  const priority = priorityConfig[task.priority] ?? priorityConfig["MEDIUM"];
  const checklist = task.checklist ?? [];
  const completed = checklist.filter((c) => c.completed).length;
  const progress  = checklist.length > 0 ? (completed / checklist.length) * 100 : 0;

  return (
    <div className={cn(
      "rounded-xl border bg-white p-3.5 space-y-2.5 transition-all duration-200",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]",
      "border-zinc-200/70 hover:border-zinc-300 cursor-grab active:cursor-grabbing"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-zinc-900 leading-snug">
            {task.equipmentName || task.equipmentId}
          </p>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{task.description || task.title}</p>
        </div>
        <span className={cn(
          "shrink-0 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
          priority.bg, priority.color
        )}>
          {task.priority}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400">
          {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
          {(task.type || "").toLowerCase()}
        </span>
      </div>
      {checklist.length > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF6B2C] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 text-right">{completed}/{checklist.length} tasks</p>
        </div>
      )}
      {task.aiRecommendation && (
        <div className="flex items-start gap-1.5 rounded-lg bg-[#FFF8F5] border border-[#FFE8DA] p-2">
          <Bot className="h-3 w-3 text-[#FF6B2C] shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-600 line-clamp-2">{task.aiRecommendation}</p>
        </div>
      )}
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────
function KanbanColumn({
  statusKey, tasks,
}: {
  statusKey: string;
  tasks: MaintenanceRecord[];
}) {
  const cfg = statusConfig[statusKey] ?? statusConfig["SCHEDULED"];
  const StatusIcon = cfg.icon;

  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      <div className={cn(
        "flex items-center justify-between rounded-xl px-3 py-2.5 mb-3 border",
        cfg.bg
      )}>
        <div className="flex items-center gap-2">
          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[12px] font-bold">{cfg.column}</span>
        </div>
        <span className="text-[11px] font-bold opacity-70">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2.5 flex-1 min-h-[200px] rounded-xl bg-zinc-50/60 p-2.5 border border-zinc-100">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-zinc-300 font-medium">
            No tasks
          </div>
        ) : (
          tasks.map((t) => <KanbanCard key={t.id} task={t} />)
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const [activeTab,  setActiveTab]  = useState<ListTab>("ALL");
  const [viewMode,   setViewMode]   = useState<ViewMode>("list");
  const [search,     setSearch]     = useState("");
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["maintenance"],
    queryFn:  () => fetchMaintenance(1, 100),
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load maintenance records");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const allTasks: MaintenanceRecord[] = data?.data ?? [];

  const overdueTasks = allTasks.filter((t) => t.status === "OVERDUE");

  const filtered = allTasks.filter((t) => {
    const matchesTab = activeTab === "ALL" || t.status === activeTab;
    const matchesSearch =
      !search ||
      (t.equipmentName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = LIST_TABS.map((key) => ({
    key,
    label: key === "ALL" ? "All" : key.replace("_", " ").toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    count: key === "ALL" ? allTasks.length : allTasks.filter((t) => t.status === key).length,
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <PageHeader
        title="Maintenance"
        subtitle="Track work orders, scheduled services, and AI-powered maintenance recommendations."
        action={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all",
                  viewMode === "list"
                    ? "bg-zinc-900 text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                    : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all",
                  viewMode === "kanban"
                    ? "bg-zinc-900 text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                    : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Kanban
              </button>
            </div>
          </div>
        }
      />

      {/* Error */}
      {isError && <ErrorState message="Failed to load maintenance records." onRetry={refetch} />}

      {/* Loading */}
      {isLoading && <RowSkeleton rows={5} />}

      {!isLoading && !isError && (
        <>
          {/* Overdue alert strip */}
          {overdueTasks.length > 0 && (
            <div className="rounded-2xl border border-red-200/70 bg-gradient-to-r from-red-50 to-white p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-[12px] font-bold uppercase tracking-wider">
                  {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? "s" : ""} — Immediate Action Required
                </span>
              </div>
              {overdueTasks.slice(0, 3).map((task) => (
                <div key={`overdue-${task.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-zinc-900">
                        {task.equipmentName || task.equipmentId}
                      </p>
                      <p className="text-[11px] text-zinc-400">{task.description || task.title}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Missed</p>
                    <p className="text-[12px] font-bold text-red-600 mt-0.5">
                      {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by equipment, title, or description…"
            tabs={viewMode === "list" ? tabs : undefined}
            activeTab={viewMode === "list" ? activeTab : undefined}
            onTabChange={(key) => setActiveTab(key as ListTab)}
          />

          {/* Empty */}
          {filtered.length === 0 && (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="No maintenance tasks found."
              description="Maintenance records will appear here once scheduled."
            />
          )}

          {/* List view */}
          {viewMode === "list" && filtered.length > 0 && (
            <div className="space-y-2.5">
              {filtered.map((task) => <TaskRow key={task.id} task={task} />)}
            </div>
          )}

          {/* Kanban view */}
          {viewMode === "kanban" && allTasks.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_COLUMNS.map((col) => (
                <KanbanColumn
                  key={col}
                  statusKey={col}
                  tasks={allTasks.filter((t) => {
                    const matchesCol = t.status === col;
                    const matchesSearch =
                      !search ||
                      (t.equipmentName ?? "").toLowerCase().includes(search.toLowerCase()) ||
                      (t.title ?? "").toLowerCase().includes(search.toLowerCase());
                    return matchesCol && matchesSearch;
                  })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
