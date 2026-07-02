"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react";
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
  compliant: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Compliant" },
  non_compliant: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Non-Compliant" },
  pending_review: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Pending Review" },
  expiring: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", label: "Expiring Soon" },
};

const categoryLabels: Record<string, string> = {
  iso: "ISO",
  factory_act: "Factory Act",
  peso: "PESO",
  oisd: "OISD",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-muted">
        <div className={cn("h-1.5 rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium">{score}%</span>
    </div>
  );
}

export default function CompliancePage() {
  const overallScore = Math.round(mockCompliance.reduce((a, c) => a + c.score, 0) / mockCompliance.length);
  const compliant = mockCompliance.filter(c => c.status === "compliant").length;
  const issues = mockCompliance.filter(c => c.status !== "compliant").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="text-muted-foreground">Monitor regulatory compliance across Factory Act, ISO, PESO, and OISD.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overallScore}%</p>
              <p className="text-xs text-muted-foreground">Overall Score</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{compliant}</p>
              <p className="text-xs text-muted-foreground">Compliant</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{issues}</p>
              <p className="text-xs text-muted-foreground">Needs Attention</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockCompliance.length}</p>
              <p className="text-xs text-muted-foreground">Total Regulations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Items */}
      <div className="space-y-3">
        {mockCompliance.map((item) => {
          const status = statusConfig[item.status];
          const StatusIcon = status.icon;
          return (
            <Card key={item.id} className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", status.bg)}>
                      <StatusIcon className={cn("h-4 w-4", status.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{item.regulation}</h3>
                        <Badge variant="outline" className="text-[10px]">{categoryLabels[item.category]}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">Last Audit: {item.lastAudit}</span>
                        <span className="text-xs text-muted-foreground">Next: {item.nextAudit}</span>
                      </div>
                      {item.findings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.findings.map((f, i) => (
                            <p key={i} className="text-[11px] text-muted-foreground">• {f}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={cn("text-[10px]", status.bg, status.color)} variant="secondary">{status.label}</Badge>
                    <div className="mt-2">
                      <ScoreBar score={item.score} />
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
