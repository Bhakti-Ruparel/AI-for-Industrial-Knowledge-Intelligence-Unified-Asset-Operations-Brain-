"use client";

import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ui/page-skeleton";
import { ResponsiveContainer } from "recharts";

interface ChartCardProps {
  title:      string;
  subtitle?:  string;
  loading?:   boolean;
  className?: string;
  height?:    number;
  action?:    React.ReactNode;
  children:   React.ReactNode;
  noPadding?: boolean;
}

export function ChartCard({
  title, subtitle, loading, className, height = 240, action, children, noPadding,
}: ChartCardProps) {
  return (
    <div className={cn(
      "rounded-[20px] bg-white border border-[#F3F4F6]",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
      "transition-shadow duration-300",
      !noPadding && "p-6",
      className
    )}>
      <div className={cn(
        "flex items-start justify-between mb-5",
        noPadding && "px-6 pt-6"
      )}>
        <div>
          <h2 className="text-[14px] font-semibold text-[#111827] leading-snug">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[12px] text-[#9CA3AF]">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 ml-4">{action}</div>}
      </div>
      {loading ? (
        <div className={cn(noPadding && "px-6 pb-6")} style={{ height }}>
          <Shimmer className="w-full h-full rounded-xl" />
        </div>
      ) : (
        <div
          className={cn(noPadding && "px-6 pb-6")}
          style={{ height }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Re-export for convenience
export { ResponsiveContainer };
