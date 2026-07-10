// ═══════════════════════════════════════════════════════════════════════════════
// Prisma Client — Singleton for Next.js
// Will be activated once DATABASE_URL is configured in .env.local
// Run `npx prisma generate` after configuring Supabase connection
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any = null;

try {
  // Dynamically import only if prisma client has been generated
  const { PrismaClient } = require("@prisma/client");
  const globalForPrisma = globalThis as unknown as { prisma: typeof PrismaClient | undefined };
  prisma = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
} catch {
  // PrismaClient not generated yet — using placeholder services
  prisma = null;
}

export { prisma };
export default prisma;
