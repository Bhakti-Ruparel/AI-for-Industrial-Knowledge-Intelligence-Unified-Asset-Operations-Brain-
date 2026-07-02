"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, Info, XCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/use-store";

const typeConfig = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  success: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
};

export default function NotificationsPage() {
  const { notifications, markAsRead } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on equipment alerts, leads, and compliance events.</p>
        </div>
        <Badge variant="secondary">{notifications.filter(n => !n.read).length} unread</Badge>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => {
          const config = typeConfig[notif.type];
          const Icon = config.icon;
          return (
            <Card key={notif.id} className={cn("border-border/50 bg-card/50 backdrop-blur transition-colors", !notif.read && "border-primary/20")}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={cn("text-sm font-medium", !notif.read && "text-foreground")}>{notif.title}</h3>
                    {!notif.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{notif.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(notif.timestamp).toLocaleString()}</p>
                </div>
                {!notif.read && (
                  <button onClick={() => markAsRead(notif.id)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent shrink-0">
                    <Check className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
