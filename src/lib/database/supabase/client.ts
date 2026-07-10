// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Client — Server & Browser instances
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/config";

let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error("Supabase server credentials not configured");
  }
  if (!serverClient) {
    serverClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serverClient;
}

export function getSupabaseBrowser(): SupabaseClient {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error("Supabase browser credentials not configured");
  }
  if (!browserClient) {
    browserClient = createClient(config.supabase.url, config.supabase.anonKey);
  }
  return browserClient;
}
