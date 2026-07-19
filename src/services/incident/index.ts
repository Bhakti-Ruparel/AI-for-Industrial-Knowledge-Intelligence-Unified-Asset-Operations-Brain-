// ═══════════════════════════════════════════════════════════════════════════════
// Incident Service — Prisma queries
// ═══════════════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { createLogger } from "@/utils/logger";
import { NotFoundError } from "@/utils/errors";

const logger = createLogger("incident-service");

export interface IncidentParams {
  page?:     number;
  limit?:    number;
  status?:   string;
  severity?: string;
  search?:   string;
}

export interface CreateIncidentInput {
  title:       string;
  description: string;
  equipmentId: string;
  severity:    string;
  evidence?:   { type: string; title: string; url: string }[];
}

export async function getIncidentList(organizationId: string, params: IncidentParams) {
  const page  = Math.max(1, params.page  ?? 1);
  const limit = Math.min(100, params.limit ?? 20);
  const skip  = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId, deletedAt: null };
  if (params.status)   where.status   = params.status;
  if (params.severity) where.severity = params.severity;
  if (params.search) {
    where.OR = [
      { title:       { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [records, total] = await Promise.all([
    (prisma as any).incident.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ status: "asc" }, { reportedAt: "desc" }],
      include: {
        equipment:  { select: { id: true, name: true, model: true } },
        reportedBy: { select: { id: true, name: true } },
      },
    }),
    (prisma as any).incident.count({ where }),
  ]);

  return {
    data:  records.map(formatRecord),
    total,
    page,
    limit,
  };
}

export async function createIncident(
  input: CreateIncidentInput,
  organizationId: string,
  reportedById: string,
) {
  const record = await (prisma as any).incident.create({
    data: {
      organizationId,
      reportedById,
      equipmentId: input.equipmentId,
      title:       input.title,
      description: input.description,
      severity:    input.severity || "MEDIUM",
      status:      "OPEN",
      evidence:    input.evidence ?? [],
      timeline:    [
        {
          id:          `tl-${Date.now()}`,
          timestamp:   new Date().toISOString(),
          description: "Incident reported",
          user:        "System",
          type:        "created",
        },
      ],
      reportedAt: new Date(),
    },
    include: {
      equipment:  { select: { id: true, name: true, model: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });
  return formatRecord(record);
}

function formatRecord(r: any) {
  return {
    id:            r.id,
    title:         r.title,
    description:   r.description,
    equipmentId:   r.equipmentId,
    equipmentName: r.equipment?.name,
    severity:      r.severity,
    status:        r.status,
    rootCause:     r.rootCause,
    resolution:    r.resolution,
    evidence:      r.evidence ?? [],
    timeline:      r.timeline ?? [],
    aiAnalysis:    r.aiAnalysis,
    downtime:      r.downtime,
    cost:          r.cost,
    reportedAt:    r.reportedAt?.toISOString(),
    resolvedAt:    r.resolvedAt?.toISOString(),
    organizationId: r.organizationId,
    createdAt:     r.createdAt?.toISOString(),
  };
}
