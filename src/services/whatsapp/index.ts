// ═══════════════════════════════════════════════════════════════════════════════
// WhatsApp Notification Service (migrated from Flask)
// Supports Meta Cloud API and Twilio
// ═══════════════════════════════════════════════════════════════════════════════

import type { LeadData } from "@/services/leads";
import { getPriority } from "@/services/leads";

const WA_ENABLED = process.env.WHATSAPP_ENABLED === "true";
const COSMOS_PHONE = (process.env.WHATSAPP_PHONE || "6358987708").replace(/^\+?(91)?/, "");
const WA_PROVIDER = process.env.WHATSAPP_PROVIDER || "meta";

// ── Phone formatting ─────────────────────────────────────────────────────────
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return "91" + digits;
  return digits;
}

// ── Send single message ──────────────────────────────────────────────────────
async function sendSingle(toDigits: string, body: string): Promise<void> {
  if (WA_PROVIDER === "twilio") {
    await twilioSend(toDigits, body);
  } else {
    await metaSend(toDigits, body);
  }
}

async function metaSend(toDigits: string, body: string): Promise<void> {
  const pid = process.env.META_PHONE_NUMBER_ID || "";
  const token = process.env.META_ACCESS_TOKEN || "";
  if (!pid || !token) throw new Error("META_PHONE_NUMBER_ID or META_ACCESS_TOKEN not set");

  const res = await fetch(`https://graph.facebook.com/v19.0/${pid}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toDigits,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    throw new Error(`Meta API error: ${res.status} ${await res.text()}`);
  }
  console.log(`[Meta] Sent to ...${toDigits.slice(-4)} status=${res.status}`);
}

async function twilioSend(toDigits: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const token = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_FROM || "whatsapp:+14155238886";
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set");

  const params = new URLSearchParams({
    From: from,
    To: `whatsapp:+${toDigits}`,
    Body: body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    throw new Error(`Twilio API error: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  console.log(`[Twilio] Sent to ...${toDigits.slice(-4)} SID=${json.sid || "?"}`);
}

// ── Message builders ─────────────────────────────────────────────────────────
function buildCustomerMessage(data: LeadData): string {
  return [
    `Hello ${data.name || ""},`,
    "",
    "Thank you for contacting Cosmos CNC.",
    "Your enquiry has been successfully registered.",
    "",
    `Reference Number: ${data.reference_number || ""}`,
    `Selected Machine: ${data.model_label || data.model || ""}`,
    "",
    "Our Application Engineer will contact you shortly.",
    "",
    "For any assistance:",
    "Cosmos CNC Support  +91 63589 87708",
    "",
    "Thank you for choosing Cosmos CNC.",
  ].join("\n");
}

function buildTeamMessage(data: LeadData): string {
  const priority = data.lead_priority || getPriority(data.purchase_timeline || "");
  let ts = data.timestamp || "";
  try {
    ts = new Date(ts).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { /* keep original */ }

  return [
    "NEW MACHINE ENQUIRY RECEIVED 🔔",
    "",
    "👤 *Contact Details*",
    `Person Name: ${data.name || ""}`,
    `Company Name: ${data.company || ""}`,
    `Contact Number: ${data.phone || ""}`,
    `Email ID: ${data.email || ""}`,
    "",
    "📍 *Location*",
    `State: ${data.state || ""}`,
    `City: ${data.city || ""}`,
    `Village: ${data.village || "—"}`,
    "",
    "🏭 *Business Information*",
    `Industry Type: ${data.industry || ""}`,
    "",
    "⚙️ *Machine Requirement*",
    `Machine Model: ${data.model_label || data.model || ""}`,
    `Machine Type: ${data.machine_category || ""}`,
    `Expected Purchase Timeline: ${data.purchase_timeline || ""}`,
    `Lead Priority: ${priority}`,
    "",
    `🕒 Enquiry Date & Time: ${ts}`,
    `Reference Number: ${data.reference_number || ""}`,
  ].join("\n");
}

// ── Public API ───────────────────────────────────────────────────────────────
export interface WhatsAppResult {
  customer: boolean;
  team: boolean;
}

export async function sendWhatsAppNotifications(data: LeadData): Promise<WhatsAppResult> {
  const results: WhatsAppResult = { customer: false, team: false };

  if (!WA_ENABLED) {
    console.log("[WhatsApp] Disabled — skipping notifications");
    return results;
  }

  // Message 1: Customer confirmation
  const customerPhone = formatPhone(data.phone || "");
  if (customerPhone.length >= 10) {
    try {
      await sendSingle(customerPhone, buildCustomerMessage(data));
      results.customer = true;
      console.log(`[WhatsApp] Customer message sent to ...${customerPhone.slice(-4)}`);
    } catch (e) {
      console.error(`[WhatsApp] Customer message FAILED: ${e}`);
    }
  }

  // Message 2: Cosmos team alert
  const teamPhone = formatPhone(COSMOS_PHONE);
  try {
    await sendSingle(teamPhone, buildTeamMessage(data));
    results.team = true;
    console.log(`[WhatsApp] Team alert sent to ...${teamPhone.slice(-4)}`);
  } catch (e) {
    console.error(`[WhatsApp] Team alert FAILED: ${e}`);
  }

  return results;
}
