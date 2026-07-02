// ═══════════════════════════════════════════════════════════════════════════════
// Authentication Middleware
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import { UnauthorizedError } from "@/utils/errors";
import { errorResponse } from "@/utils/response";

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    try {
      // TODO: Validate Supabase JWT from Authorization header
      // For now, use a default context for development
      const authHeader = request.headers.get("authorization");

      // Development mode — allow requests without auth
      if (process.env.NODE_ENV === "development" && !authHeader) {
        const devContext: AuthContext = {
          userId: "dev-user-001",
          organizationId: "dev-org-001",
          role: "ADMIN",
          email: "admin@plantmind.ai",
        };
        return handler(request, devContext);
      }

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError();
      }

      // TODO: Verify token with Supabase
      const token = authHeader.replace("Bearer ", "");
      const context: AuthContext = {
        userId: "user-from-token",
        organizationId: "org-from-token",
        role: "ADMIN",
        email: "user@plantmind.ai",
      };

      return handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
