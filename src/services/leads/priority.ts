// ═══════════════════════════════════════════════════════════════════════════════
// Lead Scoring — Priority classification (migrated from Flask)
// ═══════════════════════════════════════════════════════════════════════════════

export const TIMELINE_PRIORITY: Record<string, { label: string; color: string }> = {
  Immediate: { label: "HOT LEAD", color: "#FF0000" },
  "Within 1 Month": { label: "HIGH PRIORITY", color: "#FF6600" },
  "Within 3 Months": { label: "MEDIUM PRIORITY", color: "#FFA500" },
  "Within 6 Months": { label: "LOW PRIORITY", color: "#2196F3" },
  "More Than 6 Months": { label: "FUTURE OPPORTUNITY", color: "#9C27B0" },
};

export function getPriority(timeline: string): string {
  return TIMELINE_PRIORITY[timeline]?.label || "UNCLASSIFIED";
}

export function getPriorityColor(priority: string): string {
  const entry = Object.values(TIMELINE_PRIORITY).find((v) => v.label === priority);
  return entry?.color || "#666666";
}
