"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import {
  Database, Cpu, Network, MessageSquare, Bot, HardDrive,
  CheckCircle2, XCircle, ExternalLink, Zap, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IntegrationStatus {
  supabase:    boolean;
  huggingface: boolean;
  qdrant:      boolean;
  neo4j:       boolean;
  whatsapp:    boolean;
  prisma:      boolean;
}

interface Integration {
  key:         keyof IntegrationStatus;
  name:        string;
  description: string;
  icon:        typeof Database;
  iconBg:      string;
  iconColor:   string;
  envKey:      string;
  badge:       string;
  docsUrl?:    string;
  optional?:   boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    key:         "supabase",
    name:        "Supabase",
    description: "PostgreSQL database, file storage, and real-time auth. Core platform dependency.",
    icon:        Database,
    iconBg:      "bg-emerald-50",
    iconColor:   "text-emerald-600",
    envKey:      "NEXT_PUBLIC_SUPABASE_URL",
    badge:       "Core",
    docsUrl:     "https://supabase.com/docs",
  },
  {
<<<<<<< HEAD
    name:        "Hugging Face",
    description: "AI embeddings via sentence-transformers and LLM inference for RAG pipeline.",
    icon:        Bot,
    iconBg:      "bg-yellow-50",
    iconColor:   "text-yellow-600",
    status:      "connected",
    envKey:      "HUGGINGFACE_API_KEY",
    badge:       "AI",
  },
  {
    name:        "Qdrant",
    description: "Vector database for semantic document search and embedding storage.",
    icon:        Cpu,
    iconBg:      "bg-blue-50",
    iconColor:   "text-blue-600",
    status:      "disconnected",
    envKey:      "QDRANT_URL",
    docsUrl:     "https://qdrant.tech/documentation/",
    badge:       "Vector DB",
  },
  {
    name:        "Neo4j",
    description: "Graph database for knowledge graph relationships, entity linking, and RCA analysis.",
    icon:        Network,
    iconBg:      "bg-purple-50",
    iconColor:   "text-purple-600",
    status:      "connected",
    envKey:      "NEO4J_URI",
    docsUrl:     "https://neo4j.com/docs/",
    badge:       "Graph DB",
  },
  {
    name:        "WhatsApp (Meta)",
    description: "Send lead notifications and service request confirmations via WhatsApp Business API.",
    icon:        MessageSquare,
    iconBg:      "bg-green-50",
    iconColor:   "text-green-600",
    status:      "optional",
    envKey:      "META_PHONE_NUMBER_ID",
    docsUrl:     "https://developers.facebook.com/docs/whatsapp",
    badge:       "Messaging",
  },
  {
=======
    key:         "prisma",
>>>>>>> 2db3a995329492c2f715da3bee0cbf955448467a
    name:        "Prisma + pg",
    description: "ORM layer connecting to Supabase PostgreSQL via PgBouncer session pooler.",
    icon:        HardDrive,
    iconBg:      "bg-indigo-50",
    iconColor:   "text-indigo-600",
    envKey:      "PRISMA_DATABASE_URL",
    badge:       "ORM",
  },
  {
    key:         "huggingface",
    name:        "Hugging Face",
    description: "AI embeddings (sentence-transformers) and LLM inference (Mistral 7B) for RAG pipeline.",
    icon:        Bot,
    iconBg:      "bg-yellow-50",
    iconColor:   "text-yellow-600",
    envKey:      "HUGGINGFACE_API_KEY",
    badge:       "AI",
    docsUrl:     "https://huggingface.co/docs/api-inference",
  },
  {
    key:         "qdrant",
    name:        "Qdrant",
    description: "Vector database for semantic document search and embedding storage.",
    icon:        Cpu,
    iconBg:      "bg-blue-50",
    iconColor:   "text-blue-600",
    envKey:      "QDRANT_URL",
    badge:       "Vector DB",
    docsUrl:     "https://cloud.qdrant.io",
  },
  {
    key:         "neo4j",
    name:        "Neo4j",
    description: "Graph database for knowledge graph relationships, entity linking, and RCA analysis.",
    icon:        Network,
    iconBg:      "bg-purple-50",
    iconColor:   "text-purple-600",
    envKey:      "NEO4J_URI",
    badge:       "Graph DB",
    docsUrl:     "https://neo4j.com/docs/",
    optional:    true,
  },
  {
    key:         "whatsapp",
    name:        "WhatsApp (Meta)",
    description: "Send lead notifications and service request confirmations via WhatsApp Business API.",
    icon:        MessageSquare,
    iconBg:      "bg-green-50",
    iconColor:   "text-green-600",
    envKey:      "META_PHONE_NUMBER_ID",
    badge:       "Messaging",
    docsUrl:     "https://developers.facebook.com/docs/whatsapp",
    optional:    true,
  },
];

// ── Fetch real status from server ─────────────────────────────────────────────

