// ═══════════════════════════════════════════════════════════════════════════════
// OCR Service — Text extraction abstraction
// Supports PDF text extraction and image OCR
// Provider can be swapped (Tesseract, Google Vision, AWS Textract)
// ═══════════════════════════════════════════════════════════════════════════════

import { createLogger } from "@/utils/logger";

const logger = createLogger("ocr");

export interface OCRResult {
  text: string;
  pages: number;
  confidence: number;
  provider: string;
}

export interface OCRProvider {
  name: string;
  extractText(buffer: Buffer, mimeType: string): Promise<OCRResult>;
}

// Default provider — basic text extraction (expandable)
class DefaultOCRProvider implements OCRProvider {
  name = "default";

  async extractText(buffer: Buffer, mimeType: string): Promise<OCRResult> {
    logger.info({ mimeType, size: buffer.length }, "Extracting text");

    // For PDFs — extract raw text (placeholder for pdf-parse or similar)
    if (mimeType === "application/pdf") {
      // TODO: Integrate pdf-parse or PyMuPDF via API
      return {
        text: "[PDF text extraction pending — integrate pdf-parse]",
        pages: 1,
        confidence: 0,
        provider: this.name,
      };
    }

    // For images — placeholder for OCR provider
    if (mimeType.startsWith("image/")) {
      // TODO: Integrate Tesseract.js or cloud OCR
      return {
        text: "[Image OCR pending — integrate Tesseract or cloud provider]",
        pages: 1,
        confidence: 0,
        provider: this.name,
      };
    }

    // Plain text
    return {
      text: buffer.toString("utf-8"),
      pages: 1,
      confidence: 1.0,
      provider: this.name,
    };
  }
}

// Singleton — swap provider here
let currentProvider: OCRProvider = new DefaultOCRProvider();

export function setOCRProvider(provider: OCRProvider) {
  currentProvider = provider;
  logger.info({ provider: provider.name }, "OCR provider set");
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<OCRResult> {
  return currentProvider.extractText(buffer, mimeType);
}
