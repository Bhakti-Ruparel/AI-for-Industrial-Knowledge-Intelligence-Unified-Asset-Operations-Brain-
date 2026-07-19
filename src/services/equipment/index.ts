
// ═══════════════════════════════════════════════════════════════════════════════
// Equipment Service
// ═══════════════════════════════════════════════════════════════════════════════

import { equipmentRepository } from "@/repositories";
import { prisma } from "@/lib/prisma";
import { filterMachines, getMachineData } from "@/services/machines";
import type { PaginationOptions } from "@/repositories";

export async function getEquipmentList(organizationId: string, options: PaginationOptions) {
  return equipmentRepository.findMany(organizationId, options);
}

export async function getEquipmentById(id: string, organizationId: string) {
  return equipmentRepository.findById(id, organizationId);
}

export async function createEquipment(data: any, organizationId: string) {
  return equipmentRepository.create({ ...data, organizationId });
}

export async function updateEquipment(id: string, organizationId: string, data: any) {
  return equipmentRepository.update(id, organizationId, data);
}

export async function deleteEquipment(id: string, organizationId: string) {
  return equipmentRepository.softDelete(id, organizationId);
}

export async function getCriticalEquipment(organizationId: string) {
  return equipmentRepository.findCritical(organizationId);
}

export async function getEquipmentHealthSummary(organizationId: string) {
  const [total, operational, maintenance, critical, offline, healthAgg] = await Promise.all([
    equipmentRepository.count(organizationId),
    equipmentRepository.count(organizationId, { status: "OPERATIONAL" }),
    equipmentRepository.count(organizationId, { status: "MAINTENANCE" }),
    equipmentRepository.count(organizationId, { status: "CRITICAL" }),
    equipmentRepository.count(organizationId, { status: "OFFLINE" }),
    prisma ? (prisma as any).equipment.aggregate({
      where: { organizationId, deletedAt: null },
      _avg: { healthScore: true },
    }) : { _avg: { healthScore: null } },
  ]);

  return {
    total,
    operational,
    maintenance,
    critical,
    offline,
    averageHealth: Math.round(healthAgg._avg?.healthScore ?? 0),
  };
}

// Re-export machine recommendation (existing logic)
export { filterMachines, getMachineData };
