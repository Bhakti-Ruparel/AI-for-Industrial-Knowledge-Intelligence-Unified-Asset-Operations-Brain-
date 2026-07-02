// ═══════════════════════════════════════════════════════════════════════════════
// Machine Recommendation Agent — Wraps existing recommendation engine
// NOTE: Does NOT modify the existing recommendation algorithm
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { filterMachines, getMachineData } from "@/services/machines";

export const machineRecommendationAgent: AgentDefinition = {
  id: "machine-recommendation",
  name: "Machine Recommendation Agent",
  description: "Recommends optimal CNC machines based on workpiece requirements and application",
  capabilities: ["recommend_machine", "compare_machines", "machine_specs"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    // Parse dimensions from query
    const dimensions = parseDimensions(input.query);
    const category = detectCategory(input.query);
    const series = detectSeries(input.query, category);

    if (dimensions && category && series) {
      const results = filterMachines(category, series, dimensions);
      const response = formatRecommendation(results, category, series, dimensions);
      return {
        response,
        confidence: 0.92,
        sources: [],
        actions: [
          { type: "create_booking", label: "Request Consultation" },
          { type: "compare", label: "Compare Models" },
          { type: "brochure", label: "Download Brochure" },
        ],
      };
    }

    // Fallback — list available categories
    const machineData = getMachineData();
    const categories = Object.keys(machineData);
    return {
      response: `I can recommend machines from these categories: ${categories.join(", ")}. Please specify your workpiece dimensions (X, Y, Z in mm) and the machine category you're interested in.`,
      confidence: 0.7,
      sources: [],
      actions: [{ type: "show_catalog", label: "View Full Catalog" }],
    };
  },
};

function parseDimensions(query: string): Record<string, number> | null {
  const patterns = [
    /(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/,
    /x\s*[=:]\s*(\d+).*?y\s*[=:]\s*(\d+).*?z\s*[=:]\s*(\d+)/i,
  ];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return { x: parseInt(m[1]), y: parseInt(m[2]), z: parseInt(m[3]) };
  }
  return null;
}

function detectCategory(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes("vtl") || lower.includes("vertical turn")) return "VTL";
  if (lower.includes("grind")) return "Grinding";
  if (lower.includes("5 axis") || lower.includes("5-axis")) return "5 Axis VMC";
  if (lower.includes("turnmill") || lower.includes("turn mill")) return "Turnmill";
  return "VMC";
}

function detectSeries(query: string, category: string): string {
  const machineData = getMachineData();
  const seriesNames = Object.keys(machineData[category] || {});
  const lower = query.toLowerCase();
  for (const s of seriesNames) {
    if (lower.includes(s.toLowerCase().replace(" series", ""))) return s;
  }
  return seriesNames[0] || "";
}

function formatRecommendation(results: any, category: string, series: string, dims: Record<string, number>): string {
  const lines: string[] = [];
  lines.push(`Based on your requirements (${dims.x}×${dims.y}×${dims.z}mm) in ${category} — ${series}:\n`);

  if (results.best_fit?.length) {
    lines.push(`**Best Fit:** ${results.best_fit[0].label} (${results.best_fit[0].x || results.best_fit[0].diameter}mm)`);
  }
  if (results.recommended?.length) {
    lines.push(`**Also Recommended:** ${results.recommended.map((m: any) => m.label).join(", ")}`);
  }
  if (results.alternative?.length) {
    lines.push(`**Alternatives:** ${results.alternative.map((m: any) => m.label).join(", ")}`);
  }

  return lines.join("\n");
}
