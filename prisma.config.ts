// ═══════════════════════════════════════════════════════════════════════════════
// Prisma 7 Configuration
//
// The Prisma CLI (db push, migrate, db pull) uses datasource.url.
// For schema operations we use DIRECT_URL (not the pgbouncer pooler).
//
// For `prisma generate` (used during build) no DB URL is needed —
// it only reads the schema file to generate the client types.
//
// The runtime PrismaClient uses DATABASE_URL (pooler) via the pg adapter —
// configured separately in src/lib/database/prisma/client.ts.
// ═══════════════════════════════════════════════════════════════════════════════

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // CLI schema commands (db push, migrate, db pull) → direct connection
    // This is NOT used by prisma generate — only by migrate/push commands
    url: env("DIRECT_URL") ?? env("DATABASE_URL") ?? "",
  },
});
