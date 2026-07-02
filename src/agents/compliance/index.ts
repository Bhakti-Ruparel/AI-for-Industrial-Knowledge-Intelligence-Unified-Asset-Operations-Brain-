// ═══════════════════════════════════════════════════════════════════════════════
// Compliance Agent — Regulatory intelligence
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";

export const complianceAgent: AgentDefinition = {
  id: "compliance",
  name: "Compliance Agent",
  description: "Tracks regulatory compliance, identifies gaps, and recommends corrective actions",
  capabilities: ["compliance_check", "gap_analysis", "audit_prep", "generate_package"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    return {
      response: generateComplianceResponse(input.query),
      confidence: 0.88,
      sources: [],
      actions: [
        { type: "generate_package", label: "Generate Compliance Package" },
        { type: "gap_analysis", label: "Run Gap Analysis" },
        { type: "schedule_audit", label: "Schedule Audit" },
      ],
    };
  },
};

function generateComplianceResponse(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes("iso")) {
    return "**ISO Compliance Status:**\n\n- ISO 9001:2015 — ✅ Compliant (Score: 94%)\n- ISO 14001:2015 — ✅ Compliant (Score: 88%)\n- ISO 45001:2018 — ⚠️ Non-Compliant (Score: 62%)\n\n**Key Gap for ISO 45001:** PPE audit incomplete, training records missing for 3 operators, incident reporting delay > 24hrs.";
  }

  if (lower.includes("factory act") || lower.includes("peso")) {
    return "**Regulatory Status:**\n\n- Factory Act 1948 — ⚠️ Pending Review (Guard rail inspection overdue)\n- PESO — ⚠️ Expiring (Certificate renewal required by July 2026)\n\nI recommend prioritizing the PESO certificate renewal to avoid operational shutdown.";
  }

  return "I'm your Compliance Intelligence Agent. I monitor:\n- Factory Act 1948\n- ISO (9001, 14001, 45001)\n- PESO Regulations\n- OISD Standards\n- Environmental Compliance\n\nWhat compliance area would you like to review?";
}
