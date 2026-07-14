"use client";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title:       string;
  subtitle?:   string;
  action?:     React.ReactNode;
  badge?:      React.ReactNode;
  className?:  string;
}

export function PageHeader({ title, subtitle, action, badge, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1 text-[13px] text-[#6B7280] leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
