// ═══════════════════════════════════════════════════════════════════════════════
// Workflow Engine — Types and base abstractions
// ═══════════════════════════════════════════════════════════════════════════════

export type WorkflowStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";

export interface WorkflowStep {
  id: string;
  name: string;
  status: WorkflowStatus;
  executedAt?: string;
  result?: unknown;
  error?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStepDefinition[];
  trigger?: string; // Event that auto-triggers this workflow
}

export interface WorkflowStepDefinition {
  id: string;
  name: string;
  execute: (context: WorkflowContext) => Promise<unknown>;
  rollback?: (context: WorkflowContext) => Promise<void>;
  condition?: (context: WorkflowContext) => boolean;
}

export interface WorkflowContext {
  workflowId: string;
  organizationId: string;
  userId?: string;
  data: Record<string, unknown>;
  completedSteps: WorkflowStep[];
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: WorkflowStatus;
  context: WorkflowContext;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
}
