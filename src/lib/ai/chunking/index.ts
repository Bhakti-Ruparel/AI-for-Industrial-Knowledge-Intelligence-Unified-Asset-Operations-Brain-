// ═══════════════════════════════════════════════════════════════════════════════
// Document Chunking — Recursive text splitter
// ═══════════════════════════════════════════════════════════════════════════════

import { config } from "@/config";
import { createLogger } from "@/utils/logger";

const logger = createLogger("chunking");

export interface Chunk {
  content: string;
  index: number;
  pageNumber?: number;
  metadata?: Record<string, unknown>;
}

export function chunkDocument(
  text: string,
  options?: { chunkSize?: number; overlap?: number }
): Chunk[] {
  const chunkSize = options?.chunkSize || config.ai.chunkSize;
  const overlap = options?.overlap || config.ai.chunkOverlap;

  const separators = ["\n\n", "\n", ". ", " "];
  const chunks: Chunk[] = [];

  const splits = recursiveSplit(text, separators, chunkSize);

  let index = 0;
  for (let i = 0; i < splits.length; i++) {
    let content = splits[i];

    // Add overlap from previous chunk
    if (i > 0 && overlap > 0) {
      const prevEnd = splits[i - 1].slice(-overlap);
      content = prevEnd + content;
    }

    chunks.push({ content: content.trim(), index });
    index++;
  }

  logger.info({ totalChunks: chunks.length, textLength: text.length, chunkSize }, "Document chunked");
  return chunks.filter((c) => c.content.length > 50); // Skip tiny fragments
}

function recursiveSplit(text: string, separators: string[], maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const separator = separators.find((sep) => text.includes(sep)) || separators[separators.length - 1];
  const parts = text.split(separator);
  const results: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? current + separator + part : part;
    if (candidate.length > maxLength && current) {
      results.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }

  if (current) results.push(current);
  return results;
}
