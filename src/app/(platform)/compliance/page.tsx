"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCompliance, type ComplianceRecord } from "@/services/api/compliance";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Clock, XCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  COMPLIANT:      { icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600", label: "Compliant"       },
  NON_COMPLIANT:  { icon: XCircle,       color: "text-red-600",     bg: "bg-red-50 text-red-600",         label: "Non-Compliant"   },
  PENDING_REVIEW: { icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50 text-amber-600",     label: "Pending Review"  },
  EXPIRING:       { icon: AlertTriangle, color: "text-orange-600",  bg: "bg-orange-50 text-orange-600",   label: "Expiring Soon"   },
};

const categoryLabels: Record<string, string> = {
  FACTORY_ACT:   "Factory Act",
  ISO:           "ISO Compliance",
  PESO:          "PESO Regs",
  OISD:          "OISD Standards",
  ENVIRONMENTAL: "Environmental",
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
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["compliance"],
    queryFn: () => fetchCompliance(1, 50),
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load compliance records");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const records: ComplianceRecord[] = data?.data ?? [];

  const overallScore = records.length
    ? Math.round(records.reduce((a, c) => a + (c.score ?? 0), 0) / records.length)
    : 0;
  const compliant = records.filter((c) => c.status === "COMPLIANT").length;
  const issues = records.filter((c) => c.status !== "COMPLIANT").length;
  const criticalViolations = records.filter(
    (r) => r.status === "NON_COMPLIANT" || r.status === "EXPIRING"
  );

  return (
    <div className="space-y-6 p-6 font-sans antialiased max-w-[1400px] mx-auto text-zinc-900 bg-[#fafafa]/30 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Regulatory Compliance Matrix</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Monitor and execute audits across your Factory Act, ISO, PESO, and OISD registries.</p>
        </div>
      </div>

      {/* Error */}
      {isError && <ErrorState message="Failed to load compliance records." onRetry={refetch} />}

      {/* Loading */}
      {isLoading && <RowSkeleton rows={6} />}

      {!isLoading && !isError && (
        <>
          {/* Critical banner */}
          {criticalViolations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-red-600">
                <XCircle className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Immediate Actions Required</span>
              </div>
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
                          {statusConfig[item.status]?.label ?? item.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-zinc-400 mt-0.5">
                        {(item.findings ?? []).join(" | ") || "Pending recertification"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10 pr-2">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Deadline</p>
                      <p className="text-xs font-bold text-red-600 mt-0.5">{item.nextAuditDate ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Score</p>
                      <p className="text-xs font-bold text-zinc-800 mt-0.5">{item.score ?? "—"}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* KPI panels */}
          {records.length > 0 && (
            <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Overall Rating Score",       val: `${overallScore}%`, icon: Shield,        style: "bg-zinc-900 text-white"                },
                { label: "Fully Compliant Registries", val: compliant,          icon: CheckCircle,   style: "bg-white border border-zinc-100 text-emerald-600" },
                { label: "Active Breaches / Flags",    val: issues,             icon: AlertTriangle, style: "bg-white border border-zinc-100 text-red-500"     },
                { label: "Tracked Frameworks",         val: records.length,     icon: Clock,         style: "bg-white border border-zinc-100 text-zinc-500"    },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <Card key={idx} className={cn("rounded-xl overflow-hidden shadow-4xs", kpi.style)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold tracking-tight">{kpi.val}</p>
                        <p className={cn("text-[10px] font-medium tracking-wide mt-0.5", kpi.style.includes("zinc-900") ? "text-zinc-400" : "text-zinc-400")}>
                          {kpi.label}
                        </p>
                      </div>
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", kpi.style.includes("zinc-900") ? "bg-white/10 text-white" : "bg-zinc-50 text-current")}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty */}
          {records.length === 0 && (
            <EmptyState
              icon={<Shield className="h-5 w-5" />}
              title="No compliance records found."
              description="Compliance frameworks will appear here once added."
            />
          )}

          {/* Records list */}
          <div className="space-y-2.5 pt-2">
            {records.map((item) => {
              const status = statusConfig[item.status] ?? statusConfig["PENDING_REVIEW"];
              const StatusIcon = status.icon;

              return (
                <Card key={item.id} className="border border-zinc-100 bg-white rounded-xl shadow-4xs overflow-hidden transition-all hover:border-zinc-200/80 group">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">

                      {/* Framework */}
                      <div className="col-span-12 md:col-span-5 flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border border-zinc-100/60", status.bg)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                              {item.regulation}
                              <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                            </h3>
                            <Badge variant="secondary" className="text-[8px] font-extrabold bg-zinc-50 border border-zinc-200/40 text-zinc-400 px-1 py-0 rounded uppercase tracking-wider">
                              {categoryLabels[item.category] ?? item.category}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate max-w-[320px] mt-0.5">
                            {(item.findings ?? []).length > 0
                              ? `Findings: ${(item.findings ?? []).join(", ")}`
                              : "No breaches detected."}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-4 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Status</span>
                        <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1.5", status.bg)}>
                          <StatusIcon className="h-3 w-3 shrink-0" />
                          <span className="tracking-tight">{status.label}</span>
                        </div>
                      </div>

                      {/* Last audit */}
                      <div className="col-span-4 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Last Audit</span>
                        <span className="text-xs font-bold text-zinc-600 block mt-1">{item.lastAuditDate ?? "—"}</span>
                      </div>

                      {/* Next audit */}
                      <div className="col-span-4 md:col-span-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Next Audit</span>
                        <span className={cn("text-xs font-bold block mt-1",
                          item.status === "NON_COMPLIANT" || item.status === "EXPIRING" ? "text-red-600" : "text-zinc-600"
                        )}>
                          {item.nextAuditDate ?? "—"}
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="col-span-12 md:col-span-1 flex md:justify-end">
                        {item.score != null && <ScoreBar score={item.score} />}
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
