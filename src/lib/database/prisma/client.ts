// ═══════════════════════════════════════════════════════════════════════════════
// Prisma Client Singleton
// ═══════════════════════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as { prisma: any };

let prisma: any = null;

try {
  const { PrismaClient } = require("@prisma/client");
  prisma = globalForPrisma.prisma ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
} catch {
  // Prisma not generated yet
}

export { prisma };
export default prisma;
