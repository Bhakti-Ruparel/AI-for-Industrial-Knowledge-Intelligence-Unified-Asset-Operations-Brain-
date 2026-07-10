"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, CheckCircle2, Clock, AlertTriangle, 
  Wrench, ArrowUpRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  scheduledDate: string;
  completedDate?: string;
  assignee: string;
  description: string;
  checklist: ChecklistItem[];
}

const initialTasks: MaintenanceTask[] = [
  { id: "1", equipmentId: "1", equipmentName: "CVM-850 #1", type: "preventive", priority: "medium", status: "scheduled", scheduledDate: "2026-07-15", assignee: "Rajesh Kumar", description: "Quarterly spindle inspection and lubrication", checklist: [{ id: "1", label: "Check spindle bearings", completed: false }, { id: "2", label: "Lubricate linear guides", completed: false }] },
  { id: "2", equipmentId: "4", equipmentName: "SURFGRIND-600", type: "corrective", priority: "critical", status: "overdue", scheduledDate: "2026-06-10", assignee: "Amit Patel", description: "Wheel dresser replacement - grinding quality degraded", checklist: [{ id: "1", label: "Replace wheel dresser", completed: false }, { id: "2", label: "Calibrate surface finish", completed: false }] },
  { id: "3", equipmentId: "2", equipmentName: "DYNAMILL-1200", type: "preventive", priority: "high", status: "in_progress", scheduledDate: "2026-07-01", assignee: "Suresh Mehta", description: "Coolant system flush and filter replacement", checklist: [{ id: "1", label: "Drain coolant", completed: true }, { id: "2", label: "Replace filters", completed: true }, { id: "3", label: "Refill coolant", completed: false }] },
  { id: "4", equipmentId: "3", equipmentName: "V-TURN 1200", type: "predictive", priority: "low", status: "scheduled", scheduledDate: "2026-07-20", assignee: "Vikram Singh", description: "Vibration analysis indicates potential turret issue", checklist: [{ id: "1", label: "Run vibration diagnostics", completed: false }] },
  { id: "5", equipmentId: "5", equipmentName: "UNIMILL-500", type: "preventive", priority: "medium", status: "completed", scheduledDate: "2026-06-25", completedDate: "2026-06-25", assignee: "Rajesh Kumar", description: "Monthly 5-axis calibration check", checklist: [{ id: "1", label: "Calibrate A-axis", completed: true }, { id: "2", label: "Calibrate C-axis", completed: true }] },
];

const priorityConfig = {
  low: { color: "text-blue-500", bg: "bg-blue-50/50" },
  medium: { color: "text-zinc-400", bg: "bg-zinc-50" },
  high: { color: "text-orange-500", bg: "bg-orange-50" },
  critical: { color: "text-red-500", bg: "bg-red-50" },
};

const statusConfig = {
  scheduled: { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 text-blue-600", text: "Scheduled" },
  in_progress: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 text-amber-600", text: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600", text: "Completed" },
  overdue: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 text-red-600", text: "Overdue" },
};

export default function MaintenancePage() {
  const [tasks] = useState<MaintenanceTask[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<string>("all");

  const overdueTasks = tasks.filter(t => t.status === "overdue");
  const filteredTasks = tasks.filter(task => activeTab === "all" || task.status === activeTab);

  return (
    <div className="space-y-6 p-6 font-sans antialiased max-w-[1400px] mx-auto text-zinc-900">
      
      {/* 1. Header Block */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Maintenance Dashboard</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Track machine health lifecycles and clear scheduled service pipelines.</p>
      </div>

      {/* 2. Top Critical Interventions Section */}
      {overdueTasks.map((task) => (
        <div key={`alert-${task.id}`} className="space-y-2">
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical Interventions Required</span>
          </div>
          
          <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-3xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-zinc-900">{task.equipmentName}</h4>
                  <span className="bg-red-600 text-white font-extrabold text-[8px] tracking-wider px-1.5 py-0.5 rounded-full uppercase">
                    Overdue
                  </span>
                </div>
                <p className="text-xs font-medium text-zinc-400 mt-0.5">{task.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-10 pr-2">
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Missed Target</p>
                <p className="text-xs font-bold text-red-600 mt-0.5">{task.scheduledDate}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Assignee</p>
                <p className="text-xs font-bold text-zinc-700 mt-0.5">{task.assignee}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 3. Horizontal Filter Row / Line */}
      <div className="flex items-center gap-1 border-b border-zinc-100 pb-3 mt-2">
        {["all", "scheduled", "in_progress", "completed"].map((tabKey) => {
          const count = tabKey === "all" ? tasks.length : tasks.filter(t => t.status === tabKey).length;
          const isSelected = activeTab === tabKey;
          
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all select-none whitespace-nowrap",
                isSelected 
                  ? "bg-zinc-900 text-white shadow-3xs" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              <span>{tabKey.replace("_", " ")}</span>
              <span className={cn(
                "px-1 py-0.2 text-[9px] rounded font-bold",
                isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Main Unified Horizontal Pipeline Stack */}
      <div className="space-y-2.5">
        {filteredTasks.map((task) => {
          const priority = priorityConfig[task.priority];
          const status = statusConfig[task.status];
          const StatusIcon = status.icon;
          const completedItems = task.checklist.filter(c => c.completed).length;
          const progressPercentage = (completedItems / task.checklist.length) * 100;

          return (
            <Card 
              key={task.id} 
              className="border border-zinc-100 bg-white rounded-xl shadow-4xs overflow-hidden transition-all duration-200 hover:border-zinc-200/80 group"
            >
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Equipment Identifiers */}
                  <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border border-zinc-100/60", priority.bg)}>
                      <Wrench className={cn("h-3.5 w-3.5", priority.color)} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                          {task.equipmentName}
                          <ArrowUpRight className="h-3 w-3 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                        </h3>
                        <Badge variant="secondary" className="text-[8px] font-extrabold bg-zinc-50 border border-zinc-200/40 text-zinc-400 px-1 py-0 rounded uppercase tracking-wider">
                          {task.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[240px] md:max-w-xs mt-0.5">{task.description}</p>
                    </div>
                  </div>

                  {/* Workflow Flag Status */}
                  <div className="col-span-3 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Status</span>
                    <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1", status.bg)}>
                      <StatusIcon className="h-3 w-3 shrink-0" />
                      <span>{status.text}</span>
                    </div>
                  </div>

                  {/* Targeted Date timeline */}
                  <div className="col-span-3 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Target Date</span>
                    <span className="text-xs font-bold text-zinc-600 block mt-1">{task.scheduledDate}</span>
                  </div>

                  {/* Task Assignee field */}
                  <div className="col-span-3 md:col-span-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Assignee</span>
                    <span className="text-xs font-bold text-zinc-600 block mt-1">{task.assignee}</span>
                  </div>

                  {/* Subtask Linear Pipes */}
                  <div className="col-span-3 md:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] font-bold">
                      <span className="text-zinc-400 uppercase tracking-wider">Subtasks</span>
                      <span className="text-zinc-700 bg-zinc-50 px-1 rounded">
                        {completedItems}/{task.checklist.length}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-300", 
                          task.status === "completed" ? "bg-emerald-500" : "bg-blue-500"
                        )} 
                        style={{ width: `${progressPercentage}%` }} 
                      />
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