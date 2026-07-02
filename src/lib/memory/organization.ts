// ═══════════════════════════════════════════════════════════════════════════════
// Organization Memory — Shared context for all users in an organization
// ═══════════════════════════════════════════════════════════════════════════════

export interface OrganizationContext {
  recentIncidents: string[];
  criticalEquipment: string[];
  upcomingAudits: string[];
  activeMaintenanceTasks: number;
  lastUpdated: string;
}

class OrganizationMemory {
  private contexts = new Map<string, OrganizationContext>();

  set(organizationId: string, context: Partial<OrganizationContext>): void {
    const existing = this.contexts.get(organizationId) || {
      recentIncidents: [],
      criticalEquipment: [],
      upcomingAudits: [],
      activeMaintenanceTasks: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.contexts.set(organizationId, { ...existing, ...context, lastUpdated: new Date().toISOString() });
  }

  get(organizationId: string): OrganizationContext | null {
    return this.contexts.get(organizationId) || null;
  }

  getContextString(organizationId: string): string {
    const ctx = this.get(organizationId);
    if (!ctx) return "";
    const parts: string[] = [];
    if (ctx.criticalEquipment.length) parts.push(`Critical equipment: ${ctx.criticalEquipment.join(", ")}`);
    if (ctx.recentIncidents.length) parts.push(`Recent incidents: ${ctx.recentIncidents.join(", ")}`);
    if (ctx.upcomingAudits.length) parts.push(`Upcoming audits: ${ctx.upcomingAudits.join(", ")}`);
    return parts.join(". ");
  }
}

export const organizationMemory = new OrganizationMemory();
