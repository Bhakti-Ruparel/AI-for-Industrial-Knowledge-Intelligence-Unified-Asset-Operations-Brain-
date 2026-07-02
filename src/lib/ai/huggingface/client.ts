// ═══════════════════════════════════════════════════════════════════════════════
// Hugging Face Inference API Client
// ═══════════════════════════════════════════════════════════════════════════════

import { config } from "@/config";
import { createLogger } from "@/utils/logger";
import { ServiceUnavailableError } from "@/utils/errors";

const logger = createLogger("huggingface");

const HF_API = "https://api-inference.huggingface.co/models";

export async function generateText(prompt: string, model?: string): Promise<string> {
  const modelId = model || config.huggingface.chatModel;

  const response = await fetch(`${HF_API}/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.huggingface.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 2048, temperature: 0.3, return_full_text: false },
    }),
  });

  if (!response.ok) {
    logger.error({ status: response.status, model: modelId }, "HF inference failed");
    throw new ServiceUnavailableError("Hugging Face Inference");
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0]?.generated_text || "" : data.generated_text || "";
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${HF_API}/${config.huggingface.embeddingModel}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.huggingface.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    logger.error({ status: response.status }, "HF embedding failed");
    throw new ServiceUnavailableError("Hugging Face Embeddings");
  }

  const data = await response.json();
  return Array.isArray(data[0]) ? data[0] : data;
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${HF_API}/${config.huggingface.embeddingModel}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.huggingface.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: texts }),
  });

  if (!response.ok) {
    throw new ServiceUnavailableError("Hugging Face Embeddings");
  }

  return response.json();
}
