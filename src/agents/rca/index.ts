// ═══════════════════════════════════════════════════════════════════════════════
// RCA Agent — Fetches real incident data, uses LLM to synthesize analysis
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { synthesize } from "@/lib/ai/llm-synthesizer";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are a root cause analysis specialist for an industrial plant. Analyze incidents, identify patterns, and suggest corrective actions using the provided database data. Use markdown formatting. Be analytical and precise.`;

export const rcaAgent: AgentDefinition = {
  id: "rca",
  name: "Root Cause Analysis Agent",
  description: "Performs root cause analysis on incidents using historical data and patterns",
  capabilities: ["root_cause", "failure_analysis", "pattern_detection"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;

    try {
      if (!prisma) return { response: "Database unavailable.", confidence: 0.1, sources: [], actions: [] };

      const [openIncidents, resolvedWithRCA] = await Promise.all([
        (prisma as any).incident.findMany({
          where: { organizationId, status: { in: ["OPEN", "INVESTIGATING"] }, deletedAt: null },
          include: { equipment: { select: { name: true, model: true } } },
          orderBy: [{ severity: "desc" }, { reportedAt: "desc" }],
          take: 10,
        }),
        (prisma as any).incident.findMany({
          where: { organizationId, status: { in: ["RESOLVED", "CLOSED"] }, deletedAt: null, rootCause: { not: null } },
          include: { equipment: { select: { name: true } } },
          orderBy: { resolvedAt: "desc" },
          take: 10,
        }),
      ]);

      const data = {
        openIncidents: openIncidents.map((i: any) => ({
          title: i.title, equipment: i.equipment?.name, severity: i.severity,
          status: i.status, reportedAt: i.reportedAt, description: i.description?.slice(0, 200),
        })),
        resolvedWithRootCause: resolvedWithRCA.map((i: any) => ({
          title: i.title, equipment: i.equipment?.name, rootCause: i.rootCause,
          resolution: i.resolution, severity: i.severity,
        })),
        stats: { open: openIncidents.length, resolved: resolvedWithRCA.length },
      };

      // Build fallback
      const lines: string[] = ["**🔍 Incident & RCA Summary:**\n"];
      lines.push(`- Open/Investigating: **${openIncidents.length}**`);
      lines.push(`- Resolved (with RCA): **${resolvedWithRCA.length}**`);

      if (openIncidents.length > 0) {
        lines.push(`\n**Active Incidents:**`);
        openIncidents.slice(0, 5).forEach((inc: any, i: number) => {
          const icon = inc.severity === "CRITICAL" ? "🔴" : inc.severity === "HIGH" ? "🟠" : "🟡";
          lines.push(`${i + 1}. ${icon} **${inc.title}** — ${inc.equipment?.name ?? "Unknown"} *(${inc.severity})*`);
        });
      }

      if (resolvedWithRCA.length > 0) {
        lines.push(`\n**Recent Root Causes:**`);
        resolvedWithRCA.slice(0, 3).forEach((inc: any, i: number) => {
          lines.push(`${i + 1}. **${inc.title}**: ${inc.rootCause?.slice(0, 100)}`);
        });
      }

      if (openIncidents.length === 0 && resolvedWithRCA.length === 0) {
        lines.push("\nNo incidents recorded yet. Incidents will appear here once reported.");
      }

      const response = await synthesize({
        question: query,
        systemPrompt: SYSTEM_PROMPT,
        data,
        fallback: lines.join("\n"),
      });

      return { response, confidence: 0.88, sources: [], actions: [{ type: "view_incidents", label: "View Incidents" }] };
    } catch {
      return { response: "Unable to load incident data.", confidence: 0.2, sources: [], actions: [] };
    }
  },
};
