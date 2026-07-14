// GET /api/insights — Derive actionable insights from live Prisma data
import { withAuth } from "@/middlewares/with-auth";
import { getDashboardMetrics } from "@/services/analytics";
import { successResponse, errorResponse } from "@/utils/response";

interface Insight {
  id:          string;
  title:       string;
  description: string;
  href:        string;
  variant:     "danger" | "warning" | "info" | "success";
}

export const GET = withAuth(async (_request, ctx) => {
  try {
    const m       = await getDashboardMetrics(ctx.organizationId);
    const insights: Insight[] = [];

    // Critical open incidents
    if (m.incidents.open > 0) {
      insights.push({
        id: "open-incidents",
        title: `${m.incidents.open} open incident${m.incidents.open > 1 ? "s" : ""} require attention`,
        description: `${m.incidents.investigating} under investigation. Average resolution time: ${m.incidents.mttr > 0 ? m.incidents.mttr + " hrs" : "N/A"}.`,
        href: "/incidents",
        variant: "danger",
      });
    }

    // Overdue maintenance
    if (m.maintenance.overdue > 0) {
      insights.push({
        id: "overdue-maintenance",
        title: `${m.maintenance.overdue} maintenance task${m.maintenance.overdue > 1 ? "s" : ""} overdue`,
        description: `${m.maintenance.dueSoon} more due within 7 days. Schedule preventive maintenance to avoid downtime.`,
        href: "/maintenance",
        variant: m.maintenance.overdue > 3 ? "danger" : "warning",
      });
    } else if (m.maintenance.dueSoon > 0) {
      insights.push({
        id: "due-soon",
        title: `${m.maintenance.dueSoon} maintenance task${m.maintenance.dueSoon > 1 ? "s" : ""} due this week`,
        description: "Schedule these tasks to prevent equipment degradation and unplanned downtime.",
        href: "/maintenance",
        variant: "warning",
      });
    }

    // Critical equipment
    if (m.equipment.critical > 0) {
      insights.push({
        id: "critical-equipment",
        title: `${m.equipment.critical} piece${m.equipment.critical > 1 ? "s" : ""} of equipment in critical state`,
        description: `Overall fleet health: ${m.equipment.averageHealth}%. Immediate inspection recommended.`,
        href: "/equipment",
        variant: "danger",
      });
    }

    // Non-compliant regulations
    if (m.compliance.nonCompliant > 0) {
      insights.push({
        id: "compliance-violations",
        title: `${m.compliance.nonCompliant} compliance violation${m.compliance.nonCompliant > 1 ? "s" : ""} detected`,
        description: `${m.compliance.expiring} certification${m.compliance.expiring !== 1 ? "s" : ""} expiring soon. Overall score: ${m.compliance.overallScore}%.`,
        href: "/compliance",
        variant: "warning",
      });
    }

    // Documents processing/failed
    if (m.documents.processing > 0) {
      insights.push({
        id: "docs-processing",
        title: `${m.documents.processing} document${m.documents.processing > 1 ? "s" : ""} being processed`,
        description: `${m.documents.indexed} of ${m.documents.total} documents fully indexed in the knowledge base.`,
        href: "/documents",
        variant: "info",
      });
    }

    // All good
    if (insights.length === 0) {
      insights.push({
        id: "all-good",
        title: "All systems nominal",
        description: `${m.equipment.operational} equipment operational, ${m.documents.indexed} documents indexed, compliance score ${m.compliance.overallScore}%.`,
        href: "/dashboard",
        variant: "success",
      });
    }

    return successResponse(insights);
  } catch (error) {
    return errorResponse(error);
  }
});
