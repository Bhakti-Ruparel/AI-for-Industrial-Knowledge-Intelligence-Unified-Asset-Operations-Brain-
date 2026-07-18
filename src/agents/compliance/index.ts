// ═══════════════════════════════════════════════════════════════════════════════
// Compliance Agent — Real Prisma data + intelligent responses
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/prisma";

export const complianceAgent: AgentDefinition = {
  id: "compliance",
  name: "Compliance Agent",
  description: "Tracks regulatory compliance, identifies gaps, and recommends corrective actions",
  capabilities: ["compliance_check", "gap_analysis", "audit_prep", "generate_package"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;
    const lower = query.toLowerCase();

    try {
      const records = await prisma?.complianceRecord.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { nextAuditDate: "asc" },
      }) ?? [];

      if (!records.length) {
        return reply(
          "No compliance records found in the system. Add compliance frameworks (Factory Act, ISO, PESO, OISD) to start tracking.",
          0.7,
          [{ type: "add_compliance", label: "Add Framework" }]
        );
      }

      const compliant    = records.filter((r) => r.status === "COMPLIANT");
      const nonCompliant = records.filter((r) => r.status === "NON_COMPLIANT");
      const expiring     = records.filter((r) => r.status === "EXPIRING");
      const pending      = records.filter((r) => r.status === "PENDING_REVIEW");
      const avgScore     = records.reduce((s, r) => s + (r.score ?? 0), 0) / records.length;

      // ── Non-compliant / violations ────────────────────────────────────────
      if (lower.includes("violation") || lower.includes("non-compliant") || lower.includes("gap") || lower.includes("fail")) {
        if (!nonCompliant.length) {
          return reply("✅ No compliance violations detected. All monitored frameworks are compliant.", 0.95, []);
        }
        const lines = [`**${nonCompliant.length} Compliance Violation${nonCompliant.length > 1 ? "s" : ""} Found:**\n`];
        nonCompliant.forEach((r, i) => {
          const findings = Array.isArray(r.findings) ? (r.findings as string[]).slice(0, 2).join("; ") : "";
          lines.push(`${i + 1}. **${r.regulation}** (${r.category.replace("_", " ")})`);
          if (findings) lines.push(`   Findings: ${findings}`);
          if (r.nextAuditDate) lines.push(`   Next Audit: ${new Date(r.nextAuditDate).toLocaleDateString("en-IN")}`);
        });
        lines.push("\n🔴 Recommend immediate corrective action on all violations.");
        return reply(lines.join("\n"), 0.93, [
          { type: "gap_analysis", label: "Run Gap Analysis" },
          { type: "generate_package", label: "Generate Compliance Package" },
        ]);
      }

      // ── Expiring / upcoming audits ────────────────────────────────────────
      if (lower.includes("expir") || lower.includes("audit") || lower.includes("upcoming") || lower.includes("renew")) {
        const items = [...expiring, ...records.filter((r) => {
          if (!r.nextAuditDate) return false;
          const days = (new Date(r.nextAuditDate).getTime() - Date.now()) / 86_400_000;
          return days <= 30 && days > 0;
        })];
        if (!items.length) {
          return reply("No frameworks expiring or audits due in the next 30 days.", 0.88, []);
        }
        const lines = [`**${items.length} Framework${items.length > 1 ? "s" : ""} Expiring or Due for Audit:**\n`];
        items.forEach((r, i) => {
          const date = r.nextAuditDate ? new Date(r.nextAuditDate).toLocaleDateString("en-IN") : "N/A";
          lines.push(`${i + 1}. **${r.regulation}** — Audit due: ${date} *(${r.status})*`);
        });
        return reply(lines.join("\n"), 0.9, [
          { type: "schedule_audit", label: "Schedule Audit" },
          { type: "generate_package", label: "Generate Package" },
        ]);
      }

      // ── Specific framework lookup ─────────────────────────────────────────
      const frameworks = ["iso", "factory act", "peso", "oisd", "environmental"];
      for (const fw of frameworks) {
        if (lower.includes(fw)) {
          const matches = records.filter((r) => r.regulation.toLowerCase().includes(fw) || r.category.toLowerCase().includes(fw.replace(" ", "_")));
          if (matches.length) {
            const lines = [`**${fw.toUpperCase()} Compliance Status:**\n`];
            matches.forEach((r) => {
              const icon = r.status === "COMPLIANT" ? "✅" : r.status === "NON_COMPLIANT" ? "🔴" : r.status === "EXPIRING" ? "⚠️" : "🔵";
              lines.push(`${icon} **${r.regulation}** — Score: ${r.score ?? "N/A"}% | Status: ${r.status.replace("_", " ")}`);
              if (r.nextAuditDate) lines.push(`   Next Audit: ${new Date(r.nextAuditDate).toLocaleDateString("en-IN")}`);
            });
            return reply(lines.join("\n"), 0.92, [
              { type: "gap_analysis", label: "Run Gap Analysis" },
              { type: "schedule_audit", label: "Schedule Audit" },
            ]);
          }
        }
      }

      // ── Overall summary ───────────────────────────────────────────────────
      const lines = [
        "**Overall Compliance Status:**\n",
        `📊 Overall Score: **${Math.round(avgScore)}%**`,
        `✅ Compliant: **${compliant.length}** framework${compliant.length !== 1 ? "s" : ""}`,
        `🔴 Non-Compliant: **${nonCompliant.length}**`,
        `⚠️ Expiring Soon: **${expiring.length}**`,
        `🔵 Pending Review: **${pending.length}**`,
      ];
      if (nonCompliant.length > 0) {
        lines.push(`\n🔴 **${nonCompliant.length} violation${nonCompliant.length > 1 ? "s" : ""}** require immediate attention:`);
        nonCompliant.slice(0, 3).forEach((r) => lines.push(`  • ${r.regulation}`));
      }
      if (expiring.length > 0) {
        lines.push(`\n⚠️ **${expiring.length} framework${expiring.length > 1 ? "s" : ""}** expiring — renew certificates before next audit.`);
      }
      lines.push("\nAsk me about *specific frameworks*, *violations*, *upcoming audits*, or *ISO/PESO/OISD status*.");
      return reply(lines.join("\n"), 0.92, [
        { type: "generate_package", label: "Generate Compliance Package" },
        { type: "gap_analysis", label: "Run Gap Analysis" },
        { type: "schedule_audit", label: "Schedule Audit" },
      ]);
    } catch {
      return reply("Unable to load compliance data. Please check your database connection.", 0.3, []);
    }
  },
};

function reply(response: string, confidence: number, actions: { type: string; label: string }[]): AgentOutput {
  return { response, confidence, sources: [], actions };
}
