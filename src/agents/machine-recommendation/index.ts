// ═══════════════════════════════════════════════════════════════════════════════
// Machine Recommendation Agent — Wraps existing recommendation engine
// NOTE: Does NOT modify the existing recommendation algorithm
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { filterMachines, getMachineData, type FilterResult } from "@/services/machines";

export const machineRecommendationAgent: AgentDefinition = {
  id: "machine-recommendation",
  name: "Machine Recommendation Agent",
  description: "Recommends optimal CNC machines based on workpiece requirements and application",
  capabilities: ["recommend_machine", "compare_machines", "machine_specs"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query } = input;
    const lower = query.toLowerCase();

    const category = detectCategory(query);
    const series   = detectSeries(query, category);
    const dimensions = parseDimensions(query, category);

    if (dimensions && series) {
      const results = filterMachines(category, series, dimensions);
      const response = formatRecommendation(results, category, series, dimensions);
      return {
        response,
        confidence: results.best_fit?.length ? 0.95 : 0.75,
        sources: [],
        actions: [
          { type: "create_booking", label: "Request Consultation" },
          { type: "compare",        label: "Compare Models"       },
          { type: "brochure",       label: "Download Brochure"    },
        ],
      };
    }

    // No dimensions parsed — guide the user
    const machineData = getMachineData();
    const categories  = Object.keys(machineData);
    const categoryGuide: Record<string, string> = {
      VMC:         "X×Y×Z travel (e.g. 800×500×500mm)",
      VTL:         "Diameter×Height (e.g. 1000×800mm)",
      Grinding:    "Length×Width×Height (e.g. 500×200×300mm)",
      "5 Axis VMC": "Length×Width×Height (e.g. 600×500×400mm)",
      Turnmill:    "Diameter×Length (e.g. 300×800mm)",
    };

    const lines = [
      "**Machine Recommendation Engine**\n",
      `I can recommend from: **${categories.join(", ")}**\n`,
      "To get a recommendation, please specify:",
    ];
    categories.forEach((cat) => {
      lines.push(`• **${cat}**: ${categoryGuide[cat] ?? "workpiece dimensions"}`);
    });
    lines.push("\n**Example queries:**");
    lines.push("• *\"Recommend VMC for 800×500×400mm workpiece\"*");
    lines.push("• *\"Best VTL for 1200mm diameter, 900mm height\"*");
    lines.push("• *\"5 axis machine for 600×500×350mm\"*");

    return {
      response:   lines.join("\n"),
      confidence: 0.7,
      sources:    [],
      actions: [
        { type: "show_catalog",   label: "View Full Catalog" },
        { type: "create_booking", label: "Talk to an Expert" },
      ],
    };
  },
};

function parseDimensions(query: string, category: string): Record<string, number> | null {
  // VMC / 5 Axis: X×Y×Z
  if (["VMC", "5 Axis VMC"].includes(category)) {
    const patterns = [
      /(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/,
      /x\s*[=:]\s*(\d+).*?y\s*[=:]\s*(\d+).*?z\s*[=:]\s*(\d+)/i,
    ];
    for (const p of patterns) {
      const m = query.match(p);
      if (m) return { x: parseInt(m[1]), y: parseInt(m[2]), z: parseInt(m[3]) };
    }
  }
  // VTL: diameter × height (weight optional)
  if (category === "VTL") {
    const m = query.match(/(?:dia(?:meter)?\s*[=:×x]?\s*)?(\d+)\s*[xX×]\s*(\d+)/i);
    if (m) return { diameter: parseInt(m[1]), height: parseInt(m[2]), weight: 0 };
    const d = query.match(/(?:dia(?:meter)?)[\s=:]*(\d+)/i);
    const h = query.match(/(?:height|ht)[\s=:]*(\d+)/i);
    if (d && h) return { diameter: parseInt(d[1]), height: parseInt(h[1]), weight: 0 };
  }
  // Grinding / Turnmill: length × width × height or diameter × length
  if (["Grinding", "Turnmill"].includes(category)) {
    const p = /(\d+)\s*[xX×]\s*(\d+)\s*(?:[xX×]\s*(\d+))?/;
    const m = query.match(p);
    if (m) {
      if (category === "Turnmill") return { diameter: parseInt(m[1]), length: parseInt(m[2]) };
      return { length: parseInt(m[1]), width: parseInt(m[2]), height: parseInt(m[3] || m[2]) };
    }
  }
  // Generic 3-number pattern fallback
  const generic = /(\d{3,4})\s*[xX×]\s*(\d{3,4})\s*[xX×]\s*(\d{3,4})/;
  const gm = query.match(generic);
  if (gm) return { x: parseInt(gm[1]), y: parseInt(gm[2]), z: parseInt(gm[3]) };
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

function formatRecommendation(results: FilterResult, category: string, series: string, dims: Record<string, number>): string {
  const dimStr = category === "VTL"
    ? `Ø${dims.diameter ?? "?"}mm × H${dims.height ?? "?"}mm (weight: ${dims.weight ?? "?"}kg)`
    : category === "Grinding"
    ? `${dims.length ?? "?"}×${dims.width ?? "?"}×${dims.height ?? "?"}mm`
    : `${dims.x ?? "?"}×${dims.y ?? "?"}×${dims.z ?? "?"}mm`;

  const lines: string[] = [
    `**Machine Recommendation for ${category} — ${series}**`,
    `Workpiece requirement: ${dimStr}\n`,
  ];

  if (results.best_fit?.length) {
    const m = results.best_fit[0];
    const cap = m.x ? `${m.x}×${m.y}×${m.z}mm` : m.diameter ? `Ø${m.diameter}mm` : m.length ? `${m.length}×${m.width}×${m.height}mm` : "";
    lines.push(`✅ **Best Fit: ${m.label}**${cap ? ` *(capacity: ${cap})*` : ""}`);
    lines.push("   Matches your requirements precisely — recommended as primary choice.");
  }

  if (results.recommended?.length) {
    lines.push("\n📋 **Also Recommended:**");
    results.recommended.forEach((m) => {
      const cap = m.x ? `${m.x}×${m.y}×${m.z}mm` : m.diameter ? `Ø${m.diameter}mm` : "";
      lines.push(`• ${m.label}${cap ? ` *(${cap})*` : ""}`);
    });
  }

  if (results.alternative?.length) {
    lines.push("\n🔄 **Alternative Options:**");
    results.alternative.forEach((m) => {
      lines.push(`• ${m.label}`);
    });
  }

  if (!results.best_fit?.length && !results.recommended?.length) {
    lines.push("⚠️ No exact match found for your dimensions. The alternatives listed have the closest specifications.");
    lines.push("Consider adjusting your requirements or contact us for a custom solution.");
  }

  lines.push("\nWould you like a detailed spec sheet, comparison, or to schedule a demo?");
  return lines.join("\n");
}
