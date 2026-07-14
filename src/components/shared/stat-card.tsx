"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ui/page-skeleton";

interface StatCardProps {
  label:      string;
  value:      string | number;
  icon:       LucideIcon;
  iconBg:     string;
  iconColor:  string;
  loading?:   boolean;
  sub?:       React.ReactNode;
  onClick?:   () => void;
  className?: string;
  trend?:     "up" | "down" | "neutral";
  trendLabel?: string;
}

export function StatCard({
  label, value, icon: Icon, iconBg, iconColor,
  loading, sub, onClick, className, trend, trendLabel,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn(
        "rounded-[20px] bg-white p-6 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        className
      )}>
        <div className="flex items-center gap-3">
          <Shimmer className="h-10 w-10 rounded-xl" />
          <Shimmer className="h-3 w-28 rounded-lg" />
        </div>
        <Shimmer className="mt-5 h-9 w-24 rounded-lg" />
        <Shimmer className="mt-2.5 h-3 w-20 rounded-lg" />
      </div>
    );
  }

  const trendColor =
    trend === "up"   ? "text-emerald-600" :
    trend === "down" ? "text-red-500" :
    "text-zinc-400";

  const trendArrow =
    trend === "up"   ? "↑" :
    trend === "down" ? "↓" :
    "";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-[20px] bg-white p-6 border border-[#F3F4F6]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)]",
        "transition-all duration-300 hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6B7280]">{label}</span>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
          iconBg
        )}>
          <Icon className={cn("h-[18px] w-[18px]", iconColor)} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-4 text-[32px] font-bold text-[#111827] tracking-tight leading-none tabular-nums">
        {value}
      </p>
      {(sub || trendLabel) && (
        <div className="mt-2.5 flex items-center gap-2">
          {trendLabel && (
            <span className={cn("text-[12px] font-semibold", trendColor)}>
              {trendArrow} {trendLabel}
            </span>
          )}
          {sub}
        </div>
      )}
    </div>
  );
}
