"use client";

import { cn } from "@/lib/utils";

export type EntityType =
  | "equipment" | "EQUIPMENT"
  | "part"      | "PART"
  | "person"    | "PERSON"
  | "location"  | "LOCATION"
  | "hazard"    | "HAZARD"
  | "parameter" | "PARAMETER"
  | "regulation"| "REGULATION"
  | "date"      | "DATE"
  | string;

const entityStyles: Record<string, string> = {
  equipment:  "bg-blue-50 text-blue-700 border-blue-200/60",
  part:       "bg-amber-50 text-amber-700 border-amber-200/60",
  person:     "bg-purple-50 text-purple-700 border-purple-200/60",
  location:   "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  hazard:     "bg-red-50 text-red-700 border-red-200/60",
  parameter:  "bg-orange-50 text-orange-700 border-orange-200/60",
  regulation: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  date:       "bg-teal-50 text-teal-700 border-teal-200/60",
};

function normalizeType(type: string): string {
  return type.toLowerCase();
}

interface EntityChipProps {
  type:   string;
  value:  string;
  count?: number;
  size?:  "sm" | "md";
  className?: string;
}

export function EntityChip({ type, value, count, size = "sm", className }: EntityChipProps) {
  const key   = normalizeType(type);
  const style = entityStyles[key] ?? "bg-zinc-50 text-zinc-600 border-zinc-200/60";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-[11px]",
        style,
        className
      )}
    >
      <span className="opacity-60 capitalize">{key}:</span>
      <span>{value}</span>
      {count !== undefined && (
        <span className="ml-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold border border-current/20">
          {count}
        </span>
      )}
    </span>
  );
}
