// ═══════════════════════════════════════════════════════════════════════════════
// LLM Synthesizer — Generates natural language responses from structured data
// Falls back to formatted text if LLM is unavailable
// ═══════════════════════════════════════════════════════════════════════════════

import { generateText } from "@/lib/ai/huggingface/client";
import { createLogger } from "@/utils/logger";

const logger = createLogger("llm-synthesizer");

export interface SynthesizeOptions {
  /** The user's original question */
  question: string;
  /** The system role context */
  systemPrompt: string;
  /** Structured data fetched from the database — passed as context to the LLM */
  data: Record<string, unknown> | string;
  /** Pre-formatted fallback response if LLM is unavailable */
  fallback: string;
}

/**
 * Attempts to synthesize a natural language response using the LLM.
 * If the LLM is unavailable (rate limit, timeout, error), returns the pre-formatted fallback.
 */
export async function synthesize(options: SynthesizeOptions): Promise<string> {
  const { question, systemPrompt, data, fallback } = options;

  const dataStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const prompt = [
    `<|system|>\n${systemPrompt}\n`,
    `<|user|>\nQuestion: ${question}\n\nRelevant data from the database:\n${dataStr}\n`,
    `<|assistant|>\n`,
  ].join("");

  try {
    const response = await generateText(prompt);
    const cleaned = cleanLLMResponse(response);
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
    // LLM returned empty/garbage — use fallback
    return fallback;
  } catch (err) {
    logger.debug({ err }, "LLM synthesis unavailable — using structured fallback");
    return fallback;
  }
}

function cleanLLMResponse(raw: string): string {
  if (!raw?.trim()) return "";
  let text = raw.trim();

  // Strip system/user/assistant markers if model echoed them
  const markers = ["<|assistant|>", "<|user|>", "<|system|>", "[Answer]", "Answer:"];
  for (const marker of markers) {
    const idx = text.lastIndexOf(marker);
    if (idx !== -1) text = text.slice(idx + marker.length).trim();
  }

  // Remove leading "Sure!" / "Here's" noise
  text = text.replace(/^(Sure[!,.]?\s*|Here['']?s?\s*(what|the|your)?\s*)/i, "").trim();

  return text;
}
