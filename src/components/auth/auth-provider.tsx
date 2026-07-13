"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// Auth Provider — Restores Supabase session on mount, listens for auth events
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/database/supabase/client";
import { useAuthStore } from "@/hooks/use-auth-store";
import type { AuthUser } from "@/types/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, clearAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // Load initial session
    const initSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    const loadUserProfile = async (supabaseId: string) => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const { data } = await res.json();
          setUser(data as AuthUser);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    };

    initSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await loadUserProfile(session.user.id);
          queryClient.invalidateQueries();
          router.refresh();
        } else if (event === "SIGNED_OUT") {
          clearAuth();
          queryClient.clear();
          router.push("/login");
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          // Silently refresh user data
          await loadUserProfile(session.user.id);
        } else if (event === "USER_UPDATED" && session?.user) {
          await loadUserProfile(session.user.id);
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
