// ═══════════════════════════════════════════════════════════════════════════════
// Lessons Learned Agent — Real Prisma incident pattern analysis
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/prisma";

export const lessonsAgent: AgentDefinition = {
  id: "lessons",
  name: "Lessons Learned Agent",
  description: "Identifies patterns from historical incidents and generates preventive recommendations",
  capabilities: ["pattern_detection", "lessons_learned", "recommendations", "trend_analysis"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;
    const lower = query.toLowerCase();

    try {
      // Pull all resolved incidents with root causes
      const resolved = await prisma?.incident.findMany({
        where: {
          organizationId,
          status: { in: ["RESOLVED", "CLOSED"] },
          deletedAt: null,
        },
        include: { equipment: { select: { name: true, model: true, category: { select: { name: true } } } } },
        orderBy: { resolvedAt: "desc" },
        take: 50,
      }) ?? [];

      if (!resolved.length) {
        return reply(
          "No resolved incidents found in the system yet.\n\nOnce incidents are investigated and resolved, I will analyze them to identify:\n- Recurring failure patterns\n- Equipment-specific weak points\n- Seasonal or usage-based trends\n- Preventive action recommendations",
          0.7,
          [{ type: "view_incidents", label: "View Incidents" }]
        );
      }

      // ── Build pattern map: equipment → incidents ──────────────────────────
      const equipmentMap = new Map<string, { name: string; count: number; rootCauses: string[]; severities: string[] }>();
      const rootCauseMap = new Map<string, number>();

      for (const inc of resolved) {
        const eqName = inc.equipment?.name ?? inc.equipmentId;
        if (!equipmentMap.has(eqName)) {
          equipmentMap.set(eqName, { name: eqName, count: 0, rootCauses: [], severities: [] });
        }
        const entry = equipmentMap.get(eqName)!;
        entry.count++;
        entry.severities.push(inc.severity);
        if (inc.rootCause) {
          entry.rootCauses.push(inc.rootCause.slice(0, 80));
          // Track global root cause frequency
          const key = inc.rootCause.slice(0, 40).toLowerCase();
          rootCauseMap.set(key, (rootCauseMap.get(key) ?? 0) + 1);
        }
      }

      // Sort equipment by incident count
      const topEquipment = [...equipmentMap.values()].sort((a, b) => b.count - a.count);
      // Sort root causes by frequency
      const topRootCauses = [...rootCauseMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // ── Specific equipment query ──────────────────────────────────────────
      const eqMatch = [...equipmentMap.entries()].find(([name]) =>
        lower.includes(name.toLowerCase())
      );
      if (eqMatch) {
        const [name, data] = eqMatch;
        const lines = [`**Lessons Learned for ${name}:**\n`,
          `📊 Total incidents resolved: **${data.count}**`,
          `⚠️ Severities: ${data.severities.join(", ")}`,
        ];
        if (data.rootCauses.length) {
          lines.push("\n**Root Causes Identified:**");
          data.rootCauses.slice(0, 5).forEach((rc, i) => lines.push(`${i + 1}. ${rc}`));
        }
        lines.push("\n**Preventive Recommendations:**");
        lines.push("• Schedule regular preventive maintenance before due dates");
        lines.push("• Monitor health score — act when score drops below 70");
        lines.push("• Document all observations during scheduled inspections");
        return reply(lines.join("\n"), 0.88, [
          { type: "find_patterns",     label: "Find More Patterns"    },
          { type: "preventive_actions", label: "Create Preventive Plan" },
        ]);
      }

      // ── Pattern / trend query ─────────────────────────────────────────────
      if (lower.includes("pattern") || lower.includes("trend") || lower.includes("recurring") || lower.includes("common")) {
        const lines = [`**Recurring Failure Patterns (${resolved.length} resolved incidents):**\n`];
        if (topEquipment.length) {
          lines.push("**Most Incident-Prone Equipment:**");
          topEquipment.slice(0, 5).forEach((eq, i) => {
            lines.push(`${i + 1}. **${eq.name}** — ${eq.count} incident${eq.count > 1 ? "s" : ""}`);
          });
        }
        if (topRootCauses.length) {
          lines.push("\n**Most Common Root Causes:**");
          topRootCauses.forEach(([cause, count], i) => {
            lines.push(`${i + 1}. ${cause} *(${count}x)*`);
          });
        }
        lines.push("\n💡 **Insight:** Focus preventive maintenance on high-frequency equipment and address recurring root causes systematically.");
        return reply(lines.join("\n"), 0.9, [
          { type: "preventive_actions", label: "Generate Preventive Plan" },
          { type: "generate_lessons",   label: "Full Lessons Report"      },
        ]);
      }

      // ── Preventive recommendations ────────────────────────────────────────
      if (lower.includes("prevent") || lower.includes("recommend") || lower.includes("avoid")) {
        const lines = [`**Preventive Recommendations (based on ${resolved.length} historical incidents):**\n`];
        if (topEquipment[0]) {
          lines.push(`🔴 **High Priority:** ${topEquipment[0].name} has had ${topEquipment[0].count} incidents — increase inspection frequency.`);
        }
        if (topEquipment[1]) {
          lines.push(`🟠 **Medium Priority:** ${topEquipment[1].name} — ${topEquipment[1].count} incidents — review maintenance schedule.`);
        }
        lines.push("\n**General Recommendations:**");
        lines.push("• Implement predictive maintenance based on health score trends");
        lines.push("• Document root causes for every incident — this data trains future recommendations");
        lines.push("• Review top root causes with maintenance team monthly");
        lines.push("• Track MTTR (Mean Time To Resolve) and set targets for improvement");
        return reply(lines.join("\n"), 0.87, [
          { type: "create_maintenance",  label: "Schedule Preventive Task" },
          { type: "find_patterns",       label: "View Patterns"            },
        ]);
      }

      // ── Default summary ───────────────────────────────────────────────────
      const withRCA = resolved.filter((r) => r.rootCause).length;
      const lines = [
        `**Lessons Learned Summary (${resolved.length} resolved incidents):**\n`,
        `📋 Total analyzed: **${resolved.length}**`,
        `🔍 With root cause documented: **${withRCA}** (${Math.round((withRCA / resolved.length) * 100)}%)`,
        `🏭 Equipment affected: **${equipmentMap.size}**`,
      ];
      if (topEquipment[0]) {
        lines.push(`\n⚠️ **Most affected:** ${topEquipment[0].name} (${topEquipment[0].count} incidents)`);
      }
      if (topRootCauses[0]) {
        lines.push(`🔁 **Top recurring cause:** ${topRootCauses[0][0]} (${topRootCauses[0][1]}x)`);
      }
      lines.push("\nAsk me about *patterns*, *specific equipment*, *preventive recommendations*, or *trends*.");
      return reply(lines.join("\n"), 0.88, [
        { type: "find_patterns",      label: "Detect Patterns"          },
        { type: "generate_lessons",   label: "Generate Lessons Report"  },
        { type: "preventive_actions", label: "Suggest Preventive Actions"},
      ]);
    } catch {
      return reply("Unable to load incident history. Please check your database connection.", 0.3, []);
    }
  },
};

function reply(response: string, confidence: number, actions: { type: string; label: string }[]): AgentOutput {
  return { response, confidence, sources: [], actions };
}
