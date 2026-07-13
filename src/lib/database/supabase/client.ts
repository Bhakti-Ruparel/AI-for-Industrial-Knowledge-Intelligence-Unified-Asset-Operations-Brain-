// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Clients — SSR-aware (browser + server + middleware)
// Uses @supabase/ssr for proper cookie-based session handling
// ═══════════════════════════════════════════════════════════════════════════════

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
  return url.replace(/\/$/, "");
}

function getAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local");
  return key;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  return key;
}

// ── Browser Client (CSR) ─────────────────────────────────────────────────────
// Singleton — uses cookie-based sessions via @supabase/ssr

let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!_browserClient) {
    _browserClient = createBrowserClient(getSupabaseUrl(), getAnonKey());
  }
  return _browserClient;
}

// ── Server Admin Client ──────────────────────────────────────────────────────
// Uses service role key — NEVER expose to client

let _serverClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseServer() {
  if (!_serverClient) {
    _serverClient = createClient(getSupabaseUrl(), getServiceRoleKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _serverClient;
}
