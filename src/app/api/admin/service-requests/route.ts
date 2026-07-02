// GET /api/admin/service-requests — List all service requests
import { NextRequest, NextResponse } from "next/server";
import { loadAllServiceRequests } from "@/services/leads";

export async function GET(request: NextRequest) {
  let records = await loadAllServiceRequests();
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase() || "";

  if (q) {
    records = records.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q)
    );
  }

  return NextResponse.json(records);
}
