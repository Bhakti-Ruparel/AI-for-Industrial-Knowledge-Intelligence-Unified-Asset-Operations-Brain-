// ═══════════════════════════════════════════════════════════════════════════════
// Lessons Learned Agent — Extracts patterns from resolved incidents
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";

export const lessonsAgent: AgentDefinition = {
  id: "lessons",
  name: "Lessons Learned Agent",
  description: "Identifies patterns from historical incidents and generates preventive recommendations",
  capabilities: ["pattern_detection", "lessons_learned", "recommendations", "trend_analysis"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    return {
      response: "I analyze resolved incidents to extract lessons learned and identify recurring patterns. I can:\n\n- Identify similar incidents across equipment\n- Detect failure mode trends\n- Generate preventive recommendations\n- Create lessons learned reports\n\nAsk me about patterns for a specific equipment type or time period.",
      confidence: 0.8,
      sources: [],
      actions: [
        { type: "find_patterns", label: "Detect Patterns" },
        { type: "generate_lessons", label: "Generate Lessons Report" },
        { type: "preventive_actions", label: "Suggest Preventive Actions" },
      ],
    };
  },
};
