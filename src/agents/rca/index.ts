// ═══════════════════════════════════════════════════════════════════════════════
// Root Cause Analysis Agent — Real incident data from Prisma
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/prisma";

export const rcaAgent: AgentDefinition = {
  id: "rca",
  name: "Root Cause Analysis Agent",
  description: "Performs root cause analysis on incidents using historical data and patterns",
  capabilities: ["root_cause", "failure_analysis", "5_why", "fishbone"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;
    const lower = query.toLowerCase();

    try {
      const [openIncidents, criticalIncidents, recentResolved] = await Promise.all([
        prisma?.incident.findMany({
          where: { organizationId, status: { in: ["OPEN", "INVESTIGATING"] }, deletedAt: null },
          include: { equipment: { select: { name: true, model: true } } },
          orderBy: [{ severity: "desc" }, { reportedAt: "desc" }],
          take: 10,
        }) ?? [],
        prisma?.incident.findMany({
          where: { organizationId, severity: "CRITICAL", status: { not: "CLOSED" }, deletedAt: null },
          include: { equipment: { select: { name: true } } },
          take: 5,
        }) ?? [],
        prisma?.incident.findMany({
          where: { organizationId, status: "RESOLVED", deletedAt: null, rootCause: { not: null } },
          include: { equipment: { select: { name: true } } },
          orderBy: { resolvedAt: "desc" },
          take: 5,
        }) ?? [],
      ]);

      // ── Critical incidents ────────────────────────────────────────────────
      if (lower.includes("critical") || lower.includes("urgent") || lower.includes("serious")) {
        if (!criticalIncidents.length) {
          return reply("✅ No critical incidents currently open.", 0.93, []);
        }
        const lines = [`**${criticalIncidents.length} Critical Incident${criticalIncidents.length > 1 ? "s" : ""}:**\n`];
        criticalIncidents.forEach((inc, i) => {
          lines.push(`${i + 1}. **${inc.title}**`);
          lines.push(`   Equipment: ${inc.equipment?.name ?? inc.equipmentId}`);
          lines.push(`   Status: ${inc.status} | Reported: ${new Date(inc.reportedAt).toLocaleDateString("en-IN")}`);
          if (inc.description) lines.push(`   ${inc.description.slice(0, 120)}`);
        });
        lines.push("\n🔴 Immediate RCA and corrective action required.");
        return reply(lines.join("\n"), 0.95, [
          { type: "generate_rca", label: "Generate RCA Report" },
          { type: "create_corrective", label: "Create Corrective Action" },
        ]);
      }

      // ── Open / active incidents ───────────────────────────────────────────
      if (lower.includes("open") || lower.includes("active") || lower.includes("investigating") || lower.includes("unresolved")) {
        if (!openIncidents.length) {
          return reply("✅ No open or investigating incidents. All current incidents are resolved.", 0.93, []);
        }
        const lines = [`**${openIncidents.length} Active Incident${openIncidents.length > 1 ? "s" : ""}:**\n`];
        openIncidents.forEach((inc, i) => {
          const icon = inc.severity === "CRITICAL" ? "🔴" : inc.severity === "HIGH" ? "🟠" : inc.severity === "MEDIUM" ? "🟡" : "🟢";
          lines.push(`${i + 1}. ${icon} **${inc.title}** *(${inc.severity})*`);
          lines.push(`   Equipment: ${inc.equipment?.name ?? inc.equipmentId} | Status: ${inc.status}`);
          lines.push(`   Reported: ${new Date(inc.reportedAt).toLocaleDateString("en-IN")}`);
        });
        return reply(lines.join("\n"), 0.93, [
          { type: "generate_rca", label: "Start RCA" },
          { type: "find_similar", label: "Find Similar Incidents" },
        ]);
      }

      // ── Root causes / patterns from resolved incidents ───────────────────
      if (lower.includes("root cause") || lower.includes("why") || lower.includes("pattern") || lower.includes("resolved")) {
        if (!recentResolved.length) {
          return reply("No resolved incidents with documented root causes yet. Once incidents are resolved and root causes are recorded, I can identify patterns.", 0.7, []);
        }
        const lines = ["**Root Causes from Recently Resolved Incidents:**\n"];
        recentResolved.forEach((inc, i) => {
          lines.push(`${i + 1}. **${inc.title}** — ${inc.equipment?.name ?? inc.equipmentId}`);
          if (inc.rootCause) lines.push(`   Root Cause: ${inc.rootCause.slice(0, 150)}`);
          if (inc.resolution) lines.push(`   Resolution: ${inc.resolution.slice(0, 100)}`);
        });
        lines.push("\n💡 Use these learnings to prevent recurrence. Would you like me to identify recurring failure patterns?");
        return reply(lines.join("\n"), 0.88, [
          { type: "find_patterns", label: "Find Recurring Patterns" },
          { type: "generate_lessons", label: "Generate Lessons Report" },
        ]);
      }

      // ── Summary / default ─────────────────────────────────────────────────
      const totalOpen = openIncidents.length;
      const totalCrit = criticalIncidents.length;
      const lines = [
        "**Incident & RCA Summary:**\n",
        `🔴 Open Incidents: **${totalOpen}**`,
        `⚠️ Critical: **${totalCrit}**`,
        `✅ Recently Resolved (with RCA): **${recentResolved.length}**`,
      ];
      if (totalOpen > 0) {
        lines.push(`\n**Most Recent Open Incidents:**`);
        openIncidents.slice(0, 3).forEach((inc) => {
          lines.push(`• **${inc.title}** — ${inc.equipment?.name ?? "Unknown"} *(${inc.severity})*`);
        });
      }
      lines.push("\nI can help with **5-Why analysis**, **Fishbone diagrams**, **pattern detection**, and **corrective action planning**.");
      lines.push("Ask me: *'What are the open incidents?'*, *'Show critical incidents'*, or *'What are common root causes?'*");
      return reply(lines.join("\n"), 0.9, [
        { type: "generate_rca", label: "Start RCA Analysis" },
        { type: "find_similar", label: "Find Similar Incidents" },
        { type: "create_corrective", label: "Create Corrective Action" },
      ]);
    } catch {
      return reply("Unable to load incident data. Please check your database connection.", 0.3, []);
    }
  },
};

function reply(response: string, confidence: number, actions: { type: string; label: string }[]): AgentOutput {
  return { response, confidence, sources: [], actions };
}
