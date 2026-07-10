// ═══════════════════════════════════════════════════════════════════════════════
// Planner — Selects which agent(s) to invoke based on query analysis
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

const INTENT_PATTERNS: Record<string, { agents: string[]; keywords: string[] }> = {
  knowledge: { agents: ["knowledge"], keywords: ["what", "how", "explain", "describe", "tell me", "information", "details"] },
  maintenance: { agents: ["maintenance"], keywords: ["maintenance", "service", "repair", "schedule", "preventive", "lubrication", "overdue"] },
  compliance: { agents: ["compliance"], keywords: ["compliance", "iso", "factory act", "peso", "oisd", "regulation", "audit", "certificate"] },
  rca: { agents: ["rca"], keywords: ["root cause", "why did", "failure", "breakdown", "incident", "investigate"] },
  recommendation: { agents: ["machine-recommendation"], keywords: ["recommend", "suggest", "which machine", "best for", "suitable"] },
  booking: { agents: ["booking"], keywords: ["book", "enquiry", "lead", "order", "purchase", "buy", "quote"] },
  lessons: { agents: ["lessons"], keywords: ["lessons", "learned", "pattern", "similar", "previous", "history", "trend"] },
};

export function createPlan(query: string, agentHint?: string): ExecutionPlan {
  // If explicit agent specified, use it
  if (agentHint && agentManager.get(agentHint)) {
    return {
      primaryAgent: agentHint,
      supportingAgents: [],
      reasoning: `User specified agent: ${agentHint}`,
      confidence: 1.0,
    };
  }

  // Analyze query intent
  const lowerQuery = query.toLowerCase();
  let bestMatch = { intent: "knowledge", score: 0 };

  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    const score = config.keywords.filter((kw) => lowerQuery.includes(kw)).length / config.keywords.length;
    if (score > bestMatch.score) {
      bestMatch = { intent, score };
    }
  }

  const config = INTENT_PATTERNS[bestMatch.intent];
  const primaryAgent = config.agents[0];

  // Add supporting agents if confidence is low
  const supportingAgents = bestMatch.score < 0.3 ? ["knowledge"] : [];

  logger.info({ intent: bestMatch.intent, primaryAgent, confidence: bestMatch.score }, "Plan created");

  return {
    primaryAgent,
    supportingAgents: supportingAgents.filter((a) => a !== primaryAgent),
    reasoning: `Intent detected: ${bestMatch.intent} (score: ${bestMatch.score.toFixed(2)})`,
    confidence: Math.max(bestMatch.score, 0.5),
  };
}
