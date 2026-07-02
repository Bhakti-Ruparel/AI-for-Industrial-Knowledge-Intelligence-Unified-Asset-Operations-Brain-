// GET /api/admin/leads — List all leads with filtering
import { NextRequest, NextResponse } from "next/server";
import { loadAllLeads } from "@/services/leads";

export async function GET(request: NextRequest) {
  let records = await loadAllLeads();
  const params = request.nextUrl.searchParams;

  const q = params.get("q")?.toLowerCase() || "";
  const state = params.get("state")?.toLowerCase() || "";
  const industry = params.get("industry")?.toLowerCase() || "";
  const machineType = params.get("machine_type")?.toLowerCase() || "";
  const timeline = params.get("purchase_timeline")?.toLowerCase() || "";
  const priority = params.get("priority")?.toLowerCase() || "";
  const dateFrom = params.get("date_from") || "";
  const dateTo = params.get("date_to") || "";

  if (q) {
    records = records.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q)
    );
  }
  if (state) {
    records = records.filter((r) => (r.state || "").toLowerCase() === state);
  }
  if (industry) {
    records = records.filter((r) => (r.industry || "").toLowerCase().includes(industry));
  }
  if (machineType) {
    records = records.filter((r) => (r.machine_category || "").toLowerCase() === machineType);
  }
  if (timeline) {
    records = records.filter((r) => (r.purchase_timeline || "").toLowerCase().includes(timeline));
  }
  if (priority) {
    records = records.filter((r) => (r.lead_priority || "").toLowerCase().includes(priority));
  }
  if (dateFrom) {
    records = records.filter((r) => (r.timestamp || "") >= dateFrom);
  }
  if (dateTo) {
    records = records.filter((r) => (r.timestamp || "") <= dateTo + "T23:59:59");
  }

  return NextResponse.json(records);
}
