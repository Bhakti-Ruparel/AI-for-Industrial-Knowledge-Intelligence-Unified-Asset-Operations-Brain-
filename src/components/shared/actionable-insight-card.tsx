"use client";

import Link from "next/link";
import { type LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type InsightVariant = "danger" | "warning" | "info" | "success";

const variantStyles: Record<InsightVariant, { icon: string; card: string }> = {
  danger:  { icon: "bg-red-50 text-red-600",     card: "border-red-100 hover:border-red-200 hover:bg-red-50/30" },
  warning: { icon: "bg-amber-50 text-amber-600",  card: "border-amber-100 hover:border-amber-200 hover:bg-amber-50/30" },
  info:    { icon: "bg-blue-50 text-blue-600",    card: "border-blue-100 hover:border-blue-200 hover:bg-blue-50/30" },
  success: { icon: "bg-emerald-50 text-emerald-600", card: "border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/30" },
};

export interface ActionableInsightCardProps {
  icon:        LucideIcon;
  title:       string;
  description: string;
  href:        string;
  variant:     InsightVariant;
  className?:  string;
}

export function ActionableInsightCard({
  icon: Icon, title, description, href, variant, className,
}: ActionableInsightCardProps) {
  const s = variantStyles[variant];
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3.5 rounded-2xl border p-4 transition-all duration-200",
        s.card,
        className
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", s.icon)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#111827] leading-snug">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#6B7280] leading-relaxed">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#FF6B2C] transition-colors shrink-0 mt-0.5" />
    </Link>
  );
}
