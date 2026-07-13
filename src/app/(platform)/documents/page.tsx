"use client";

import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments, uploadDocument, deleteDocument,
  retryDocumentProcessing, formatFileSize,
  type DocumentRecord, type DocumentQueryParams,
} from "@/services/api/documents";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Upload, Search, Filter, Eye, Trash2,
  CheckCircle, Clock, AlertCircle, X, Loader2,
  RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Status display config ─────────────────────────────────────────────────────
const statusConfig: Record<string, {
  icon: typeof CheckCircle; color: string; bg: string; label: string;
}> = {
  UPLOADED:   { icon: Clock,        color: "text-blue-600",    bg: "bg-blue-50 border-blue-100",    label: "Uploaded"   },
  PROCESSING: { icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50 border-amber-100",  label: "Processing" },
  INDEXED:    { icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", label: "Indexed" },
  ERROR:      { icon: AlertCircle,  color: "text-red-600",     bg: "bg-red-50 border-red-100",      label: "Failed"     },
  FAILED:     { icon: AlertCircle,  color: "text-red-600",     bg: "bg-red-50 border-red-100",      label: "Failed"     },
};

// Processing stages shown as sub-label
const stageLabels: Record<string, string> = {
  UPLOAD_COMPLETE:         "Uploaded",
  PROCESSING:              "Starting…",
  TEXT_EXTRACTION:         "Extracting text…",
  DOCUMENT_CLASSIFICATION: "Classifying…",
  ENTITY_EXTRACTION:       "Extracting entities…",
  RELATIONSHIP_EXTRACTION: "Finding relationships…",
  CHUNKING:                "Chunking…",
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

const ALLOWED_EXTENSIONS = ".pdf,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg,.webp,.tiff";
const ITEMS_PER_PAGE = 20;

export default function DocumentsPage() {
  // ── Query params state ──────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,       setPage]       = useState(1);

  // ── Upload state ────────────────────────────────────────────────────────────
  const [dragOver,        setDragOver]        = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState<number | null>(null);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast        = useToast();
  const qc           = useQueryClient();

  // ── Build query params ──────────────────────────────────────────────────────
  const queryParams: DocumentQueryParams = {
    page,
    limit: ITEMS_PER_PAGE,
    search:     search    || undefined,
    type:       typeFilter  !== "all" ? typeFilter  : undefined,
    status:     statusFilter !== "all" ? statusFilter : undefined,
    sortBy:     "createdAt",
    sortOrder:  "desc",
  };

  // ── Fetch documents ─────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["documents", queryParams],
    queryFn:  () => fetchDocuments(queryParams),
    // Poll while any document is processing
    refetchInterval: (query) => {
      const docs = query.state.data?.data ?? [];
      const hasProcessing = docs.some(
        (d) => d.status === "UPLOADED" || d.status === "PROCESSING"
      );
      return hasProcessing ? 4000 : false;
    },
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load documents");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);

  const documents  = data?.data  ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // ── Upload mutation ─────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const title = file.name.split(".").slice(0, -1).join(".") || file.name;
      const ext   = file.name.split(".").pop()?.toLowerCase() ?? "";
      const type  = ext === "dwg" || ext === "dxf" ? "DRAWING" : "MANUAL";
      return uploadDocument(file, title, type, undefined, (pct) =>
        setUploadProgress(pct)
      );
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

  // ── Delete mutation ─────────────────────────────────────────────────────────
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

  // ── Retry mutation ──────────────────────────────────────────────────────────
  const retryMutation = useMutation({
    mutationFn: (id: string) => retryDocumentProcessing(id),
    onSuccess: () => {
      toast.info("Retry queued", "Document processing will restart.");
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: Error) => toast.error("Retry failed", err.message),
  });

  // ── File handlers ───────────────────────────────────────────────────────────
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
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getStageLabel = (doc: DocumentRecord) => {
    if (doc.processingStage) return stageLabels[doc.processingStage] ?? doc.processingStage;
    return stageLabels[doc.status] ?? doc.status;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-6 bg-[#f8f9fa] min-h-screen antialiased">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept={ALLOWED_EXTENSIONS}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Knowledge Base</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Upload industrial documents to power AI search and the copilot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalItems > 0 && (
            <Badge variant="outline" className="text-xs px-3.5 py-1.5 bg-white border-zinc-200 text-zinc-800 font-semibold shadow-xs rounded-xl">
              {totalItems} documents
            </Badge>
          )}
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["documents"] })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 transition-all duration-300 bg-white shadow-xs cursor-pointer",
          dragOver ? "border-[#ff6b4a] bg-[#fff5f2]/40 scale-[0.99]" : "border-zinc-200/80 hover:border-zinc-300",
          uploadMutation.isPending && "cursor-not-allowed opacity-60"
        )}
      >
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 text-[#ff6b4a] animate-spin" />
            <p className="text-sm font-semibold text-zinc-800">
              Uploading{uploadProgress !== null ? ` ${uploadProgress}%` : "…"}
            </p>
            {uploadProgress !== null && (
              <div className="w-48 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff6b4a] rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <p className="text-xs text-zinc-400">Processing will start automatically after upload</p>
          </div>
        ) : (
          <>
            <div className={cn(
              "p-3 rounded-xl mb-3 border transition-all",
              dragOver ? "bg-[#fff5f2] border-[#ff6b4a]/30 scale-110" : "bg-zinc-50 border-zinc-100"
            )}>
              <Upload className={cn("h-5 w-5 transition-colors", dragOver ? "text-[#ff6b4a]" : "text-zinc-400")} />
            </div>
            <p className="text-sm font-semibold text-zinc-800">
              Drag files here or click to browse
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, WEBP, TIFF — Max 50MB
            </p>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, filename or summary…"
            className="pl-10 text-xs border-zinc-200 bg-white h-10 shadow-xs rounded-xl focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/5 focus-visible:border-[#ff6b4a]/60 placeholder:text-zinc-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-44 text-xs bg-white border-zinc-200 h-10 rounded-xl shadow-xs text-zinc-700 font-semibold">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{typeLabels[typeFilter] ?? "All Types"}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl text-xs font-medium">
            {Object.entries(typeLabels).map(([val, lbl]) => (
              <SelectItem key={val} value={val}>{lbl}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-40 text-xs bg-white border-zinc-200 h-10 rounded-xl shadow-xs text-zinc-700 font-semibold">
            <span>{statusFilter === "all" ? "All Statuses" : statusConfig[statusFilter]?.label ?? statusFilter}</span>
          </SelectTrigger>
          <SelectContent className="rounded-xl text-xs font-medium">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="INDEXED">Indexed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="UPLOADED">Uploaded</SelectItem>
            <SelectItem value="ERROR">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {isError && <ErrorState message="Failed to load documents." onRetry={refetch} />}

      {/* Loading */}
      {isLoading && <RowSkeleton rows={5} />}

      {/* Empty */}
      {!isLoading && !isError && documents.length === 0 && (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={search || typeFilter !== "all" || statusFilter !== "all"
            ? "No documents matched your filters."
            : "No documents uploaded yet."}
          description={search || typeFilter !== "all" || statusFilter !== "all"
            ? "Try adjusting your search or filters."
            : "Upload your first PDF, manual, or regulation above to get started."}
        />
      )}

      {/* Document List */}
      {!isLoading && !isError && documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((doc) => {
            const stKey = doc.status ?? "UPLOADED";
            const cfg   = statusConfig[stKey] ?? statusConfig["UPLOADED"];
            const StatusIcon = cfg.icon;
            const isConfirmingDelete = deletingId === doc.id;
            const isActive = doc.status === "PROCESSING" || doc.status === "UPLOADED";

            return (
              <Card
                key={doc.id}
                className={cn(
                  "border-zinc-200/70 bg-white shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl group overflow-hidden",
                  isConfirmingDelete && "border-red-200 bg-red-50/20",
                  isActive && "border-amber-200/60"
                )}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* File icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 group-hover:bg-[#fff5f2] group-hover:border-[#ffe6df] transition-colors">
                    <FileText className="h-4 w-4 text-zinc-400 group-hover:text-[#ff6b4a] transition-colors" />
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold text-zinc-800 tracking-tight truncate pr-4">
                      {doc.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-50 text-zinc-500 border-zinc-200/80 rounded-md">
                        {(doc.type || "").replace(/_/g, " ")}
                      </Badge>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {formatFileSize(doc.size ?? 0)}
                      </span>
                      {doc.pages && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-zinc-300" />
                          <span className="text-[11px] text-zinc-400">{doc.pages} pages</span>
                        </>
                      )}
                      {doc.summary && (
                        <span className="text-[11px] text-zinc-400 truncate max-w-[300px]" title={doc.summary}>
                          {doc.summary.slice(0, 80)}…
                        </span>
                      )}
                    </div>

                    {/* Processing stage indicator */}
                    {isActive && (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                        <span className="text-[11px] text-amber-600 font-medium">
                          {getStageLabel(doc)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center shrink-0">
                    <div className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3 py-1 text-[11px] font-semibold border capitalize",
                      cfg.bg
                    )}>
                      <StatusIcon className={cn("h-3.5 w-3.5", cfg.color, isActive && "animate-pulse")} />
                      <span className={cfg.color}>{cfg.label}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 border-l border-zinc-100 pl-3">
                    {!isConfirmingDelete ? (
                      <>
                        {/* Retry button for failed */}
                        {(doc.status === "ERROR" || doc.status === "FAILED") && (
                          <button
                            onClick={() => retryMutation.mutate(doc.id)}
                            disabled={retryMutation.isPending}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-amber-50 hover:text-amber-600 transition-all"
                            title="Retry processing"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(doc.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-[11px] font-bold border border-zinc-200 bg-white text-zinc-600 px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          className="text-[11px] font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 shadow-xs transition-colors disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-500">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-zinc-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
