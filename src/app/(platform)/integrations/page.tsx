"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Database, Cpu, Network, MessageSquare, Bot, HardDrive,
  CheckCircle2, XCircle, ExternalLink, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  name:        string;
  description: string;
  icon:        typeof Database;
  iconBg:      string;
  iconColor:   string;
  status:      "connected" | "disconnected" | "optional";
  envKey:      string;
  docsUrl?:    string;
  badge?:      string;
}

const integrations: Integration[] = [
  {
    name:        "Supabase",
    description: "PostgreSQL database, file storage, and real-time auth. Core platform dependency.",
    icon:        Database,
    iconBg:      "bg-emerald-50",
    iconColor:   "text-emerald-600",
    status:      "connected",
    envKey:      "NEXT_PUBLIC_SUPABASE_URL",
    badge:       "Core",
  },
  {
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
    name:        "Prisma + pg",
    description: "ORM layer connecting to Supabase PostgreSQL via PgBouncer session pooler.",
    icon:        HardDrive,
    iconBg:      "bg-indigo-50",
    iconColor:   "text-indigo-600",
    status:      "connected",
    envKey:      "PRISMA_DATABASE_URL",
    badge:       "ORM",
  },
];

const statusConfig = {
  connected:    { label: "Connected",    icon: CheckCircle2, class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  disconnected: { label: "Not Set Up",   icon: XCircle,      class: "bg-red-50 text-red-600 border-red-200"            },
  optional:     { label: "Optional",     icon: Zap,          class: "bg-amber-50 text-amber-700 border-amber-200"      },
};

export default function IntegrationsPage() {
  const connected    = integrations.filter((i) => i.status === "connected").length;
  const disconnected = integrations.filter((i) => i.status === "disconnected").length;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Integrations"
        subtitle="Manage external service connections. Set the corresponding environment variables in your .env file to activate each integration."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {connected} / {integrations.length} active
          </span>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Connected",  value: connected,    color: "text-emerald-600", bg: "bg-emerald-50/70 border-emerald-100"  },
          { label: "Not Set Up", value: disconnected, color: "text-red-600",     bg: "bg-red-50/70 border-red-100"          },
          { label: "Optional",   value: integrations.filter((i) => i.status === "optional").length, color: "text-amber-600", bg: "bg-amber-50/70 border-amber-100" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-4 text-center", s.bg)}>
            <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</p>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Integration cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((item) => {
          const Icon      = item.icon;
          const statusCfg = statusConfig[item.status];
          const StatusIcon = statusCfg.icon;

          return (
            <div
              key={item.name}
              className={cn(
                "group rounded-2xl border bg-white p-5 transition-all duration-200",
                "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
                item.status === "connected" ? "border-zinc-200/70" : "border-zinc-200/60"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                  item.iconBg, "border-transparent"
                )}>
                  <Icon className={cn("h-5 w-5", item.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[14px] font-bold text-zinc-900 tracking-tight">{item.name}</h3>
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200/60">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-zinc-500 leading-relaxed">{item.description}</p>

                  {/* Env key + status */}
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <code className="text-[10px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-1">
                      {item.envKey}
                    </code>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[10px] font-bold",
                        statusCfg.class
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </span>
                      {item.docsUrl && (
                        <a
                          href={item.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#FF6B2C] hover:text-[#FF824E] transition-colors"
                        >
                          Docs <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup guide */}
      <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/50 p-5">
        <p className="text-[12px] font-semibold text-zinc-700 mb-1.5">How to configure</p>
        <p className="text-[12px] text-zinc-500 leading-relaxed">
          Edit the <code className="font-mono text-[11px] bg-white border border-zinc-200 rounded px-1.5 py-0.5">.env</code> file
          in the project root and set the required environment variable for each integration.
          Then restart the development server. The application will automatically detect and activate the connection.
        </p>
      </div>
    </div>
  );
}
