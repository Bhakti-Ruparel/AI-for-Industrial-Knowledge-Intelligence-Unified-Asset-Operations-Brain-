// ═══════════════════════════════════════════════════════════════════════════════
// Equipment Repository
// ═══════════════════════════════════════════════════════════════════════════════

import { BaseRepository } from "./base.repository";

export class EquipmentRepository extends BaseRepository<any> {
  protected readonly model = "equipment";

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
