"use client";

import { cn } from "@/lib/utils";

// Generic shimmer block
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-100",
        className
      )}
    />
  );
}

// Row skeleton for table/list items
export function RowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white p-4">
          <Shimmer className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3 w-1/3" />
            <Shimmer className="h-2.5 w-2/3" />
          </div>
          <Shimmer className="h-5 w-20 rounded-full" />
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// KPI card skeleton
export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-6", count === 4 && "grid-cols-4", count === 6 && "grid-cols-3")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[20px] bg-white p-6 border border-zinc-100 space-y-4">
          <div className="flex items-center gap-3">
            <Shimmer className="h-10 w-10 rounded-xl" />
            <Shimmer className="h-3 w-28" />
          </div>
          <Shimmer className="h-8 w-24" />
          <Shimmer className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

// Card grid skeleton
export function CardGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-100 bg-white p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Shimmer className="h-4 w-2/3" />
              <Shimmer className="h-3 w-1/2" />
            </div>
            <Shimmer className="h-11 w-11 rounded-full shrink-0" />
          </div>
          <Shimmer className="h-2.5 w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            <Shimmer className="h-14 rounded-xl" />
            <Shimmer className="h-14 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Generic error state
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/40 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-zinc-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// Generic empty state
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-12 text-center shadow-xs">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          {icon}
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
          <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-zinc-800">{title}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
    </div>
  );
}
