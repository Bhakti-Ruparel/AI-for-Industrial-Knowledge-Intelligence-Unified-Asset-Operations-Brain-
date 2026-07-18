// GET /api/integrations/status — Returns which integrations have env vars configured
import { withAuth } from "@/middlewares/with-auth";
import { successResponse } from "@/utils/response";

export const GET = withAuth(async () => {
  return successResponse({
    supabase:    !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    huggingface: !!(process.env.HUGGINGFACE_API_KEY),
    qdrant:      !!(process.env.QDRANT_URL && process.env.QDRANT_URL !== "http://localhost:6333"),
    neo4j:       !!(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD),
    whatsapp:    !!(process.env.META_PHONE_NUMBER_ID || process.env.TWILIO_ACCOUNT_SID),
    prisma:      !!(process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL),
  });
});
