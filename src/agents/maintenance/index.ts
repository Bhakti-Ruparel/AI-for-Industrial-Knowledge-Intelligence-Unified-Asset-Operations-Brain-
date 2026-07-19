// ═══════════════════════════════════════════════════════════════════════════════
// Maintenance Agent — Real Prisma data + intelligent responses
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/prisma";

export const maintenanceAgent: AgentDefinition = {
  id: "maintenance",
  name: "Maintenance Agent",
  description: "Predicts equipment failures, generates maintenance schedules, and provides maintenance guidance",
  capabilities: ["predict_failure", "generate_schedule", "maintenance_guide", "checklist"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;
    const lower = query.toLowerCase();

    try {
      // Pull live maintenance data from Prisma
      const [overdue, inProgress, scheduled, completed, critical] = await Promise.all([
        prisma?.maintenanceRecord.findMany({
          where: { organizationId, status: "OVERDUE", deletedAt: null },
          include: { equipment: { select: { name: true, model: true } } },
          orderBy: { scheduledDate: "asc" },
          take: 10,
        }) ?? [],
        prisma?.maintenanceRecord.findMany({
          where: { organizationId, status: "IN_PROGRESS", deletedAt: null },
          include: { equipment: { select: { name: true } } },
          take: 5,
        }) ?? [],
        prisma?.maintenanceRecord.findMany({
          where: {
            organizationId, status: "SCHEDULED", deletedAt: null,
            scheduledDate: { lte: new Date(Date.now() + 7 * 86_400_000) },
          },
          include: { equipment: { select: { name: true } } },
          orderBy: { scheduledDate: "asc" },
          take: 10,
        }) ?? [],
        prisma?.maintenanceRecord.count({
          where: { organizationId, status: "COMPLETED", deletedAt: null },
        }) ?? 0,
        prisma?.maintenanceRecord.findMany({
          where: { organizationId, priority: "CRITICAL", status: { not: "COMPLETED" }, deletedAt: null },
          include: { equipment: { select: { name: true } } },
          take: 5,
        }) ?? [],
      ]);

      // ── Overdue query ─────────────────────────────────────────────────────
      if (lower.includes("overdue")) {
        if (!overdue.length) {
          return reply("No overdue maintenance tasks. All schedules are up to date. ✅", 0.95, [
            { type: "view_maintenance", label: "View All Maintenance" },
          ]);
        }
        const lines = [`**${overdue.length} Overdue Maintenance Task${overdue.length > 1 ? "s" : ""}:**\n`];
        overdue.forEach((t, i) => {
          const days = Math.floor((Date.now() - new Date(t.scheduledDate).getTime()) / 86_400_000);
          lines.push(`${i + 1}. **${t.equipment?.name ?? t.equipmentId}** — ${t.title} *(${days} day${days !== 1 ? "s" : ""} overdue, ${t.priority} priority)*`);
        });
        lines.push("\n⚠️ Recommend prioritizing critical-priority tasks immediately.");
        return reply(lines.join("\n"), 0.95, [
          { type: "create_maintenance", label: "Schedule Maintenance" },
          { type: "view_maintenance", label: "View All" },
        ]);
      }

      // ── Critical tasks ────────────────────────────────────────────────────
      if (lower.includes("critical") || lower.includes("urgent") || lower.includes("priority")) {
        if (!critical.length) {
          return reply("No critical-priority maintenance tasks pending. All critical items are resolved. ✅", 0.93, []);
        }
        const lines = [`**${critical.length} Critical Maintenance Task${critical.length > 1 ? "s" : ""}:**\n`];
        critical.forEach((t, i) => {
          lines.push(`${i + 1}. **${t.equipment?.name ?? t.equipmentId}** — ${t.title} *(${t.status})*`);
        });
        return reply(lines.join("\n"), 0.93, [
          { type: "view_maintenance", label: "View Tasks" },
          { type: "create_maintenance", label: "Schedule Task" },
        ]);
      }

      // ── Due soon / schedule ───────────────────────────────────────────────
      if (lower.includes("due") || lower.includes("schedule") || lower.includes("upcoming") || lower.includes("this week")) {
        if (!scheduled.length) {
          return reply("No maintenance tasks due in the next 7 days.", 0.88, [
            { type: "create_maintenance", label: "Schedule New Task" },
          ]);
        }
        const lines = [`**${scheduled.length} Task${scheduled.length > 1 ? "s" : ""} Due in the Next 7 Days:**\n`];
        scheduled.forEach((t, i) => {
          const date = new Date(t.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          lines.push(`${i + 1}. **${t.equipment?.name ?? t.equipmentId}** — ${t.title} *(${date}, ${t.priority} priority)*`);
        });
        return reply(lines.join("\n"), 0.9, [
          { type: "view_maintenance", label: "View Schedule" },
          { type: "create_maintenance", label: "Add Task" },
        ]);
      }

      // ── In progress ───────────────────────────────────────────────────────
      if (lower.includes("in progress") || lower.includes("ongoing") || lower.includes("active")) {
        if (!inProgress.length) {
          return reply("No maintenance tasks currently in progress.", 0.88, [
            { type: "view_maintenance", label: "View All Tasks" },
          ]);
        }
        const lines = [`**${inProgress.length} Task${inProgress.length > 1 ? "s" : ""} Currently In Progress:**\n`];
        inProgress.forEach((t, i) => {
          lines.push(`${i + 1}. **${t.equipment?.name ?? t.equipmentId}** — ${t.title} *(${t.type}, ${t.priority} priority)*`);
        });
        return reply(lines.join("\n"), 0.9, [{ type: "view_maintenance", label: "View Details" }]);
      }

      // ── Summary / default ─────────────────────────────────────────────────
      const total = (overdue.length) + (inProgress.length) + (scheduled.length) + (completed as number);
      const lines = [
        "**Maintenance Summary:**\n",
        `📋 Total tasks: **${total}**`,
        `🔴 Overdue: **${overdue.length}**`,
        `⚙️ In Progress: **${inProgress.length}**`,
        `📅 Due this week: **${scheduled.length}**`,
        `✅ Completed: **${completed}**`,
      ];
      if (overdue.length > 0) {
        lines.push(`\n⚠️ **${overdue.length} task${overdue.length > 1 ? "s" : ""} overdue** — immediate attention required.`);
      }
      lines.push("\nAsk me about *overdue tasks*, *upcoming schedule*, *critical items*, or *specific equipment*.");
      return reply(lines.join("\n"), 0.92, [
        { type: "view_maintenance", label: "View All Tasks" },
        { type: "create_maintenance", label: "Schedule Task" },
        { type: "generate_checklist", label: "Generate Checklist" },
      ]);
    } catch {
      return reply(
        "I'm having trouble connecting to the database right now. Please check your database connection and try again.",
        0.3, []
      );
    }
  },
};

function reply(response: string, confidence: number, actions: { type: string; label: string }[]): AgentOutput {
  return { response, confidence, sources: [], actions };
}
