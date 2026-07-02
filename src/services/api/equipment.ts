// ═══════════════════════════════════════════════════════════════════════════════
// Equipment Service — Client-side API calls (uses internal Next.js API routes)
// ═══════════════════════════════════════════════════════════════════════════════

import type { Equipment } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function getEquipment(): Promise<Equipment[]> {
  // TODO: Merge with Supabase equipment registry when configured
  return [
    { id: "1", name: "CVM-850 #1", model: "CVM-850", series: "CVM SERIES", category: "VMC", status: "operational", healthScore: 94, location: "Bay A - Line 1", lastMaintenance: "2026-06-15", nextMaintenance: "2026-07-15", specifications: { x: "850", y: "500", z: "500", spindle: "12000 RPM" }, documents: ["1", "5"] },
    { id: "2", name: "DYNAMILL-1200", model: "DYNAMILL-1200", series: "DYNAMILL SERIES", category: "VMC", status: "maintenance", healthScore: 72, location: "Bay B - Line 2", lastMaintenance: "2026-06-01", nextMaintenance: "2026-07-01", specifications: { x: "1200", y: "600", z: "600", spindle: "10000 RPM" }, documents: ["5"] },
    { id: "3", name: "V-TURN 1200", model: "V-TURN 1200", series: "V TURN SERIES", category: "VTL", status: "operational", healthScore: 88, location: "Bay C - Line 1", lastMaintenance: "2026-06-20", nextMaintenance: "2026-07-20", specifications: { diameter: "1200", height: "800", weight: "5000" }, documents: ["4"] },
    { id: "4", name: "SURFGRIND-600", model: "SURFGRIND-600", series: "SURFGRIND SERIES", category: "Grinding", status: "critical", healthScore: 45, location: "Bay D - Line 1", lastMaintenance: "2026-05-10", nextMaintenance: "2026-06-10", specifications: { length: "600", width: "300", height: "200" }, documents: [] },
    { id: "5", name: "UNIMILL-500", model: "UNIMILL-500", series: "UNIMILL SERIES", category: "5 Axis VMC", status: "operational", healthScore: 97, location: "Bay A - Line 3", lastMaintenance: "2026-06-25", nextMaintenance: "2026-07-25", specifications: { length: "500", width: "400", height: "350" }, documents: [] },
  ];
}

export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const equipment = await getEquipment();
  return equipment.find((e) => e.id === id) || null;
}

export async function getMachineData(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/machine-data`);
  return res.json();
}

export async function filterMachines(
  category: string,
  series: string,
  params: Record<string, number>
) {
  const res = await fetch(`${API}/machines/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, series, params }),
  });
  return res.json();
}
