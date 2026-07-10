// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline Stage Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface PipelineContext {
  documentId: string;
  organizationId: string;
  userId?: string;
  filename: string;
  mimeType: string;
  storagePath: string;
  buffer?: Buffer;
  text?: string;
  chunks?: ChunkOutput[];
  entities?: EntityOutput[];
  relationships?: RelationshipOutput[];
  embeddings?: EmbeddingOutput[];
  graphNodes?: string[];
  errors: string[];
  startedAt: string;
}

export interface ChunkOutput {
  content: string;
  index: number;
  pageNumber?: number;
}

export interface EntityOutput {
  type: string;
  value: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface RelationshipOutput {
  source: string;
  sourceType: string;
  target: string;
  targetType: string;
  relationship: string;
  confidence: number;
}

export interface EmbeddingOutput {
  pointId: string;
  chunkIndex: number;
}

export type PipelineStage = (ctx: PipelineContext) => Promise<PipelineContext>;
