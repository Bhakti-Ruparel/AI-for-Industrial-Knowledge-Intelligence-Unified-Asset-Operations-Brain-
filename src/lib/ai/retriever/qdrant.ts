// ═══════════════════════════════════════════════════════════════════════════════
// Qdrant Vector Store — Similarity search
// ═══════════════════════════════════════════════════════════════════════════════

import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "@/config";
import { createLogger } from "@/utils/logger";

const logger = createLogger("qdrant");

let client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey || undefined,
    });
  }
  return client;
}

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

export async function upsertPoints(points: VectorPoint[]): Promise<void> {
  const qdrant = getClient();
  await qdrant.upsert(config.qdrant.collectionName, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload,
    })),
  });
  logger.info({ count: points.length }, "Points upserted to Qdrant");
}

export async function searchSimilar(
  vector: number[],
  limit: number = config.ai.topK,
  filter?: Record<string, unknown>
): Promise<SearchResult[]> {
  const qdrant = getClient();

  const results = await qdrant.search(config.qdrant.collectionName, {
    vector,
    limit,
    with_payload: true,
    score_threshold: config.ai.minConfidence,
    ...(filter && { filter }),
  });

  return results.map((r) => ({
    id: String(r.id),
    score: r.score,
    payload: (r.payload as Record<string, unknown>) || {},
  }));
}

export async function deletePoints(ids: string[]): Promise<void> {
  const qdrant = getClient();
  await qdrant.delete(config.qdrant.collectionName, { wait: true, points: ids });
}

export async function ensureCollection(vectorSize: number = 384): Promise<void> {
  const qdrant = getClient();
  try {
    await qdrant.getCollection(config.qdrant.collectionName);
  } catch {
    await qdrant.createCollection(config.qdrant.collectionName, {
      vectors: { size: vectorSize, distance: "Cosine" },
    });
    logger.info({ collection: config.qdrant.collectionName, vectorSize }, "Collection created");
  }
}
