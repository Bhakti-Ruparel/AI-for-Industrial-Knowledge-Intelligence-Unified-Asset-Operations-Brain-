// ═══════════════════════════════════════════════════════════════════════════════
// Agent Registry — Bootstraps all agents into the orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

import { agentManager } from "@/lib/ai/orchestrator";
import { knowledgeAgent } from "./knowledge";
import { maintenanceAgent } from "./maintenance";
import { complianceAgent } from "./compliance";
import { rcaAgent } from "./rca";
import { lessonsAgent } from "./lessons";
import { bookingAgent } from "./booking";
import { machineRecommendationAgent } from "./machine-recommendation";

let initialized = false;

export function initializeAgents(): void {
  if (initialized) return;

  agentManager.register(knowledgeAgent);
  agentManager.register(maintenanceAgent);
  agentManager.register(complianceAgent);
  agentManager.register(rcaAgent);
  agentManager.register(lessonsAgent);
  agentManager.register(bookingAgent);
  agentManager.register(machineRecommendationAgent);

  initialized = true;
}
