// GET /api/agents — List AI agents and their status
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { successResponse, errorResponse } from "@/utils/response";

export const GET = withAuth(async (request, ctx) => {
  try {
    const agents = [
      { id: "knowledge", name: "Knowledge Agent", description: "Retrieves information from document knowledge base using RAG", status: "active", tasksCompleted: 1247, accuracy: 94.2 },
      { id: "maintenance", name: "Maintenance Agent", description: "Predicts failures and generates maintenance schedules", status: "active", tasksCompleted: 342, accuracy: 91.8 },
      { id: "compliance", name: "Compliance Agent", description: "Tracks regulatory compliance and identifies gaps", status: "idle", tasksCompleted: 89, accuracy: 96.1 },
      { id: "rca", name: "Root Cause Agent", description: "Analyzes incidents using historical data and sensor readings", status: "active", tasksCompleted: 56, accuracy: 88.5 },
      { id: "document", name: "Document Agent", description: "Processes, chunks, and indexes documents for retrieval", status: "active", tasksCompleted: 1847, accuracy: 97.3 },
      { id: "recommendation", name: "Recommendation Agent", description: "Recommends optimal machines based on requirements", status: "idle", tasksCompleted: 234, accuracy: 92.0 },
      { id: "booking", name: "Booking Agent", description: "Manages leads, bookings, and customer communications", status: "active", tasksCompleted: 156, accuracy: 99.1 },
      { id: "lessons", name: "Lessons Learned Agent", description: "Extracts patterns from resolved incidents for future prevention", status: "idle", tasksCompleted: 45, accuracy: 85.7 },
    ];

    return successResponse(agents);
  } catch (error) {
    return errorResponse(error);
  }
});
