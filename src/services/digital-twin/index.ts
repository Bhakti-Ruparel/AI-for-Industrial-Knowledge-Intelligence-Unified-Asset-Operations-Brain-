// ═══════════════════════════════════════════════════════════════════════════════
// Digital Twin — Aggregates real equipment state from Prisma
// ═══════════════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { createLogger } from "@/utils/logger";

const logger = createLogger("digital-twin");

export interface DigitalTwin {
  equipmentId: string;
  name: string;
  model: string;
  status: string;
  healthScore: number;
  riskScore: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  maintenanceHistory: MaintenanceEvent[];
  incidents: IncidentSummary[];
  documents: DocumentRef[];
  complianceStatus: ComplianceState;
  predictions: Prediction[];
  aiSummary: string;
}

interface MaintenanceEvent {
  id: string;
  type: string;
  date: string;
  description: string;
  status: string;
}

interface IncidentSummary {
  id: string;
  title: string;
  severity: string;
  date: string;
  resolved: boolean;
}

interface DocumentRef {
  id: string;
  title: string;
  type: string;
}

interface ComplianceState {
  overallStatus: "compliant" | "non_compliant" | "pending";
  items: { regulation: string; status: string; nextAudit: string }[];
}

interface Prediction {
  type: string;
  description: string;
  probability: number;
  timeframe: string;
  recommendation: string;
}

export async function getDigitalTwin(
  equipmentId: string,
  organizationId: string,
): Promise<DigitalTwin | null> {
  if (!prisma) {
    logger.warn("Prisma unavailable — returning null digital twin");
    return null;
  }

  try {
    // Fetch equipment with all related data in parallel
    const [equipment, maintenanceRecords, incidents, documents] = await Promise.all([
      (prisma as any).equipment.findFirst({
        where: { id: equipmentId, organizationId, deletedAt: null },
        include: { category: { select: { name: true } } },
      }),
      (prisma as any).maintenanceRecord.findMany({
        where: { equipmentId, organizationId, deletedAt: null },
        orderBy: { scheduledDate: "desc" },
        take: 10,
        select: {
          id: true, type: true, scheduledDate: true,
          title: true, description: true, status: true,
          completedAt: true,
        },
      }),
      (prisma as any).incident.findMany({
        where: { equipmentId, organizationId, deletedAt: null },
        orderBy: { reportedAt: "desc" },
        take: 10,
        select: {
          id: true, title: true, severity: true,
          reportedAt: true, status: true, rootCause: true,
        },
      }),
      (prisma as any).document.findMany({
        where: { equipmentId, organizationId, deletedAt: null },
        take: 20,
        select: { id: true, title: true, type: true },
      }),
    ]);

    if (!equipment) return null;

    // Derive last completed maintenance
    const completedMaint = maintenanceRecords.filter((m: any) => m.status === "COMPLETED");
    const lastMaintenance =
      completedMaint[0]?.completedAt?.toISOString().split("T")[0] ?? null;

    // Next scheduled maintenance
    const upcoming = maintenanceRecords
      .filter((m: any) => m.status === "SCHEDULED" || m.status === "IN_PROGRESS")
      .sort((a: any, b: any) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );
    const nextMaintenance =
      upcoming[0]?.scheduledDate?.toISOString().split("T")[0] ?? null;

    // Build maintenance history
    const maintenanceHistory: MaintenanceEvent[] = maintenanceRecords
      .slice(0, 5)
      .map((m: any) => ({
        id:          m.id,
        type:        (m.type as string).toLowerCase(),
        date:        (m.completedAt ?? m.scheduledDate)?.toISOString().split("T")[0] ?? "",
        description: m.description ?? m.title,
        status:      (m.status as string).toLowerCase(),
      }));

    // Build incident summaries
    const incidentSummaries: IncidentSummary[] = incidents.map((i: any) => ({
      id:       i.id,
      title:    i.title,
      severity: (i.severity as string).toLowerCase(),
      date:     new Date(i.reportedAt).toISOString().split("T")[0],
      resolved: i.status === "RESOLVED" || i.status === "CLOSED",
    }));

    // Build document refs
    const documentRefs: DocumentRef[] = documents.map((d: any) => ({
      id:    d.id,
      title: d.title,
      type:  (d.type as string).toLowerCase(),
    }));

    // Compliance (org-level for now — equipment-specific later)
    const complianceRecords = await (prisma as any).complianceRecord.findMany({
      where:   { organizationId, deletedAt: null, status: { not: "PENDING_REVIEW" } },
      take:    5,
      select:  { regulation: true, status: true, nextAuditDate: true },
    });
    const hasViolation = complianceRecords.some((r: any) => r.status === "NON_COMPLIANT");
    const complianceStatus: ComplianceState = {
      overallStatus: hasViolation ? "non_compliant" : complianceRecords.length > 0 ? "compliant" : "pending",
      items: complianceRecords.map((r: any) => ({
        regulation: r.regulation,
        status:     (r.status as string).toLowerCase(),
        nextAudit:  r.nextAuditDate
          ? new Date(r.nextAuditDate).toISOString().split("T")[0]
          : "—",
      })),
    };

    // Health-based predictions
    const predictions: Prediction[] = [];
    const hs = equipment.healthScore as number;
    if (hs < 50) {
      predictions.push({
        type:           "critical_failure_risk",
        description:    `Health score is critically low (${hs}%). Immediate inspection recommended.`,
        probability:    0.85,
        timeframe:      "1-2 weeks",
        recommendation: "Schedule emergency inspection and check all major components.",
      });
    } else if (hs < 70) {
      predictions.push({
        type:           "degraded_performance",
        description:    `Health score is below optimal (${hs}%). Preventive action advised.`,
        probability:    0.6,
        timeframe:      "2-4 weeks",
        recommendation: "Schedule preventive maintenance and monitor performance metrics.",
      });
    }
    if (upcoming[0]) {
      const daysUntil = Math.floor(
        (new Date(upcoming[0].scheduledDate).getTime() - Date.now()) / 86_400_000,
      );
      if (daysUntil <= 7) {
        predictions.push({
          type:           "maintenance_due",
          description:    `${upcoming[0].title} is due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
          probability:    1.0,
          timeframe:      `${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
          recommendation: "Ensure parts and personnel are ready for scheduled maintenance.",
        });
      }
    }

    // AI summary
    const openIncidents = incidentSummaries.filter((i) => !i.resolved).length;
    const aiSummary = [
      `${equipment.name} (${equipment.model}) is in ${hs >= 85 ? "good" : hs >= 65 ? "fair" : "poor"} health (${hs}%).`,
      openIncidents > 0
        ? `${openIncidents} open incident${openIncidents > 1 ? "s" : ""} require attention.`
        : "No open incidents.",
      lastMaintenance ? `Last maintained on ${lastMaintenance}.` : "No maintenance history recorded.",
      nextMaintenance ? `Next maintenance scheduled for ${nextMaintenance}.` : "",
      predictions.length > 0 ? predictions[0].description : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      equipmentId,
      name:               equipment.name,
      model:              equipment.model,
      status:             (equipment.status as string).toLowerCase(),
      healthScore:        hs,
      riskScore:          equipment.riskScore as number,
      lastMaintenance,
      nextMaintenance,
      maintenanceHistory,
      incidents:          incidentSummaries,
      documents:          documentRefs,
      complianceStatus,
      predictions,
      aiSummary,
    };
  } catch (err) {
    logger.error({ err, equipmentId }, "getDigitalTwin failed");
    return null;
  }
}
