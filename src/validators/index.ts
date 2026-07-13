// ═══════════════════════════════════════════════════════════════════════════════
// Zod Validation Schemas
// ═══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";

// ── Common ───────────────────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().optional(),
  agentType: z.enum(["knowledge", "maintenance", "compliance", "rca", "document", "recommendation", "booking"]).optional(),
});

// ── Documents ────────────────────────────────────────────────────────────────
export const documentUploadSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(["MANUAL", "REPORT", "REGULATION", "SOP", "DRAWING", "INSPECTION", "CERTIFICATE", "INVOICE", "OTHER"]).default("OTHER"),
  equipmentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const documentQuerySchema = z.object({
  page:        z.coerce.number().min(1).default(1),
  limit:       z.coerce.number().min(1).max(100).default(20),
  sortBy:      z.string().optional(),
  sortOrder:   z.enum(["asc", "desc"]).default("desc"),
  search:      z.string().optional(),
  status:      z.enum(["UPLOADED","PROCESSING","INDEXED","ERROR","FAILED"]).optional(),
  type:        z.enum(["MANUAL","REPORT","REGULATION","SOP","DRAWING","INSPECTION","CERTIFICATE","INVOICE","OTHER"]).optional(),
  equipmentId: z.string().optional(),
  dateFrom:    z.string().optional(),
  dateTo:      z.string().optional(),
});

// ── Equipment ────────────────────────────────────────────────────────────────
export const createEquipmentSchema = z.object({
  name: z.string().min(1).max(255),
  model: z.string().min(1),
  series: z.string().min(1),
  serialNumber: z.string().optional(),
  categoryId: z.string(),
  location: z.string().optional(),
  floor: z.string().optional(),
  bay: z.string().optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  commissionDate: z.string().datetime().optional(),
  warrantyExpiry: z.string().datetime().optional(),
});

// ── Maintenance ──────────────────────────────────────────────────────────────
export const createMaintenanceSchema = z.object({
  equipmentId: z.string(),
  type: z.enum(["PREVENTIVE", "CORRECTIVE", "PREDICTIVE", "EMERGENCY"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledDate: z.string().datetime(),
  estimatedHours: z.number().positive().optional(),
  assignedToId: z.string().optional(),
  checklist: z.array(z.object({ label: z.string(), completed: z.boolean().default(false) })).optional(),
});

// ── Incidents ────────────────────────────────────────────────────────────────
export const createIncidentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  equipmentId: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  evidence: z.array(z.object({ type: z.string(), title: z.string(), url: z.string() })).optional(),
});

// ── Compliance ───────────────────────────────────────────────────────────────
export const createComplianceSchema = z.object({
  regulation: z.string().min(1),
  category: z.enum(["FACTORY_ACT", "ISO", "PESO", "OISD", "ENVIRONMENTAL"]),
  lastAuditDate: z.string().datetime().optional(),
  nextAuditDate: z.string().datetime().optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

// ── Booking / Leads ──────────────────────────────────────────────────────────
export const createBookingSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  phone: z.string().regex(/^\d{10}$/, "Must be 10-digit mobile number"),
  email: z.string().email(),
  state: z.string().min(1),
  city: z.string().min(1),
  village: z.string().optional(),
  industry: z.string().optional(),
  machineCategory: z.string().min(1),
  series: z.string().min(1),
  model: z.string().min(1),
  modelLabel: z.string().optional(),
  purchaseTimeline: z.string().min(1),
  remarks: z.string().optional(),
});

// ── Knowledge Graph ──────────────────────────────────────────────────────────
export const createNodeSchema = z.object({
  type: z.enum(["EQUIPMENT", "DOCUMENT", "PERSON", "INCIDENT", "MAINTENANCE", "PROCESS", "REGULATION", "PART", "LOCATION", "FAILURE_MODE"]),
  label: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).optional(),
  equipmentId: z.string().optional(),
});

export const createEdgeSchema = z.object({
  fromNodeId: z.string(),
  toNodeId: z.string(),
  relationship: z.string().min(1),
  weight: z.number().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

// ── Search ───────────────────────────────────────────────────────────────────
export const searchSchema = z.object({
  query: z.string().min(1).max(500),
  types: z.array(z.string()).optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});
