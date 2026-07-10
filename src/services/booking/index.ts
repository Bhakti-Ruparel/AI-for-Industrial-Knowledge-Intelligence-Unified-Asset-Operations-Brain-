// ═══════════════════════════════════════════════════════════════════════════════
// Booking Service — Machine recommendation + lead generation
// ═══════════════════════════════════════════════════════════════════════════════

import { filterMachines } from "@/services/machines";
import { saveLead, getPriority } from "@/services/leads";
import { appendToExcel } from "@/services/excel";
import { sendWhatsAppNotifications } from "@/services/whatsapp";
import { createLogger } from "@/utils/logger";

const logger = createLogger("booking-service");

export interface BookingInput {
  name: string;
  company: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  village?: string;
  industry?: string;
  machineCategory: string;
  series: string;
  model: string;
  modelLabel?: string;
  purchaseTimeline: string;
  remarks?: string;
  organizationId: string;
  userId?: string;
}

export interface BookingResult {
  success: boolean;
  reference: string;
  priority: string;
  whatsapp: { customer: boolean; team: boolean };
}

export async function recommendMachine(category: string, series: string, params: Record<string, number>) {
  return filterMachines(category, series, params);
}

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const priority = getPriority(input.purchaseTimeline);

  // Map to lead format for existing pipeline
  const leadData = {
    name: input.name,
    company: input.company,
    phone: input.phone,
    email: input.email,
    state: input.state,
    city: input.city,
    village: input.village,
    industry: input.industry,
    machine_category: input.machineCategory,
    series: input.series,
    model: input.model,
    model_label: input.modelLabel,
    purchase_timeline: input.purchaseTimeline,
    remarks: input.remarks,
    lead_priority: priority,
  };

  // Step 1: Save lead
  const { reference, data } = await saveLead(leadData);
  logger.info({ reference, priority }, "Booking/lead created");

  // Step 2: Excel (non-fatal)
  try {
    await appendToExcel(data);
  } catch (e: any) {
    logger.error({ reference, error: e.message }, "Excel append failed");
  }

  // Step 3: WhatsApp (non-fatal)
  let wa = { customer: false, team: false };
  try {
    wa = await sendWhatsAppNotifications(data);
  } catch (e: any) {
    logger.error({ reference, error: e.message }, "WhatsApp notification failed");
  }

  return { success: true, reference, priority, whatsapp: wa };
}

export async function sendLead(leadData: any) {
  return createBooking(leadData);
}
