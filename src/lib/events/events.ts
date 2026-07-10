// ═══════════════════════════════════════════════════════════════════════════════
// Event Definitions — All domain events in the system
// ═══════════════════════════════════════════════════════════════════════════════

export enum EventType {
  // Document lifecycle
  DOCUMENT_UPLOADED = "document.uploaded",
  OCR_COMPLETED = "document.ocr.completed",
  OCR_FAILED = "document.ocr.failed",
  ENTITIES_EXTRACTED = "document.entities.extracted",
  RELATIONSHIPS_EXTRACTED = "document.relationships.extracted",
  DOCUMENT_CHUNKED = "document.chunked",
  EMBEDDING_CREATED = "document.embedding.created",
  VECTOR_STORED = "document.vector.stored",
  KNOWLEDGE_GRAPH_UPDATED = "document.graph.updated",
  DOCUMENT_INDEXED = "document.indexed",
  DOCUMENT_PROCESSING_FAILED = "document.processing.failed",

  // Equipment
  EQUIPMENT_CREATED = "equipment.created",
  EQUIPMENT_UPDATED = "equipment.updated",
  EQUIPMENT_HEALTH_CHANGED = "equipment.health.changed",
  EQUIPMENT_CRITICAL = "equipment.critical",

  // Maintenance
  MAINTENANCE_SCHEDULED = "maintenance.scheduled",
  MAINTENANCE_STARTED = "maintenance.started",
  MAINTENANCE_COMPLETED = "maintenance.completed",
  MAINTENANCE_OVERDUE = "maintenance.overdue",
  MAINTENANCE_GENERATED = "maintenance.ai.generated",

  // Incidents
  INCIDENT_CREATED = "incident.created",
  INCIDENT_ESCALATED = "incident.escalated",
  INCIDENT_RESOLVED = "incident.resolved",
  RCA_COMPLETED = "incident.rca.completed",

  // Compliance
  COMPLIANCE_CHECKED = "compliance.checked",
  COMPLIANCE_EXPIRING = "compliance.expiring",
  COMPLIANCE_VIOLATION = "compliance.violation",

  // AI
  AI_QUERY_RECEIVED = "ai.query.received",
  AI_RESPONSE_GENERATED = "ai.response.generated",
  AGENT_TASK_STARTED = "agent.task.started",
  AGENT_TASK_COMPLETED = "agent.task.completed",

  // Booking
  BOOKING_CREATED = "booking.created",
  LEAD_QUALIFIED = "booking.lead.qualified",
}

export interface DomainEvent<T = unknown> {
  id: string;
  type: EventType;
  timestamp: string;
  organizationId: string;
  userId?: string;
  payload: T;
  metadata?: Record<string, unknown>;
}

// ── Payload Types ────────────────────────────────────────────────────────────

export interface DocumentUploadedPayload {
  documentId: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

export interface OCRCompletedPayload {
  documentId: string;
  text: string;
  pages: number;
  confidence: number;
}

export interface EntitiesExtractedPayload {
  documentId: string;
  entities: ExtractedEntity[];
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  position?: { start: number; end: number };
  metadata?: Record<string, unknown>;
}

export interface EmbeddingCreatedPayload {
  documentId: string;
  chunkCount: number;
  vectorIds: string[];
}

export interface KnowledgeGraphUpdatedPayload {
  documentId: string;
  nodesCreated: number;
  edgesCreated: number;
}

export interface EquipmentHealthPayload {
  equipmentId: string;
  previousScore: number;
  currentScore: number;
  reason: string;
}

export interface MaintenanceGeneratedPayload {
  equipmentId: string;
  maintenanceId: string;
  type: string;
  reason: string;
}
