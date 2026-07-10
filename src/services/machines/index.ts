// ═══════════════════════════════════════════════════════════════════════════════
// Machine Service — Recommendation Engine (migrated from Flask)
// Exact same filtering/sorting logic as Python backend
// ═══════════════════════════════════════════════════════════════════════════════

import machineData from "@/data/machine-data.json";

export type MachineCategory = "VMC" | "VTL" | "Grinding" | "5 Axis VMC" | "Turnmill";

export interface MachineModel {
  model: string;
  label: string;
  x?: number;
  y?: number;
  z?: number;
  diameter?: number;
  height?: number;
  weight?: number;
  length?: number;
  width?: number;
}

export interface FilterParams {
  x?: number;
  y?: number;
  z?: number;
  diameter?: number;
  height?: number;
  weight?: number;
  length?: number;
  width?: number;
}

export interface FilterResult {
  best_fit: MachineModel[];
  recommended: MachineModel[];
  alternative: MachineModel[];
}

const MACHINE_DATA = machineData as Record<string, Record<string, MachineModel[]>>;

export function getMachineData(): Record<string, Record<string, MachineModel[]>> {
  return MACHINE_DATA;
}

export function getSeriesForCategory(category: MachineCategory): string[] {
  return Object.keys(MACHINE_DATA[category] || {});
}

export function filterMachines(
  category: string,
  series: string,
  params: FilterParams
): FilterResult {
  const results: FilterResult = { best_fit: [], recommended: [], alternative: [] };

  if (!(category in MACHINE_DATA)) return results;
  if (!(series in MACHINE_DATA[category])) return results;

  const models = MACHINE_DATA[category][series];

  function pick(sorted: MachineModel[]) {
    if (sorted.length > 0) {
      results.best_fit = sorted.slice(0, 1);
      results.recommended = sorted.slice(1, 3);
      results.alternative = sorted.slice(3, 5);
      return true;
    }
    return false;
  }

  if (category === "VMC") {
    const rx = params.x || 0;
    const ry = params.y || 0;
    const rz = params.z || 0;
    const matching = models
      .filter((m) => (m.x || 0) >= rx && (m.y || 0) >= ry && (m.z || 0) >= rz)
      .sort((a, b) => {
        const diffA = ((a.x || 0) - rx) + ((a.y || 0) - ry) + ((a.z || 0) - rz);
        const diffB = ((b.x || 0) - rx) + ((b.y || 0) - ry) + ((b.z || 0) - rz);
        return diffA - diffB;
      });
    if (!pick(matching)) {
      results.alternative = [...models].sort((a, b) => (b.x || 0) - (a.x || 0)).slice(0, 2);
    }
  } else if (category === "VTL") {
    const rd = params.diameter || 0;
    const rh = params.height || 0;
    const rw = params.weight || 0;
    const matching = models
      .filter((m) => (m.diameter || 0) >= rd && (m.height || 0) >= rh && (m.weight || 0) >= rw)
      .sort((a, b) => ((a.diameter || 0) - rd) - ((b.diameter || 0) - rd));
    if (!pick(matching)) {
      results.alternative = [...models].sort((a, b) => (b.diameter || 0) - (a.diameter || 0)).slice(0, 2);
    }
  } else if (category === "Grinding") {
    const rl = params.length || 0;
    const rw = params.width || 0;
    const rh = params.height || 0;
    const matching = models
      .filter((m) => (m.length || 0) >= rl && (m.width || 0) >= rw && (m.height || 0) >= rh)
      .sort((a, b) => ((a.length || 0) - rl) - ((b.length || 0) - rl));
    if (!pick(matching)) {
      results.alternative = [...models].sort((a, b) => (b.length || 0) - (a.length || 0)).slice(0, 2);
    }
  } else if (category === "5 Axis VMC") {
    const rl = params.length || 0;
    const rw = params.width || 0;
    const rh = params.height || 0;
    const matching = models
      .filter((m) => (m.length || 0) >= rl && (m.width || 0) >= rw && (m.height || 0) >= rh)
      .sort((a, b) => ((a.length || 0) - rl) - ((b.length || 0) - rl));
    if (!pick(matching)) {
      results.alternative = [...models].sort((a, b) => (b.length || 0) - (a.length || 0)).slice(0, 2);
    }
  } else if (category === "Turnmill") {
    const rd = params.diameter || 0;
    const rl = params.length || 0;
    const matching = models
      .filter((m) => (m.diameter || 0) >= rd && (m.length || 0) >= rl)
      .sort((a, b) => ((a.diameter || 0) - rd) - ((b.diameter || 0) - rd));
    if (!pick(matching)) {
      results.alternative = [...models].sort((a, b) => (b.diameter || 0) - (a.diameter || 0)).slice(0, 2);
    }
  }

  return results;
}
