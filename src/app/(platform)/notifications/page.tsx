"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, type NotificationRecord } from "@/services/api/notifications";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, Info, XCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Normalize type key (API returns uppercase, component config uses lowercase)
const typeConfig: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  info:             { icon: Info,          color: "text-blue-500",    bg: "bg-blue-500/10"    },
  warning:          { icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-500/10"   },
  error:            { icon: XCircle,       color: "text-red-500",     bg: "bg-red-500/10"     },
  success:          { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-500/10" },
  // API uppercase variants
  INFO:             { icon: Info,          color: "text-blue-500",    bg: "bg-blue-500/10"    },
  WARNING:          { icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-500/10"   },
  ERROR:            { icon: XCircle,       color: "text-red-500",     bg: "bg-red-500/10"     },
  SUCCESS:          { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-500/10" },
  AI_INSIGHT:       { icon: Info,          color: "text-blue-500",    bg: "bg-blue-500/10"    },
  MAINTENANCE_DUE:  { icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-500/10"   },
  INCIDENT_ALERT:   { icon: XCircle,       color: "text-red-500",     bg: "bg-red-500/10"     },
  COMPLIANCE_ALERT: { icon: AlertTriangle, color: "text-orange-500",  bg: "bg-orange-500/10"  },
};

export default function NotificationsPage() {
  const toast = useToast();
  const qc = useQueryClient();

  const { data: notifications, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load notifications");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const items: NotificationRecord[] = notifications ?? [];
  const unread = items.filter((n) => !n.read).length;

  // Mark-as-read is local-only in Phase 1 (no PATCH endpoint yet)
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      // Optimistically update cache
      qc.setQueryData<NotificationRecord[]>(["notifications"], (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      toast.info("Marked as read");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on equipment alerts, leads, and compliance events.</p>
        </div>
        <Badge variant="secondary">{unread} unread</Badge>
      </div>

      {isError && <ErrorState message="Failed to load notifications." onRetry={refetch} />}

      {isLoading && <RowSkeleton rows={4} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications"
          description="You're all caught up. New alerts will appear here."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-3">
          {items.map((notif) => {
            const config = typeConfig[notif.type] ?? typeConfig["INFO"];
            const Icon = config.icon;
            return (
              <Card
                key={notif.id}
                className={cn(
                  "border-border/50 bg-card/50 backdrop-blur transition-colors",
                  !notif.read && "border-primary/20"
                )}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={cn("text-sm font-medium", !notif.read && "text-foreground")}>
                        {notif.title}
                      </h3>
                      {!notif.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{notif.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => markRead.mutate(notif.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent shrink-0"
                    >
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
