"use client";

import { useState, useEffect } from "react";
import {
  Wrench, FileText, AlertTriangle, Bot, TrendingUp, TrendingDown,
  ArrowRight, ChevronDown, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── KPI Data ──────────────────────────────────────────────────────────────────
const kpis = [
  { title: "Active Equipment", value: "24", change: 4.2, direction: "up" as const, label: "from last month", icon: Wrench, iconBg: "bg-[#FFF2EB]", iconColor: "text-[#FF6B2C]" },
  { title: "Documents Indexed", value: "1,847", change: 12.5, direction: "up" as const, label: "this week", icon: FileText, iconBg: "bg-[#EFF6FF]", iconColor: "text-[#3B82F6]" },
  { title: "Open Incidents", value: "3", change: 25, direction: "down" as const, label: "vs last week", icon: AlertTriangle, iconBg: "bg-[#FEF2F2]", iconColor: "text-[#EF4444]" },
  { title: "AI Queries Today", value: "142", change: 18.3, direction: "up" as const, label: "from yesterday", icon: Bot, iconBg: "bg-[#F5F3FF]", iconColor: "text-[#8B5CF6]" },
];

// ── Activity ──────────────────────────────────────────────────────────────────
const activities = [
  { id: "1", title: "New lead captured", description: "HOT LEAD — Automotive Die Mould, Pune", time: "2m ago", dot: "bg-[#22C55E]" },
  { id: "2", title: "Maintenance overdue", description: "SURFGRIND-600 scheduled maintenance missed", time: "1h ago", dot: "bg-[#F59E0B]" },
  { id: "3", title: "Document indexed", description: "ISO 9001:2015 Quality Manual processed", time: "3h ago", dot: "bg-[#3B82F6]" },
  { id: "4", title: "Equipment alert", description: "CVM-850 spindle bearing temperature high", time: "5h ago", dot: "bg-[#EF4444]" },
  { id: "5", title: "Compliance update", description: "PESO inspection due in 15 days", time: "1d ago", dot: "bg-[#8B5CF6]" },
];

// ── AI Insights ───────────────────────────────────────────────────────────────
const insights = [
  { id: "1", priority: "High Priority", priorityColor: "bg-[#EF4444]", message: "CVM-850 spindle bearing shows early wear pattern. Recommend inspection within 2 weeks." },
  { id: "2", priority: "Medium Priority", priorityColor: "bg-[#F59E0B]", message: "SURFGRIND-600 has recurring vibration spikes. Check alignment and lubrication system." },
  { id: "3", priority: "Low Priority", priorityColor: "bg-[#22C55E]", message: "Three similar incidents resolved last month. Consider preventive maintenance." },
];

// ── Equipment Risk ────────────────────────────────────────────────────────────
const equipmentRisk = [
  { name: "CVM-850", type: "Spindle", risk: 82, level: "High", levelColor: "bg-[#EF4444]" },
  { name: "SURFGRIND-600", type: "Grinding Machine", risk: 65, level: "Medium", levelColor: "bg-[#F59E0B]" },
  { name: "VMC-1270", type: "CNC Machine", risk: 45, level: "Medium", levelColor: "bg-[#F59E0B]" },
  { name: "AIR-500 Compressor", type: "Compressor", risk: 20, level: "Low", levelColor: "bg-[#22C55E]" },
];

// ── Maintenance Data ──────────────────────────────────────────────────────────
const maintenanceData = { overdue: 8, dueSoon: 12, inProgress: 9, upToDate: 13, total: 42 };

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className={cn("space-y-8 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Good morning, Admin 👋
          </h1>
          <p className="mt-1 text-[15px] text-[#6B7280]">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] font-medium text-[#374151] shadow-sm transition-all hover:shadow-md">
          <span>May 21, 2025</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.title}
            className="group rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#F3F4F6] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.iconBg)}>
                <kpi.icon className={cn("h-[18px] w-[18px]", kpi.iconColor)} strokeWidth={2} />
              </div>
              <span className="text-[13px] font-medium text-[#6B7280]">{kpi.title}</span>
            </div>
            <p className="mt-4 text-[32px] font-bold text-[#111827] tracking-tight">{kpi.value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {kpi.direction === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-[#22C55E]" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-[#EF4444]" />
              )}
              <span className={cn("text-[12px] font-semibold", kpi.direction === "up" ? "text-[#22C55E]" : "text-[#EF4444]")}>
                {kpi.change}%
              </span>
              <span className="text-[12px] text-[#9CA3AF]">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Activity + Insights Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#F3F4F6]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Recent Activity</h2>
            <button className="text-[12px] font-medium text-[#FF6B2C] hover:text-[#FF824E] transition-colors">View all</button>
          </div>
          <div className="space-y-5">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3.5">
                <div className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", activity.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#111827]">{activity.title}</p>
                  <p className="mt-0.5 text-[12px] text-[#6B7280] truncate">{activity.description}</p>
                </div>
                <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#F3F4F6]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">AI Insights</h2>
            <button className="text-[12px] font-medium text-[#FF6B2C] hover:text-[#FF824E] transition-colors">View all</button>
          </div>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="group flex items-start gap-3.5 rounded-2xl border border-[#F3F4F6] p-4 transition-all hover:border-[#FFEDD5] hover:bg-[#FFFBF5]">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={cn("h-2 w-2 rounded-full", insight.priorityColor)} />
                  <span className="text-[11px] font-semibold text-[#EF4444]">{insight.priority}</span>
                </div>
                <p className="flex-1 text-[12px] text-[#374151] leading-relaxed">{insight.message}</p>
                <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-[#FF6B2C]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row — Maintenance / Health Chart / Equipment Risk */}
      <div className="grid grid-cols-3 gap-6">
        {/* Maintenance Status */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#F3F4F6]">
          <h2 className="text-[15px] font-semibold text-[#111827] mb-6">Maintenance Status</h2>
          <div className="flex items-center gap-6">
            {/* Donut placeholder */}
            <div className="relative flex h-28 w-28 items-center justify-center shrink-0">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 - (maintenanceData.overdue / maintenanceData.total) * 251.2} strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 - (maintenanceData.dueSoon / maintenanceData.total) * 251.2} strokeLinecap="round" transform={`rotate(${(maintenanceData.overdue / maintenanceData.total) * 360} 50 50)`} />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 - (maintenanceData.inProgress / maintenanceData.total) * 251.2} strokeLinecap="round" transform={`rotate(${((maintenanceData.overdue + maintenanceData.dueSoon) / maintenanceData.total) * 360} 50 50)`} />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22C55E" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 - (maintenanceData.upToDate / maintenanceData.total) * 251.2} strokeLinecap="round" transform={`rotate(${((maintenanceData.overdue + maintenanceData.dueSoon + maintenanceData.inProgress) / maintenanceData.total) * 360} 50 50)`} />
              </svg>
              <div className="absolute text-center">
                <p className="text-[22px] font-bold text-[#111827]">{maintenanceData.total}</p>
                <p className="text-[10px] text-[#9CA3AF]">Total</p>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                <span className="text-[12px] text-[#6B7280]">Overdue</span>
                <span className="ml-auto text-[12px] font-semibold text-[#111827]">{maintenanceData.overdue} ({Math.round(maintenanceData.overdue/maintenanceData.total*100)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                <span className="text-[12px] text-[#6B7280]">Due Soon</span>
                <span className="ml-auto text-[12px] font-semibold text-[#111827]">{maintenanceData.dueSoon} ({Math.round(maintenanceData.dueSoon/maintenanceData.total*100)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
                <span className="text-[12px] text-[#6B7280]">In Progress</span>
                <span className="ml-auto text-[12px] font-semibold text-[#111827]">{maintenanceData.inProgress} ({Math.round(maintenanceData.inProgress/maintenanceData.total*100)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                <span className="text-[12px] text-[#6B7280]">Up to Date</span>
                <span className="ml-auto text-[12px] font-semibold text-[#111827]">{maintenanceData.upToDate} ({Math.round(maintenanceData.upToDate/maintenanceData.total*100)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Health Overview */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#F3F4F6]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Equipment Health Overview</h2>
            <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">
              This Week <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          {/* Chart area */}
          <div className="relative h-[160px]">
            {/* Y axis labels */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-[#9CA3AF]">
              <span>100%</span><span>80%</span><span>60%</span><span>40%</span><span>20%</span><span>0%</span>
            </div>
            {/* Chart grid + line */}
            <div className="absolute left-8 right-0 top-0 bottom-6">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="absolute w-full border-t border-dashed border-[#F3F4F6]" style={{ top: `${(i / 5) * 100}%` }} />
              ))}
              {/* Smooth line (simplified SVG) */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B2C" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#FF6B2C" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,60 C40,55 80,45 120,50 C160,55 200,30 240,25 C280,20 320,15 360,12" fill="none" stroke="#FF6B2C" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d="M0,60 C40,55 80,45 120,50 C160,55 200,30 240,25 C280,20 320,15 360,12 L360,100 L0,100 Z" fill="url(#healthGrad)" />
                {/* Data point */}
                <circle cx="360" cy="12" r="5" fill="#FF6B2C" />
                <circle cx="360" cy="12" r="8" fill="#FF6B2C" fillOpacity="0.2" />
              </svg>
              {/* Score badge */}
              <div className="absolute right-0 -top-1 rounded-lg bg-[#22C55E] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                92%
              </div>
            </div>
            {/* X axis */}
            <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-[#9CA3AF]">
              <span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span><span>May 19</span><span>May 20</span><span>May 21</span>
            </div>
          </div>
        </div>

        {/* Top Equipment at Risk */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#F3F4F6]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Top Equipment at Risk</h2>
            <button className="text-[12px] font-medium text-[#FF6B2C] hover:text-[#FF824E] transition-colors">View all</button>
          </div>
          <div className="space-y-4">
            {equipmentRisk.map((eq) => (
              <div key={eq.name} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9FAFB]">
                  <Wrench className="h-4 w-4 text-[#6B7280]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#111827]">{eq.name}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{eq.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold text-white", eq.levelColor)}>
                    {eq.level}
                  </span>
                  <span className="text-[11px] text-[#6B7280]">{eq.risk}% risk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
