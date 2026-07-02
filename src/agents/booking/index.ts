// ═══════════════════════════════════════════════════════════════════════════════
// Booking Agent — Lead generation and booking management
// NOTE: Uses existing booking service — does NOT modify logic
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";

export const bookingAgent: AgentDefinition = {
  id: "booking",
  name: "Booking Agent",
  description: "Manages machine enquiries, lead qualification, and booking workflows",
  capabilities: ["create_enquiry", "qualify_lead", "schedule_demo", "follow_up"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    return {
      response: "I can help you with machine enquiries and bookings. Would you like to:\n\n1. Submit a new machine enquiry\n2. Check the status of an existing enquiry\n3. Schedule a demo or consultation\n\nPlease provide your requirements or reference number.",
      confidence: 0.9,
      sources: [],
      actions: [
        { type: "create_booking", label: "New Enquiry" },
        { type: "check_status", label: "Check Status" },
        { type: "schedule_demo", label: "Schedule Demo" },
      ],
    };
  },
};
