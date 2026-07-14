"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, type NotificationRecord } from "@/services/api/notifications";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { useToast } from "@/components/ui/toast";
import {
  Bell, AlertTriangle, CheckCircle, Info, XCircle,
  Wrench, Shield, Bot, Check, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Type config ───────────────────────────────────────────────────────────────
const typeConfig: Record<string, {
  icon:  typeof Info;
  color: string;
  bg:    string;
  ring:  string;
  label: string;
}> = {
  INFO:             { icon: Info,          color: "text-blue-600",    bg: "bg-blue-50",    ring: "ring-blue-100",    label: "Info"           },
  WARNING:          { icon: AlertTriangle, color: "text-amber-600",   bg: "bg-amber-50",   ring: "ring-amber-100",   label: "Warning"        },
  ERROR:            { icon: XCircle,       color: "text-red-600",     bg: "bg-red-50",     ring: "ring-red-100",     label: "Error"          },
  SUCCESS:          { icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", label: "Success"        },
  AI_INSIGHT:       { icon: Bot,           color: "text-purple-600",  bg: "bg-purple-50",  ring: "ring-purple-100",  label: "AI Insight"     },
  MAINTENANCE_DUE:  { icon: Wrench,        color: "text-orange-600",  bg: "bg-orange-50",  ring: "ring-orange-100",  label: "Maintenance"    },
  INCIDENT_ALERT:   { icon: AlertTriangle, color: "text-red-600",     bg: "bg-red-50",     ring: "ring-red-100",     label: "Incident"       },
  COMPLIANCE_ALERT: { icon: Shield,        color: "text-indigo-600",  bg: "bg-indigo-50",  ring: "ring-indigo-100",  label: "Compliance"     },
};

const FILTER_TABS = [
  { key: "ALL",              label: "All"         },
  { key: "AI_INSIGHT",       label: "AI"          },
  { key: "MAINTENANCE_DUE",  label: "Maintenance" },
  { key: "INCIDENT_ALERT",   label: "Incidents"   },
  { key: "COMPLIANCE_ALERT", label: "Compliance"  },
  { key: "WARNING",          label: "Warnings"    },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const toast = useToast();
  const qc    = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search,       setSearch]       = useState("");

  const { data: notifications, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn:  fetchNotifications,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load notifications");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const items: NotificationRecord[] = notifications ?? [];
  const unread = items.filter((n) => !n.read).length;

  // ── Mark single as read (optimistic) ──────────────────────────────────────
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      qc.setQueryData<NotificationRecord[]>(["notifications"], (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
  });

  // ── Mark all as read (optimistic) ─────────────────────────────────────────
  const markAllRead = useMutation({
    mutationFn: async () => {
      qc.setQueryData<NotificationRecord[]>(["notifications"], (old) =>
        (old ?? []).map((n) => ({ ...n, read: true }))
      );
      toast.success("All notifications marked as read");
    },
  });

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = items.filter((n) => {
    const matchesType   = activeFilter === "ALL" || n.type === activeFilter;
    const matchesSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const unreadFiltered  = filtered.filter((n) => !n.read);
  const readFiltered    = filtered.filter((n) =>  n.read);

  const tabs = FILTER_TABS.map((t) => ({
    key:   t.key,
    label: t.label,
    count: t.key === "ALL"
      ? items.length
      : items.filter((n) => n.type === t.key).length,
  })).filter((t) => t.key === "ALL" || t.count > 0);

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Header */}
      <PageHeader
        title="Notifications"
        subtitle="Stay updated on equipment alerts, AI insights, maintenance events, and compliance changes."
        badge={
          unread > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B2C] px-2.5 py-1 text-[11px] font-bold text-white">
              {unread} unread
            </span>
          ) : undefined
        }
        action={
          unread > 0 ? (
            <button
              onClick={() => markAllRead.mutate()}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search notifications…"
        tabs={tabs}
        activeTab={activeFilter}
        onTabChange={setActiveFilter}
      />

      {/* Error / Loading */}
      {isError   && <ErrorState message="Failed to load notifications." onRetry={refetch} />}
      {isLoading && <RowSkeleton rows={4} />}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title={search || activeFilter !== "ALL" ? "No notifications match your filters." : "You're all caught up!"}
          description={search || activeFilter !== "ALL" ? "Try a different filter or search term." : "New alerts will appear here automatically."}
        />
      )}

      {/* Unread group */}
      {!isLoading && !isError && unreadFiltered.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Unread · {unreadFiltered.length}
            </span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>
          {unreadFiltered.map((notif) => (
            <NotificationRow
              key={notif.id}
              notif={notif}
              onMarkRead={() => markRead.mutate(notif.id)}
            />
          ))}
        </section>
      )}

      {/* Read group */}
      {!isLoading && !isError && readFiltered.length > 0 && (
        <section className="space-y-2">
          {unreadFiltered.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Earlier · {readFiltered.length}
              </span>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>
          )}
          {readFiltered.map((notif) => (
            <NotificationRow key={notif.id} notif={notif} />
          ))}
        </section>
      )}
    </div>
  );
}

// ── Notification row component ────────────────────────────────────────────────
function NotificationRow({
  notif,
  onMarkRead,
}: {
  notif: NotificationRecord;
  onMarkRead?: () => void;
}) {
  const cfg  = typeConfig[notif.type] ?? typeConfig["INFO"];
  const Icon = cfg.icon;

  return (
    <div className={cn(
      "group flex items-start gap-4 rounded-2xl border p-4 transition-all duration-200",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
      !notif.read
        ? "bg-white border-[#FF6B2C]/15 hover:border-[#FF6B2C]/30"
        : "bg-white border-zinc-200/70 hover:border-zinc-300"
    )}>
      {/* Icon */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        cfg.bg
      )}>
        <Icon className={cn("h-4.5 w-4.5", cfg.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              "text-[13px] font-semibold leading-snug",
              !notif.read ? "text-zinc-900" : "text-zinc-700"
            )}>
              {notif.title}
            </h3>
            {!notif.read && (
              <span className="h-2 w-2 rounded-full bg-[#FF6B2C] shrink-0 mt-1" />
            )}
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
              cfg.bg, cfg.color
            )}>
              {cfg.label}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 whitespace-nowrap shrink-0 mt-0.5">
            {timeAgo(notif.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-zinc-500 leading-relaxed">
          {notif.message}
        </p>
        {notif.actionUrl && (
          <a
            href={notif.actionUrl}
            className="mt-2 inline-flex items-center text-[11px] font-semibold text-[#FF6B2C] hover:text-[#FF824E] transition-colors"
          >
            View details →
          </a>
        )}
      </div>

      {/* Mark read button */}
      {onMarkRead && !notif.read && (
        <button
          onClick={onMarkRead}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all opacity-0 group-hover:opacity-100"
          title="Mark as read"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
