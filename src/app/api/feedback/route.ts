// POST /api/feedback — Create feedback entry
import { NextRequest, NextResponse } from "next/server";
import { saveFeedback } from "@/services/leads";

const REQUIRED_FIELDS = ["name", "company", "phone", "machine_model", "rating"];

export async function POST(request: NextRequest) {
  const data = await request.json();

  const missing = REQUIRED_FIELDS.filter((f) => !data[f]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const ref = await saveFeedback(data);
  return NextResponse.json({ success: true, reference: ref });
}
