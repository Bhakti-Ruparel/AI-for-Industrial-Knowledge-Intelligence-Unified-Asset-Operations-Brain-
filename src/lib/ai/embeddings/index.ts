// ═══════════════════════════════════════════════════════════════════════════════
// Embeddings Service — Vector generation abstraction
// ═══════════════════════════════════════════════════════════════════════════════

import { generateEmbedding, generateBatchEmbeddings } from "@/lib/ai/huggingface/client";
import { createLogger } from "@/utils/logger";

const logger = createLogger("embeddings");

export async function embed(text: string): Promise<number[]> {
  logger.debug({ textLength: text.length }, "Generating embedding");
  return generateEmbedding(text);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  logger.info({ count: texts.length }, "Generating batch embeddings");
  // Process in batches of 32 to avoid API limits
  const batchSize = 32;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await generateBatchEmbeddings(batch);
    results.push(...embeddings);
  }

  return results;
}
