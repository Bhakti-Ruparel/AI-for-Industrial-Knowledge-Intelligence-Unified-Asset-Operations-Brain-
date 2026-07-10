// ═══════════════════════════════════════════════════════════════════════════════
// Agent Manager — Registers and manages all AI agents
// ═══════════════════════════════════════════════════════════════════════════════

import { createLogger } from "@/utils/logger";

const logger = createLogger("orchestrator:agent-manager");

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  execute: (input: AgentInput) => Promise<AgentOutput>;
}

export interface AgentInput {
  query: string;
  context: Record<string, unknown>;
  organizationId: string;
  userId: string;
  conversationHistory?: string[];
}

export interface AgentOutput {
  response: string;
  confidence: number;
  sources: any[];
  actions: { type: string; label: string; payload?: Record<string, unknown> }[];
  metadata?: Record<string, unknown>;
}

class AgentManager {
  private agents = new Map<string, AgentDefinition>();

  register(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
    logger.info({ agentId: agent.id, capabilities: agent.capabilities }, "Agent registered");
  }

  get(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  getAll(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  findByCapability(capability: string): AgentDefinition[] {
    return this.getAll().filter((a) => a.capabilities.includes(capability));
  }

  async execute(agentId: string, input: AgentInput): Promise<AgentOutput> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not registered`);
    }

    logger.info({ agentId, queryLength: input.query.length }, "Executing agent");
    const startTime = Date.now();

    const output = await agent.execute(input);

    logger.info({ agentId, duration: Date.now() - startTime, confidence: output.confidence }, "Agent execution completed");
    return output;
  }
}

export const agentManager = new AgentManager();
