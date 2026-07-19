// ═══════════════════════════════════════════════════════════════════════════════
// Equipment Repository
// ═══════════════════════════════════════════════════════════════════════════════

import { BaseRepository, type PaginationOptions, type PaginatedResult } from "./base.repository";
import { prisma } from "@/lib/database/prisma/client";

export class EquipmentRepository extends BaseRepository<any> {
  protected readonly model = "equipment";

  // Override findMany to include category relation
  async findMany(
    organizationId: string,
    options: PaginationOptions,
    where: Record<string, unknown> = {}
  ): Promise<PaginatedResult<any>> {
    if (!prisma) {
      return { data: [], total: 0, page: options.page, limit: options.limit, totalPages: 0 };
    }
    const { page, limit, sortBy = "createdAt", sortOrder = "desc" } = options;
    const skip = (page - 1) * limit;
    const baseWhere = { ...where, organizationId, deletedAt: null };

    try {
      const [rows, total] = await Promise.all([
        (prisma as any).equipment.findMany({
          where:   baseWhere,
          skip,
          take:    limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            category:           { select: { name: true } },
            maintenanceRecords: {
              where:   { deletedAt: null, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
              orderBy: { scheduledDate: "asc" },
              take:    1,
              select:  { scheduledDate: true },
            },
            _count: { select: { documents: true } },
          },
        }),
        (prisma as any).equipment.count({ where: baseWhere }),
      ]);

      const data = rows.map((eq: any) => ({
        id:              eq.id,
        name:            eq.name,
        model:           eq.model,
        series:          eq.series,
        category:        eq.category?.name ?? eq.categoryId,
        status:          (eq.status as string).toLowerCase(),
        healthScore:     eq.healthScore,
        riskScore:       eq.riskScore,
        location:        eq.location,
        floor:           eq.floor,
        bay:             eq.bay,
        nextMaintenance: eq.maintenanceRecords?.[0]?.scheduledDate?.toISOString().split("T")[0] ?? null,
        documents:       Array.from({ length: eq._count.documents }),
        specifications:  eq.specifications,
        serialNumber:    eq.serialNumber,
        createdAt:       eq.createdAt?.toISOString(),
      }));

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (err: any) {
      if (["P2021", "P2022", "P1001", "P1002", "P1003"].includes(err?.code)) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      throw err;
    }
  }

  async findByStatus(organizationId: string, status: string) {
    return this.db.findMany({
      where: { organizationId, status, deletedAt: null },
      include: { category: true },
    });
  }

  async findCritical(organizationId: string) {
    return this.db.findMany({
      where: { organizationId, healthScore: { lte: 50 }, deletedAt: null },
      orderBy: { healthScore: "asc" },
      take: 10,
    });
  }

  async updateHealthScore(id: string, score: number) {
    return this.db.update({
      where: { id },
      data: { healthScore: score, riskScore: 100 - score },
    });
  }
}

export const equipmentRepository = new EquipmentRepository();
