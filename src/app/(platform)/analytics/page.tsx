"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/cards/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Clock, Wrench, FileText, Bot } from "lucide-react";

const kpis = [
  { title: "Equipment Uptime", value: "94.2%", change: 2.1, changeLabel: "vs last month", icon: TrendingUp },
  { title: "Avg Downtime", value: "4.8 hrs", change: -15, changeLabel: "reduced", icon: Clock },
  { title: "Maintenance Tasks", value: "28", change: 8, changeLabel: "this month", icon: Wrench },
  { title: "Documents Processed", value: "156", change: 32, changeLabel: "this week", icon: FileText },
  { title: "AI Queries", value: "1,247", change: 18, changeLabel: "vs last week", icon: Bot },
  { title: "Compliance Score", value: "82%", change: 4, changeLabel: "improvement", icon: BarChart3 },
];

// Placeholder chart data
const chartPlaceholder = (label: string) => (
  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
    <div className="text-center">
      <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50" />
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">Recharts integration ready</p>
    </div>
  </div>
);

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics, usage statistics, and operational insights.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard key={kpi.title} {...kpi} />
        ))}
      </div>

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
              <CardContent>{chartPlaceholder("Pie chart — operational vs maintenance vs critical")}</CardContent>
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
              <CardContent>{chartPlaceholder("Area chart — queries per day")}</CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Query Categories</CardTitle></CardHeader>
              <CardContent>{chartPlaceholder("Radar chart — equipment, compliance, maintenance, docs")}</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
