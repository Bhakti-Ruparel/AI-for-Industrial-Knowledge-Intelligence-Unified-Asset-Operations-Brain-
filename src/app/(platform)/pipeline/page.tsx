"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { RowSkeleton, ErrorState, EmptyState } from "@/components/ui/page-skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  fetchPipelineJobs, PIPELINE_STAGES, getStageIndex,
  getStageProgress, formatPipelineDuration, formatFileSize,
  type PipelineDocument,
} from "@/services/api/pipeline";
import { retryDocumentProcessing } from "@/services/api/documents";
import { DocumentPreview } from "@/components/documents/document-preview";
import {
  Cpu, CheckCircle2, XCircle, Clock, Loader2, RefreshCw,
  FileText, Eye, ChevronDown, ChevronUp,
  Activity, AlertCircle, CheckCheck, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ── Stage pill ────────────────────────────────────────────────────────────────

function StagePill({
  label, status,
}: { label: string; status: "done" | "active" | "failed" | "pending" }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all",
      status === "done"    && "bg-emerald-50 text-emerald-700",
      status === "active"  && "bg-[#FFF2EB] text-[#FF6B2C]",
      status === "failed"  && "bg-red-50 text-red-700",
      status === "pending" && "bg-zinc-50 text-zinc-400",
    )}>
      <span className={cn(
        "h-2 w-2 rounded-full",
        status === "done"    && "bg-emerald-500",
        status === "active"  && "bg-[#FF6B2C] animate-pulse",
        status === "failed"  && "bg-red-500",
        status === "pending" && "bg-zinc-300",
      )} />
      {label}
    </div>
  );
}

// ── Job card ──────────────────────────────────────────────────────────────────

