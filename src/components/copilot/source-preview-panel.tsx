"use client";

import { X, FileText, ExternalLink } from "lucide-react";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { cn } from "@/lib/utils";
import type { Source } from "@/types";

interface SourcePreviewPanelProps {
  source:  Source;
  onClose: () => void;
}

export function SourcePreviewPanel({ source, onClose }: SourcePreviewPanelProps) {
  return (
    <div className="border-t border-zinc-100 bg-white shrink-0 max-h-[40vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF2EB]">
            <FileText className="h-3.5 w-3.5 text-[#FF6B2C]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-zinc-900 truncate">{source.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="rounded-md bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 capitalize">
                {source.type}
              </span>
              <ConfidenceBadge value={source.relevance} />
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          aria-label="Close source preview"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {source.snippet ? (
          <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{source.snippet}</p>
        ) : (
          <p className="text-[12px] text-zinc-400 italic">No preview available for this source.</p>
        )}
      </div>
    </div>
  );
}
