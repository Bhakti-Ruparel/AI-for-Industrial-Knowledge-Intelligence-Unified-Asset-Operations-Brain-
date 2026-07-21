// ═══════════════════════════════════════════════════════════════════════════════
// Planner — Smart agent routing based on query intent analysis
// Routes queries to the right agent automatically — users never need to choose
// ═══════════════════════════════════════════════════════════════════════════════

import { agentManager } from "./agent-manager";
import { createLogger } from "@/utils/logger";

const logger = createLogger("orchestrator:planner");

export interface ExecutionPlan {
  primaryAgent: string;
  supportingAgents: string[];
  reasoning: string;
  confidence: number;
}

// Priority-ordered intent rules — first match wins
const INTENT_RULES: { intent: string; agent: string; patterns: RegExp[] }[] = [
  // Maintenance — explicit maintenance keywords
  {
    intent: "maintenance",
    agent: "maintenance",
    patterns: [
      /\b(maintenance|overdue|scheduled|preventive|corrective|work order|service task)/i,
      /\b(lubrication|repair|calibrat)/i,
      /maintenance (task|schedule|record|plan)/i,
    ],
  },
  // Compliance — regulatory frameworks
  {
    intent: "compliance",
    agent: "compliance",
    patterns: [
      /\b(compliance|regulation|iso|factory act|peso|oisd|audit|certificate|non.?compliant)/i,
      /\b(violation|expir)/i,
    ],
  },
  // RCA / Incidents — failure investigation
  {
    intent: "rca",
    agent: "rca",
    patterns: [
      /\b(root cause|rca|incident|failure|breakdown|why did|investigate)/i,
      /\b(open incident|critical incident|unresolved)/i,
    ],
  },
  // Lessons learned — pattern analysis
  {
    intent: "lessons",
    agent: "lessons",
    patterns: [
      /\b(lesson|learned|pattern|recurring|prevent|trend|historical)/i,
    ],
  },
  // Machine recommendation
  {
    intent: "recommendation",
    agent: "machine-recommendation",
    patterns: [
      /\b(recommend|suggest|which machine|best (for|machine)|suitable|vmc|vtl|cnc|grinding)/i,
      /\b(\d+\s*[x×]\s*\d+|workpiece|material|tonnage)/i,
    ],
  },
  // Booking / leads
  {
    intent: "booking",
    agent: "booking",
    patterns: [
      /\b(book|enquir|lead|order|purchase|buy|quote|demo)/i,
    ],
  },
  // Knowledge — document queries, equipment info, general questions (catch-all)
  {
    intent: "knowledge",
    agent: "knowledge",
    patterns: [
      /\b(document|file|upload|pdf|manual|knowledge base|indexed)/i,
      /\b(equipment|machine|health|status)/i,
      /\b(summary|overview|how many|count|total|stats)/i,
      /\b(what|how|explain|describe|tell me|show|list|find|search)/i,
      /./,  // catch-all — everything unmatched goes to knowledge
    ],
  },
];

export function createPlan(query: string, agentHint?: string): ExecutionPlan {
  // If explicit agent specified, use it directly
  if (agentHint && agentManager.get(agentHint)) {
    return {
      primaryAgent: agentHint,
      supportingAgents: [],
      reasoning: `User specified agent: ${agentHint}`,
      confidence: 1.0,
    };
  }

  // Match against intent rules in priority order
  for (const rule of INTENT_RULES) {
    const matched = rule.patterns.some((pattern) => pattern.test(query));
    if (matched) {
      // Skip catch-all regex for confidence scoring
      const specificMatches = rule.patterns.filter((p) => p.source !== "." && p.test(query)).length;
      const confidence = Math.min(0.95, 0.6 + specificMatches * 0.15);

      logger.info({ intent: rule.intent, agent: rule.agent, confidence }, "Plan created");

      return {
        primaryAgent: rule.agent,
        supportingAgents: [],
        reasoning: `Intent: ${rule.intent} (confidence: ${confidence.toFixed(2)})`,
        confidence,
      };
    }
  }

  // Absolute fallback
  return {
    primaryAgent: "knowledge",
    supportingAgents: [],
    reasoning: "No specific intent detected — using knowledge agent",
    confidence: 0.5,
  };
}
