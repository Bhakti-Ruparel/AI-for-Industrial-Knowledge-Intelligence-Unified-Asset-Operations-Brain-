"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Wrench, Activity, FileText, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Equipment } from "@/types";

const mockEquipment: Equipment[] = [
  { id: "1", name: "CVM-850 #1", model: "CVM-850", series: "CVM SERIES", category: "VMC", status: "operational", healthScore: 94, location: "Bay A - Line 1", lastMaintenance: "2026-06-15", nextMaintenance: "2026-07-15", specifications: { x: 850, y: 500, z: 500, spindle: "12000 RPM" }, documents: ["1"] },
  { id: "2", name: "DYNAMILL-1200", model: "DYNAMILL-1200", series: "DYNAMILL SERIES", category: "VMC", status: "maintenance", healthScore: 72, location: "Bay B - Line 2", lastMaintenance: "2026-06-01", nextMaintenance: "2026-07-01", specifications: { x: 1200, y: 600, z: 600, spindle: "10000 RPM" }, documents: [] },
  { id: "3", name: "V-TURN 1200", model: "V-TURN 1200", series: "V TURN SERIES", category: "VTL", status: "operational", healthScore: 88, location: "Bay C - Line 1", lastMaintenance: "2026-06-20", nextMaintenance: "2026-07-20", specifications: { diameter: 1200, height: 800 }, documents: [] },
  { id: "4", name: "SURFGRIND-600", model: "SURFGRIND-600", series: "SURFGRIND SERIES", category: "Grinding", status: "critical", healthScore: 45, location: "Bay D - Line 1", lastMaintenance: "2026-05-10", nextMaintenance: "2026-06-10", specifications: { length: 600, width: 300 }, documents: [] },
  { id: "5", name: "UNIMILL-500", model: "UNIMILL-500", series: "UNIMILL SERIES", category: "5 Axis VMC", status: "operational", healthScore: 97, location: "Bay A - Line 3", lastMaintenance: "2026-06-25", nextMaintenance: "2026-07-25", specifications: { length: 500, width: 400 }, documents: [] },
];

const statusConfig = {
  operational: { label: "Operational", color: "bg-emerald-500", textColor: "text-emerald-500" },
  maintenance: { label: "In Maintenance", color: "bg-amber-500", textColor: "text-amber-500" },
  offline: { label: "Offline", color: "bg-gray-500", textColor: "text-gray-500" },
  critical: { label: "Critical", color: "bg-red-500", textColor: "text-red-500" },
};

function HealthRing({ score }: { score: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="hsl(217 33% 17%)" strokeWidth="4" />
        <circle cx="28" cy="28" r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold">{score}</span>
    </div>
  );
}

export default function EquipmentPage() {
  const [search, setSearch] = useState("");

  const filtered = mockEquipment.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
          <p className="text-muted-foreground">Monitor health, maintenance, and documentation for all machines.</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-full", config.color)} />
              <span className="text-[10px] text-muted-foreground">{mockEquipment.filter(e => e.status === key).length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment..." className="pl-10" />
      </div>

      {/* Equipment Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((eq) => {
          const status = statusConfig[eq.status];
          return (
            <Card key={eq.id} className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{eq.name}</h3>
                      <Badge variant="outline" className="text-[10px]">{eq.category}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{eq.series} • {eq.location}</p>
                  </div>
                  <HealthRing score={eq.healthScore} />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", status.color)} />
                  <span className={cn("text-xs font-medium", status.textColor)}>{status.label}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-accent/30 px-2.5 py-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Next Service</p>
                      <p className="text-xs font-medium">{eq.nextMaintenance}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-accent/30 px-2.5 py-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Documents</p>
                      <p className="text-xs font-medium">{eq.documents.length} linked</p>
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
