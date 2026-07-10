"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Clock, XCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplianceItem } from "@/types";

const mockCompliance: ComplianceItem[] = [
  { id: "1", regulation: "ISO 9001:2015 Quality Management", category: "iso", status: "compliant", lastAudit: "2026-03-15", nextAudit: "2026-09-15", score: 94, findings: [] },
  { id: "2", regulation: "ISO 14001:2015 Environmental Management", category: "iso", status: "compliant", lastAudit: "2026-04-10", nextAudit: "2026-10-10", score: 88, findings: ["Minor: waste disposal documentation gap"] },
  { id: "3", regulation: "Factory Act 1948 - Safety Provisions", category: "factory_act", status: "pending_review", lastAudit: "2026-01-20", nextAudit: "2026-07-20", score: 76, findings: ["Guard rail inspection overdue", "Fire extinguisher certification pending"] },
  { id: "4", regulation: "PESO - Pressure Equipment Certification", category: "peso", status: "expiring", lastAudit: "2025-12-01", nextAudit: "2026-07-01", score: 82, findings: ["Certificate renewal required"] },
  { id: "5", regulation: "OISD - Oil Industry Safety Standards", category: "oisd", status: "compliant", lastAudit: "2026-05-01", nextAudit: "2026-11-01", score: 91, findings: [] },
  { id: "6", regulation: "ISO 45001:2018 Occupational H&S", category: "iso", status: "non_compliant", lastAudit: "2026-02-10", nextAudit: "2026-08-10", score: 62, findings: ["PPE audit incomplete", "Training records missing for 3 operators", "Incident reporting delay > 24hrs"] },
];

const statusConfig = {
  compliant: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600", label: "Compliant" },
  non_compliant: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 text-red-600", label: "Non-Compliant" },
  pending_review: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 text-amber-600", label: "Pending Review" },
  expiring: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 text-orange-600", label: "Expiring Soon" },
};

const categoryLabels: Record<string, string> = {
  iso: "ISO Compliance",
  factory_act: "Factory Act",
  peso: "PESO Regs",
  oisd: "OISD Standards",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1 w-full sm:w-28">
      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
        <span className="uppercase tracking-wider">Health</span>
        <span className="text-zinc-800">{score}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const overallScore = Math.round(mockCompliance.reduce((a, c) => a + c.score, 0) / mockCompliance.length);
  const compliant = mockCompliance.filter(c => c.status === "compliant").length;
  const issues = mockCompliance.filter(c => c.status !== "compliant").length;

  // Track absolute critical structural failures (e.g., non_compliant or expiring)
  const criticalViolations = mockCompliance.filter(item => item.status === "non_compliant" || item.status === "expiring");

  return (
    <div className="space-y-6 p-6 font-sans antialiased max-w-[1400px] mx-auto text-zinc-900 bg-[#fafafa]/30 min-h-screen">
      
      {/* 1. Page Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Regulatory Compliance Matrix</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Monitor and execute audits across your Factory Act, ISO, PESO, and OISD registries.</p>
        </div>
      </div>

      {/* 2. Overdue & Critical System Violations Banner (Pinned on top) */}
      {criticalViolations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-red-600">
            <XCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Immediate Actions Required</span>
          </div>
          
          <div className="space-y-2">
            {criticalViolations.map((item) => (
              <div key={`critical-${item.id}`} className="bg-white border border-red-100 rounded-xl p-4 shadow-3xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-zinc-900">{item.regulation}</h4>
                      <Badge className="bg-red-600 text-white font-extrabold text-[8px] tracking-wider px-1.5 py-0.5 rounded-full uppercase border-none">
                        {statusConfig[item.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-zinc-400 mt-0.5">
                      Findings: {item.findings.join(" | ") || "Pending recertification parameters"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-10 pr-2">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Deadlines</p>
                    <p className="text-xs font-bold text-red-600 mt-0.5">{item.nextAudit}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Score</p>
                    <p className="text-xs font-bold text-zinc-800 mt-0.5">{item.score}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. KPI Status Panels Block */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Overall Rating Score", val: `${overallScore}%`, icon: Shield, style: "bg-zinc-900 text-white" },
          { label: "Fully Compliant Registries", val: compliant, icon: CheckCircle, style: "bg-white border border-zinc-100 text-emerald-600" },
          { label: "Active Breaches / Flags", val: issues, icon: AlertTriangle, style: "bg-white border border-zinc-100 text-red-500" },
          { label: "Tracked Frameworks", val: mockCompliance.length, icon: Clock, style: "bg-white border border-zinc-100 text-zinc-500" }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className={cn("rounded-xl overflow-hidden shadow-4xs", kpi.style)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold tracking-tight">{kpi.val}</p>
                  <p className={cn("text-[10px] font-medium tracking-wide mt-0.5", kpi.style.includes("zinc-900") ? "text-zinc-400" : "text-zinc-400")}>{kpi.label}</p>
                </div>
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", kpi.style.includes("zinc-900") ? "bg-white/10 text-white" : "bg-zinc-50 text-current")}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 4. Main Continuous Horizontal Framework Stack */}
      <div className="space-y-2.5 pt-2">
        {mockCompliance.map((item) => {
          const status = statusConfig[item.status];
          const StatusIcon = status.icon;

          return (
            <Card 
              key={item.id} 
              className="border border-zinc-100 bg-white rounded-xl shadow-4xs overflow-hidden transition-all duration-200 hover:border-zinc-200/80 group"
            >
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Column 1-5: Framework Context Identifiers */}
                  <div className="col-span-12 md:col-span-5 flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border border-zinc-100/60", status.bg)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                          {item.regulation}
                          <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                        </h3>
                        <Badge variant="secondary" className="text-[8px] font-extrabold bg-zinc-50 border border-zinc-200/40 text-zinc-400 px-1 py-0 rounded uppercase tracking-wider">
                          {categoryLabels[item.category]}
                        </Badge>
                      </div>
                      
                      {/* Subfindings inline view block */}
                      <p className="text-[11px] text-zinc-400 truncate max-w-[320px] mt-0.5">
                        {item.findings.length > 0 ? `Findings: ${item.findings.join(", ")}` : "No system breaches or structural deviations tracked."}
                      </p>
                    </div>
                  </div>

                  {/* Column 6-7: Current Registry Operational Health Status */}
                  <div className="col-span-4 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Status</span>
                    <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1.5", status.bg)}>
                      <StatusIcon className="h-3 w-3 shrink-0" />
                      <span className="tracking-tight">{status.label}</span>
                    </div>
                  </div>

                  {/* Column 8-9: Historical Record Audit Cycle Logs */}
                  <div className="col-span-4 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Last Clean Audit</span>
                    <span className="text-xs font-bold text-zinc-600 block mt-1">{item.lastAudit}</span>
                  </div>

                  {/* Column 10-11: Targeted Window Cycles */}
                  <div className="col-span-4 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Target Recertification</span>
                    <span className={cn("text-xs font-bold block mt-1", item.status === "non_compliant" || item.status === "expiring" ? "text-red-600" : "text-zinc-600")}>
                      {item.nextAudit}
                    </span>
                  </div>

                  {/* Column 12: Integrated Core Rating Assessment Metric Slider */}
                  <div className="col-span-12 md:col-span-1 flex md:justify-end">
                    <ScoreBar score={item.score} />
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