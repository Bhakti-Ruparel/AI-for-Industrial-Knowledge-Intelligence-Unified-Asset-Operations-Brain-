// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Server Client — Next.js App Router (Server Components & Route Handlers)
// Uses @supabase/ssr createServerClient with cookie read/write
// ═══════════════════════════════════════════════════════════════════════════════

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components where cookies can't be set.
            // Middleware handles session refresh in that case.
          }
        },
      },
    }
  );
}
