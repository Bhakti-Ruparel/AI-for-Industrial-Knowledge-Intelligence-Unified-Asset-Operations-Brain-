// GET /api/admin/feedback — List all feedback
import { NextRequest, NextResponse } from "next/server";
import { loadAllFeedback } from "@/services/leads";

export async function GET(request: NextRequest) {
  let records = await loadAllFeedback();
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase() || "";

  if (q) {
    records = records.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q)
    );
  }

  return NextResponse.json(records);
}
