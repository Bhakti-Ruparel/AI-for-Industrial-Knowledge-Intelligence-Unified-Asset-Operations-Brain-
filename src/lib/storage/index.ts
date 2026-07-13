// ═══════════════════════════════════════════════════════════════════════════════
// Storage Service — Supabase Storage with scalable path structure
// Path: industrial-documents/{orgId}/{year}/{month}/{docId}/{storedFilename}
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@/utils/logger";
import { InternalServerError } from "@/utils/errors";

const logger = createLogger("storage");

export const DOCUMENT_BUCKET = "industrial-documents";

export interface UploadResult {
  path:           string;
  storedFilename: string;
  bucket:         string;
  size:           number;
}

// ── Derive Supabase URL from DATABASE_URL if NEXT_PUBLIC_SUPABASE_URL is missing
function getSupabaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  // Derive from DATABASE_URL: postgresql://user:pass@db.{ref}.supabase.co:5432/postgres
  const dbUrl = process.env.DATABASE_URL ?? "";
  const match = dbUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/);
  if (match) return `https://${match[1]}.supabase.co`;

  throw new Error("Cannot determine Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url    = getSupabaseUrl();
  const key    = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  _client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _client;
}

// ── Check if storage is usable ────────────────────────────────────────────────
export function isStorageConfigured(): boolean {
  try {
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DATABASE_URL?.includes(".supabase.co"));
    return hasKey && hasUrl;
  } catch {
    return false;
  }
}

// ── Build scalable storage path ───────────────────────────────────────────────
export function buildStoragePath(
  organizationId: string,
  documentId:     string,
  storedFilename: string
): string {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${organizationId}/${year}/${month}/${documentId}/${storedFilename}`;
}

// ── Upload a file buffer ──────────────────────────────────────────────────────
export async function uploadFile(
  bucket:      string,
  path:        string,
  file:        Buffer | Uint8Array,
  contentType: string
): Promise<UploadResult> {
  const supabase = getClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) {
    logger.error({ error: error.message, bucket, path }, "File upload failed");
    throw new InternalServerError(`Storage upload failed: ${error.message}`);
  }

  logger.info({ bucket, path, size: file.length }, "File uploaded to Supabase Storage");

  return {
    path:           data.path,
    storedFilename: path.split("/").pop() ?? path,
    bucket,
    size:           file.length,
  };
}

// ── Generate a signed (temporary) download URL ───────────────────────────────
export async function getSignedUrl(
  bucket:    string,
  path:      string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = getClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new InternalServerError(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

// ── Delete a file ─────────────────────────────────────────────────────────────
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    logger.warn({ error: error.message, bucket, path }, "File deletion warning");
  } else {
    logger.info({ bucket, path }, "File deleted from Supabase Storage");
  }
}
