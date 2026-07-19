// ═══════════════════════════════════════════════════════════════════════════════
// Booking Agent — Real booking/lead data from Prisma
// ═══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentInput, AgentOutput } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/prisma";

export const bookingAgent: AgentDefinition = {
  id: "booking",
  name: "Booking Agent",
  description: "Manages machine enquiries, lead qualification, and booking workflows",
  capabilities: ["create_enquiry", "qualify_lead", "schedule_demo", "follow_up"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    const { query, organizationId } = input;
    const lower = query.toLowerCase();

    try {
      // Pull live booking/lead data
      const [recentBookings, newLeads, contacted, wonLeads, totalCount] = await Promise.all([
        prisma?.booking.findMany({
          where: { organizationId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
        }) ?? [],
        prisma?.booking.count({
          where: { organizationId, status: "NEW", deletedAt: null },
        }) ?? 0,
        prisma?.booking.count({
          where: { organizationId, status: "CONTACTED", deletedAt: null },
        }) ?? 0,
        prisma?.booking.count({
          where: { organizationId, status: "WON", deletedAt: null },
        }) ?? 0,
        prisma?.booking.count({
          where: { organizationId, deletedAt: null },
        }) ?? 0,
      ]);

      // ── Status / summary query ────────────────────────────────────────────
      if (lower.includes("status") || lower.includes("summary") || lower.includes("how many") || lower.includes("leads")) {
        const lines = [
          "**Enquiry & Lead Summary:**\n",
          `📋 Total enquiries: **${totalCount}**`,
          `🆕 New (uncontacted): **${newLeads}**`,
          `📞 Contacted: **${contacted}**`,
          `✅ Won: **${wonLeads}**`,
        ];
        if (recentBookings.length) {
          lines.push("\n**Recent Enquiries:**");
          recentBookings.slice(0, 5).forEach((b, i) => {
            lines.push(`${i + 1}. **${b.name}** — ${b.company} | ${b.machineCategory} ${b.series} ${b.model} | Priority: ${b.leadPriority} | Status: ${b.status}`);
          });
        }
        if (newLeads > 0) {
          lines.push(`\n⚡ **${newLeads} new lead${newLeads > 1 ? "s" : ""}** waiting for follow-up.`);
        }
        return reply(lines.join("\n"), 0.93, [
          { type: "view_leads",      label: "View All Leads"    },
          { type: "create_booking",  label: "New Enquiry"       },
          { type: "follow_up",       label: "Follow Up on Leads"},
        ]);
      }

      // ── Recent / latest enquiries ─────────────────────────────────────────
      if (lower.includes("recent") || lower.includes("latest") || lower.includes("new enquir") || lower.includes("new lead")) {
        if (!recentBookings.length) {
          return reply("No enquiries found yet. Submit a machine enquiry to get started.", 0.8, [
            { type: "create_booking", label: "New Enquiry" },
          ]);
        }
        const lines = [`**${recentBookings.length} Most Recent Enquiries:**\n`];
        recentBookings.forEach((b, i) => {
          const date = new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          lines.push(`${i + 1}. **${b.name}** (${b.company})`);
          lines.push(`   Machine: ${b.machineCategory} — ${b.series} — ${b.model}`);
          lines.push(`   State: ${b.state} | Priority: ${b.leadPriority} | Status: ${b.status} | ${date}`);
          if (b.remarks) lines.push(`   Remarks: ${b.remarks.slice(0, 80)}`);
        });
        return reply(lines.join("\n"), 0.92, [
          { type: "view_leads",     label: "View All Leads"     },
          { type: "follow_up",      label: "Mark as Contacted"  },
          { type: "create_booking", label: "New Enquiry"        },
        ]);
      }

      // ── How to create an enquiry ──────────────────────────────────────────
      if (lower.includes("create") || lower.includes("submit") || lower.includes("new enquiry") || lower.includes("add lead")) {
        return reply(
          "To submit a new machine enquiry:\n\n" +
          "Please provide the following details:\n" +
          "1. **Customer name and company**\n" +
          "2. **Phone and email**\n" +
          "3. **State and city**\n" +
          "4. **Machine category** (VMC / VTL / Grinding / 5 Axis VMC / Turnmill)\n" +
          "5. **Series and model**\n" +
          "6. **Purchase timeline** (Immediate / 1-3 months / 3-6 months / 6-12 months)\n" +
          "7. **Lead priority** (Hot / Warm / Cold)\n\n" +
          "You can also use the booking form on the website chatbot directly.",
          0.9,
          [{ type: "create_booking", label: "Open Booking Form" }]
        );
      }

      // ── Won / conversion ──────────────────────────────────────────────────
      if (lower.includes("won") || lower.includes("conversion") || lower.includes("close")) {
        const convRate = totalCount > 0 ? Math.round((wonLeads / totalCount) * 100) : 0;
        return reply(
          `**Lead Conversion Summary:**\n\n` +
          `✅ Won deals: **${wonLeads}**\n` +
          `📊 Conversion rate: **${convRate}%**\n` +
          `📋 Total enquiries: **${totalCount}**\n\n` +
          (wonLeads === 0 ? "No won deals yet. Focus on following up with contacted leads." :
           `Great conversion rate! Keep engaging with the **${newLeads}** new leads.`),
          0.9,
          [
            { type: "view_leads",  label: "View All Leads"    },
            { type: "follow_up",   label: "Follow Up on Leads"},
          ]
        );
      }

      // ── Default ───────────────────────────────────────────────────────────
      return reply(
        `**Booking & Lead Management:**\n\n` +
        `📋 Total enquiries: **${totalCount}** | 🆕 New: **${newLeads}** | ✅ Won: **${wonLeads}**\n\n` +
        "I can help you with:\n" +
        "• **View recent enquiries** — latest leads and their status\n" +
        "• **Lead summary** — overview of pipeline by status\n" +
        "• **Create enquiry** — how to submit a new machine enquiry\n" +
        "• **Conversion stats** — won deals and conversion rate\n\n" +
        "What would you like to know?",
        0.88,
        [
          { type: "create_booking", label: "New Enquiry"   },
          { type: "view_leads",     label: "View All Leads"},
          { type: "schedule_demo",  label: "Schedule Demo" },
        ]
      );
    } catch {
      return reply(
        "Unable to load booking data. Please check your database connection.\n\n" +
        "To submit a new machine enquiry, please contact us directly or use the booking form on the website.",
        0.3,
        [{ type: "create_booking", label: "New Enquiry" }]
      );
    }
  },
};

function reply(response: string, confidence: number, actions: { type: string; label: string }[]): AgentOutput {
  return { response, confidence, sources: [], actions };
}
