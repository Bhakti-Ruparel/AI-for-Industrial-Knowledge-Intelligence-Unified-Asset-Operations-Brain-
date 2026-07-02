"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle2, Clock, AlertTriangle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaintenanceTask } from "@/types";

const mockTasks: MaintenanceTask[] = [
  { id: "1", equipmentId: "1", equipmentName: "CVM-850 #1", type: "preventive", priority: "medium", status: "scheduled", scheduledDate: "2026-07-15", assignee: "Rajesh Kumar", description: "Quarterly spindle inspection and lubrication", checklist: [{ id: "1", label: "Check spindle bearings", completed: false }, { id: "2", label: "Lubricate linear guides", completed: false }] },
  { id: "2", equipmentId: "4", equipmentName: "SURFGRIND-600", type: "corrective", priority: "critical", status: "overdue", scheduledDate: "2026-06-10", assignee: "Amit Patel", description: "Wheel dresser replacement - grinding quality degraded", checklist: [{ id: "1", label: "Replace wheel dresser", completed: false }, { id: "2", label: "Calibrate surface finish", completed: false }] },
  { id: "3", equipmentId: "2", equipmentName: "DYNAMILL-1200", type: "preventive", priority: "high", status: "in_progress", scheduledDate: "2026-07-01", assignee: "Suresh Mehta", description: "Coolant system flush and filter replacement", checklist: [{ id: "1", label: "Drain coolant", completed: true }, { id: "2", label: "Replace filters", completed: true }, { id: "3", label: "Refill coolant", completed: false }] },
  { id: "4", equipmentId: "3", equipmentName: "V-TURN 1200", type: "predictive", priority: "low", status: "scheduled", scheduledDate: "2026-07-20", assignee: "Vikram Singh", description: "Vibration analysis indicates potential turret issue", checklist: [{ id: "1", label: "Run vibration diagnostics", completed: false }] },
  { id: "5", equipmentId: "5", equipmentName: "UNIMILL-500", type: "preventive", priority: "medium", status: "completed", scheduledDate: "2026-06-25", completedDate: "2026-06-25", assignee: "Rajesh Kumar", description: "Monthly 5-axis calibration check", checklist: [{ id: "1", label: "Calibrate A-axis", completed: true }, { id: "2", label: "Calibrate C-axis", completed: true }] },
];

const priorityConfig = {
  low: { color: "text-blue-500", bg: "bg-blue-500/10" },
  medium: { color: "text-amber-500", bg: "bg-amber-500/10" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10" },
  critical: { color: "text-red-500", bg: "bg-red-500/10" },
};

const statusConfig = {
  scheduled: { icon: Calendar, color: "text-blue-500" },
  in_progress: { icon: Clock, color: "text-amber-500" },
  completed: { icon: CheckCircle2, color: "text-emerald-500" },
  overdue: { icon: AlertTriangle, color: "text-red-500" },
};

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">Schedule, track, and manage equipment maintenance.</p>
        </div>
        <div className="flex gap-3">
          <Card className="border-border/50 bg-card/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">1 Overdue</span>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {mockTasks.map((task) => {
            const priority = priorityConfig[task.priority];
            const status = statusConfig[task.status];
            const StatusIcon = status.icon;
            const completedItems = task.checklist.filter(c => c.completed).length;

            return (
              <Card key={task.id} className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", priority.bg)}>
                      <Wrench className={cn("h-5 w-5", priority.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{task.equipmentName}</h3>
                        <Badge variant="outline" className="text-[10px]">{task.type}</Badge>
                        <Badge className={cn("text-[10px]", priority.bg, priority.color)} variant="secondary">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <StatusIcon className={cn("h-3 w-3", status.color)} />
                          <span className={cn("text-xs font-medium", status.color)}>{task.status.replace("_", " ")}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Due: {task.scheduledDate}</span>
                        <span className="text-xs text-muted-foreground">Assignee: {task.assignee}</span>
                      </div>
                      {/* Checklist progress */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Checklist</span>
                          <span className="text-[10px] text-muted-foreground">{completedItems}/{task.checklist.length}</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted">
                          <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${(completedItems / task.checklist.length) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          <p className="text-sm text-muted-foreground">Filtered view for overdue tasks.</p>
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4">
          <p className="text-sm text-muted-foreground">Filtered view for scheduled tasks.</p>
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          <p className="text-sm text-muted-foreground">Filtered view for in-progress tasks.</p>
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <p className="text-sm text-muted-foreground">Filtered view for completed tasks.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
