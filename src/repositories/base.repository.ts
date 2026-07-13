// ═══════════════════════════════════════════════════════════════════════════════
// Base Repository — Generic CRUD with graceful degradation
// Handles: no DB configured, DB connected but tables missing (pre-migration)
// ═══════════════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/database/prisma/client";
import { NotFoundError } from "@/utils/errors";

export interface PaginationOptions {
  page:       number;
  limit:      number;
  sortBy?:    string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data:        T[];
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
}

// ── Prisma error codes that mean "not yet set up" ──────────────────────────────
const MISSING_TABLE_CODES = new Set(["P2021", "P2022", "P1001", "P1002", "P1003"]);

function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as any).code as string | undefined;
  return !!(code && MISSING_TABLE_CODES.has(code));
}

// ── No-op proxy for when Prisma is null (no DATABASE_URL) ─────────────────────
function buildNoop() {
  return new Proxy({} as Record<string, unknown>, {
    get: (_t, method: string) => {
      if (method === "count")                           return async () => 0;
      if (method === "findMany")                        return async () => [];
      if (method === "findFirst" || method === "findUnique") return async () => null;
      return async (args?: unknown) => ({
        id: "unconfigured",
        ...((args as any)?.data ?? {}),
      });
    },
  });
}

export abstract class BaseRepository<T> {
  protected abstract readonly model: string;

  protected get db() {
    if (!prisma) return buildNoop();
    return (prisma as any)[this.model];
  }

  // ── findById ───────────────────────────────────────────────────────────────
  async findById(id: string, organizationId: string): Promise<T> {
    try {
      const record = await this.db.findFirst({
        where: { id, organizationId, deletedAt: null },
      });
      if (!record) throw new NotFoundError(this.model, id);
      return record as T;
    } catch (err) {
      if (isMissingTableError(err)) throw new NotFoundError(this.model, id);
      throw err;
    }
  }

  // ── findMany ───────────────────────────────────────────────────────────────
  async findMany(
    organizationId: string,
    options: PaginationOptions,
    where: Record<string, unknown> = {}
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc" } = options;
    const skip = (page - 1) * limit;
    const baseWhere = { ...where, organizationId, deletedAt: null };

    try {
      const [data, total] = await Promise.all([
        this.db.findMany({
          where: baseWhere,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.db.count({ where: baseWhere }),
      ]);
      return { data: data ?? [], total: total ?? 0, page, limit, totalPages: Math.ceil((total ?? 0) / limit) };
    } catch (err) {
      if (isMissingTableError(err)) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      throw err;
    }
  }

  // ── create ─────────────────────────────────────────────────────────────────
  async create(data: Partial<T> & { organizationId: string }): Promise<T> {
    try {
      return await this.db.create({ data }) as T;
    } catch (err) {
      if (isMissingTableError(err)) {
        // Return the data as-is with a temp ID so callers don't crash
        return { id: `local-${Date.now()}`, ...data } as unknown as T;
      }
      throw err;
    }
  }

  // ── update ─────────────────────────────────────────────────────────────────
  async update(id: string, organizationId: string, data: Partial<T>): Promise<T> {
    await this.findById(id, organizationId);
    return this.db.update({ where: { id }, data }) as T;
  }

  // ── softDelete ─────────────────────────────────────────────────────────────
  async softDelete(id: string, organizationId: string): Promise<void> {
    try {
      await this.findById(id, organizationId);
      await this.db.update({ where: { id }, data: { deletedAt: new Date() } });
    } catch (err) {
      if (isMissingTableError(err)) return;
      throw err;
    }
  }

  // ── count ──────────────────────────────────────────────────────────────────
  async count(organizationId: string, where: Record<string, unknown> = {}): Promise<number> {
    try {
      return await this.db.count({ where: { ...where, organizationId, deletedAt: null } }) ?? 0;
    } catch (err) {
      if (isMissingTableError(err)) return 0;
      throw err;
    }
  }
}
