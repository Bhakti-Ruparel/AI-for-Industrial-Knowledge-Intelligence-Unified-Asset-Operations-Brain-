// ═══════════════════════════════════════════════════════════════════════════════
// AI Orchestrator — Entry point for all AI interactions
// ═══════════════════════════════════════════════════════════════════════════════

import { agentManager, type AgentInput, type AgentOutput } from "./agent-manager";
import { createPlan } from "./planner";
import { buildContext } from "./context-builder";
import { orchestratorMemory } from "./memory";
import { createLogger } from "@/utils/logger";

const logger = createLogger("orchestrator");

export interface OrchestratorInput {
  query: string;
  organizationId: string;
  userId: string;
  conversationId?: string;
  agentHint?: string;
}

export interface OrchestratorOutput {
  response: string;
  confidence: number;
  agentUsed: string;
  plan: { primaryAgent: string; reasoning: string };
  sources: any[];
  actions: any[];
  metadata?: Record<string, unknown>;
}

export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const { query, organizationId, userId, conversationId, agentHint } = input;

  logger.info({ userId, agentHint, queryLength: query.length }, "Orchestration started");

  // Step 1: Plan execution
  const plan = createPlan(query, agentHint);

  // Step 2: Build context
  const conversationHistory = conversationId
    ? orchestratorMemory.getConversationContext(conversationId)
    : [];
  const context = await buildContext(query, organizationId, conversationHistory);

  // Step 3: Execute primary agent
  const agentInput: AgentInput = {
    query,
    context: {
      relevantChunks: context.relevantChunks,
      equipmentContext: context.equipmentContext,
      conversationHistory: context.conversationHistory,
    },
    organizationId,
    userId,
    conversationHistory: context.conversationHistory,
  };

  let output: AgentOutput;
  try {
    output = await agentManager.execute(plan.primaryAgent, agentInput);
  } catch (error) {
    // Fallback to knowledge agent
    logger.warn({ primaryAgent: plan.primaryAgent, error }, "Primary agent failed, falling back to knowledge");
    try {
      output = await agentManager.execute("knowledge", agentInput);
    } catch {
      output = {
        response: "I'm unable to process your request at the moment. Please ensure AI services are configured.",
        confidence: 0,
        sources: [],
        actions: [],
      };
    }
  }

  // Step 4: Update memory
  if (conversationId) {
    orchestratorMemory.appendConversation(conversationId, `User: ${query}`);
    orchestratorMemory.appendConversation(conversationId, `Assistant: ${output.response.substring(0, 200)}`);
  }

  return {
    response: output.response,
    confidence: output.confidence,
    agentUsed: plan.primaryAgent,
    plan: { primaryAgent: plan.primaryAgent, reasoning: plan.reasoning },
    sources: output.sources,
    actions: output.actions,
    metadata: output.metadata,
  };
}

export { agentManager } from "./agent-manager";
export type { AgentDefinition, AgentInput, AgentOutput } from "./agent-manager";
