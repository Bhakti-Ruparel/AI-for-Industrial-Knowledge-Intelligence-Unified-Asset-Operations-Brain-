
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'MAINTENANCE', 'OFFLINE', 'CRITICAL', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('MANUAL', 'REPORT', 'REGULATION', 'SOP', 'DRAWING', 'INSPECTION', 'CERTIFICATE', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'INDEXED', 'ERROR', 'FAILED');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETE', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'FAILED');

-- CreateEnum
CREATE TYPE "ComplianceCategory" AS ENUM ('FACTORY_ACT', 'ISO', 'PESO', 'OISD', 'ENVIRONMENTAL');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW', 'EXPIRING');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('EQUIPMENT', 'DOCUMENT', 'PERSON', 'INCIDENT', 'MAINTENANCE', 'PROCESS', 'REGULATION', 'PART', 'LOCATION', 'FAILURE_MODE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'DEMO_SCHEDULED', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'AI_INSIGHT', 'MAINTENANCE_DUE', 'INCIDENT_ALERT', 'COMPLIANCE_ALERT');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "organizationId" TEXT NOT NULL,
    "supabaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "serialNumber" TEXT,
    "categoryId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "floor" TEXT,
    "bay" TEXT,
    "specifications" JSONB,
    "image" TEXT,
    "commissionDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL DEFAULT '',
    "bucketName" TEXT NOT NULL DEFAULT 'industrial-documents',
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT,
    "type" "DocumentType" NOT NULL DEFAULT 'MANUAL',
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "processingStage" TEXT,
    "ocrStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "embeddingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "knowledgeGraphStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "pages" INTEGER,
    "language" TEXT,
    "extractedText" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "equipmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "tokenCount" INTEGER,
    "qdrantPointId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "assignedToId" TEXT,
    "checklist" JSONB,
    "aiRecommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "severity" "Priority" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "rootCause" TEXT,
    "resolution" TEXT,
    "evidence" JSONB,
    "timeline" JSONB,
    "aiAnalysis" TEXT,
    "downtime" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "inspector" TEXT,
    "findings" JSONB,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_records" (
    "id" TEXT NOT NULL,
    "regulation" TEXT NOT NULL,
    "category" "ComplianceCategory" NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "organizationId" TEXT NOT NULL,
    "lastAuditDate" TIMESTAMP(3),
    "nextAuditDate" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "findings" JSONB,
    "evidence" JSONB,
    "riskLevel" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_nodes" (
    "id" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "label" TEXT NOT NULL,
    "properties" JSONB,
    "organizationId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "neo4jId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_edges" (
    "id" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "properties" JSONB,
    "neo4jId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "agentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "equipmentId" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "village" TEXT,
    "industry" TEXT,
    "machineCategory" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "modelLabel" TEXT,
    "purchaseTimeline" TEXT NOT NULL,
    "leadPriority" TEXT NOT NULL,
    "remarks" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'NEW',
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_tags" (
    "documentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "document_tags_pkey" PRIMARY KEY ("documentId","tagId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_slug_key" ON "equipment_categories"("slug");

-- CreateIndex
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");

-- CreateIndex
CREATE INDEX "documents_organizationId_status_idx" ON "documents"("organizationId", "status");

-- CreateIndex
CREATE INDEX "documents_organizationId_type_idx" ON "documents"("organizationId", "type");

-- CreateIndex
CREATE INDEX "documents_organizationId_deletedAt_idx" ON "documents"("organizationId", "deletedAt");

-- CreateIndex
CREATE INDEX "documents_organizationId_createdAt_idx" ON "documents"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "document_chunks_documentId_idx" ON "document_chunks"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_referenceNumber_key" ON "bookings"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_organizationId_key" ON "tags"("name", "organizationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "equipment_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: Default organization and admin user required for document upload FK constraints
-- The app uses organizationId='dev-org-001' and userId='dev-user-001' in dev mode
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO "organizations" ("id", "name", "slug", "plan", "updatedAt")
VALUES ('dev-org-001', 'PlantMind Dev', 'plantmind-dev', 'pro', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "users" ("id", "email", "name", "role", "organizationId", "updatedAt")
VALUES ('dev-user-001', 'admin@plantmind.ai', 'Admin User', 'ADMIN', 'dev-org-001', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Also seed equipment categories so equipment module works
INSERT INTO "equipment_categories" ("id", "name", "slug", "updatedAt") VALUES
  ('cat-vmc',     'VMC',        'vmc',        NOW()),
  ('cat-vtl',     'VTL',        'vtl',        NOW()),
  ('cat-grind',   'Grinding',   'grinding',   NOW()),
  ('cat-5axis',   '5 Axis VMC', '5-axis-vmc', NOW()),
  ('cat-turnmill','Turnmill',   'turnmill',   NOW())
ON CONFLICT ("slug") DO NOTHING;
