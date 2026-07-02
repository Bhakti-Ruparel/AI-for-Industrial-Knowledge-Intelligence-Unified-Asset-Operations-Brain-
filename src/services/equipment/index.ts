// ═══════════════════════════════════════════════════════════════════════════════
// Equipment Service
// ═══════════════════════════════════════════════════════════════════════════════

import { equipmentRepository } from "@/repositories";
import { filterMachines, getMachineData } from "@/services/machines";
import { createLogger } from "@/utils/logger";
import type { PaginationOptions } from "@/repositories";

const logger = createLogger("equipment-service");

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
  // TODO: Aggregate health scores from DB
  return {
    total: 24,
    operational: 18,
    maintenance: 3,
    critical: 2,
    offline: 1,
    averageHealth: 82,
  };
}

// Re-export machine recommendation (existing logic)
export { filterMachines, getMachineData };
