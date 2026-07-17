"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// DocumentPreview — Modal that shows document metadata, summary, processing
// status, and a signed download/view URL for PDFs and images.
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Download, X, CheckCircle, Clock, AlertCircle,
  FileImage, FileSpreadsheet, Tag, Calendar, Hash, Layers,
  Eye as EyeIcon, Loader2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchDocumentById, formatFileSize, type DocumentRecord } from "@/services/api/documents";

// Direct relative path to completely avoid Next.js/TypeScript path alias errors:
import { getSupabaseBrowser } from "@/lib/database/supabase/client";
function mimeToIcon(mimeType: string) {
  if (mimeType.startsWith("image/"))           return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv")) return FileSpreadsheet;
  return FileText;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  UPLOADED:   { icon: Clock,       color: "text-blue-600",    bg: "bg-blue-50",    label: "Uploaded"   },
  PROCESSING: { icon: Clock,       color: "text-amber-600",   bg: "bg-amber-50",   label: "Processing" },
  INDEXED:    { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", label: "Indexed"    },
  ERROR:      { icon: AlertCircle, color: "text-red-600",     bg: "bg-red-50",     label: "Failed"     },
  FAILED:     { icon: AlertCircle, color: "text-red-600",     bg: "bg-red-50",     label: "Failed"     },
};

const stageOrder = [
  "UPLOAD_COMPLETE", "TEXT_EXTRACTION", "DOCUMENT_CLASSIFICATION",
  "ENTITY_EXTRACTION", "RELATIONSHIP_EXTRACTION", "CHUNKING",
  "EMBEDDING", "QDRANT_INDEX", "KNOWLEDGE_GRAPH", "SUMMARY_GENERATION", "COMPLETE",
];

const stageLabel: Record<string, string> = {
  UPLOAD_COMPLETE:         "Uploaded",
  TEXT_EXTRACTION:         "Text Extraction",
  DOCUMENT_CLASSIFICATION: "Classification",
  ENTITY_EXTRACTION:       "Entity Extraction",
  RELATIONSHIP_EXTRACTION: "Relationship Extraction",
  CHUNKING:                "Chunking",
  EMBEDDING:               "Embedding",
  QDRANT_INDEX:            "Vector Indexing",
  KNOWLEDGE_GRAPH:         "Knowledge Graph",
  SUMMARY_GENERATION:      "Summary Generation",
  COMPLETE:                "Fully Indexed",
};

function PipelineProgress({ doc }: { doc: DocumentRecord }) {
  const currentIdx = doc.processingStage ? stageOrder.indexOf(doc.processingStage) : -1;
  const isActive   = doc.status === "PROCESSING" || doc.status === "UPLOADED";
  const isFailed   = doc.status === "ERROR" || doc.status === "FAILED";

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        Pipeline Progress
      </p>
      <div className="space-y-1.5">
        {stageOrder.map((stage, idx) => {
          const done    = idx < currentIdx;
          const current = idx === currentIdx && isActive;
          const failed  = idx === currentIdx && isFailed;

          return (
            <div key={stage} className="flex items-center gap-2.5">
              <div className={cn(
                "h-4 w-4 shrink-0 rounded-full flex items-center justify-center",
                done    ? "bg-emerald-500"  :
                current ? "bg-amber-400"    :
                failed  ? "bg-red-500"      :
                          "bg-zinc-200"
              )}>
                {done && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                {current && <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />}
                {failed && <AlertCircle className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className={cn(
                "text-[11px] font-medium",
                done    ? "text-emerald-600" :
                current ? "text-amber-600"   :
                failed  ? "text-red-600"     :
                          "text-zinc-400"
              )}>
                {stageLabel[stage] ?? stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Preview panel for images / PDFs ──────────────────────────────────────────
function FilePreview({ doc, url }: { doc: DocumentRecord; url: string }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
          <EyeIcon className="h-5 w-5 text-zinc-400" />
        </div>
        <p className="text-[12px] text-zinc-500">Preview unavailable</p>
        <p className="text-[11px] text-zinc-400 max-w-xs px-4">
          The storage parameters or direct URLs could not be verified.
        </p>
      </div>
    );
  }

  if (doc.mimeType === "application/pdf") {
    return (
      <iframe
        src={url}
        title={doc.title}
        className="h-[440px] w-full rounded-xl border border-zinc-100 bg-white"
      />
    );
  }

  if (doc.mimeType.startsWith("image/")) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={doc.title}
          className="max-h-[440px] w-auto rounded-lg object-contain shadow-sm"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10">
      <FileText className="h-8 w-8 text-zinc-300" />
      <p className="text-[12px] text-zinc-500">No visual preview available for this file type</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-[12px] font-semibold text-white hover:bg-zinc-700 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Download to view
      </a>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface DocumentPreviewProps {
  documentId: string;
  onClose: () => void;
}

export function DocumentPreview({ documentId, onClose }: DocumentPreviewProps) {
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  // 1. Fetch document record metadata
  const { data: doc, isLoading, isError, refetch } = useQuery({
    queryKey: ["document", documentId, "preview"],
    queryFn: () => fetchDocumentById(documentId, true) as Promise<DocumentRecord & { downloadUrl?: string }>,
    staleTime: 30_000,
  });

  // 2. Resolve Signed URL with safety checks
  useEffect(() => {
    async function getSignedUrl() {
      if (!doc) return;
      
const docWithStorage = doc as any;

console.log("FULL DOCUMENT:", docWithStorage);
console.log("Bucket:", docWithStorage.bucketName);
console.log("Storage:", docWithStorage.storagePath);
      if (docWithStorage.downloadUrl) {
        setDownloadUrl(docWithStorage.downloadUrl);
        return;
      }

      if (docWithStorage.bucketName && docWithStorage.storagePath) {
        try {
          const supabase = getSupabaseBrowser();
          if (!supabase?.storage) {
            throw new Error("Supabase storage client is uninitialized.");
          }
  console.log("Document object:", docWithStorage);
console.log("Bucket Name:", docWithStorage.bucketName);
console.log("Storage Path:", docWithStorage.storagePath);

const { data, error } = await supabase.storage
  .from(docWithStorage.bucketName)
  .createSignedUrl(docWithStorage.storagePath, 1800);
          if (error) throw error;
          if (data?.signedUrl) {
            setDownloadUrl(data.signedUrl);
          }
        } catch (err) {
          console.warn("Could not generate signed URL, falling back to public fallback URL:", err);
          
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
          if (supabaseUrl) {
            setDownloadUrl(`${supabaseUrl}/storage/v1/object/public/${docWithStorage.bucketName}/${docWithStorage.storagePath}`);
          }
        }
      }
    }

    getSignedUrl();
  }, [doc]);

  const FileIcon = doc ? mimeToIcon(doc.mimeType) : FileText;
  const stCfg    = doc ? (statusConfig[doc.status] ?? statusConfig.UPLOADED) : null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF2EB]">
            <FileIcon className="h-4 w-4 text-[#FF6B2C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-zinc-900 truncate">
              {isLoading ? "Loading…" : doc?.title ?? "Document"}
            </p>
            {doc && (
              <p className="text-[11px] text-zinc-400 truncate">{doc.filename}</p>
            )}
          </div>
          {/* Download button */}
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          )}
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — preview */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-zinc-100">
            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[#FF6B2C]" />
                <p className="text-[12px] text-zinc-500">Loading document…</p>
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <p className="text-[13px] font-semibold text-zinc-800">Failed to load document</p>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-[12px] font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            {doc && <FilePreview doc={doc} url={downloadUrl} />}

            {/* Summary */}
            {doc?.summary && (
              <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  AI Summary
                </p>
                <p className="text-[13px] text-zinc-700 leading-relaxed">{doc.summary}</p>
              </div>
            )}
          </div>

          {/* Right — metadata */}
          <div className="w-[260px] shrink-0 overflow-y-auto p-5 space-y-5">

            {/* Status */}
            {doc && stCfg && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Status
                </p>
                <div className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold",
                  stCfg.bg
                )}>
                  <stCfg.icon className={cn("h-3.5 w-3.5", stCfg.color)} />
                  <span className={stCfg.color}>{stCfg.label}</span>
                </div>
              </div>
            )}

            {/* Metadata rows */}
            {doc && (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Details
                </p>

                {[
                  { icon: Hash,     label: "Type",     value: (doc.type ?? "").replace(/_/g, " ") },
                  { icon: Layers,   label: "Size",     value: formatFileSize(doc.size) },
                  ...(doc.pages ? [{ icon: FileText, label: "Pages", value: `${doc.pages} pages` }] : []),
                  ...(doc.language ? [{ icon: Tag, label: "Language", value: doc.language }] : []),
                  { icon: Calendar, label: "Uploaded", value: formatDate(doc.createdAt) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                      <Icon className="h-3.5 w-3.5 text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
                      <p className="text-[12px] font-medium text-zinc-800 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-processing statuses */}
            {doc && (doc.ocrStatus || doc.embeddingStatus || doc.knowledgeGraphStatus) && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Processing
                </p>
                {[
                  { label: "OCR / Text",      val: doc.ocrStatus },
                  { label: "Embeddings",      val: doc.embeddingStatus },
                  { label: "Knowledge Graph", val: doc.knowledgeGraphStatus },
                ].filter(r => r.val).map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">{label}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase rounded-lg px-2 py-0.5",
                      val === "COMPLETE"     ? "bg-emerald-50 text-emerald-600" :
                      val === "IN_PROGRESS"  ? "bg-amber-50 text-amber-600"    :
                      val === "FAILED"       ? "bg-red-50 text-red-600"        :
                                              "bg-zinc-100 text-zinc-500"
                    )}>
                      {val?.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {doc?.tags && doc.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                      style={tag.color ? { borderColor: tag.color + "40", color: tag.color } : {}}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline progress — only show when processing */}
            {doc && (doc.status === "PROCESSING" || doc.status === "UPLOADED") && (
              <PipelineProgress doc={doc} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}