function PipelineJobCard({
  doc,
  onPreview,
  onRetry,
  retrying,
}: {
  doc: PipelineDocument;
  onPreview: (id: string) => void;
  onRetry: (id: string) => void;
  retrying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const progress   = getStageProgress(doc.processingStage);
  const currentIdx = getStageIndex(doc.processingStage);
  const isFailed   = doc.status === "ERROR" || doc.status === "FAILED";
  const isActive   = doc.status === "UPLOADED" || doc.status === "PROCESSING";
  const isDone     = doc.status === "INDEXED";

  const statusIcon = isDone   ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> :
                     isFailed ? <XCircle       className="h-3.5 w-3.5 text-red-600" /> :
                                <Loader2       className="h-3.5 w-3.5 text-[#FF6B2C] animate-spin" />;

  const statusLabel = isDone ? "Indexed" : isFailed ? "Failed" : isActive ? "Processing" : "Uploaded";
  const statusBg    = isDone   ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      isFailed ? "bg-red-50 text-red-700 border-red-200" :
                                 "bg-[#FFF2EB] text-[#FF6B2C] border-[#FFD6BE]";

  // Sub-processing statuses
  const subStatuses = [
    { label: "OCR / Text",      val: doc.ocrStatus },
    { label: "Embeddings",      val: doc.embeddingStatus },
    { label: "Knowledge Graph", val: doc.knowledgeGraphStatus },
  ].filter((s) => s.val);

  return (
    <div className={cn(
      "rounded-2xl border bg-white transition-all duration-200",
      isFailed && "border-red-200",
      isActive  && "border-amber-200",
      isDone    && "border-zinc-200",
      !isActive && !isFailed && !isDone && "border-zinc-200",
    )}>
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          isDone   ? "bg-emerald-50 border-emerald-100" :
          isFailed ? "bg-red-50 border-red-100"         :
                     "bg-[#FFF2EB] border-[#FFD6BE]"
        )}>
          <FileText className={cn("h-4 w-4",
            isDone ? "text-emerald-600" : isFailed ? "text-red-500" : "text-[#FF6B2C]"
          )} />
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[13px] font-semibold text-zinc-900 truncate">{doc.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-400">{formatFileSize(doc.size)}</span>
            {doc.pages && (
              <>
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                <span className="text-[11px] text-zinc-400">{doc.pages} pages</span>
              </>
            )}
            {doc._count?.chunks != null && doc._count.chunks > 0 && (
              <>
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                <span className="text-[11px] text-zinc-400">{doc._count.chunks} chunks</span>
              </>
            )}
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span className="text-[11px] text-zinc-400">
              {formatPipelineDuration(doc.createdAt, doc.updatedAt)}
            </span>
          </div>

          {/* Progress bar — only shown while active */}
          {(isActive || isFailed) && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-medium">
                  {doc.processingStage
                    ? PIPELINE_STAGES.find(s => s.key === doc.processingStage)?.label ?? doc.processingStage
                    : "Starting…"}
                </span>
                <span className="text-[11px] font-bold text-zinc-600">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    isFailed ? "bg-red-500" : "bg-[#FF6B2C]"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold shrink-0",
          statusBg
        )}>
          {statusIcon}
          {statusLabel}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isFailed && (
            <button
              onClick={() => onRetry(doc.id)}
              disabled={retrying}
              title="Retry processing"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-amber-50 hover:text-amber-600 transition-all"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
            </button>
          )}
          <button
            onClick={() => onPreview(doc.id)}
            title="Preview document"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Hide stages" : "Show stages"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded: stage timeline + sub-statuses */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3 space-y-3">
          {/* Stage pills */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Pipeline Stages
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_STAGES.map((stage, idx) => {
                const status =
                  idx < currentIdx                                ? "done"    :
                  idx === currentIdx && isActive                  ? "active"  :
                  idx === currentIdx && isFailed                  ? "failed"  :
                  /* else */                                        "pending";
                return (
                  <StagePill key={stage.key} label={stage.label} status={status} />
                );
              })}
            </div>
          </div>

          {/* Sub-processing statuses */}
          {subStatuses.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Processing Status
              </p>
              <div className="flex flex-wrap gap-2">
                {subStatuses.map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5">
                    <span className="text-[11px] text-zinc-500">{label}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                      val === "COMPLETE"    ? "bg-emerald-50 text-emerald-600" :
                      val === "IN_PROGRESS" ? "bg-amber-50 text-amber-600"    :
                      val === "FAILED"      ? "bg-red-50 text-red-600"        :
                                             "bg-zinc-100 text-zinc-500"
                    )}>
                      {val?.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {doc.summary && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                AI Summary
              </p>
              <p className="text-[12px] text-zinc-600 leading-relaxed bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                {doc.summary}
              </p>
            </div>
          )}

          {/* Uploader */}
          {doc.uploadedBy && (
            <p className="text-[11px] text-zinc-400">
              Uploaded by <span className="font-semibold text-zinc-600">{doc.uploadedBy.name}</span>
              {" · "}{new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const toast   = useToast();
  const qc      = useQueryClient();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { data: jobs = [], isLoading, isError, refetch } = useQuery({
    queryKey:       ["pipeline"],
    queryFn:        fetchPipelineJobs,
    refetchInterval: (q) => {
      const docs = q.state.data ?? [];
      return docs.some((d) => d.status === "UPLOADED" || d.status === "PROCESSING")
        ? 4000
        : 30_000;
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => retryDocumentProcessing(id),
    onMutate:   (id) => setRetryingId(id),
    onSuccess:  () => {
      setRetryingId(null);
      toast.info("Retry queued", "Document processing will restart.");
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: Error) => {
      setRetryingId(null);
      toast.error("Retry failed", err.message);
    },
  });

  // Summary stats
  const total      = jobs.length;
  const processing = jobs.filter((j) => j.status === "UPLOADED" || j.status === "PROCESSING").length;
  const indexed    = jobs.filter((j) => j.status === "INDEXED").length;
  const failed     = jobs.filter((j) => j.status === "ERROR" || j.status === "FAILED").length;

  return (
    <>
      {previewId && (
        <DocumentPreview documentId={previewId} onClose={() => setPreviewId(null)} />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">AI Pipeline</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Monitor document ingestion, OCR, embedding, and knowledge graph stages in real-time.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 transition-all shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Documents"
            value={isLoading ? "—" : total}
            icon={FileText}
            iconBg="bg-zinc-50"
            iconColor="text-zinc-500"
            loading={isLoading}
          />
          <StatCard
            label="Processing"
            value={isLoading ? "—" : processing}
            icon={Cpu}
            iconBg="bg-[#FFF2EB]"
            iconColor="text-[#FF6B2C]"
            loading={isLoading}
            sub={processing > 0 ? (
              <div className="flex items-center gap-1 mt-1">
                <Activity className="h-3 w-3 text-[#FF6B2C] animate-pulse" />
                <span className="text-[11px] text-[#FF6B2C] font-medium">Active</span>
              </div>
            ) : undefined}
          />
          <StatCard
            label="Fully Indexed"
            value={isLoading ? "—" : indexed}
            icon={CheckCheck}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            loading={isLoading}
          />
          <StatCard
            label="Failed"
            value={isLoading ? "—" : failed}
            icon={AlertCircle}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            loading={isLoading}
            sub={failed > 0 ? (
              <span className="text-[11px] text-red-500 font-medium mt-1 block">Needs attention</span>
            ) : undefined}
          />
        </div>

        {/* Stage legend */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#FF6B2C]" />
            <p className="text-[13px] font-semibold text-zinc-800">Pipeline Stages</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_STAGES.map((s) => (
              <Badge
                key={s.key}
                variant="outline"
                className="text-[10px] font-medium px-2.5 py-1 rounded-lg border-zinc-200 text-zinc-500 bg-zinc-50"
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Error */}
        {isError && <ErrorState message="Failed to load pipeline jobs." onRetry={refetch} />}

        {/* Loading */}
        {isLoading && <RowSkeleton rows={5} />}

        {/* Empty */}
        {!isLoading && !isError && jobs.length === 0 && (
          <EmptyState
            icon={<Cpu className="h-5 w-5" />}
            title="No documents in pipeline"
            description="Upload documents from the Knowledge Base page to start processing."
          />
        )}

        {/* Job list — grouped by status */}
        {!isLoading && !isError && jobs.length > 0 && (
          <div className="space-y-6">
            {/* Processing first */}
            {processing > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-[#FF6B2C] animate-spin" />
                  <h2 className="text-[13px] font-semibold text-zinc-700">
                    Processing <span className="text-zinc-400 font-normal">({processing})</span>
                  </h2>
                </div>
                {jobs
                  .filter((j) => j.status === "UPLOADED" || j.status === "PROCESSING")
                  .map((doc) => (
                    <PipelineJobCard
                      key={doc.id}
                      doc={doc}
                      onPreview={setPreviewId}
                      onRetry={(id) => retryMutation.mutate(id)}
                      retrying={retryingId === doc.id}
                    />
                  ))}
              </div>
            )}

            {/* Failed */}
            {failed > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <h2 className="text-[13px] font-semibold text-zinc-700">
                    Failed <span className="text-zinc-400 font-normal">({failed})</span>
                  </h2>
                </div>
                {jobs
                  .filter((j) => j.status === "ERROR" || j.status === "FAILED")
                  .map((doc) => (
                    <PipelineJobCard
                      key={doc.id}
                      doc={doc}
                      onPreview={setPreviewId}
                      onRetry={(id) => retryMutation.mutate(id)}
                      retrying={retryingId === doc.id}
                    />
                  ))}
              </div>
            )}

            {/* Indexed */}
            {indexed > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-[13px] font-semibold text-zinc-700">
                    Indexed <span className="text-zinc-400 font-normal">({indexed})</span>
                  </h2>
                </div>
                {jobs
                  .filter((j) => j.status === "INDEXED")
                  .map((doc) => (
                    <PipelineJobCard
                      key={doc.id}
                      doc={doc}
                      onPreview={setPreviewId}
                      onRetry={(id) => retryMutation.mutate(id)}
                      retrying={retryingId === doc.id}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
