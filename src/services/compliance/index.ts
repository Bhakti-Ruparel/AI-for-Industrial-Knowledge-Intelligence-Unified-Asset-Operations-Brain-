// ═══════════════════════════════════════════════════════════════════════════════
// Compliance Service — Prisma queries
// ═══════════════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { createLogger } from "@/utils/logger";

const logger = createLogger("compliance-service");

export interface ComplianceParams {
  page?:     number;
  limit?:    number;
  status?:   string;
  category?: string;
  search?:   string;
}

export interface CreateComplianceInput {
  regulation:    string;
  category:      string;
  lastAuditDate?: string;
  nextAuditDate?: string;
  riskLevel?:    string;
  score?:        number;
  status?:       string;
}

export async function getComplianceList(organizationId: string, params: ComplianceParams) {
  const page  = Math.max(1, params.page  ?? 1);
  const limit = Math.min(100, params.limit ?? 20);
  const skip  = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId, deletedAt: null };
  if (params.status)   where.status   = params.status;
  if (params.category) where.category = params.category;
  if (params.search) {
    where.OR = [
      { regulation: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [records, total] = await Promise.all([
    (prisma as any).complianceRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    (prisma as any).complianceRecord.count({ where }),
  ]);

  return {
    data:  records.map(formatRecord),
    total,
    page,
    limit,
  };
}

export async function createComplianceRecord(
  input: CreateComplianceInput,
  organizationId: string,
) {
  const record = await (prisma as any).complianceRecord.create({
    data: {
      organizationId,
      regulation:    input.regulation,
      category:      input.category || "ISO",
      riskLevel:     input.riskLevel || "MEDIUM",
      status:        input.status || "PENDING_REVIEW",
      score:         input.score ?? null,
      lastAuditDate: input.lastAuditDate ? new Date(input.lastAuditDate) : null,
      nextAuditDate: input.nextAuditDate ? new Date(input.nextAuditDate) : null,
      findings:      [],
      evidence:      [],
    },
  });
  return formatRecord(record);
}

function formatRecord(r: any) {
  return {
    id:            r.id,
    regulation:    r.regulation,
    category:      r.category,
    status:        r.status,
    organizationId: r.organizationId,
    lastAuditDate: r.lastAuditDate
      ? new Date(r.lastAuditDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : null,
    nextAuditDate: r.nextAuditDate
      ? new Date(r.nextAuditDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : null,
    score:    r.score,
    findings: r.findings ?? [],
    evidence: r.evidence ?? [],
    riskLevel: r.riskLevel,
    createdAt: r.createdAt?.toISOString(),
  };
}
