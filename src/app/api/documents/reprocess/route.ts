// POST /api/documents/reprocess — Re-extract text from existing documents
import { withAuth } from "@/middlewares/with-auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseServer } from "@/lib/database/supabase/client";
import { extractText } from "@/lib/ai/ocr";
import { successResponse, errorResponse } from "@/utils/response";

export const POST = withAuth(async (request, ctx) => {
  try {
    if (!prisma) return errorResponse(new Error("Database unavailable"));

    // Find documents with pending/placeholder text
    const docs = await (prisma as any).document.findMany({
      where: {
        organizationId: ctx.organizationId,
        deletedAt: null,
        OR: [
          { extractedText: null },
          { extractedText: { contains: "pending" } },
          { ocrStatus: "PENDING" },
        ],
      },
      select: { id: true, title: true, storagePath: true, bucketName: true, mimeType: true },
    });

    if (docs.length === 0) {
      return successResponse({ processed: 0, message: "All documents already processed." });
    }

    const supabase = getSupabaseServer();
    let processed = 0;
    const results: { title: string; status: string; textLength?: number }[] = [];

    for (const doc of docs) {
      try {
        // Download file from Supabase storage
        const { data: fileData, error } = await supabase.storage
          .from(doc.bucketName || "industrial-documents")
          .download(doc.storagePath);

        if (error || !fileData) {
          results.push({ title: doc.title, status: `download failed: ${error?.message}` });
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());

        // Extract text
        const ocrResult = await extractText(buffer, doc.mimeType);

        if (ocrResult.text && ocrResult.confidence > 0) {
          // Update document with extracted text
          await (prisma as any).document.update({
            where: { id: doc.id },
            data: {
              extractedText: ocrResult.text,
              pages: ocrResult.pages,
              ocrStatus: "COMPLETE",
              status: "INDEXED",
            },
          });
          processed++;
          results.push({ title: doc.title, status: "success", textLength: ocrResult.text.length });
        } else {
          await (prisma as any).document.update({
            where: { id: doc.id },
            data: { ocrStatus: "FAILED" },
          });
          results.push({ title: doc.title, status: "no text extracted" });
        }
      } catch (e: any) {
        results.push({ title: doc.title, status: `error: ${e.message?.slice(0, 100)}` });
      }
    }

    return successResponse({ processed, total: docs.length, results });
  } catch (error) {
    return errorResponse(error);
  }
});
