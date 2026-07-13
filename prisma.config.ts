// ═══════════════════════════════════════════════════════════════════════════════
// Prisma 7 Configuration
//
// The Prisma CLI (db push, migrate, db pull, generate) uses datasource.url.
// For schema operations we must use DIRECT_URL (not the pgbouncer pooler)
// because PgBouncer transaction mode doesn't support prepared statements / DDL.
//
// The runtime PrismaClient uses DATABASE_URL (pooler) via the pg adapter —
// that is configured separately in src/lib/database/prisma/client.ts.
// ═══════════════════════════════════════════════════════════════════════════════

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // CLI schema commands (db push, migrate, db pull) → direct connection
    url: env("DIRECT_URL"),
  },
});
