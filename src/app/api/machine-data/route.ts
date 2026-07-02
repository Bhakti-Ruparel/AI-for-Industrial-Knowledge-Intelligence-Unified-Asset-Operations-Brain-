// GET /api/machine-data — Returns all machine catalog data
import { NextResponse } from "next/server";
import { getMachineData } from "@/services/machines";

export async function GET() {
  return NextResponse.json(getMachineData());
}
