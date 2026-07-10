"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, Clock, CheckCircle, Search as SearchIcon, 
  FileImage, FileText, Database, ArrowUpRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  low: { color: "text-blue-500", bg: "bg-blue-50 text-blue-600" },
  medium: { color: "text-amber-500", bg: "bg-amber-50 text-amber-600" },
  high: { color: "text-orange-500", bg: "bg-orange-50 text-orange-600" },
  critical: { color: "text-red-600", bg: "bg-red-50 text-red-600" },
};

const statusConfig = {
  open: { icon: AlertTriangle, bg: "bg-red-50/70 text-red-600", text: "Open" },
  investigating: { icon: Clock, bg: "bg-amber-50/70 text-amber-600", text: "Investigating" },
  resolved: { icon: CheckCircle, bg: "bg-emerald-50 text-emerald-600", text: "Resolved" },
  closed: { icon: CheckCircle, bg: "bg-zinc-100 text-zinc-600", text: "Closed" },
};

export default function IncidentsPage() {
  const [search, setSearch] = useState("");

  const activeCount = mockIncidents.filter(i => i.status === "open" || i.status === "investigating").length;
  const criticalUnresolved = mockIncidents.filter(i => (i.severity === "critical" || i.severity === "high") && i.status !== "resolved");
  
  const filteredIncidents = mockIncidents.filter(incident => 
    incident.title.toLowerCase().includes(search.toLowerCase()) || 
    incident.equipmentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 font-sans antialiased max-w-[1400px] mx-auto text-zinc-900 bg-[#fafafa]/30 min-h-screen">
      
      {/* Page Layout Title Block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Incidents Registry</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Track, investigate, and isolate equipment malfunctions lifecycle events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] tracking-wide px-2.5 py-0.5 border-none rounded-full">
            {activeCount} Active Outages
          </Badge>
        </div>
      </div>

      {/* PINNED OVERDUE & CRITICAL SYSTEM INCIDENTS HEADER PANEL */}
      {criticalUnresolved.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical Failures Requiring Isolation</span>
          </div>
          
          <div className="space-y-2">
            {criticalUnresolved.map((incident) => (
              <div key={`critical-bar-${incident.id}`} className="bg-white border border-red-100 rounded-xl p-4 shadow-3xs flex items-center justify-between">
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
                    <p className="text-xs font-medium text-zinc-400 mt-0.5">{incident.equipmentName} • {incident.description}</p>
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
                    <span className="inline-block text-xs font-bold text-red-600 capitalize mt-0.5">{incident.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Realtime Pipeline Filter Input Field */}
      <div className="relative mt-2">
        <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <Input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Filter incidents by asset label, title, index identifier..." 
          className="pl-9 h-9 text-xs bg-white border-zinc-200/80 rounded-lg placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400" 
        />
      </div>

      {/* UNIFIED HORIZONTAL SYSTEM MATRIX ROW PIPELINE */}
      <div className="space-y-2.5">
        {filteredIncidents.map((incident) => {
          const severity = severityConfig[incident.severity];
          const status = statusConfig[incident.status];
          const StatusIcon = status.icon;

          return (
            <Card 
              key={incident.id} 
              className="border border-zinc-100 bg-white rounded-xl shadow-4xs overflow-hidden transition-all duration-200 hover:border-zinc-200/80 group"
            >
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Column 1-4: Incident title identity fields */}
                  <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border border-zinc-100/60", severity.bg)}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                          {incident.title}
                          <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                        </h3>
                        <Badge variant="secondary" className={cn("text-[8px] font-extrabold px-1 py-0 rounded uppercase tracking-wider border-none", severity.bg)}>
                          {incident.severity}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[240px] md:max-w-xs mt-0.5">{incident.description}</p>
                    </div>
                  </div>

                  {/* Column 5-6: Target Asset Identification Equipment Name */}
                  <div className="col-span-4 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Target Asset</span>
                    <span className="text-xs font-bold text-zinc-700 block mt-1">{incident.equipmentName}</span>
                  </div>

                  {/* Column 7-8: Incident Stage Pipeline Status Badge */}
                  <div className="col-span-4 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Lifecycle Stage</span>
                    <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1.5", status.bg)}>
                      <StatusIcon className="h-3 w-3 shrink-0" />
                      <span className="tracking-tight">{status.text}</span>
                    </div>
                  </div>

                  {/* Column 9-10: Initial Incident Trigger Date Timestamp */}
                  <div className="col-span-4 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Reported Date</span>
                    <span className="text-xs font-bold text-zinc-600 block mt-1">
                      {new Date(incident.reportedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Column 11-12: Linked File Attachments & Evidence Pills */}
                  <div className="col-span-12 md:col-span-2 space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Attached Evidence</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {incident.evidence.length > 0 ? (
                        incident.evidence.map((ev) => (
                          <div 
                            key={ev.id} 
                            className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5"
                          >
                            {ev.type === "image" && <FileImage className="h-2.5 w-2.5 text-zinc-400" />}
                            {ev.type === "document" && <FileText className="h-2.5 w-2.5 text-zinc-400" />}
                            {ev.type === "sensor_data" && <Database className="h-2.5 w-2.5 text-zinc-400" />}
                            <span className="truncate max-w-[60px]">{ev.title}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-300 italic font-medium">None linked</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Sub-tray: Root Cause Trace Diagnostics Row */}
                {incident.rootCause && (
                  <div className="mt-3 pt-3 border-t border-zinc-50 flex items-start gap-2 bg-zinc-50/50 p-2 rounded-lg">
                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                      RCA Diagnostics
                    </div>
                    <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                      {incident.rootCause}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}