// ═══════════════════════════════════════════════════════════════════════════════
// COSMOS AI PLATFORM — Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

// ── Chat / Copilot ───────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  sources?: Source[];
  actions?: AIAction[];
}

export interface Source {
  id: string;
  title: string;
  type: "document" | "equipment" | "regulation" | "manual";
  relevance: number;
  snippet?: string;
}

export interface AIAction {
  id: string;
  label: string;
  type: "navigate" | "create" | "update" | "analyze";
  payload?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

// ── Documents ────────────────────────────────────────────────────────────────
export interface Document {
  id: string;
  title: string;
  type: "manual" | "report" | "regulation" | "sop" | "drawing";
  status: "processing" | "indexed" | "error";
  uploadedAt: string;
  size: number;
  pages?: number;
  tags: string[];
  embedding_status: "pending" | "complete" | "failed";
  ocr_status?: "pending" | "complete" | "failed";
}

// ── Equipment ────────────────────────────────────────────────────────────────
export interface Equipment {
  id: string;
  name: string;
  model: string;
  series: string;
  category: "VMC" | "VTL" | "Grinding" | "5 Axis VMC" | "Turnmill";
  status: "operational" | "maintenance" | "offline" | "critical";
  healthScore: number;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  specifications: Record<string, string | number>;
  documents: string[];
}

// ── Maintenance ──────────────────────────────────────────────────────────────
export interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: "preventive" | "corrective" | "predictive";
  priority: "low" | "medium" | "high" | "critical";
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  scheduledDate: string;
  completedDate?: string;
  assignee: string;
  description: string;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

// ── Incidents ────────────────────────────────────────────────────────────────
export interface Incident {
  id: string;
  title: string;
  equipmentId: string;
  equipmentName: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  reportedAt: string;
  resolvedAt?: string;
  rootCause?: string;
  description: string;
  evidence: Evidence[];
  timeline: TimelineEvent[];
}

export interface Evidence {
  id: string;
  type: "image" | "log" | "document" | "sensor_data";
  title: string;
  url: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  user: string;
  type: "created" | "updated" | "resolved" | "comment";
}

// ── Compliance ───────────────────────────────────────────────────────────────
export interface ComplianceItem {
  id: string;
  regulation: string;
  category: "factory_act" | "iso" | "peso" | "oisd";
  status: "compliant" | "non_compliant" | "pending_review" | "expiring";
  lastAudit: string;
  nextAudit: string;
  score: number;
  findings: string[];
}

// ── Analytics ────────────────────────────────────────────────────────────────
export interface KPI {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number;
  changeType: "increase" | "decrease";
  period: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// ── Agents ───────────────────────────────────────────────────────────────────
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: "knowledge" | "maintenance" | "compliance" | "rca";
  status: "active" | "idle" | "processing";
  tasksCompleted: number;
  accuracy: number;
  lastActive: string;
  icon: string;
}

// ── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

// ── Booking / Leads ──────────────────────────────────────────────────────────
export interface Lead {
  id: string;
  reference_number: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  industry: string;
  machine_category: string;
  series: string;
  model: string;
  purchase_timeline: string;
  lead_priority: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  leadId: string;
  equipmentId: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledDate: string;
  notes: string;
}

// ── User (legacy interface — prefer AuthUser from @/types/auth for auth context) ──
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "engineer" | "operator" | "viewer";
  avatar?: string;
}

// Re-export auth types for convenience
export type { AuthUser, UserRole } from "@/types/auth";

// ── Knowledge Graph ──────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  type: "equipment" | "document" | "regulation" | "incident" | "person";
  label: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
}
