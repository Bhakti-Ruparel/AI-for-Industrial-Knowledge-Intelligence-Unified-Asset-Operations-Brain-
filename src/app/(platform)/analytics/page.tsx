"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardMetrics, fetchHealthTrend, fetchIncidentTrend,
  fetchDocsByType, fetchMaintenanceCost,
} from "@/services/api/analytics";
import { useToast } from "@/components/ui/toast";
import { KPISkeleton, ErrorState, Shimmer } from "@/components/ui/page-skeleton";
import { ChartCard } from "@/components/shared/chart-card";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, BarChart3, Clock,
  Wrench, FileText, Bot, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// â”€â”€ Theme & Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const tooltipStyle = {
  background: "#fff",
  border: "1px solid #F3F4F6",
  borderRadius: "14px",
  fontSize: 12,
  padding: "10px 14px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};

const CHART_COLORS = [
  "#FF6B2C", "#3B82F6", "#22C55E",
  "#F59E0B", "#8B5CF6", "#EC4899",
];

// â”€â”€ KPI card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  positive: boolean;
  changeLabel: string;
  icon: typeof BarChart3;
}

function KpiCard({
  title, value, change, positive, changeLabel, icon: Icon,
}: KpiCardProps) {
  return (
    <div className="rounded-[20px] bg-white p-6 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-zinc-500 font-medium">{title}</p>
          <p className="mt-2.5 text-[30px] font-bold tracking-tight text-zinc-900 tabular-nums leading-none">
            {value}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            {positive
              ? <TrendingUp  className="h-3.5 w-3.5 text-emerald-500" />
              : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
            <span className={cn("text-[12px] font-semibold tabular-nums", positive ? "text-emerald-600" : "text-red-500")}>
              {change}
            </span>
            <span className="text-[12px] text-zinc-400">{changeLabel}</span>
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF2EB] shadow-[0_1px_3px_rgba(255,107,44,0.15)]">
          <Icon className="h-5 w-5 text-[#FF6B2C]" />
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Gauge ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GaugeRing({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct   = Math.min(Math.max(0, value) / max, 1);
  const color =
    pct >= 0.7  ? "#22C55E" :
    pct >= 0.5  ? "#F59E0B" :
    "#EF4444";
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - pct * 251.2}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-[28px] font-bold text-zinc-900 tabular-nums leading-none">{value}</p>
          {label && <p className="text-[10px] text-zinc-400 mt-1 font-medium">{label}</p>}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AnalyticsPage() {
  const toast = useToast();

  const { data: metrics, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics"],
    queryFn:  fetchDashboardMetrics,
  });

  const { data: healthTrend   = [], isLoading: lHealth   } = useQuery({ queryKey: ["analytics-health-trend"],   queryFn: () => fetchHealthTrend(30),    enabled: !!metrics });
  const { data: incidentTrend = [], isLoading: lIncident } = useQuery({ queryKey: ["analytics-incident-trend"], queryFn: () => fetchIncidentTrend(30),  enabled: !!metrics });
  const { data: docsByType    = [], isLoading: lDocs      } = useQuery({ queryKey: ["analytics-docs-type"],      queryFn: fetchDocsByType,               enabled: !!metrics });
  const { data: maintCost     = [], isLoading: lCost      } = useQuery({ queryKey: ["analytics-maint-cost"],     queryFn: () => fetchMaintenanceCost(6), enabled: !!metrics });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load analytics");
    }
  }, [isError, toast]);

  const kpis = metrics ? [
    {
      title:       "Equipment Uptime",
      value:       `${metrics.equipment.averageHealth}%`,
      change:      metrics.equipment.critical > 0 ? -metrics.equipment.critical : metrics.equipment.operational,
      positive:    metrics.equipment.critical === 0,
      changeLabel: metrics.equipment.critical > 0
        ? `${metrics.equipment.critical} critical`
        : `${metrics.equipment.operational} operational`,
      icon: TrendingUp,
    },
    {
      title:       "Avg Resolution Time",
      value:       metrics.incidents.mttr > 0 ? `${metrics.incidents.mttr} hrs` : "â€”",
      change:      metrics.incidents.resolved,
      positive:    true,
      changeLabel: `${metrics.incidents.resolved} resolved`,
      icon: Clock,
    },
    {
      title:       "Maintenance Tasks",
      value:       String(metrics.maintenance.total),
      change:      metrics.maintenance.overdue,
      positive:    metrics.maintenance.overdue === 0,
      changeLabel: metrics.maintenance.overdue > 0
        ? `${metrics.maintenance.overdue} overdue`
        : `${metrics.maintenance.completed} completed`,
      icon: Wrench,
    },
    { title: "Docs Processed",   value: metrics.documents.indexed.toLocaleString(),  change: metrics.documents.processing, positive: metrics.documents.processing === 0, changeLabel: metrics.documents.processing > 0 ? `${metrics.documents.processing} processing` : `of ${metrics.documents.total} total`, icon: FileText },
    { title: "AI Queries Today", value: metrics.ai.queriesToday.toLocaleString(),    change: metrics.ai.queriesTotal,              positive: true,                              changeLabel: `${metrics.ai.queriesTotal.toLocaleString()} total`,                                           icon: Bot      },
    { title: "Compliance Score", value: `${metrics.compliance.overallScore}%`,       change: metrics.compliance.nonCompliant,      positive: metrics.compliance.nonCompliant === 0, changeLabel: metrics.compliance.nonCompliant > 0 ? `${metrics.compliance.nonCompliant} violations` : `${metrics.compliance.compliant} compliant`, icon: Shield },
  ] : [];

  const complianceData = metrics ? [
    { name: "Compliant",     value: metrics.compliance.compliant,    color: "#22C55E" },
    { name: "Non-Compliant", value: metrics.compliance.nonCompliant, color: "#EF4444" },
    { name: "Expiring",      value: metrics.compliance.expiring,     color: "#F59E0B" },
  ].filter((d) => d.value > 0) : [];

  // Protect calculations against unexpected zero limits
  const queriesTotal = metrics?.ai?.queriesTotal ?? 0;
  const queriesToday = metrics?.ai?.queriesToday ?? 0;
  const fillPercentage = queriesTotal > 0 ? Math.min(100, (queriesToday / queriesTotal) * 100 * 30) : 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto overflow-hidden">
      <PageHeader
        title="Analytics"
        subtitle="Performance metrics, usage statistics, and operational intelligence."
      />

      {isError && <ErrorState message="Failed to load analytics data." onRetry={refetch} />}

      {/* KPI grid */}
      {isLoading ? (
        <KPISkeleton count={6} />
      ) : (
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => <KpiCard key={kpi.title} {...kpi} />)}
        </div>
      )}

      {/* Alert strip */}
      {!isLoading && metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Critical Equipment",  value: metrics.equipment.critical,      accent: "text-red-600",    bg: "bg-red-50/70 border-red-100"       },
            { label: "Open Incidents",       value: metrics.incidents.open,          accent: "text-amber-600",  bg: "bg-amber-50/70 border-amber-100"   },
            { label: "Non-Compliant",        value: metrics.compliance.nonCompliant, accent: "text-orange-600", bg: "bg-orange-50/70 border-orange-100" },
            { label: "Docs Processing",      value: metrics.documents.processing,    accent: "text-blue-600",   bg: "bg-blue-50/70 border-blue-100"     },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-2xl border p-4 text-center", item.bg)}>
              <p className={cn("text-2xl font-bold tabular-nums", item.accent)}>{item.value}</p>
              <p className="text-[11px] text-zinc-500 mt-1 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Shimmer key={i} className="h-20 rounded-2xl" />)}
        </div>
      )}

      {/* Tabbed charts */}
      <Tabs defaultValue="equipment" className="space-y-5">
        <TabsList className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 p-1 h-auto gap-1 flex-wrap justify-start">
          {["equipment", "documents", "maintenance", "incidents", "compliance", "ai"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-lg px-4 py-1.5 text-[12px] font-semibold capitalize data-[state=active]:bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08)] data-[state=active]:text-[#FF6B2C] transition-all"
            >
              {tab === "ai" ? "AI Usage" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* â”€â”€ Equipment â”€â”€ */}
        <TabsContent value="equipment" className="space-y-5">
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
            <ChartCard title="Equipment Health Trend (30 days)" subtitle="Average health score across all machines" loading={lHealth} height={240}>
              {healthTrend.length === 0 || healthTrend.every((d) => d.value === 0) ? (
                <div className="flex h-full items-center justify-center flex-col gap-2 text-center">
                  <TrendingUp className="h-8 w-8 text-zinc-200" />
                  <p className="text-[12px] text-zinc-400">Add equipment to see health trends.</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF6B2C" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#FF6B2C" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v: string) => v.slice(5)} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9CA3AF" }} unit="%" />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    formatter={(v: unknown) => [typeof v === "number" ? `${v.toFixed(1)}%` : "â€”", "Health"]} 
                  />
                  <Area type="monotone" dataKey="value" stroke="#FF6B2C" strokeWidth={2} fill="url(#hGrad)" dot={false} activeDot={{ r: 4, fill: "#FF6B2C" }} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Status Distribution" loading={isLoading} height={240}>
              {metrics && metrics.equipment.total === 0 ? (
                <div className="flex h-full items-center justify-center flex-col gap-2 text-center">
                  <Wrench className="h-8 w-8 text-zinc-200" />
                  <p className="text-[12px] text-zinc-400">No equipment registered yet.</p>
                </div>
              ) : metrics && (
                <div className="flex items-center justify-center gap-6 sm:gap-10 h-full flex-wrap">
                  {[
                    { label: "Operational",  value: metrics.equipment.operational, color: "#22C55E" },
                    { label: "Maintenance",  value: Math.max(0, metrics.equipment.total - metrics.equipment.operational - metrics.equipment.critical), color: "#F59E0B" },
                    { label: "Critical",     value: metrics.equipment.critical,    color: "#EF4444" },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full text-white text-lg sm:text-xl font-bold shadow-[0_4px_12px_rgba(0,0,0,0.15)]" style={{ background: item.color }}>
                        {Math.max(0, item.value)}
                      </div>
                      <p className="mt-2.5 text-[11px] text-zinc-500 font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* â”€â”€ Documents â”€â”€ */}
        <TabsContent value="documents" className="space-y-5">
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
            <ChartCard title="Documents by Type" loading={lDocs} height={260}>
              {docsByType.length === 0 ? (
                <div className="flex h-full items-center justify-center flex-col gap-2 text-center">
                  <FileText className="h-8 w-8 text-zinc-200" />
                  <p className="text-[12px] text-zinc-400">Upload documents to see type breakdown.</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={docsByType} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Count" radius={[5, 5, 0, 0]} animationDuration={1200}>
                    {docsByType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Index Status" loading={isLoading} height={260}>
              {metrics && metrics.documents.total === 0 ? (
                <div className="flex h-full items-center justify-center flex-col gap-2 text-center">
                  <FileText className="h-8 w-8 text-zinc-200" />
                  <p className="text-[12px] text-zinc-400">No documents uploaded yet.</p>
                </div>
              ) : metrics && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Indexed",    value: metrics.documents.indexed,   fill: "#22C55E" },
                        { name: "Processing", value: metrics.documents.processing, fill: "#F59E0B" },
                        { name: "Other",      value: Math.max(0, metrics.documents.total - metrics.documents.indexed - metrics.documents.processing), fill: "#94A3B8" },
                      ].filter((d) => d.value > 0)}
                      dataKey="value" cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90} paddingAngle={3}
                      animationDuration={1200}
                    >
                      {[{ fill: "#22C55E" }, { fill: "#F59E0B" }, { fill: "#94A3B8" }].map((c, i) => (
                        <Cell key={i} fill={c.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* â”€â”€ Maintenance â”€â”€ */}
        <TabsContent value="maintenance" className="space-y-5">
          <ChartCard title="Maintenance Cost by Type (6 months)" subtitle="Breakdown of preventive, corrective, and predictive costs" loading={lCost} height={300}>
            {maintCost.every((d) => d.preventive === 0 && d.corrective === 0 && d.predictive === 0) ? (
              <div className="flex h-full items-center justify-center flex-col gap-2 text-center">
                <Wrench className="h-8 w-8 text-zinc-200" />
                <p className="text-[12px] text-zinc-400">No maintenance cost data yet. Complete maintenance tasks with cost entries to populate this chart.</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintCost} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v: number) => v > 0 ? `â‚¹${(v / 1000).toFixed(0)}k` : "0"} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [typeof v === "number" ? `â‚¹${v.toLocaleString("en-IN")}` : "â€”", ""]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="preventive" name="Preventive" stackId="a" fill="#22C55E" />
                <Bar dataKey="corrective" name="Corrective"  stackId="a" fill="#EF4444" />
                <Bar dataKey="predictive" name="Predictive"  stackId="a" fill="#3B82F6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>

        {/* â”€â”€ Incidents â”€â”€ */}
        <TabsContent value="incidents" className="space-y-5">
          <ChartCard title="Incident Trend (30 days)" subtitle="Daily incident count over the past month" loading={lIncident} height={300}>
            {incidentTrend.every((d) => d.value === 0) ? (
              <div className="flex h-full items-center justify-center flex-col gap-2 text-center">
                <TrendingDown className="h-8 w-8 text-zinc-200" />
                <p className="text-[12px] text-zinc-400">No incidents reported in the last 30 days.</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="iGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v: string) => v.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" name="Incidents" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3, fill: "#EF4444" }} activeDot={{ r: 5 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>

        {/* â”€â”€ Compliance â”€â”€ */}
        <TabsContent value="compliance" className="space-y-5">
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
            <ChartCard title="Compliance Status" loading={isLoading} height={280}>
              {metrics && complianceData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={complianceData} dataKey="value" cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} animationDuration={1200}>
                      {complianceData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {metrics && complianceData.length === 0 && (
                <div className="flex h-full items-center justify-center flex-col gap-2 text-center">
                  <Shield className="h-8 w-8 text-zinc-200" />
                  <p className="text-[12px] text-zinc-400">Add compliance records to see status breakdown.</p>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Overall Compliance Score" loading={isLoading} height={280}>
              {metrics && (
                <>
                  <GaugeRing value={metrics.compliance.overallScore} label="Score" />
                  <p className="text-center text-[12px] text-zinc-500 mt-2">
                    {metrics.compliance.compliant} compliant Â· {metrics.compliance.nonCompliant} violations Â· {metrics.compliance.expiring} expiring
                  </p>
                </>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* â”€â”€ AI Usage â”€â”€ */}
        <TabsContent value="ai" className="space-y-5">
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
            <ChartCard title="AI Query Volume" subtitle="Queries today vs. all-time" loading={isLoading} height={280}>
              {metrics && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="text-center">
                    <p className="text-[52px] font-bold text-zinc-900 tabular-nums leading-none">{queriesToday}</p>
                    <p className="text-[13px] text-zinc-400 mt-2 font-medium">Queries today</p>
                  </div>
                  <div className="w-full max-w-xs space-y-1.5">
                    <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                      <span>Daily usage</span>
                      <span className="font-bold text-zinc-700">{queriesTotal.toLocaleString()} total</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF6B2C] transition-all duration-700"
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Average AI Confidence" subtitle="Based on all-time query results" loading={isLoading} height={280}>
              {metrics && (
                <>
                  <GaugeRing value={Math.round(metrics.ai.avgConfidence * 100)} label="Avg Conf." />
                  <p className="text-center text-[12px] text-zinc-500 mt-2">
                    Based on {queriesTotal.toLocaleString()} queries
                  </p>
                </>
              )}
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}