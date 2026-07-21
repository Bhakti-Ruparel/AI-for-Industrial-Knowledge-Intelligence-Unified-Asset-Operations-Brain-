// ═══════════════════════════════════════════════════════════════════════════════
// OCR Service — PDF text extraction using pdf-parse v2
// ═══════════════════════════════════════════════════════════════════════════════

import { PDFParse, type TextResult } from "pdf-parse";
import { createLogger } from "@/utils/logger";

const logger = createLogger("ocr");

export interface OCRResult {
  text: string;
  pages: number;
  confidence: number;
  provider: string;
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<OCRResult> {
  logger.info({ mimeType, sizeBytes: buffer.length }, "[OCR] extractText called");

  if (mimeType === "application/pdf") {
    logger.info("[OCR] Parsing PDF with pdf-parse v2...");
    const parser = new PDFParse(new Uint8Array(buffer));
    const result: TextResult = await parser.getText();
    const text = result.text.trim();
    const pages = result.total || 1;
    logger.info({ pages, textLength: text.length, first100: text.slice(0, 100) }, "[OCR] PDF extraction complete");
    return {
      text: text || "",
      pages,
      confidence: text.length > 50 ? 0.9 : text.length > 0 ? 0.5 : 0,
      provider: "pdf-parse",
    };
  }

  if (mimeType.startsWith("image/")) {
    logger.warn("[OCR] Image OCR not implemented");
    return { text: "", pages: 1, confidence: 0, provider: "none" };
  }

  // Plain text / csv / other text formats
  const text = buffer.toString("utf-8").trim();
  logger.info({ textLength: text.length }, "[OCR] Plain text extraction");
  return { text, pages: 1, confidence: 1.0, provider: "utf8" };
}
