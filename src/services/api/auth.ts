// ═══════════════════════════════════════════════════════════════════════════════
// Auth API helpers — shared fetch utilities with session token injection
// ═══════════════════════════════════════════════════════════════════════════════

import { getSupabaseBrowser } from "@/lib/database/supabase/client";

/**
 * Get the current Supabase session access token for API requests.
 * Returns null if no active session.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Build fetch headers that include the Authorization Bearer token.
 * Falls back gracefully if no session is active (relying on cookies).
 */
export async function authHeaders(extra?: Record<string, string>): Promise<HeadersInit> {
  const token = await getAccessToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * Authenticated fetch wrapper — adds Bearer token to every request.
 */
export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = await authHeaders(
    init?.headers as Record<string, string> | undefined
  );
  return fetch(url, { ...init, headers });
}
