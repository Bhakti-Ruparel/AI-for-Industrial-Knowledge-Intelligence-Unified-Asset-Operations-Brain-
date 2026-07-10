// ═══════════════════════════════════════════════════════════════════════════════
// Document Repository
// ═══════════════════════════════════════════════════════════════════════════════

import { BaseRepository } from "./base.repository";

export class DocumentRepository extends BaseRepository<any> {
  protected readonly model = "document";

  async findByStatus(organizationId: string, status: string) {
    return this.db.findMany({
      where: { organizationId, status, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPendingProcessing(organizationId: string) {
    return this.db.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { ocrStatus: "PENDING" },
          { embeddingStatus: "PENDING" },
          { knowledgeGraphStatus: "PENDING" },
        ],
      },
    });
  }

  async updateProcessingStatus(id: string, field: string, status: string) {
    return this.db.update({
      where: { id },
      data: { [field]: status },
    });
  }
}

export const documentRepository = new DocumentRepository();