async function fetchStatus(): Promise<IntegrationStatus> {
  const res = await fetch("/api/integrations/status");
  if (!res.ok) throw new Error("Failed to fetch integration status");
  const json = await res.json();
  return json.data;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ configured, optional }: { configured: boolean; optional?: boolean }) {
  if (configured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Connected
      </span>
    );
  }
  if (optional) {
    return (
      <span className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
        <Zap className="h-3 w-3" />
        Optional
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
      <XCircle className="h-3 w-3" />
      Not Set Up
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["integrations-status"],
    queryFn:  fetchStatus,
    staleTime: 30_000,
  });

  const getConfigured = (key: keyof IntegrationStatus) =>
    status ? status[key] : false;

  const connectedCount = status
    ? INTEGRATIONS.filter((i) => status[i.key]).length
    : 0;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Integrations"
        subtitle="Real-time status of all connected services. Set environment variables in Vercel or your .env file to activate each integration."
        badge={
          isLoading ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {connectedCount} / {INTEGRATIONS.length} active
            </span>
          )
        }
      />

      {/* Summary strip */}
      {status && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Connected",
              value: INTEGRATIONS.filter((i) => status[i.key]).length,
              color: "text-emerald-600",
              bg:    "bg-emerald-50/70 border-emerald-100",
            },
            {
              label: "Not Set Up",
              value: INTEGRATIONS.filter((i) => !status[i.key] && !i.optional).length,
              color: "text-red-600",
              bg:    "bg-red-50/70 border-red-100",
            },
            {
              label: "Optional",
              value: INTEGRATIONS.filter((i) => !status[i.key] && i.optional).length,
              color: "text-amber-600",
              bg:    "bg-amber-50/70 border-amber-100",
            },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-2xl border p-4 text-center", s.bg)}>
              <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</p>
              <p className="text-[11px] text-zinc-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Integration cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((item) => {
          const Icon       = item.icon;
          const configured = getConfigured(item.key);

          return (
            <div
              key={item.name}
              className={cn(
                "group rounded-2xl border bg-white p-5 transition-all duration-200",
                "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
                configured ? "border-emerald-200/50" : "border-zinc-200/60"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  item.iconBg
                )}>
                  <Icon className={cn("h-5 w-5", item.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[14px] font-bold text-zinc-900 tracking-tight">{item.name}</h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200/60">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-zinc-500 leading-relaxed">{item.description}</p>

                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <code className="text-[10px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-1">
                      {item.envKey}
                    </code>
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-bold text-zinc-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking
                        </span>
                      ) : (
                        <StatusBadge configured={configured} optional={item.optional} />
                      )}
                      {item.docsUrl && (
                        <a
                          href={item.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#FF6B2C] hover:text-[#FF824E] transition-colors"
                        >
                          {item.key === "qdrant" && !configured ? "Get Free Cluster" : "Docs"}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Setup hint for disconnected non-optional integrations */}
                  {!configured && !item.optional && !isLoading && (
                    <p className="mt-2 text-[11px] text-red-500 leading-relaxed">
                      Add <code className="font-mono bg-red-50 px-1 rounded">{item.envKey}</code> to your Vercel environment variables.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Qdrant setup guide if not connected */}
      {status && !status.qdrant && (
        <div className="rounded-2xl border border-blue-200/70 bg-blue-50/40 p-5 space-y-2">
          <p className="text-[13px] font-bold text-blue-800">Set up Qdrant (free) in 2 minutes</p>
          <ol className="text-[12px] text-blue-700 space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://cloud.qdrant.io" target="_blank" rel="noopener noreferrer" className="underline font-semibold">cloud.qdrant.io</a> → Create a free cluster</li>
            <li>Copy the <strong>Cluster URL</strong> and create an <strong>API Key</strong></li>
            <li>Add to Vercel: <code className="bg-blue-100 px-1 rounded font-mono text-[11px]">QDRANT_URL</code>, <code className="bg-blue-100 px-1 rounded font-mono text-[11px]">QDRANT_API_KEY</code>, <code className="bg-blue-100 px-1 rounded font-mono text-[11px]">QDRANT_COLLECTION=plantmind_documents</code></li>
            <li>Redeploy — the collection is created automatically on first document upload</li>
          </ol>
        </div>
      )}

      {/* General setup note */}
      <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/50 p-5">
        <p className="text-[12px] font-semibold text-zinc-700 mb-1.5">How to configure</p>
        <p className="text-[12px] text-zinc-500 leading-relaxed">
          On Vercel: Project → Settings → Environment Variables → Add each key.
          Locally: edit <code className="font-mono text-[11px] bg-white border border-zinc-200 rounded px-1.5 py-0.5">.env</code> in the project root.
          Changes take effect after redeployment (Vercel) or server restart (local).
        </p>
      </div>
    </div>
  );
}
