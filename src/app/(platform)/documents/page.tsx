"use client";

import {
  useState, useRef, useEffect,
  type ChangeEvent, type DragEvent,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments, uploadDocument, deleteDocument,
  retryDocumentProcessing, formatFileSize,
  type DocumentRecord, type DocumentQueryParams,
} from "@/services/api/documents";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";
import { DocumentPreview } from "@/components/documents/document-preview";
import { ProcessingStatusRow } from "@/components/shared/processing-status-row";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Upload, Eye, Trash2,
  CheckCircle, Clock, AlertCircle, X, Loader2,
  RefreshCw, ChevronLeft, ChevronRight, Filter,
  FileSpreadsheet, Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<string, {
  icon: typeof CheckCircle; color: string; bg: string; label: string; dot: string;
}> = {
  UPLOADED:   { icon: Clock,        color: "text-blue-600",    bg: "bg-blue-50 border-blue-200/70",       label: "Uploaded",   dot: "bg-blue-500"    },
  PROCESSING: { icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50 border-amber-200/70",     label: "Processing", dot: "bg-amber-500"   },
  INDEXED:    { icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200/70", label: "Indexed",    dot: "bg-emerald-500" },
  ERROR:      { icon: AlertCircle,  color: "text-red-600",     bg: "bg-red-50 border-red-200/70",         label: "Failed",     dot: "bg-red-500"     },
  FAILED:     { icon: AlertCircle,  color: "text-red-600",     bg: "bg-red-50 border-red-200/70",         label: "Failed",     dot: "bg-red-500"     },
};

const stageLabels: Record<string, string> = {
  UPLOAD_COMPLETE:         "Uploaded",
  PROCESSING:              "Starting…",
  TEXT_EXTRACTION:         "Extracting text…",
  DOCUMENT_CLASSIFICATION: "Classifying…",
  ENTITY_EXTRACTION:       "Extracting entities…",
  RELATIONSHIP_EXTRACTION: "Finding relationships…",
  CHUNKING:                "Chunking content…",
  EMBEDDING:               "Generating embeddings…",
  QDRANT_INDEX:            "Indexing vectors…",
  KNOWLEDGE_GRAPH:         "Building graph…",
  SUMMARY_GENERATION:      "Summarizing…",
  COMPLETE:                "Fully indexed",
  FAILED:                  "Processing failed",
};

const typeLabels: Record<string, string> = {
  all:         "All Types",
  MANUAL:      "Manuals",
  REPORT:      "Reports",
  REGULATION:  "Regulations",
  SOP:         "SOPs",
  DRAWING:     "Drawings",
  INSPECTION:  "Inspection",
  CERTIFICATE: "Certificates",
  INVOICE:     "Invoices",
  OTHER:       "Other",
};

function mimeToIcon(mimeType: string) {
  if (mimeType?.includes("image")) return Image;
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("csv") || mimeType?.includes("excel"))
    return FileSpreadsheet;
  return FileText;
}

const ALLOWED_EXTENSIONS = ".pdf,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg,.webp,.tiff";
const ITEMS_PER_PAGE = 20;

export default function DocumentsPage() {
  const [search,        setSearch]        = useState("");
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [page,          setPage]          = useState(1);
  const [dragOver,      setDragOver]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [previewId,     setPreviewId]     = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast        = useToast();
  const qc           = useQueryClient();

  const queryParams: DocumentQueryParams = {
    page,
    limit:     ITEMS_PER_PAGE,
    search:    search       || undefined,
    type:      typeFilter   !== "all" ? typeFilter   : undefined,
    status:    statusFilter !== "all" ? statusFilter : undefined,
    sortBy:    "createdAt",
    sortOrder: "desc",
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["documents", queryParams],
    queryFn:  () => fetchDocuments(queryParams),
    refetchInterval: (query) => {
      const docs = query.state.data?.data ?? [];
      const hasProcessing = docs.some((d) => d.status === "UPLOADED" || d.status === "PROCESSING");
      return hasProcessing ? 4_000 : false;
    },
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load documents");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);

  const documents  = data?.data  ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const title = file.name.split(".").slice(0, -1).join(".") || file.name;
      const ext   = file.name.split(".").pop()?.toLowerCase() ?? "";
      const type  = ext === "dwg" || ext === "dxf" ? "DRAWING" : "MANUAL";
      return uploadDocument(file, title, type, undefined, (pct) => setUploadProgress(pct));
    },
    onSuccess: (doc) => {
      setUploadProgress(null);
      toast.success("Upload complete", `"${doc.title}" is being processed.`);
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: Error) => {
      setUploadProgress(null);
      toast.error("Upload failed", err.message);
    },
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      setDeletingId(null);
      toast.success("Document deleted");
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: Error) => {
      setDeletingId(null);
      toast.error("Delete failed", err.message);
    },
  });

  // ── Retry ─────────────────────────────────────────────────────────────────
  const retryMutation = useMutation({
    mutationFn: (id: string) => retryDocumentProcessing(id),
    onSuccess: () => {
      toast.info("Retry queued", "Document processing will restart.");
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: Error) => toast.error("Retry failed", err.message),
  });

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getStageLabel = (doc: DocumentRecord) => {
    if (doc.processingStage) return stageLabels[doc.processingStage] ?? doc.processingStage;
    return stageLabels[doc.status] ?? doc.status;
  };

  const processingCount = documents.filter((d) => d.status === "UPLOADED" || d.status === "PROCESSING").length;

  return (
    <>
      {previewId && (
        <DocumentPreview documentId={previewId} onClose={() => setPreviewId(null)} />
      )}

      <div className="space-y-6 max-w-[1400px] mx-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept={ALLOWED_EXTENSIONS}
          className="hidden"
        />

        {/* Header */}
        <PageHeader
          title="Knowledge Base"
          subtitle="Upload and manage industrial documents. They are automatically OCR'd, chunked, embedded, and indexed."
          badge={
            totalItems > 0 ? (
              <Badge
                variant="outline"
                className="text-xs px-3 py-1 bg-white border-zinc-200 text-zinc-700 font-semibold rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              >
                {totalItems.toLocaleString()} documents
              </Badge>
            ) : undefined
          }
          action={
            <div className="flex items-center gap-2">
              {processingCount > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {processingCount} processing
                </div>
              )}
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ["documents"] })}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          }
        />

        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-300 cursor-pointer group",
            dragOver
              ? "border-[#FF6B2C] bg-[#FFF8F5] scale-[0.995]"
              : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50",
            uploadMutation.isPending && "cursor-not-allowed opacity-60",
            "shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          )}
        >
          {uploadMutation.isPending ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF2EB]">
                <Loader2 className="h-5 w-5 text-[#FF6B2C] animate-spin" />
              </div>
              <p className="text-[14px] font-semibold text-zinc-800">
                Uploading{uploadProgress !== null ? ` ${uploadProgress}%` : "…"}
              </p>
              {uploadProgress !== null && (
                <div className="w-56 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B2C] rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <p className="text-[12px] text-zinc-400">Processing starts automatically after upload</p>
            </div>
          ) : (
            <>
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300",
                dragOver
                  ? "bg-[#FFF2EB] border-[#FF6B2C]/30 scale-110"
                  : "bg-zinc-50 border-zinc-200 group-hover:bg-[#FFF8F5] group-hover:border-[#FF6B2C]/20"
              )}>
                <Upload className={cn(
                  "h-5 w-5 transition-colors",
                  dragOver ? "text-[#FF6B2C]" : "text-zinc-400 group-hover:text-[#FF6B2C]"
                )} />
              </div>
              <p className="mt-3 text-[14px] font-semibold text-zinc-800">
                {dragOver ? "Drop files to upload" : "Drag files here or click to browse"}
              </p>
              <p className="mt-1 text-[12px] text-zinc-400">
                PDF, DOCX, TXT, CSV, XLSX, PNG, JPG — Max 50 MB per file
              </p>
            </>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by title, filename, or summary…"
        >
          {/* Type filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 pl-9 pr-8 rounded-xl border border-zinc-200 bg-white text-[12px] font-semibold text-zinc-700 outline-none focus:border-[#FF6B2C]/50 focus:ring-2 focus:ring-[#FF6B2C]/8 appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all"
            >
              {Object.entries(typeLabels).map(([val, lbl]) => (
                <option key={val} value={val}>{lbl}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-zinc-200 bg-white text-[12px] font-semibold text-zinc-700 outline-none focus:border-[#FF6B2C]/50 focus:ring-2 focus:ring-[#FF6B2C]/8 appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="INDEXED">Indexed</option>
            <option value="PROCESSING">Processing</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="ERROR">Failed</option>
          </select>

          {/* Clear filters */}
          {(search || typeFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-zinc-200 bg-white text-[12px] font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </FilterBar>

        {/* Error / Loading / Empty */}
        {isError   && <ErrorState message="Failed to load documents." onRetry={refetch} />}
        {isLoading && <RowSkeleton rows={5} />}

        {!isLoading && !isError && documents.length === 0 && (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={
              search || typeFilter !== "all" || statusFilter !== "all"
                ? "No documents matched your filters."
                : "No documents uploaded yet."
            }
            description={
              search || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Upload your first PDF, manual, or regulation above to get started."
            }
            action={
              !(search || typeFilter !== "all" || statusFilter !== "all") ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#FF824E] transition-all shadow-[0_1px_3px_rgba(255,107,44,0.3)] active:scale-95"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </button>
              ) : undefined
            }
          />
        )}

        {/* Document List */}
        {!isLoading && !isError && documents.length > 0 && (
          <div className="space-y-2.5">
            {documents.map((doc, idx) => {
              const stKey        = doc.status ?? "UPLOADED";
              const cfg          = statusConfig[stKey] ?? statusConfig["UPLOADED"];
              const StatusIcon   = cfg.icon;
              const isDelConfirm = deletingId === doc.id;
              const isActive     = doc.status === "PROCESSING" || doc.status === "UPLOADED";
              const DocIcon      = mimeToIcon(doc.mimeType);
              const hasSubStatus = doc.ocrStatus || doc.embeddingStatus || doc.knowledgeGraphStatus;

              return (
                <div
                  key={doc.id}
                  className={cn(
                    "group rounded-2xl border bg-white transition-all duration-200 overflow-hidden",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
                    isDelConfirm && "border-red-200 bg-red-50/30",
                    isActive     && "border-amber-200/70",
                    !isDelConfirm && !isActive && "border-zinc-200/70 hover:border-zinc-300/80"
                  )}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* File icon */}
                    <div className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      "group-hover:bg-[#FFF8F5] group-hover:border-[#FFD6BE]",
                      "bg-zinc-50 border-zinc-100"
                    )}>
                      <DocIcon className="h-4.5 w-4.5 text-zinc-400 group-hover:text-[#FF6B2C] transition-colors" />
                    </div>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-[13px] font-semibold text-zinc-900 tracking-tight truncate pr-2">
                        {doc.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex items-center rounded-md border border-zinc-200/60 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {(doc.type || "").replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-zinc-400">{formatFileSize(doc.size ?? 0)}</span>
                        {doc.pages && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-zinc-300" />
                            <span className="text-[11px] text-zinc-400">{doc.pages} pages</span>
                          </>
                        )}
                        {doc.summary && (
                          <span className="text-[11px] text-zinc-400 truncate max-w-[280px]" title={doc.summary}>
                            {doc.summary.slice(0, 80)}{doc.summary.length > 80 ? "…" : ""}
                          </span>
                        )}
                      </div>

                      {/* Stage label while processing */}
                      {isActive && (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                          <span className="text-[11px] text-amber-600 font-medium">{getStageLabel(doc)}</span>
                        </div>
                      )}

                      {/* OCR / Embedding / Graph sub-status */}
                      {hasSubStatus && doc.status === "INDEXED" && (
                        <ProcessingStatusRow
                          ocrStatus={doc.ocrStatus}
                          embeddingStatus={doc.embeddingStatus}
                          knowledgeGraphStatus={doc.knowledgeGraphStatus}
                        />
                      )}
                    </div>

                    {/* Status badge */}
                    <div className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                      cfg.bg
                    )}>
                      <StatusIcon className={cn("h-3.5 w-3.5", cfg.color, isActive && "animate-pulse")} />
                      <span className={cfg.color}>{cfg.label}</span>
                    </div>

                    {/* Actions */}
                    {!isDelConfirm ? (
                      <div className="flex items-center gap-1 shrink-0 pl-3 border-l border-zinc-100">
                        {(doc.status === "ERROR" || doc.status === "FAILED") && (
                          <button
                            onClick={() => retryMutation.mutate(doc.id)}
                            disabled={retryMutation.isPending}
                            title="Retry processing"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-amber-50 hover:text-amber-600 transition-all"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setPreviewId(doc.id)}
                          title="Preview document"
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(doc.id)}
                          title="Delete document"
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-zinc-100">
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-[11px] font-bold border border-zinc-200 bg-white text-zinc-600 px-2.5 py-1.5 rounded-xl hover:bg-zinc-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          className="text-[11px] font-bold bg-red-600 text-white px-3 py-1.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shadow-[0_1px_3px_rgba(220,38,38,0.3)]"
                        >
                          {deleteMutation.isPending ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <p className="text-[12px] text-zinc-500">
              Showing <span className="font-semibold text-zinc-800">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, totalItems)}</span>{" "}
              of <span className="font-semibold text-zinc-800">{totalItems.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[12px] font-semibold text-zinc-700 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
