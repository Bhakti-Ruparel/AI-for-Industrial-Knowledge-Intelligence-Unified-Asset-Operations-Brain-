"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, Search as SearchIcon, FileImage, FileText, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Incident } from "@/types";

const mockIncidents: Incident[] = [
  {
    id: "1", title: "Spindle Bearing Failure", equipmentId: "1", equipmentName: "CVM-850 #1",
    severity: "high", status: "investigating", reportedAt: "2026-07-01T14:30:00Z",
    description: "Unusual vibration detected during high-speed machining. Spindle temperature elevated to 78°C.",
    rootCause: "Bearing wear due to extended operation without scheduled maintenance",
    evidence: [
      { id: "1", type: "sensor_data", title: "Vibration Analysis Report", url: "#" },
      { id: "2", type: "image", title: "Thermal Imaging", url: "#" },
    ],
    timeline: [
      { id: "1", timestamp: "2026-07-01T14:30:00Z", description: "Vibration alarm triggered", user: "System", type: "created" },
      { id: "2", timestamp: "2026-07-01T14:45:00Z", description: "Investigation started", user: "Rajesh Kumar", type: "updated" },
      { id: "3", timestamp: "2026-07-01T15:00:00Z", description: "Thermal scan completed — bearing overheat confirmed", user: "Amit Patel", type: "comment" },
    ],
  },
  {
    id: "2", title: "Grinding Wheel Imbalance", equipmentId: "4", equipmentName: "SURFGRIND-600",
    severity: "critical", status: "open", reportedAt: "2026-07-02T09:00:00Z",
    description: "Surface finish quality dropped below tolerance. Wheel vibration exceeds safe limits.",
    evidence: [{ id: "3", type: "document", title: "Quality Inspection Report", url: "#" }],
    timeline: [
      { id: "1", timestamp: "2026-07-02T09:00:00Z", description: "Quality check failed — Ra > 1.6μm", user: "QC Team", type: "created" },
    ],
  },
  {
    id: "3", title: "Coolant Leak - Bay B", equipmentId: "2", equipmentName: "DYNAMILL-1200",
    severity: "medium", status: "resolved", reportedAt: "2026-06-28T11:00:00Z", resolvedAt: "2026-06-29T16:00:00Z",
    description: "Coolant line fitting corroded causing slow leak. Floor hazard identified.",
    rootCause: "Corrosion of brass fitting due to incompatible coolant pH",
    evidence: [],
    timeline: [
      { id: "1", timestamp: "2026-06-28T11:00:00Z", description: "Leak reported by operator", user: "Operator B2", type: "created" },
      { id: "2", timestamp: "2026-06-29T16:00:00Z", description: "Fitting replaced, area cleaned", user: "Suresh Mehta", type: "resolved" },
    ],
  },
];

const severityConfig = {
  low: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  medium: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
};

const statusIcons = {
  open: AlertTriangle,
  investigating: Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
};

export default function IncidentsPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Track, investigate, and resolve equipment incidents.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive">{mockIncidents.filter(i => i.status === "open" || i.status === "investigating").length} Active</Badge>
        </div>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents..." className="pl-10" />
      </div>

      <div className="space-y-4">
        {mockIncidents.map((incident) => {
          const severity = severityConfig[incident.severity];
          const StatusIcon = statusIcons[incident.status];
          return (
            <Card key={incident.id} className={cn("border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-colors", severity.border)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", severity.bg)}>
                    <AlertTriangle className={cn("h-5 w-5", severity.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold">{incident.title}</h3>
                      <Badge className={cn("text-[10px]", severity.bg, severity.color)} variant="secondary">{incident.severity}</Badge>
                      <div className="flex items-center gap-1">
                        <StatusIcon className={cn("h-3 w-3", incident.status === "resolved" ? "text-emerald-500" : severity.color)} />
                        <span className="text-[10px] font-medium text-muted-foreground">{incident.status}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{incident.equipmentName} • Reported {new Date(incident.reportedAt).toLocaleDateString()}</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{incident.description}</p>

                    {incident.rootCause && (
                      <div className="mt-3 rounded-lg bg-accent/30 p-2.5">
                        <p className="text-[10px] font-medium text-primary">Root Cause Analysis</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{incident.rootCause}</p>
                      </div>
                    )}

                    {/* Evidence */}
                    {incident.evidence.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">Evidence:</span>
                        {incident.evidence.map((ev) => (
                          <Badge key={ev.id} variant="outline" className="text-[10px] gap-1">
                            {ev.type === "image" && <FileImage className="h-2.5 w-2.5" />}
                            {ev.type === "document" && <FileText className="h-2.5 w-2.5" />}
                            {ev.type === "sensor_data" && <Database className="h-2.5 w-2.5" />}
                            {ev.title}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="mt-4 space-y-2 border-l-2 border-border pl-3">
                      {incident.timeline.slice(0, 3).map((event) => (
                        <div key={event.id} className="relative">
                          <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-muted-foreground" />
                          <p className="text-xs">{event.description}</p>
                          <p className="text-[10px] text-muted-foreground">{event.user} • {new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
