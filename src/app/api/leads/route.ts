// POST /api/leads — Create a new lead (full pipeline: save JSON → Excel → WhatsApp)
import { NextRequest, NextResponse } from "next/server";
import { saveLead, getPriority } from "@/services/leads";
import { appendToExcel } from "@/services/excel";
import { sendWhatsAppNotifications } from "@/services/whatsapp";

const REQUIRED_FIELDS = [
  "name", "company", "phone", "email", "city", "state",
  "purchase_timeline", "machine_category", "series", "model",
];

export async function POST(request: NextRequest) {
  const data = await request.json();

  // Validate required fields
  const missing = REQUIRED_FIELDS.filter((f) => !data[f]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Score lead priority
  data.lead_priority = getPriority(data.purchase_timeline);

  // STEP 1: Save JSON — if this fails, abort
  let reference: string;
  try {
    const result = await saveLead(data);
    reference = result.reference;
    Object.assign(data, result.data);
    console.log(`[Lead] Saved: ${reference} priority=${data.lead_priority}`);
  } catch (e) {
    console.error(`[Lead] JSON save FAILED: ${e}`);
    return NextResponse.json(
      { error: "Lead could not be saved. Please try again." },
      { status: 500 }
    );
  }

  // STEP 2: Append to Excel — failure is non-fatal
  try {
    await appendToExcel(data);
    console.log(`[Excel] Appended row for ${reference}`);
  } catch (e) {
    console.error(`[Excel] Append FAILED for ${reference}: ${e}`);
  }

  // STEP 3: Send WhatsApp — failure is non-fatal
  let waResults = { customer: false, team: false };
  try {
    waResults = await sendWhatsAppNotifications(data);
  } catch (e) {
    console.error(`[WhatsApp] Unexpected error for ${reference}: ${e}`);
  }

  return NextResponse.json({
    success: true,
    reference,
    priority: data.lead_priority,
    wa: waResults,
  });
}
