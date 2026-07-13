"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { ...item, id }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) => toast({ type: "success", title, description }), [toast]);
  const error   = useCallback((title: string, description?: string) => toast({ type: "error",   title, description }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ type: "warning", title, description }), [toast]);
  const info    = useCallback((title: string, description?: string) => toast({ type: "info",    title, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Portal */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-[360px] pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Card ──────────────────────────────────────────────────────────────────────

const configs: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; iconColor: string }> = {
  success: { icon: CheckCircle,  bg: "bg-white", border: "border-emerald-200", iconColor: "text-emerald-500" },
  error:   { icon: XCircle,      bg: "bg-white", border: "border-red-200",     iconColor: "text-red-500"     },
  warning: { icon: AlertTriangle, bg: "bg-white", border: "border-amber-200",   iconColor: "text-amber-500"  },
  info:    { icon: Info,          bg: "bg-white", border: "border-blue-200",    iconColor: "text-blue-500"   },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const cfg = configs[item.type];
  const Icon = cfg.icon;

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-lg transition-all duration-300",
        cfg.bg, cfg.border,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-zinc-900 leading-snug">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-[12px] text-zinc-500 leading-snug">{item.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
