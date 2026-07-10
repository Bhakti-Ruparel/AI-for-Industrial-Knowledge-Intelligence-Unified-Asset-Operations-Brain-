// ═══════════════════════════════════════════════════════════════════════════════
// Booking / Lead Service — Client-side API calls (uses internal Next.js API routes)
// ═══════════════════════════════════════════════════════════════════════════════

import type { Lead, Booking } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function createLead(data: Partial<Lead>): Promise<{ success: boolean; reference: string; priority?: string; wa?: { customer: boolean; team: boolean } }> {
  const res = await fetch(`${API}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getLeads(filters?: Record<string, string>): Promise<Lead[]> {
  const params = new URLSearchParams(filters || {});
  const res = await fetch(`${API}/admin/leads?${params.toString()}`);
  return res.json();
}

export async function createServiceRequest(data: Record<string, unknown>): Promise<{ success: boolean; reference: string }> {
  const res = await fetch(`${API}/service-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createFeedback(data: Record<string, unknown>): Promise<{ success: boolean; reference: string }> {
  const res = await fetch(`${API}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function exportLeadsExcel(): Promise<Blob> {
  const res = await fetch(`${API}/admin/export/leads-excel`);
  return res.blob();
}

export async function createBooking(data: Partial<Booking>): Promise<{ success: boolean; id: string }> {
  // TODO: Connect to Supabase when configured
  return { success: true, id: crypto.randomUUID() };
}

export async function getBookings(): Promise<Booking[]> {
  // TODO: Connect to Supabase when configured
  return [];
}
