// ═══════════════════════════════════════════════════════════════════════════════
// Maintenance Service — Prisma queries
// ═══════════════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { createLogger } from "@/utils/logger";
import { NotFoundError } from "@/utils/errors";

const logger = createLogger("maintenance-service");

export interface MaintenanceParams {
  page?:      number;
  limit?:     number;
  status?:    string;
  priority?:  string;
  search?:    string;
}

export interface CreateMaintenanceInput {
  equipmentId:   string;
  type:          string;
  priority?:     string;
  title:         string;
  description?:  string;
  scheduledDate: string;
  assignedToId?: string;
}

export async function getMaintenanceList(organizationId: string, params: MaintenanceParams) {
  const page  = Math.max(1, params.page  ?? 1);
  const limit = Math.min(100, params.limit ?? 20);
  const skip  = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId, deletedAt: null };
  if (params.status)   where.status   = params.status;
  if (params.priority) where.priority = params.priority;
  if (params.search) {
    where.OR = [
      { title:       { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [records, total] = await Promise.all([
    (prisma as any).maintenanceRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ status: "asc" }, { scheduledDate: "asc" }],
      include: {
        equipment:  { select: { id: true, name: true, model: true, series: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    (prisma as any).maintenanceRecord.count({ where }),
  ]);

  return {
    data:  records.map(formatRecord),
    total,
    page,
    limit,
  };
}

export async function createMaintenanceRecord(input: CreateMaintenanceInput, organizationId: string) {
  const record = await (prisma as any).maintenanceRecord.create({
    data: {
      organizationId,
      equipmentId:   input.equipmentId,
      type:          input.type         || "PREVENTIVE",
      priority:      input.priority     || "MEDIUM",
      title:         input.title,
      description:   input.description,
      scheduledDate: new Date(input.scheduledDate),
      status:        "SCHEDULED",
      assignedToId:  input.assignedToId,
    },
    include: {
      equipment:  { select: { id: true, name: true, model: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
  return formatRecord(record);
}

function formatRecord(r: any) {
  return {
    id:              r.id,
    equipmentId:     r.equipmentId,
    equipmentName:   r.equipment?.name,
    type:            r.type,
    priority:        r.priority,
    status:          r.status,
    title:           r.title,
    description:     r.description,
    scheduledDate:   r.scheduledDate?.toISOString(),
    startedAt:       r.startedAt?.toISOString(),
    completedAt:     r.completedAt?.toISOString(),
    assignedToId:    r.assignedToId,
    assignedToName:  r.assignedTo?.name,
    checklist:       r.checklist,
    aiRecommendation: r.aiRecommendation,
    createdAt:       r.createdAt?.toISOString(),
  };
}
