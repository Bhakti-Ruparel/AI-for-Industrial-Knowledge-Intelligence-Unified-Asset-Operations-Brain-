"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  FileBarChart, TrendingUp, Wrench, Shield,
  Bot, FileText, AlertTriangle, ArrowRight, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reportTypes = [
  {
    icon:        TrendingUp,
    title:       "Equipment Health Report",
    description: "Comprehensive health scores, maintenance history, and predicted failure timelines for all plant equipment.",
    href:        "/analytics",
    iconBg:      "bg-[#FFF2EB]",
    iconColor:   "text-[#FF6B2C]",
    status:      "View in Analytics",
  },
  {
    icon:        Wrench,
    title:       "Maintenance Summary",
    description: "Work order completion rates, overdue tasks, cost breakdown, and technician performance metrics.",
    href:        "/maintenance",
    iconBg:      "bg-blue-50",
    iconColor:   "text-blue-600",
    status:      "View in Maintenance",
  },
  {
    icon:        AlertTriangle,
    title:       "Incident Analysis",
    description: "Root cause analysis summary, severity distribution, and resolution time trends across all incidents.",
    href:        "/incidents",
    iconBg:      "bg-red-50",
    iconColor:   "text-red-600",
    status:      "View in Incidents",
  },
  {
    icon:        Shield,
    title:       "Compliance Audit Report",
    description: "Framework-level compliance scores, violation details, upcoming audit deadlines, and risk assessment.",
    href:        "/compliance",
    iconBg:      "bg-emerald-50",
    iconColor:   "text-emerald-600",
    status:      "View in Compliance",
  },
  {
    icon:        FileText,
    title:       "Document Index Report",
    description: "Ingested document inventory, processing status, OCR quality, and embedding coverage by type.",
    href:        "/documents",
    iconBg:      "bg-indigo-50",
    iconColor:   "text-indigo-600",
    status:      "View in Documents",
  },
  {
    icon:        Bot,
    title:       "AI Usage Report",
    description: "Query volume, confidence scores, agent utilization, and knowledge base coverage analytics.",
    href:        "/analytics",
    iconBg:      "bg-purple-50",
    iconColor:   "text-purple-600",
    status:      "View in Analytics",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Reports"
        subtitle="Access operational reports across maintenance, compliance, equipment health, and AI usage."
        action={
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-400 cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            title="Batch export coming soon"
          >
            <Download className="h-3.5 w-3.5" />
            Export All
          </button>
        }
      />

      {/* Coming soon notice */}
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 flex items-start gap-3">
        <FileBarChart className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-amber-800">Scheduled PDF & Excel export coming soon</p>
          <p className="text-[12px] text-amber-700 mt-0.5 leading-relaxed">
            Until automated export is available, each report type below links directly to the live data view
            in its respective module where you can filter, analyze, and review all operational data.
          </p>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.title}
              href={report.href}
              className={cn(
                "group flex flex-col rounded-2xl border border-zinc-200/70 bg-white p-5 transition-all duration-200",
                "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]",
                "hover:-translate-y-0.5 hover:border-zinc-300"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", report.iconBg)}>
                  <Icon className={cn("h-5 w-5", report.iconColor)} />
                </div>
                <h3 className="text-[13px] font-bold text-zinc-900 group-hover:text-[#FF6B2C] transition-colors leading-snug">
                  {report.title}
                </h3>
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed flex-1">{report.description}</p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-[#FF6B2C]">
                {report.status}
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
