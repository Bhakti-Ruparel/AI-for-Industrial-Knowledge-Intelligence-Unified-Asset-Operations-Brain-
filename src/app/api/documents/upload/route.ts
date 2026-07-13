// POST /api/documents/upload — Upload + store + trigger async pipeline
import { withAuth }        from "@/middlewares/with-auth";
import { uploadDocument }  from "@/services/document";
import { createdResponse, errorResponse } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export const POST = withAuth(async (request, ctx) => {
  try {
    const formData    = await request.formData();
    const file        = formData.get("file") as File | null;
    const title       = formData.get("title") as string | null;
    const type        = (formData.get("type") as string | null) ?? "OTHER";
    const equipmentId = formData.get("equipmentId") as string | null;

    if (!file)  throw new ValidationError("File is required",  { file:  ["No file provided"] });
    if (!title) throw new ValidationError("Title is required", { title: ["Title is required"] });

    const buffer = Buffer.from(await file.arrayBuffer());

    const document = await uploadDocument({
      file:           buffer,
      filename:       file.name,
      mimeType:       file.type || "application/octet-stream",
      size:           file.size,
      title:          title.trim(),
      type,
      organizationId: ctx.organizationId,
      uploadedById:   ctx.userId,
      equipmentId:    equipmentId ?? undefined,
    });

    return createdResponse(document, "Document uploaded — processing started in background");
  } catch (error) {
    return errorResponse(error);
  }
});
