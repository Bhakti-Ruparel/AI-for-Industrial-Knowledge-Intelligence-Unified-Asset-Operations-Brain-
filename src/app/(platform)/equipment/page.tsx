"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Equipment {
  id: string;
  name: string;
  model: string;
  series: string;
  category: string;
  status: "operational" | "maintenance" | "offline" | "critical";
  healthScore: number;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  specifications: Record<string, string | number>;
  documents: string[];
}

const mockEquipment: Equipment[] = [
  { id: "1", name: "CVM-850 #1", model: "CVM-850", series: "CVM SERIES", category: "VMC", status: "operational", healthScore: 94, location: "Bay A - Line 1", lastMaintenance: "2026-06-15", nextMaintenance: "2026-07-15", specifications: { x: 850, y: 500, z: 500, spindle: "12000 RPM" }, documents: ["1"] },
  { id: "2", name: "DYNAMILL-1200", model: "DYNAMILL-1200", series: "DYNAMILL SERIES", category: "VMC", status: "maintenance", healthScore: 72, location: "Bay B - Line 2", lastMaintenance: "2026-06-01", nextMaintenance: "2026-07-01", specifications: { x: 1200, y: 600, z: 600, spindle: "10000 RPM" }, documents: [] },
  { id: "3", name: "V-TURN 1200", model: "V-TURN 1200", series: "V TURN SERIES", category: "VTL", status: "operational", healthScore: 88, location: "Bay C - Line 1", lastMaintenance: "2026-06-20", nextMaintenance: "2026-07-20", specifications: { diameter: 1200, height: 800 }, documents: [] },
  { id: "4", name: "SURFGRIND-600", model: "SURFGRIND-600", series: "SURFGRIND SERIES", category: "Grinding", status: "critical", healthScore: 45, location: "Bay D - Line 1", lastMaintenance: "2026-05-10", nextMaintenance: "2026-06-10", specifications: { length: 600, width: 300 }, documents: [] },
  { id: "5", name: "UNIMILL-500", model: "UNIMILL-500", series: "UNIMILL SERIES", category: "5 Axis VMC", status: "operational", healthScore: 97, location: "Bay A - Line 3", lastMaintenance: "2026-06-25", nextMaintenance: "2026-07-25", specifications: { length: 500, width: 400 }, documents: [] },
];

const statusConfig = {
  operational: { label: "Operational", color: "bg-[#10b981]", textColor: "text-[#10b981]" },
  maintenance: { label: "In Maintenance", color: "bg-[#f59e0b]", textColor: "text-[#f59e0b]" },
  offline: { label: "Offline", color: "bg-[#71717a]", textColor: "text-[#71717a]" },
  critical: { label: "Critical", color: "bg-[#ef4444]", textColor: "text-[#ef4444]" },
};

function HealthRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? "#10b981" : score >= 65 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-11 w-11 items-center justify-center font-sans">
      <svg className="h-11 w-11 -rotate-90">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="3" />
        <circle 
          cx="22" 
          cy="22" 
          r={radius} 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-zinc-900 tracking-tight">{score}</span>
    </div>
  );
}

export default function EquipmentPage() {
  const [search, setSearch] = useState("");

  const filtered = mockEquipment.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-1 antialiased font-sans max-w-[1600px] mx-auto text-zinc-900">
      
      {/* Top Banner Counter Strip */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-zinc-900">Equipment</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Monitor health, maintenance, and documentation for all machines.</p>
        </div>
        
        {/* Exact Match Status Counters From Your Platform Design */}
        <div className="flex items-center gap-4 bg-white/60 border border-zinc-100 px-4 py-2 rounded-xl shadow-3xs mt-2">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = mockEquipment.filter(e => e.status === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 border-r last:border-0 border-zinc-200 pr-3 last:pr-0">
                <div className={cn("h-2 w-2 rounded-full", config.color)} />
                <span className="text-[11px] font-bold text-zinc-800">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action / Filtering Workspace Layout Section */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-zinc-400" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search equipment..." 
            className="pl-10 h-10 bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:border-transparent rounded-xl text-xs font-medium placeholder:text-zinc-400 shadow-3xs" 
          />
        </div>
        <button className="flex items-center gap-2 px-3.5 h-10 border border-zinc-200 bg-white rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-3xs transition-all">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Equipment Structured Display Deck Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((eq) => {
          const status = statusConfig[eq.status];
          return (
            <Card 
              key={eq.id} 
              className="border border-zinc-200/70 bg-white hover:shadow-xs hover:border-zinc-300 transition-all duration-200 rounded-2xl overflow-hidden cursor-pointer group"
            >
              <CardContent className="p-6 space-y-5">
                
                {/* Header Meta Section */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight group-hover:text-blue-600 transition-colors">
                        {eq.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className="text-[9px] font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md border border-transparent tracking-wide"
                      >
                        {eq.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-400 tracking-normal">
                      {eq.series} <span className="mx-1 text-zinc-300">•</span> {eq.location}
                    </p>
                  </div>
                  
                  <HealthRing score={eq.healthScore} />
                </div>

                {/* Status Dot Pillar */}
                <div className="flex items-center gap-2 border-t border-zinc-50 pt-2">
                  <div className={cn("h-2 w-2 rounded-full shadow-3xs animate-pulse-slow", status.color)} />
                  <span className={cn("text-xs font-bold tracking-tight", status.textColor)}>
                    {status.label}
                  </span>
                </div>

                {/* Technical Meta Properties Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  
                  {/* Service Matrix */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5">
                    <div className="p-1.5 bg-white rounded-lg border border-zinc-100 shrink-0 text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Next Service</p>
                      <p className="text-xs font-bold text-zinc-700 truncate mt-0.5">{eq.nextMaintenance}</p>
                    </div>
                  </div>

                  {/* Documentation Matrix */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5">
                    <div className="p-1.5 bg-white rounded-lg border border-zinc-100 shrink-0 text-zinc-400">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Documents</p>
                      <p className="text-xs font-bold text-zinc-700 truncate mt-0.5">{eq.documents.length} linked</p>
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