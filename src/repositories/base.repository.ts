// ═══════════════════════════════════════════════════════════════════════════════
// Base Repository — Generic CRUD operations with soft delete & multi-tenancy
// ═══════════════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/database/prisma/client";
import { NotFoundError } from "@/utils/errors";

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<T> {
  protected abstract readonly model: string;

  protected get db() {
    if (!prisma) throw new Error("Database not connected — run prisma generate");
    return (prisma as any)[this.model];
  }

  async findById(id: string, organizationId: string): Promise<T> {
    const record = await this.db.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!record) throw new NotFoundError(this.model, id);
    return record;
  }

  async findMany(
    organizationId: string,
    options: PaginationOptions,
    where: Record<string, unknown> = {}
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc" } = options;
    const skip = (page - 1) * limit;

    const baseWhere = { ...where, organizationId, deletedAt: null };

    const [data, total] = await Promise.all([
      this.db.findMany({
        where: baseWhere,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.db.count({ where: baseWhere }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Partial<T> & { organizationId: string }): Promise<T> {
    return this.db.create({ data });
  }

  async update(id: string, organizationId: string, data: Partial<T>): Promise<T> {
    await this.findById(id, organizationId); // Ensure exists
    return this.db.update({ where: { id }, data });
  }

  async softDelete(id: string, organizationId: string): Promise<void> {
    await this.findById(id, organizationId);
    await this.db.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async count(organizationId: string, where: Record<string, unknown> = {}): Promise<number> {
    return this.db.count({ where: { ...where, organizationId, deletedAt: null } });
  }
}
