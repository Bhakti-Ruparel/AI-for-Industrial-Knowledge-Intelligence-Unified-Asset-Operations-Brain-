"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";

type Status = "PENDING" | "IN_PROGRESS" | "COMPLETE" | "FAILED" | "SKIPPED" | string | undefined | null;

interface StatusPillProps {
  label:  string;
  status: Status;
}

function StatusPill({ label, status }: StatusPillProps) {
  const s = (status ?? "PENDING").toUpperCase();

  const cfg = {
    COMPLETE:    { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200/70" },
    IN_PROGRESS: { icon: Loader2,      color: "text-amber-600",   bg: "bg-amber-50 border-amber-200/70"    },
    FAILED:      { icon: AlertCircle,  color: "text-red-600",     bg: "bg-red-50 border-red-200/70"        },
    PENDING:     { icon: Clock,        color: "text-zinc-400",    bg: "bg-zinc-50 border-zinc-200/70"      },
    SKIPPED:     { icon: Clock,        color: "text-zinc-300",    bg: "bg-zinc-50 border-zinc-100"         },
  }[s] ?? { icon: Clock, color: "text-zinc-400", bg: "bg-zinc-50 border-zinc-200/70" };

  const Icon = cfg.icon;
  const isSpinning = s === "IN_PROGRESS";

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold",
      cfg.bg, cfg.color
    )}>
      <Icon className={cn("h-3 w-3 shrink-0", isSpinning && "animate-spin")} />
      <span>{label}</span>
    </div>
  );
}

interface ProcessingStatusRowProps {
  ocrStatus?:           Status;
  embeddingStatus?:     Status;
  knowledgeGraphStatus?: Status;
  className?:           string;
}

export function ProcessingStatusRow({
  ocrStatus, embeddingStatus, knowledgeGraphStatus, className,
}: ProcessingStatusRowProps) {
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      <StatusPill label="OCR"        status={ocrStatus} />
      <StatusPill label="Embeddings" status={embeddingStatus} />
      <StatusPill label="Graph"      status={knowledgeGraphStatus} />
    </div>
  );
}
