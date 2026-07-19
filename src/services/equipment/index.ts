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
  // Resolve categoryId — if it's a slug (not a CUID), find-or-create the category
  let categoryId = data.categoryId;
  if (prisma && categoryId && !categoryId.startsWith("c")) {
    // Likely a slug like "vmc", "grinding", etc.
    const slug = categoryId.toLowerCase().replace(/\s+/g, "-");
    let category = await (prisma as any).equipmentCategory.findUnique({
      where: { slug },
    });
    if (!category) {
      // Auto-create the category
      const nameMap: Record<string, string> = {
        vmc: "VMC", vtl: "VTL", grinding: "Grinding",
        "5axis": "5 Axis VMC", "5-axis-vmc": "5 Axis VMC",
        turnmill: "Turnmill", other: "Other",
      };
      category = await (prisma as any).equipmentCategory.create({
        data: { name: nameMap[slug] ?? slug.toUpperCase(), slug },
      });
    }
    categoryId = category.id;
  }

  return equipmentRepository.create({ ...data, categoryId, organizationId });
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