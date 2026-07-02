// POST /api/service-requests — Create a service request
import { NextRequest, NextResponse } from "next/server";
import { saveServiceRequest } from "@/services/leads";

const REQUIRED_FIELDS = [
  "machine_model", "serial_number", "name", "phone", "company", "city", "state", "problem",
];

export async function POST(request: NextRequest) {
  const data = await request.json();

  const missing = REQUIRED_FIELDS.filter((f) => !data[f]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const ref = await saveServiceRequest(data);
  return NextResponse.json({ success: true, reference: ref });
}
