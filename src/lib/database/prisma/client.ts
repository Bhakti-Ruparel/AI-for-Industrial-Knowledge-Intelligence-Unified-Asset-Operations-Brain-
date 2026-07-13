// ═══════════════════════════════════════════════════════════════════════════════
// Prisma Client Singleton — Prisma 7 with @prisma/adapter-pg
// Generated client is at node_modules/.prisma/client (not @prisma/client)
//
// Connection URL priority:
//
//   1. PRISMA_DATABASE_URL — Supabase Session Pooler (port 5432 on pooler host)
//      This is the preferred runtime URL. Session pooler behaves like a direct
//      connection from Prisma's perspective: it supports transactions,
//      prepared statements, and advisory locks. Unlike the direct DB host
//      (db.*.supabase.co:5432) which is blocked on Supabase free plans, the
//      session pooler runs on the same pooler host as the transaction pooler
//      and is reachable on all plans.
//
//   2. DATABASE_URL — Supabase Transaction Pooler (port 6543, pgbouncer=true)
//      Fallback only. This mode does NOT support Prisma $transaction or
//      prepared statements. Registration will still work because we use
//      sequential creates with manual rollback, not $transaction.
// ═══════════════════════════════════════════════════════════════════════════════

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require(".prisma/client");

declare global {
  // eslint-disable-next-line no-var
  var __prisma: InstanceType<typeof PrismaClient> | undefined;
}

let prisma: InstanceType<typeof PrismaClient> | null = null;

// Session pooler first, transaction pooler as fallback
const dbUrl = process.env.PRISMA_DATABASE_URL ?? process.env.DATABASE_URL;

if (dbUrl) {
  if (!globalThis.__prisma) {
    // Strip pgbouncer=true from the session pooler URL if present — it is not
    // needed (and is harmful) for session-mode connections.
    const cleanUrl = dbUrl.replace(/[&?]pgbouncer=true/gi, "").replace(/[&?]connection_limit=\d+/gi, "");

    const pool = new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);

    globalThis.__prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
    });

    console.log(
      `[PRISMA] Client initialised using ${process.env.PRISMA_DATABASE_URL ? "PRISMA_DATABASE_URL (session pooler)" : "DATABASE_URL (transaction pooler fallback)"}`
    );
  }
  prisma = globalThis.__prisma;
} else {
  console.error("[PRISMA] No database URL found (PRISMA_DATABASE_URL / DATABASE_URL). Prisma client will be null.");
}

export { prisma };
export default prisma;
