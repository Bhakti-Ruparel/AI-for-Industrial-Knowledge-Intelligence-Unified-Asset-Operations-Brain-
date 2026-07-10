// ═══════════════════════════════════════════════════════════════════════════════
// Workflow Engine — Executes multi-step workflows with rollback support
// ═══════════════════════════════════════════════════════════════════════════════

import { v4 as uuid } from "uuid";
import { createLogger } from "@/utils/logger";
import type { WorkflowDefinition, WorkflowInstance, WorkflowContext, WorkflowStep } from "./types";

const logger = createLogger("workflow-engine");

class WorkflowEngine {
  private definitions = new Map<string, WorkflowDefinition>();
  private instances = new Map<string, WorkflowInstance>();

  register(definition: WorkflowDefinition): void {
    this.definitions.set(definition.id, definition);
    logger.info({ workflowId: definition.id, steps: definition.steps.length }, "Workflow registered");
  }

  async execute(definitionId: string, data: Record<string, unknown>, organizationId: string, userId?: string): Promise<WorkflowInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) throw new Error(`Workflow '${definitionId}' not registered`);

    const instanceId = uuid();
    const context: WorkflowContext = {
      workflowId: instanceId,
      organizationId,
      userId,
      data,
      completedSteps: [],
    };

    const instance: WorkflowInstance = {
      id: instanceId,
      definitionId,
      status: "in_progress",
      context,
      steps: [],
      startedAt: new Date().toISOString(),
    };

    this.instances.set(instanceId, instance);
    logger.info({ instanceId, definitionId }, "Workflow started");

    for (const stepDef of definition.steps) {
      // Check condition
      if (stepDef.condition && !stepDef.condition(context)) {
        instance.steps.push({ id: stepDef.id, name: stepDef.name, status: "cancelled" });
        continue;
      }

      const step: WorkflowStep = { id: stepDef.id, name: stepDef.name, status: "in_progress" };

      try {
        const result = await stepDef.execute(context);
        step.status = "completed";
        step.result = result;
        step.executedAt = new Date().toISOString();
        context.completedSteps.push(step);
      } catch (error: any) {
        step.status = "failed";
        step.error = error.message;
        instance.steps.push(step);
        instance.status = "failed";

        // Rollback completed steps in reverse
        for (const completed of [...context.completedSteps].reverse()) {
          const completedDef = definition.steps.find((s) => s.id === completed.id);
          if (completedDef?.rollback) {
            try { await completedDef.rollback(context); } catch { /* Best effort */ }
          }
        }

        logger.error({ instanceId, stepId: stepDef.id, error: error.message }, "Workflow step failed");
        return instance;
      }

      instance.steps.push(step);
    }

    instance.status = "completed";
    instance.completedAt = new Date().toISOString();
    logger.info({ instanceId, duration: Date.now() - new Date(instance.startedAt).getTime() }, "Workflow completed");
    return instance;
  }

  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }
}

export const workflowEngine = new WorkflowEngine();
