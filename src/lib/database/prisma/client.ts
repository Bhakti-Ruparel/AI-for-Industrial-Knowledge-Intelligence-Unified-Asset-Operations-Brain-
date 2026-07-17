// ═══════════════════════════════════════════════════════════════════════════════
// Prisma Client Singleton — Prisma 7 with @prisma/adapter-pg
// Generated client output: node_modules/.prisma/client
//
// Connection URL priority:
//   1. PRISMA_DATABASE_URL — Supabase Session Pooler (port 5432)
//   2. DATABASE_URL        — Supabase Transaction Pooler (port 6543, fallback)
// ═══════════════════════════════════════════════════════════════════════════════

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient | null = null;

// Session pooler first, transaction pooler as fallback
const dbUrl = process.env.PRISMA_DATABASE_URL ?? process.env.DATABASE_URL;

if (dbUrl) {
  if (!globalThis.__prisma) {
    // Strip pgbouncer=true — not needed (and harmful) for session-mode connections
    const cleanUrl = dbUrl
      .replace(/[&?]pgbouncer=true/gi, "")
      .replace(/[&?]connection_limit=\d+/gi, "");

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
      `[PRISMA] Client initialised using ${
        process.env.PRISMA_DATABASE_URL
          ? "PRISMA_DATABASE_URL (session pooler)"
          : "DATABASE_URL (transaction pooler fallback)"
      }`
    );
  }
  prisma = globalThis.__prisma;
} else {
  console.error(
    "[PRISMA] No database URL found (PRISMA_DATABASE_URL / DATABASE_URL). Prisma client will be null."
  );
}

export { prisma };
export default prisma;
