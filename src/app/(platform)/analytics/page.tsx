"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/services/api/analytics";
import { KPISkeleton, ErrorState, Shimmer } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Clock, Wrench, FileText, Bot, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const chartPlaceholder = (label: string) => (
  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
    <div className="text-center">
      <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50" />
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">Recharts integration — Phase 2</p>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const toast = useToast();

  const { data: metrics, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchDashboardMetrics,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load analytics");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const kpis = metrics
    ? [
        {
          title: "Equipment Uptime",
          value: `${metrics.equipment.averageHealth}%`,
          change: 2.1,
          positive: true,
          changeLabel: "vs last month",
          icon: TrendingUp,
        },
        {
          title: "Avg Downtime",
          value: `${metrics.incidents.mttr} hrs`,
          change: -15,
          positive: false,
          changeLabel: "reduced",
          icon: Clock,
        },
        {
          title: "Maintenance Tasks",
          value: String(metrics.maintenance.total),
          change: 8,
          positive: true,
          changeLabel: "this month",
          icon: Wrench,
        },
        {
          title: "Documents Processed",
          value: metrics.documents.indexed.toLocaleString(),
          change: 32,
          positive: true,
          changeLabel: "this week",
          icon: FileText,
        },
        {
          title: "AI Queries",
          value: metrics.ai.queriesToday.toLocaleString(),
          change: 18,
          positive: true,
          changeLabel: "vs last week",
          icon: Bot,
        },
        {
          title: "Compliance Score",
          value: `${metrics.compliance.overallScore}%`,
          change: 4,
          positive: true,
          changeLabel: "improvement",
          icon: BarChart3,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics, usage statistics, and operational insights.</p>
      </div>

      {isError && <ErrorState message="Failed to load analytics data." onRetry={refetch} />}

      {/* KPIs */}
      {isLoading ? (
        <KPISkeleton count={6} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{kpi.value}</p>
                    <div className="mt-2 flex items-center gap-1">
                      {kpi.positive ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={cn("text-xs font-medium", kpi.positive ? "text-emerald-500" : "text-red-500")}>
                        {kpi.change > 0 ? "+" : ""}{kpi.change}%
                      </span>
                      <span className="text-xs text-muted-foreground">{kpi.changeLabel}</span>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <kpi.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Live summary strip */}
      {!isLoading && metrics && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Critical Equipment", value: metrics.equipment.critical, accent: "text-red-600" },
            { label: "Open Incidents",     value: metrics.incidents.open,     accent: "text-amber-600" },
            { label: "Non-Compliant",      value: metrics.compliance.nonCompliant, accent: "text-orange-600" },
            { label: "Docs Processing",    value: metrics.documents.processing, accent: "text-blue-600" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-zinc-100 bg-white p-4 text-center shadow-xs">
              <p className={cn("text-2xl font-bold", item.accent)}>{item.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Shimmer key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="equipment">
        <TabsList>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="downtime">Downtime</TabsTrigger>
          <TabsTrigger value="usage">AI Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Equipment Health Over Time</CardTitle></CardHeader>
              <CardContent>{chartPlaceholder("Line chart — health scores by week")}</CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {!isLoading && metrics ? (
                  <div className="flex h-48 items-center justify-center gap-6">
                    {[
                      { label: "Operational", value: metrics.equipment.operational, color: "bg-emerald-500" },
                      { label: "Critical",     value: metrics.equipment.critical,    color: "bg-red-500"     },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className={cn("mx-auto h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold", item.color)}>
                          {item.value}
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                ) : chartPlaceholder("Pie chart — operational vs maintenance vs critical")}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Documents Processed</CardTitle></CardHeader>
              <CardContent>{chartPlaceholder("Bar chart — documents per day")}</CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Document Types</CardTitle></CardHeader>
              <CardContent>{chartPlaceholder("Donut chart — manuals, reports, SOPs, regulations")}</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="downtime" className="mt-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Downtime by Equipment</CardTitle></CardHeader>
            <CardContent>{chartPlaceholder("Stacked bar chart — downtime hours by machine per week")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">AI Query Volume</CardTitle></CardHeader>
              <CardContent>
                {!isLoading && metrics ? (
                  <div className="flex h-48 items-center justify-center flex-col gap-2">
                    <p className="text-5xl font-bold text-zinc-900">{metrics.ai.queriesToday}</p>
                    <p className="text-sm text-zinc-400">Queries today</p>
                    <p className="text-xs text-zinc-300">Total: {metrics.ai.queriesTotal.toLocaleString()}</p>
                  </div>
                ) : chartPlaceholder("Area chart — queries per day")}
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Confidence</CardTitle></CardHeader>
              <CardContent>
                {!isLoading && metrics ? (
                  <div className="flex h-48 items-center justify-center flex-col gap-2">
                    <p className="text-5xl font-bold text-emerald-600">{Math.round(metrics.ai.avgConfidence * 100)}%</p>
                    <p className="text-sm text-zinc-400">Average AI confidence</p>
                  </div>
                ) : chartPlaceholder("Confidence score over time")}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
