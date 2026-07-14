"use client";

import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  value:     number;   // 0–1
  className?: string;
}

export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  const pct = Math.round(value * 100);
  const style =
    pct >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    pct >= 40 ? "bg-amber-50 text-amber-700 border-amber-200"       :
                "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums",
      style, className
    )}>
      {pct}%
    </span>
  );
}
