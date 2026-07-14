"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

interface TabItem {
  key:   string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  search?:        string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  tabs?:          TabItem[];
  activeTab?:     string;
  onTabChange?:   (key: string) => void;
  children?:      React.ReactNode; // extra controls (selects, buttons, etc.)
  className?:     string;
}

export function FilterBar({
  search, onSearchChange, searchPlaceholder = "Search…",
  tabs, activeTab, onTabChange,
  children, className,
}: FilterBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-1 border-b border-zinc-100 pb-3">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold capitalize",
                  "transition-all duration-200 select-none whitespace-nowrap",
                  isActive
                    ? "bg-zinc-900 text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/60"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    "px-1.5 py-0 text-[10px] rounded-md font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Search + extra controls */}
      {(onSearchChange || children) && (
        <div className="flex flex-wrap items-center gap-3">
          {onSearchChange && (
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full h-10 pl-10 pr-10 rounded-xl border border-zinc-200 bg-white",
                  "text-[13px] text-zinc-800 placeholder:text-zinc-400",
                  "outline-none shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                  "focus:border-[#FF6B2C]/50 focus:ring-2 focus:ring-[#FF6B2C]/8",
                  "transition-all duration-200"
                )}
              />
              {search && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
