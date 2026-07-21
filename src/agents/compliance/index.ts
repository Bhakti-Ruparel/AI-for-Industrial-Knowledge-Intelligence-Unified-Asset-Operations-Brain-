// ═══════════════════════════════════════════════════════════════════════════════
// Compliance Agent — Fetches real Prisma data, uses LLM to synthesize responses
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { synthesize } from "@/lib/ai/llm-synthesizer";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are a regulatory compliance assistant for an industrial manufacturing plant. Answer questions about compliance status, audit schedules, violations, and certifications using the provided database data. Format with markdown. Be specific and actionable.`;

export const complianceAgent: AgentDefinition = {
  id: "compliance",
  name: "Compliance Agent",
  description: "Tracks regulatory compliance, identifies gaps, and recommends corrective actions",
  capabilities: ["compliance_check", "gap_analysis", "audit_prep"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;

    try {
      if (!prisma) return { response: "Database unavailable.", confidence: 0.1, sources: [], actions: [] };

      const records = await (prisma as any).complianceRecord.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { nextAuditDate: "asc" },
      });

      const data = {
        total: records.length,
        compliant: records.filter((r: any) => r.status === "COMPLIANT").length,
        nonCompliant: records.filter((r: any) => r.status === "NON_COMPLIANT").length,
        expiring: records.filter((r: any) => r.status === "EXPIRING").length,
        pending: records.filter((r: any) => r.status === "PENDING_REVIEW").length,
        avgScore: records.length ? Math.round(records.reduce((s: number, r: any) => s + (r.score ?? 0), 0) / records.length) : 0,
        records: records.map((r: any) => ({
          regulation: r.regulation, category: r.category, status: r.status,
          score: r.score, nextAuditDate: r.nextAuditDate?.toISOString(),
          findings: r.findings,
        })),
      };

      // Build fallback
      const lines: string[] = [];
      if (records.length === 0) {
        lines.push("No compliance records found. Add frameworks from the **Compliance** page.");
      } else {
        lines.push("**📋 Compliance Overview:**\n");
        lines.push(`- Total frameworks: **${data.total}**`);
        lines.push(`- ✅ Compliant: **${data.compliant}**`);
        lines.push(`- 🔴 Non-Compliant: **${data.nonCompliant}**`);
        lines.push(`- ⚠️ Expiring: **${data.expiring}**`);
        lines.push(`- Average score: **${data.avgScore}%**`);
        const violations = records.filter((r: any) => r.status === "NON_COMPLIANT");
        if (violations.length) {
          lines.push(`\n**Violations:**`);
          violations.forEach((r: any, i: number) => lines.push(`${i + 1}. **${r.regulation}** (${r.category}) — Score: ${r.score ?? "N/A"}%`));
        }
      }

      const response = await synthesize({
        question: query,
        systemPrompt: SYSTEM_PROMPT,
        data,
        fallback: lines.join("\n"),
      });

      return { response, confidence: 0.9, sources: [], actions: [{ type: "view_compliance", label: "View Compliance" }] };
    } catch {
      return { response: "Unable to load compliance data.", confidence: 0.2, sources: [], actions: [] };
    }
  },
};
