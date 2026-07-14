"use client";

import { cn } from "@/lib/utils";

// ── Generic shimmer block ─────────────────────────────────────────────────────
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]",
        className
      )}
    />
  );
}

// ── Row skeleton for table/list items ─────────────────────────────────────────
export function RowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Shimmer className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2.5">
            <Shimmer className="h-3 w-1/3 rounded-lg" />
            <Shimmer className="h-2.5 w-2/3 rounded-lg" />
          </div>
          <Shimmer className="h-6 w-20 rounded-full" />
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── KPI card skeleton ─────────────────────────────────────────────────────────
export function KPISkeleton({ count = 4 }: { count?: number }) {
  const gridClass =
    count === 4 ? "grid-cols-2 xl:grid-cols-4" :
    count === 6 ? "grid-cols-2 xl:grid-cols-3" :
    "grid-cols-2 xl:grid-cols-4";

  return (
    <div className={cn("grid gap-5", gridClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[20px] bg-white p-6 border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-3">
            <Shimmer className="h-10 w-10 rounded-xl" />
            <Shimmer className="h-3 w-28 rounded-lg" />
          </div>
          <Shimmer className="h-9 w-24 rounded-lg" />
          <Shimmer className="h-3 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Card grid skeleton ────────────────────────────────────────────────────────
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-100 bg-white p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Shimmer className="h-4 w-2/3 rounded-lg" />
              <Shimmer className="h-3 w-1/2 rounded-lg" />
            </div>
            <Shimmer className="h-11 w-11 rounded-full shrink-0" />
          </div>
          <Shimmer className="h-2.5 w-1/3 rounded-full" />
          <div className="grid grid-cols-2 gap-3">
            <Shimmer className="h-14 rounded-xl" />
            <Shimmer className="h-14 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page-level skeleton ───────────────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Shimmer className="h-7 w-48 rounded-lg" />
        <Shimmer className="h-4 w-72 rounded-lg" />
      </div>
      <KPISkeleton count={4} />
      <div className="grid gap-5 md:grid-cols-2">
        <Shimmer className="h-64 rounded-[20px]" />
        <Shimmer className="h-64 rounded-[20px]" />
      </div>
      <RowSkeleton rows={4} />
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-gradient-to-b from-red-50/60 to-white p-14 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
        <svg
          className="h-6 w-6 text-red-500"
          fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={2}
        >
          <path
            strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-zinc-800">{message}</p>
        <p className="mt-1 text-[13px] text-zinc-500">Please check your connection and try again.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-700 transition-all active:scale-95"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-14 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
        {icon ?? (
          <svg
            className="h-6 w-6"
            fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={1.5}
          >
            <path
              strokeLinecap="round" strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        )}
      </div>
      <div>
        <p className="text-[15px] font-semibold text-zinc-800">{title}</p>
        {description && (
          <p className="mt-1 text-[13px] text-zinc-500 max-w-xs mx-auto leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
