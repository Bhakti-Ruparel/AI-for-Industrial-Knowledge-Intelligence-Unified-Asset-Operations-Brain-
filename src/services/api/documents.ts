// ═══════════════════════════════════════════════════════════════════════════════
// Documents API Service — Client-side fetch wrappers with auth
// ═══════════════════════════════════════════════════════════════════════════════

import { authFetch, getAccessToken } from "./auth";

const API = "/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentRecord {
  id:              string;
  title:           string;
  filename:        string;
  storedFilename?: string;
  storagePath?:    string;
  mimeType:        string;
  size:            number;
  checksum?:       string;
  type:            string;
  status:          "UPLOADED" | "PROCESSING" | "INDEXED" | "ERROR" | "FAILED";
  processingStage?: string;
  ocrStatus?:       string;
  embeddingStatus?: string;
  knowledgeGraphStatus?: string;
  pages?:           number;
  language?:        string;
  summary?:         string;
  tags?:            { tag: { id: string; name: string; color?: string } }[];
  equipmentId?:     string;
  organizationId:   string;
  uploadedById?:    string;
  createdAt:        string;
  updatedAt?:       string;
}

export interface DocumentListResponse {
  data:  DocumentRecord[];
  total: number;
  page:  number;
  limit: number;
}

export interface DocumentStats {
  total:      number;
  indexed:    number;
  processing: number;
  failed:     number;
}

export interface DocumentQueryParams {
  page?:        number;
  limit?:       number;
  search?:      string;
  status?:      string;
  type?:        string;
  equipmentId?: string;
  sortBy?:      string;
  sortOrder?:   "asc" | "desc";
  dateFrom?:    string;
  dateTo?:      string;
}

// ── List documents ────────────────────────────────────────────────────────────

export async function fetchDocuments(
  params: DocumentQueryParams = {}
): Promise<DocumentListResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });

  const res = await authFetch(`${API}/documents?${qs.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);

  const json = await res.json();
  return {
    data:  json.data  ?? [],
    total: json.meta?.pagination?.total ?? 0,
    page:  params.page  ?? 1,
    limit: params.limit ?? 20,
  };
}

// ── Upload document with XHR for progress ─────────────────────────────────────

export async function uploadDocument(
  file:          File,
  title:         string,
  type           = "OTHER",
  equipmentId?:  string,
  onProgress?:   (pct: number) => void
): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append("file",  file);
  formData.append("title", title);
  formData.append("type",  type);
  if (equipmentId) formData.append("equipmentId", equipmentId);

  // Get token for XHR (can't use authFetch for progress tracking)
  const token = await getAccessToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json.data ?? json);
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        try {
          const json = JSON.parse(xhr.responseText);
          reject(new Error(json.message ?? `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("POST", `${API}/documents/upload`);
    // Add Bearer token if available (cookie-based auth is the fallback)
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}

// ── Get single document ───────────────────────────────────────────────────────

export async function fetchDocumentById(id: string, withDownloadUrl = false): Promise<DocumentRecord> {
  const url = withDownloadUrl
    ? `${API}/documents/${id}?download=true`
    : `${API}/documents/${id}`;
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`Document not found: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// ── Delete document ───────────────────────────────────────────────────────────

export async function deleteDocument(id: string): Promise<void> {
  const res = await authFetch(`${API}/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

// ── Retry failed document ─────────────────────────────────────────────────────

export async function retryDocumentProcessing(id: string): Promise<{ id: string; status: string }> {
  const res = await authFetch(`${API}/documents/${id}/retry`, { method: "POST" });
  if (!res.ok) throw new Error(`Retry failed: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// ── Document stats ────────────────────────────────────────────────────────────

export async function fetchDocumentStats(): Promise<DocumentStats> {
  const res = await authFetch(`${API}/documents/stats`);
  if (!res.ok) throw new Error(`Failed to fetch document stats: ${res.status}`);
  const json = await res.json();
  return json.data ?? { total: 0, indexed: 0, processing: 0, failed: 0 };
}

// ── Format file size ──────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000)     return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}
