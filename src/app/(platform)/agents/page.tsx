"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Wrench, Shield, Search, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIAgent } from "@/types";

const mockAgents: AIAgent[] = [
  { id: "1", name: "Knowledge Agent", description: "Retrieves and synthesizes information from your document knowledge base using RAG. Answers technical queries about machines, processes, and standards.", type: "knowledge", status: "active", tasksCompleted: 1247, accuracy: 94.2, lastActive: "Just now", icon: "brain" },
  { id: "2", name: "Maintenance Agent", description: "Monitors equipment health scores, predicts failures, and generates maintenance schedules based on usage patterns and manufacturer guidelines.", type: "maintenance", status: "active", tasksCompleted: 342, accuracy: 91.8, lastActive: "5 min ago", icon: "wrench" },
  { id: "3", name: "Compliance Agent", description: "Tracks regulatory compliance status, identifies gaps, and recommends corrective actions for Factory Act, ISO, PESO, and OISD standards.", type: "compliance", status: "idle", tasksCompleted: 89, accuracy: 96.1, lastActive: "2h ago", icon: "shield" },
  { id: "4", name: "RCA Agent", description: "Performs root cause analysis on equipment incidents using historical data, sensor readings, and maintenance logs to identify failure patterns.", type: "rca", status: "processing", tasksCompleted: 56, accuracy: 88.5, lastActive: "Processing...", icon: "search" },
];

const iconMap = {
  brain: Brain,
  wrench: Wrench,
  shield: Shield,
  search: Search,
};

const statusConfig = {
  active: { color: "text-emerald-500", bg: "bg-emerald-500/10", pulse: true },
  idle: { color: "text-muted-foreground", bg: "bg-muted/50", pulse: false },
  processing: { color: "text-primary", bg: "bg-primary/10", pulse: true },
};

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
        <p className="text-muted-foreground">Specialized AI agents working on your industrial intelligence tasks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockAgents.map((agent) => {
          const Icon = iconMap[agent.icon as keyof typeof iconMap] || Brain;
          const status = statusConfig[agent.status];
          return (
            <Card key={agent.id} className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0", status.bg)}>
                    <Icon className={cn("h-6 w-6", status.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{agent.name}</h3>
                      <div className="flex items-center gap-1.5">
                        {status.pulse && <span className={cn("h-2 w-2 rounded-full animate-pulse", status.color === "text-emerald-500" ? "bg-emerald-500" : "bg-primary")} />}
                        <span className={cn("text-xs font-medium capitalize", status.color)}>{agent.status}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{agent.description}</p>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-accent/30 p-2 text-center">
                        <p className="text-sm font-bold">{agent.tasksCompleted.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Tasks Done</p>
                      </div>
                      <div className="rounded-lg bg-accent/30 p-2 text-center">
                        <p className="text-sm font-bold">{agent.accuracy}%</p>
                        <p className="text-[10px] text-muted-foreground">Accuracy</p>
                      </div>
                      <div className="rounded-lg bg-accent/30 p-2 text-center">
                        <p className="text-sm font-bold text-muted-foreground">{agent.lastActive}</p>
                        <p className="text-[10px] text-muted-foreground">Last Active</p>
                      </div>
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
