// ═══════════════════════════════════════════════════════════════════════════════
// Maintenance Agent — Fetches real Prisma data, uses LLM to synthesize responses
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { synthesize } from "@/lib/ai/llm-synthesizer";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are a maintenance intelligence assistant for an industrial plant. Answer questions about maintenance tasks, schedules, overdue work orders, and equipment service needs. Use the provided database data to give accurate, actionable responses. Format with markdown. Be concise.`;

export const maintenanceAgent: AgentDefinition = {
  id: "maintenance",
  name: "Maintenance Agent",
  description: "Predicts equipment failures, generates maintenance schedules, and provides maintenance guidance",
  capabilities: ["predict_failure", "generate_schedule", "maintenance_guide", "checklist"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;

    try {
      if (!prisma) return { response: "Database unavailable.", confidence: 0.1, sources: [], actions: [] };

      // Fetch all relevant maintenance data
      const [overdue, inProgress, scheduled, completedCount, critical] = await Promise.all([
        (prisma as any).maintenanceRecord.findMany({
          where: { organizationId, status: "OVERDUE", deletedAt: null },
          include: { equipment: { select: { name: true, model: true } } },
          orderBy: { scheduledDate: "asc" },
          take: 10,
        }),
        (prisma as any).maintenanceRecord.findMany({
          where: { organizationId, status: "IN_PROGRESS", deletedAt: null },
          include: { equipment: { select: { name: true } } },
          take: 5,
        }),
        (prisma as any).maintenanceRecord.findMany({
          where: { organizationId, status: "SCHEDULED", deletedAt: null, scheduledDate: { lte: new Date(Date.now() + 7 * 86_400_000) } },
          include: { equipment: { select: { name: true } } },
          orderBy: { scheduledDate: "asc" },
          take: 10,
        }),
        (prisma as any).maintenanceRecord.count({ where: { organizationId, status: "COMPLETED", deletedAt: null } }),
        (prisma as any).maintenanceRecord.findMany({
          where: { organizationId, priority: "CRITICAL", status: { not: "COMPLETED" }, deletedAt: null },
          include: { equipment: { select: { name: true } } },
          take: 5,
        }),
      ]);

      const data = {
        overdue: overdue.map((t: any) => ({ equipment: t.equipment?.name, title: t.title, priority: t.priority, scheduledDate: t.scheduledDate })),
        inProgress: inProgress.map((t: any) => ({ equipment: t.equipment?.name, title: t.title, type: t.type })),
        scheduledThisWeek: scheduled.map((t: any) => ({ equipment: t.equipment?.name, title: t.title, scheduledDate: t.scheduledDate, priority: t.priority })),
        completedTotal: completedCount,
        criticalTasks: critical.map((t: any) => ({ equipment: t.equipment?.name, title: t.title, status: t.status })),
        totals: { overdue: overdue.length, inProgress: inProgress.length, scheduled: scheduled.length, completed: completedCount, critical: critical.length },
      };

      // Build fallback
      const lines: string[] = ["**🔧 Maintenance Summary:**\n"];
      lines.push(`- Overdue: **${overdue.length}**`);
      lines.push(`- In Progress: **${inProgress.length}**`);
      lines.push(`- Due this week: **${scheduled.length}**`);
      lines.push(`- Completed: **${completedCount}**`);
      if (overdue.length > 0) {
        lines.push(`\n**⚠️ Overdue Tasks:**`);
        overdue.slice(0, 5).forEach((t: any, i: number) => {
          lines.push(`${i + 1}. **${t.equipment?.name}** — ${t.title} *(${t.priority})*`);
        });
      }
      if (critical.length > 0) {
        lines.push(`\n**🔴 Critical Priority:**`);
        critical.forEach((t: any, i: number) => lines.push(`${i + 1}. **${t.equipment?.name}** — ${t.title}`));
      }
      if (scheduled.length > 0) {
        lines.push(`\n**📅 Due This Week:**`);
        scheduled.slice(0, 5).forEach((t: any, i: number) => {
          const date = new Date(t.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          lines.push(`${i + 1}. **${t.equipment?.name}** — ${t.title} *(${date})*`);
        });
      }

      const response = await synthesize({
        question: query,
        systemPrompt: SYSTEM_PROMPT,
        data,
        fallback: lines.join("\n"),
      });

      return { response, confidence: 0.9, sources: [], actions: [{ type: "view_maintenance", label: "View All Tasks" }] };
    } catch {
      return { response: "Unable to load maintenance data. Check your database connection.", confidence: 0.2, sources: [], actions: [] };
    }
  },
};
