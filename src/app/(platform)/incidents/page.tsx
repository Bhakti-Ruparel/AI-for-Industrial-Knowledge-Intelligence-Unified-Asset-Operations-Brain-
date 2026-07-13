"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidents, type IncidentRecord } from "@/services/api/incidents";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Clock, CheckCircle, Search as SearchIcon,
  FileImage, FileText, Database, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const severityConfig: Record<string, { color: string; bg: string }> = {
  LOW:      { color: "text-blue-500",   bg: "bg-blue-50 text-blue-600"   },
  MEDIUM:   { color: "text-amber-500",  bg: "bg-amber-50 text-amber-600" },
  HIGH:     { color: "text-orange-500", bg: "bg-orange-50 text-orange-600"},
  CRITICAL: { color: "text-red-600",    bg: "bg-red-50 text-red-600"     },
};

const statusConfig: Record<string, { icon: typeof AlertTriangle; bg: string; text: string }> = {
  OPEN:          { icon: AlertTriangle, bg: "bg-red-50/70 text-red-600",     text: "Open"          },
  INVESTIGATING: { icon: Clock,         bg: "bg-amber-50/70 text-amber-600", text: "Investigating" },
  RESOLVED:      { icon: CheckCircle,   bg: "bg-emerald-50 text-emerald-600",text: "Resolved"      },
  CLOSED:        { icon: CheckCircle,   bg: "bg-zinc-100 text-zinc-600",     text: "Closed"        },
};

export default function IncidentsPage() {
  const [search, setSearch] = useState("");
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => fetchIncidents(1, 50),
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load incidents");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const allIncidents: IncidentRecord[] = data?.data ?? [];

  const filtered = allIncidents.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.equipmentName || i.equipmentId).toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = allIncidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING").length;
  const criticalUnresolved = allIncidents.filter(
    (i) => (i.severity === "CRITICAL" || i.severity === "HIGH") && i.status !== "RESOLVED" && i.status !== "CLOSED"
  );

  return (
    <div className="space-y-6 p-6 font-sans antialiased max-w-[1400px] mx-auto text-zinc-900 bg-[#fafafa]/30 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Incidents Registry</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Track, investigate, and isolate equipment malfunctions lifecycle events.</p>
        </div>
        {activeCount > 0 && (
          <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] tracking-wide px-2.5 py-0.5 border-none rounded-full">
            {activeCount} Active Outages
          </Badge>
        )}
      </div>

      {/* Error */}
      {isError && <ErrorState message="Failed to load incidents." onRetry={refetch} />}

      {/* Loading */}
      {isLoading && <RowSkeleton rows={5} />}

      {!isLoading && !isError && (
        <>
          {/* Critical banner */}
          {criticalUnresolved.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Critical Failures Requiring Isolation</span>
              </div>
              {criticalUnresolved.map((incident) => (
                <div key={`critical-${incident.id}`} className="bg-white border border-red-100 rounded-xl p-4 shadow-3xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-900">{incident.title}</h4>
                        <span className="bg-red-600 text-white font-extrabold text-[8px] tracking-wider px-1.5 py-0.5 rounded-full uppercase">
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-400 mt-0.5">
                        {incident.equipmentName || incident.equipmentId} • {incident.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10 pr-2">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Reported</p>
                      <p className="text-xs font-bold text-zinc-700 mt-0.5">
                        {new Date(incident.reportedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Status</p>
                      <span className="inline-block text-xs font-bold text-red-600 capitalize mt-0.5">
                        {incident.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mt-2">
            <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter incidents by title or asset..."
              className="pl-9 h-9 text-xs bg-white border-zinc-200/80 rounded-lg placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400"
            />
          </div>

          {/* Empty */}
          {filtered.length === 0 && (
            <EmptyState
              icon={<AlertTriangle className="h-5 w-5" />}
              title={search ? "No incidents matched your search." : "No incidents reported."}
              description="All incidents will appear here once logged."
            />
          )}

          {/* List */}
          <div className="space-y-2.5">
            {filtered.map((incident) => {
              const severity = severityConfig[incident.severity] ?? severityConfig["MEDIUM"];
              const status = statusConfig[incident.status] ?? statusConfig["OPEN"];
              const StatusIcon = status.icon;
              const evidence = incident.evidence ?? [];

              return (
                <Card key={incident.id} className="border border-zinc-100 bg-white rounded-xl shadow-4xs overflow-hidden transition-all hover:border-zinc-200/80 group">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">

                      {/* Title */}
                      <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border border-zinc-100/60", severity.bg)}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                              {incident.title}
                              <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                            </h3>
                            <Badge variant="secondary" className={cn("text-[8px] font-extrabold px-1 py-0 rounded uppercase tracking-wider border-none", severity.bg)}>
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">{incident.description}</p>
                        </div>
                      </div>

                      {/* Asset */}
                      <div className="col-span-4 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Target Asset</span>
                        <span className="text-xs font-bold text-zinc-700 block mt-1">
                          {incident.equipmentName || incident.equipmentId}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-4 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Lifecycle Stage</span>
                        <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1.5", status.bg)}>
                          <StatusIcon className="h-3 w-3 shrink-0" />
                          <span>{status.text}</span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-4 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Reported Date</span>
                        <span className="text-xs font-bold text-zinc-600 block mt-1">
                          {new Date(incident.reportedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Evidence */}
                      <div className="col-span-12 md:col-span-2 space-y-1">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Evidence</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {evidence.length > 0 ? (
                            evidence.slice(0, 2).map((ev) => (
                              <div key={ev.id} className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5">
                                {ev.type === "image"       && <FileImage   className="h-2.5 w-2.5 text-zinc-400" />}
                                {ev.type === "document"    && <FileText    className="h-2.5 w-2.5 text-zinc-400" />}
                                {ev.type === "sensor_data" && <Database    className="h-2.5 w-2.5 text-zinc-400" />}
                                <span className="truncate max-w-[60px]">{ev.title}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-300 italic font-medium">None linked</span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* RCA strip */}
                    {incident.rootCause && (
                      <div className="mt-3 pt-3 border-t border-zinc-50 flex items-start gap-2 bg-zinc-50/50 p-2 rounded-lg">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                          RCA
                        </div>
                        <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">{incident.rootCause}</p>
                      </div>
                    )}
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
