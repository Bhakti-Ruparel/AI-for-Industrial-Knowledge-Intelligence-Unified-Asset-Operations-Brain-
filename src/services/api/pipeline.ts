// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline API Service — client-side wrappers
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch } from "./auth";
import { formatFileSize } from "./documents";

const API = "/api";

export interface PipelineDocument {
  id:               string;
  title:            string;
  filename:         string;
  mimeType:         string;
  size:             number;
  status:           "UPLOADED" | "PROCESSING" | "INDEXED" | "ERROR" | "FAILED";
  processingStage?: string;
  ocrStatus?:       string;
  embeddingStatus?: string;
  knowledgeGraphStatus?: string;
  pages?:           number;
  summary?:         string;
  createdAt:        string;
  updatedAt?:       string;
  uploadedBy?:      { name: string };
  _count?:          { chunks: number };
}

// Ordered pipeline stages — matches the server-side pipeline
export const PIPELINE_STAGES = [
  { key: "UPLOAD_COMPLETE",         label: "Uploaded"             },
  { key: "TEXT_EXTRACTION",         label: "Text Extraction"      },
  { key: "DOCUMENT_CLASSIFICATION", label: "Classification"       },
  { key: "ENTITY_EXTRACTION",       label: "Entity Extraction"    },
  { key: "RELATIONSHIP_EXTRACTION", label: "Relationships"        },
  { key: "CHUNKING",                label: "Chunking"             },
  { key: "EMBEDDING",               label: "Embedding"            },
  { key: "QDRANT_INDEX",            label: "Vector Indexing"      },
  { key: "KNOWLEDGE_GRAPH",         label: "Knowledge Graph"      },
  { key: "SUMMARY_GENERATION",      label: "Summary Generation"   },
  { key: "COMPLETE",                label: "Indexed"              },
] as const;

export type StageKey = typeof PIPELINE_STAGES[number]["key"];

export function getStageIndex(stage?: string): number {
  if (!stage) return -1;
  return PIPELINE_STAGES.findIndex((s) => s.key === stage);
}

export function getStageProgress(stage?: string): number {
  const idx = getStageIndex(stage);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
}

export function formatPipelineDuration(createdAt: string, updatedAt?: string): string {
  const start = new Date(createdAt).getTime();
  const end   = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const ms    = end - start;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export { formatFileSize };

export async function fetchPipelineJobs(): Promise<PipelineDocument[]> {
  const res = await authFetch(`${API}/pipeline`);
  if (!res.ok) throw new Error(`Failed to fetch pipeline jobs: ${res.status}`);
  return (await res.json()).data ?? [];
}
