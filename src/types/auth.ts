// ═══════════════════════════════════════════════════════════════════════════════
// Auth Types
// ═══════════════════════════════════════════════════════════════════════════════

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "ENGINEER"
  | "TECHNICIAN"
  | "OPERATOR"
  | "VIEWER";

export interface AuthUser {
  id: string;            // Prisma User ID (cuid)
  supabaseId: string;    // Supabase auth.users UUID
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

// Role permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "users:read", "users:write", "users:delete",
    "equipment:read", "equipment:write", "equipment:delete",
    "documents:read", "documents:write", "documents:delete",
    "maintenance:read", "maintenance:write",
    "incidents:read", "incidents:write",
    "compliance:read", "compliance:write",
    "analytics:read",
    "bookings:read", "bookings:write",
  ],
  ENGINEER: [
    "equipment:read", "equipment:write",
    "documents:read", "documents:write",
    "maintenance:read", "maintenance:write",
    "incidents:read", "incidents:write",
    "compliance:read",
    "analytics:read",
  ],
  TECHNICIAN: [
    "equipment:read",
    "documents:read",
    "maintenance:read", "maintenance:write",
    "incidents:read", "incidents:write",
  ],
  OPERATOR: [
    "equipment:read",
    "documents:read",
    "maintenance:read",
    "incidents:read",
  ],
  VIEWER: [
    "equipment:read",
    "documents:read",
    "analytics:read",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: UserRole[] = [
    "VIEWER",
    "OPERATOR",
    "TECHNICIAN",
    "ENGINEER",
    "ADMIN",
    "SUPER_ADMIN",
  ];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole);
}
