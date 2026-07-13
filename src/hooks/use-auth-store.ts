// ═══════════════════════════════════════════════════════════════════════════════
// Auth Store — Zustand (replaces mock user in use-store.ts)
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, AuthState } from "@/types/auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user: AuthUser | null) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      clearAuth: () =>
        set({ user: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: "plantmind-auth",
      // Only persist non-sensitive display info — session is managed by Supabase cookies
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
