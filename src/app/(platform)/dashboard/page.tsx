"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardMetrics, fetchHealthTrend, fetchDocsByType,
  fetchActionableInsights,
} from "@/services/api/analytics";
import { fetchPipelineJobs } from "@/services/api/pipeline";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/hooks/use-auth-store";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/chart-card";
import { ActionableInsightCard } from "@/components/shared/actionable-insight-card";
import { KPISkeleton, Shimmer } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Wrench, FileText, AlertTriangle, Bot,
  TrendingUp, TrendingDown,
  CheckCircle2, Clock, Loader2, RefreshCw, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Tooltip theme ─────────────────────────────────────────────────────────────
const tooltipStyle = {
  background: "#fff",
  border: "1px solid #F3F4F6",
  borderRadius: "12px",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
};

const CHART_COLORS = ["#FF6B2C", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899"];

// ── Recent activity from pipeline ────────────────────────────────────────────
function ActivityDot({ status }: { status: string }) {
  const color =
    status === "INDEXED"   ? "bg-emerald-500" :
    status === "PROCESSING"|| status === "UPLOADED" ? "bg-amber-500" :
    status === "ERROR"     || status === "FAILED"   ? "bg-red-500"   :
    "bg-zinc-400";
  return <div className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", color)} />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const toast   = useToast();
  const { user } = useAuthStore();

  const { data: metrics,   isLoading: loadingMetrics,   isError: errMetrics,  refetch: refetchMetrics } = useQuery({
    queryKey: ["analytics"],
    queryFn:  fetchDashboardMetrics,
  });

  const { data: healthTrend = [], isLoading: loadingHealth } = useQuery({
    queryKey: ["analytics-health-trend"],
    queryFn:  () => fetchHealthTrend(30),
    enabled:  !!metrics,
  });

  const { data: docsByType = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["analytics-docs-type"],
    queryFn:  fetchDocsByType,
    enabled:  !!metrics,
  });

  const { data: insights = [], isLoading: loadingInsights } = useQuery({
    queryKey: ["insights"],
    queryFn:  fetchActionableInsights,
    staleTime: 60_000,
  });

  const { data: pipelineJobs = [] } = useQuery({
    queryKey: ["pipeline"],
    queryFn:  fetchPipelineJobs,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (errMetrics) toast.error("Failed to load dashboard metrics.");
  }, [errMetrics]); // eslint-disable-line react-hooks/exhaustive-deps

  // Greeting
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  // Derived KPIs
  const kpis = metrics ? [
    {
      title:     "Active Equipment",
      value:     String(metrics.equipment.total),
      trend:     metrics.equipment.critical > 0 ? "down" : "up",
      trendVal:  metrics.equipment.operational,
      label:     `${metrics.equipment.operational} operational`,
      icon:      Wrench,
      iconBg:    "bg-[#FFF2EB]",
      iconColor: "text-[#FF6B2C]",
    },
    {
      title:     "Documents Indexed",
      value:     metrics.documents.indexed.toLocaleString(),
      trend:     "up",
      trendVal:  metrics.documents.processing,
      label:     `${metrics.documents.processing} processing`,
      icon:      FileText,
      iconBg:    "bg-[#EFF6FF]",
      iconColor: "text-[#3B82F6]",
    },
    {
      title:     "Open Incidents",
      value:     String(metrics.incidents.open + metrics.incidents.investigating),
      trend:     metrics.incidents.open > 0 ? "down" : "up",
      trendVal:  metrics.incidents.resolved,
      label:     `${metrics.incidents.resolved} resolved`,
      icon:      AlertTriangle,
      iconBg:    metrics.incidents.open > 0 ? "bg-[#FEF2F2]" : "bg-[#F0FDF4]",
      iconColor: metrics.incidents.open > 0 ? "text-[#EF4444]" : "text-[#22C55E]",
    },
    {
      title:     "AI Queries Today",
      value:     String(metrics.ai.queriesToday),
      trend:     "up",
      trendVal:  metrics.ai.queriesTotal,
      label:     `${metrics.ai.queriesTotal.toLocaleString()} total`,
      icon:      Bot,
      iconBg:    "bg-[#F5F3FF]",
      iconColor: "text-[#8B5CF6]",
    },
  ] : [];

  // Maintenance donut data
  const maintTotal = Math.max(1, metrics?.maintenance.total ?? 1);
  const maintData  = metrics ? [
    { name: "Overdue",    value: metrics.maintenance.overdue,   color: "#EF4444" },
    { name: "Due Soon",   value: metrics.maintenance.dueSoon,   color: "#F59E0B" },
    { name: "Completed",  value: metrics.maintenance.completed, color: "#22C55E" },
    {
      name: "Scheduled",
      value: Math.max(0, metrics.maintenance.total - metrics.maintenance.overdue - metrics.maintenance.dueSoon - metrics.maintenance.completed),
      color: "#94A3B8",
    },
  ].filter(d => d.value > 0) : [];

  // Recent activity from pipeline docs
  const recentActivity = pipelineJobs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <PageHeader
        title={`${greeting}, ${firstName} 👋`}
        subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        action={
          <button
            onClick={() => refetchMetrics()}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      {loadingMetrics ? (
        <KPISkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
          {kpis.map((kpi, i) => (
            <StatCard
              key={kpi.title}
              label={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              iconBg={kpi.iconBg}
              iconColor={kpi.iconColor}
              className={`transition-delay-[${i * 50}ms]`}
              sub={
                <div className="flex items-center gap-1.5">
                  {kpi.trend === "up"
                    ? <TrendingUp  className="h-3.5 w-3.5 text-[#22C55E]" />
                    : <TrendingDown className="h-3.5 w-3.5 text-[#EF4444]" />}
                  <span className="text-[12px] text-[#9CA3AF]">{kpi.label}</span>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* ── Actionable Insights ───────────────────────────────────────────── */}
      {!loadingInsights && insights.length > 0 && (
        <div className="rounded-[20px] border border-[#F3F4F6] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-[#111827]">Actionable Insights</h2>
            <span className="text-[11px] text-zinc-400">Based on live data</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {insights.map((ins) => (
              <ActionableInsightCard
                key={ins.id}
                icon={
                  ins.variant === "danger"  ? AlertTriangle :
                  ins.variant === "warning" ? Clock         :
                  ins.variant === "success" ? CheckCircle2  : Bot
                }
                title={ins.title}
                description={ins.description}
                href={ins.href}
                variant={ins.variant}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Charts Row 1: Health Trend + Docs by Type ─────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Equipment Health Trend (30 days)"
          loading={loadingHealth}
          height={220}
          action={
            <Link href="/analytics" className="flex items-center gap-1 text-[12px] text-[#FF6B2C] hover:text-[#FF824E] font-medium">
              Full report <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={healthTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF6B2C" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#FF6B2C" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9CA3AF" }} unit="%" />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`, "Health"]}
                labelFormatter={(l: unknown) => `Date: ${l}`}
              />
              <Area
                type="monotone" dataKey="value" stroke="#FF6B2C" strokeWidth={2}
                fill="url(#healthGradient)" dot={false} activeDot={{ r: 4, fill: "#FF6B2C" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Documents by Type"
          loading={loadingDocs}
          height={220}
          action={
            <Link href="/documents" className="flex items-center gap-1 text-[12px] text-[#FF6B2C] hover:text-[#FF824E] font-medium">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {docsByType.length === 0 ? (
            <div className="flex h-full items-center justify-center flex-col gap-2 text-center">
              <FileText className="h-8 w-8 text-zinc-200" />
              <p className="text-[12px] text-zinc-400">No documents yet. Upload to get started.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docsByType} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1200}>
                  {docsByType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2: Maintenance Donut + Activity + Compliance ─────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Maintenance donut */}
        <ChartCard
          title="Maintenance Status"
          loading={loadingMetrics}
          height={200}
          action={
            <Link href="/maintenance" className="text-[12px] text-[#FF6B2C] hover:text-[#FF824E] font-medium">
              Manage
            </Link>
          }
        >
          {maintData.length === 0 ? (
            <div className="flex h-full items-center justify-center flex-col gap-2">
              <Wrench className="h-8 w-8 text-zinc-200" />
              <p className="text-[12px] text-zinc-400">No maintenance records</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 h-full">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={maintData} dataKey="value" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80} paddingAngle={3}
                  >
                    {maintData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                <div className="text-center mb-2">
                  <p className="text-[24px] font-bold text-zinc-900">{metrics?.maintenance.total}</p>
                  <p className="text-[10px] text-zinc-400">Total tasks</p>
                </div>
                {maintData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-[11px] text-zinc-500 flex-1">{d.name}</span>
                    <span className="text-[11px] font-bold text-zinc-700">
                      {d.value} ({Math.round((d.value / maintTotal) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Recent activity */}
        <div className="rounded-[20px] bg-white p-6 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-[#111827]">Recent Activity</h2>
            <Link href="/pipeline" className="text-[12px] font-medium text-[#FF6B2C] hover:text-[#FF824E]">
              Pipeline →
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Loader2 className="h-6 w-6 text-zinc-200 animate-spin" />
              <p className="text-[12px] text-zinc-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((doc) => (
                <div key={doc.id} className="flex items-start gap-3">
                  <ActivityDot status={doc.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-zinc-800 truncate">{doc.title}</p>
                    <p className="text-[11px] text-zinc-400">
                      {doc.status === "INDEXED"   ? "Fully indexed" :
                       doc.status === "PROCESSING" ? "Processing…"  :
                       doc.status === "ERROR"      ? "Failed"       :
                       "Uploaded"}
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0">
                    {timeAgo(doc.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance + AI summary */}
        <div className="rounded-[20px] bg-white p-6 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-[#111827]">System Summary</h2>
            <Link href="/analytics" className="text-[12px] font-medium text-[#FF6B2C] hover:text-[#FF824E]">
              Analytics →
            </Link>
          </div>
          {loadingMetrics ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <Shimmer key={i} className="h-10 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: "Compliance Score",
                  value: `${metrics?.compliance.overallScore ?? 0}%`,
                  sub:   `${metrics?.compliance.compliant ?? 0} compliant · ${metrics?.compliance.expiring ?? 0} expiring`,
                  color: (metrics?.compliance.overallScore ?? 0) >= 70 ? "text-emerald-600" : "text-amber-600",
                  href:  "/compliance",
                },
                {
                  label: "Avg AI Confidence",
                  value: `${Math.round((metrics?.ai.avgConfidence ?? 0) * 100)}%`,
                  sub:   `${metrics?.ai.queriesToday ?? 0} queries today`,
                  color: "text-purple-600",
                  href:  "/copilot",
                },
                {
                  label: "Equipment Health",
                  value: `${metrics?.equipment.averageHealth ?? 0}%`,
                  sub:   `${metrics?.equipment.critical ?? 0} critical · ${metrics?.equipment.operational ?? 0} operational`,
                  color: (metrics?.equipment.averageHealth ?? 0) >= 70 ? "text-emerald-600" : "text-red-600",
                  href:  "/equipment",
                },
                {
                  label: "Knowledge Base",
                  value: `${metrics?.documents.indexed ?? 0} docs`,
                  sub:   `${metrics?.documents.processing ?? 0} still processing`,
                  color: "text-blue-600",
                  href:  "/documents",
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-2.5 hover:border-zinc-200 hover:bg-zinc-50 transition-all"
                >
                  <div>
                    <p className="text-[12px] font-semibold text-zinc-700">{item.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.sub}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[15px] font-bold", item.color)}>{item.value}</span>
                    <ArrowRight className="h-3 w-3 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
