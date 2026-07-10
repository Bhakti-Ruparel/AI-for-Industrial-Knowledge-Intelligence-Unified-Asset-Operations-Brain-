// GET /api/admin/export/leads-excel — Export all leads as Excel download
import { NextResponse } from "next/server";
import { loadAllLeads } from "@/services/leads";
import { exportAllLeadsToExcel } from "@/services/excel";

export async function GET() {
  const records = await loadAllLeads();

  if (records.length === 0) {
    return NextResponse.json({ error: "No data" }, { status: 404 });
  }

  const buffer = await exportAllLeadsToExcel(records);
  const now = new Date();
  const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}_${String(now.getDate()).padStart(2, "0")}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=Cosmos_Leads_${dateStr}.xlsx`,
    },
  });
}
