"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMaintenance, type MaintenanceRecord } from "@/services/api/maintenance";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, CheckCircle2, Clock, AlertTriangle,
  Wrench, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const priorityConfig: Record<string, { color: string; bg: string }> = {
  LOW:      { color: "text-blue-500",   bg: "bg-blue-50/50"   },
  MEDIUM:   { color: "text-zinc-400",   bg: "bg-zinc-50"      },
  HIGH:     { color: "text-orange-500", bg: "bg-orange-50"    },
  CRITICAL: { color: "text-red-500",    bg: "bg-red-50"       },
};

const statusConfig: Record<string, { icon: typeof Calendar; bg: string; text: string; label: string }> = {
  SCHEDULED:   { icon: Calendar,      bg: "bg-blue-50 text-blue-600",    text: "text-blue-600",    label: "Scheduled"    },
  IN_PROGRESS: { icon: Clock,         bg: "bg-amber-50 text-amber-600",  text: "text-amber-600",   label: "In Progress"  },
  COMPLETED:   { icon: CheckCircle2,  bg: "bg-emerald-50 text-emerald-600", text: "text-emerald-600", label: "Completed"  },
  OVERDUE:     { icon: AlertTriangle, bg: "bg-red-50 text-red-600",      text: "text-red-600",     label: "Overdue"      },
  CANCELLED:   { icon: Clock,         bg: "bg-zinc-100 text-zinc-500",   text: "text-zinc-500",    label: "Cancelled"    },
};

const TABS = ["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] as const;
type Tab = (typeof TABS)[number];

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => fetchMaintenance(1, 50),
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load maintenance records");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const allTasks: MaintenanceRecord[] = data?.data ?? [];

  const overdueTasks = allTasks.filter((t) => t.status === "OVERDUE");
  const filteredTasks = allTasks.filter(
    (t) => activeTab === "ALL" || t.status === activeTab
  );

  return (
    <div className="space-y-6 p-6 font-sans antialiased max-w-[1400px] mx-auto text-zinc-900">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Maintenance Dashboard</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Track machine health lifecycles and clear scheduled service pipelines.</p>
      </div>

      {/* Error */}
      {isError && <ErrorState message="Failed to load maintenance records." onRetry={refetch} />}

      {/* Loading */}
      {isLoading && <RowSkeleton rows={5} />}

      {/* Critical overdue alerts */}
      {!isLoading && overdueTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical Interventions Required</span>
          </div>
          {overdueTasks.map((task) => (
            <div key={`alert-${task.id}`} className="bg-white border border-zinc-100 rounded-xl p-4 shadow-3xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-900">{task.equipmentName || task.equipmentId}</h4>
                    <span className="bg-red-600 text-white font-extrabold text-[8px] tracking-wider px-1.5 py-0.5 rounded-full uppercase">Overdue</span>
                  </div>
                  <p className="text-xs font-medium text-zinc-400 mt-0.5">{task.description || task.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-10 pr-2">
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Missed Target</p>
                  <p className="text-xs font-bold text-red-600 mt-0.5">
                    {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      {!isLoading && !isError && (
        <>
          <div className="flex items-center gap-1 border-b border-zinc-100 pb-3">
            {TABS.map((tabKey) => {
              const count = tabKey === "ALL" ? allTasks.length : allTasks.filter((t) => t.status === tabKey).length;
              const isSelected = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all select-none whitespace-nowrap",
                    isSelected ? "bg-zinc-900 text-white shadow-3xs" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  <span>{tabKey.replace("_", " ").toLowerCase()}</span>
                  <span className={cn(
                    "px-1 text-[9px] rounded font-bold",
                    isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredTasks.length === 0 && (
            <EmptyState
              icon={<Calendar className="h-5 w-5" />}
              title="No maintenance scheduled."
              description="Maintenance records will appear here once created."
            />
          )}

          {/* Task list */}
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const priority = priorityConfig[task.priority] ?? priorityConfig["MEDIUM"];
              const status = statusConfig[task.status] ?? statusConfig["SCHEDULED"];
              const StatusIcon = status.icon;
              const checklist = task.checklist ?? [];
              const completed = checklist.filter((c) => c.completed).length;
              const progress = checklist.length > 0 ? (completed / checklist.length) * 100 : 0;

              return (
                <Card key={task.id} className="border border-zinc-100 bg-white rounded-xl shadow-4xs overflow-hidden transition-all duration-200 hover:border-zinc-200/80 group">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">

                      {/* Equipment + description */}
                      <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border border-zinc-100/60", priority.bg)}>
                          <Wrench className={cn("h-3.5 w-3.5", priority.color)} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                              {task.equipmentName || task.equipmentId}
                              <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                            </h3>
                            <Badge variant="secondary" className="text-[8px] font-extrabold bg-zinc-50 border border-zinc-200/40 text-zinc-400 px-1 py-0 rounded uppercase tracking-wider">
                              {(task.type || "").toLowerCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">{task.description || task.title}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-3 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Status</span>
                        <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1", status.bg)}>
                          <StatusIcon className="h-3 w-3 shrink-0" />
                          <span>{status.label}</span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-3 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Target Date</span>
                        <span className="text-xs font-bold text-zinc-600 block mt-1">
                          {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : "—"}
                        </span>
                      </div>

                      {/* Priority */}
                      <div className="col-span-3 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Priority</span>
                        <span className={cn("text-xs font-bold block mt-1", priority.color)}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Checklist progress */}
                      <div className="col-span-3 md:col-span-2 space-y-1.5">
                        {checklist.length > 0 && (
                          <>
                            <div className="flex items-center justify-between text-[9px] font-bold">
                              <span className="text-zinc-400 uppercase tracking-wider">Subtasks</span>
                              <span className="text-zinc-700 bg-zinc-50 px-1 rounded">{completed}/{checklist.length}</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-300", task.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-500")}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
