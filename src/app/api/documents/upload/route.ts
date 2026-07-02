// POST /api/documents/upload — Upload and process document
import { NextRequest } from "next/server";
import { withAuth } from "@/middlewares/with-auth";
import { uploadDocument } from "@/services/document";
import { createdResponse, errorResponse } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export const POST = withAuth(async (request, ctx) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const type = (formData.get("type") as string) || "OTHER";
    const equipmentId = formData.get("equipmentId") as string | null;

    if (!file) throw new ValidationError("File is required", { file: ["No file provided"] });
    if (!title) throw new ValidationError("Title is required", { title: ["Title is required"] });

    const buffer = Buffer.from(await file.arrayBuffer());

    const document = await uploadDocument({
      file: buffer,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      title,
      type,
      organizationId: ctx.organizationId,
      uploadedById: ctx.userId,
      equipmentId: equipmentId || undefined,
    });

    return createdResponse(document, "Document uploaded and processing started");
  } catch (error) {
    return errorResponse(error);
  }
});
