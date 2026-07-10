// ═══════════════════════════════════════════════════════════════════════════════
// Storage Service — Supabase Storage abstraction
// ═══════════════════════════════════════════════════════════════════════════════

import { getSupabaseServer } from "@/lib/database/supabase/client";
import { config } from "@/config";
import { createLogger } from "@/utils/logger";
import { InternalServerError } from "@/utils/errors";

const logger = createLogger("storage");

export interface UploadResult {
  path: string;
  publicUrl: string;
  size: number;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Uint8Array,
  contentType: string
): Promise<UploadResult> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) {
    logger.error({ error, bucket, path }, "File upload failed");
    throw new InternalServerError(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
    size: file.length,
  };
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    logger.error({ error, bucket, path }, "File deletion failed");
  }
}

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new InternalServerError(`Signed URL generation failed: ${error.message}`);
  return data.signedUrl;
}
