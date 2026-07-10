// POST /api/machines/filter — Machine recommendation engine
import { NextRequest, NextResponse } from "next/server";
import { filterMachines } from "@/services/machines";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { category, series, params } = body;

  if (!category || !series) {
    return NextResponse.json({ error: "category and series are required" }, { status: 400 });
  }

  const results = filterMachines(category, series, params || {});
  return NextResponse.json(results);
}
