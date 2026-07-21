// ═══════════════════════════════════════════════════════════════════════════════
// OCR Service — PDF text extraction using pdf-parse v2
// Gracefully handles environments where pdf-parse is not available
// ═══════════════════════════════════════════════════════════════════════════════

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
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse(new Uint8Array(buffer));
      const result = await parser.getText();
      const text = result.text.trim();
      const pages = result.total || 1;
      logger.info({ pages, textLength: text.length, first100: text.slice(0, 100) }, "[OCR] PDF PASS");
      return {
        text: text || "",
        pages,
        confidence: text.length > 50 ? 0.9 : text.length > 0 ? 0.5 : 0,
        provider: "pdf-parse",
      };
    } catch (e: any) {
      logger.error({ error: e?.message, stack: e?.stack?.slice(0, 300) }, "[OCR] PDF FAIL");
      return { text: "", pages: 1, confidence: 0, provider: "failed" };
    }
  }

  if (mimeType.startsWith("image/")) {
    return { text: "", pages: 1, confidence: 0, provider: "none" };
  }

  // Plain text
  const text = buffer.toString("utf-8").trim();
  return { text, pages: 1, confidence: 1.0, provider: "utf8" };
}
