"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Wrench, Shield, Search, Terminal, Settings2,
  Play, Pause, AlertCircle, Cpu, Fingerprint, Send, RefreshCw,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIAgent {
  id:             string;
  name:           string;
  description:    string;
  type:           string;
  status:         "active" | "idle" | "processing";
  tasksCompleted: number;
  accuracy:       number;
  lastActive:     string;
  icon:           "brain" | "wrench" | "shield" | "search";
}

interface LogMessage {
  id:   string;
  type: "system" | "user" | "response";
  text: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const AGENTS: AIAgent[] = [
  {
    id: "1", name: "Knowledge Agent", type: "knowledge", icon: "brain",
    status: "active", tasksCompleted: 1247, accuracy: 94.2, lastActive: "Just now",
    description: "Retrieves and synthesizes information from your document knowledge base using RAG. Answers technical queries about machines, processes, and standards.",
  },
  {
    id: "2", name: "Maintenance Agent", type: "maintenance", icon: "wrench",
    status: "active", tasksCompleted: 342, accuracy: 91.8, lastActive: "5m ago",
    description: "Monitors equipment health scores, predicts failures, and generates maintenance schedules based on usage patterns and manufacturer guidelines.",
  },
  {
    id: "3", name: "Compliance Agent", type: "compliance", icon: "shield",
    status: "idle", tasksCompleted: 89, accuracy: 96.1, lastActive: "2h ago",
    description: "Tracks regulatory compliance status, identifies gaps, and recommends corrective actions for Factory Act, ISO, PESO, and OISD standards.",
  },
  {
    id: "4", name: "RCA Agent", type: "rca", icon: "search",
    status: "processing", tasksCompleted: 56, accuracy: 88.5, lastActive: "Running…",
    description: "Performs root cause analysis on equipment incidents using historical data, sensor readings, and maintenance logs to identify failure patterns.",
  },
];

const ICON_MAP = { brain: Brain, wrench: Wrench, shield: Shield, search: Search };

const STATUS_CFG = {
  active:     { dot: "bg-emerald-500",                        text: "text-emerald-600", bg: "bg-emerald-50",  label: "Active",     badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  idle:       { dot: "bg-zinc-300",                           text: "text-zinc-400",    bg: "bg-zinc-50",     label: "Standby",    badge: "bg-zinc-50 text-zinc-500 border-zinc-200"          },
  processing: { dot: "bg-blue-500 animate-pulse",             text: "text-blue-600",    bg: "bg-blue-50",     label: "Computing",  badge: "bg-blue-50 text-blue-700 border-blue-200"          },
};

const INITIAL_LOGS: Record<string, LogMessage[]> = {
  "1": [
    { id: "i1a", type: "system",   text: "Initialized RAG parsing layers. Vector index loaded." },
    { id: "i1b", type: "response", text: "Telemetry link handshake complete. Ready for document structural requests." },
  ],
  "2": [{ id: "i2", type: "system", text: "Monitoring equipment vibration vectors… stability 98.4%" }],
  "3": [{ id: "i3", type: "system", text: "Standby sequence active. Waiting for manual audit trigger." }],
  "4": [{ id: "i4", type: "system", text: "Computing historical incident clusters for pump system #3…" }],
};

function getMockResponse(type: string, query: string): string {
  const q = query.toLowerCase();
  switch (type) {
    case "knowledge":
      if (q.includes("machine") || q.includes("standard"))
        return "RAG Matrix: ISO 13374 architecture dictates a semantic score match threshold above 88% for heavy rotary assembly tolerances. Cross-referencing 14 indexed manuals.";
      return "Synthesizing documentation: Identified matching context in asset manual cluster section B-4. All thresholds are currently indexed within normal operational guidelines.";
    case "maintenance":
      if (q.includes("fail") || q.includes("predict"))
        return "Predictive Core: Vibration frequency spike at node-4G hints bearing wear degradation over next 42 production hours. Recommend scheduling preventive maintenance within 24h.";
      return "Scheduling matrix generated: System recommends a lubricant flush cycle for the hydraulic unit within 4 business days. Priority: MEDIUM.";
    case "compliance":
      return "Compliance Auditor: Cross-referencing against OISD-118 and PESO norms. Current plant structural logs evaluate to 100% compliant. No anomalies flagged. Next audit due in 47 days.";
    case "rca":
      return "Root-Cause-Engine: Thermal telemetry spike matched to an intermittent encoder drop-out event observed historically during high load shifts. Confidence: 87%. Suggested fix: replace encoder on drive unit 3.";
    default:
      return "Agent pipeline response generated. No anomalies detected. All subsystems nominal.";
  }
}

// ── Agent list row ────────────────────────────────────────────────────────────

function AgentRow({ agent, selected, onSelect }: { agent: AIAgent; selected: boolean; onSelect: () => void }) {
  const Icon   = ICON_MAP[agent.icon] || Brain;
  const status = STATUS_CFG[agent.status];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative flex items-center gap-4 rounded-2xl border bg-white p-4 cursor-pointer transition-all duration-200",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]",
        selected
          ? "border-[#FF6B2C]/40 ring-1 ring-[#FF6B2C]/20"
          : "border-zinc-200/70 hover:border-zinc-300"
      )}
    >
      {/* Active indicator bar */}
      {selected && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#FF6B2C]" />
      )}

      {/* Icon */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
        status.bg, "border-transparent"
      )}>
        <Icon className={cn("h-5 w-5", status.text)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-[13px] font-bold text-zinc-900 tracking-tight">{agent.name}</h4>
          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 rounded-md border", status.badge)}>
            {agent.type}
          </Badge>
        </div>
        <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-xs sm:max-w-sm">{agent.description}</p>
      </div>

      {/* Status + accuracy */}
      <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", status.dot)} />
          <span className={cn("text-[11px] font-semibold", status.text)}>{status.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-16 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500",
                agent.accuracy > 93 ? "bg-emerald-500" :
                agent.accuracy > 88 ? "bg-amber-500" : "bg-zinc-400"
              )}
              style={{ width: `${agent.accuracy}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-zinc-600 tabular-nums">{agent.accuracy}%</span>
        </div>
      </div>

      {/* Task count */}
      <div className="hidden md:flex flex-col items-end shrink-0">
        <span className="text-[18px] font-bold text-zinc-800 tabular-nums leading-none">{agent.tasksCompleted.toLocaleString()}</span>
        <span className="text-[9px] text-zinc-400 font-medium mt-0.5">tasks done</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [filter,        setFilter]        = useState<"all" | "active" | "idle" | "processing">("all");
  const [selectedId,    setSelectedId]    = useState("1");
  const [inputQuery,    setInputQuery]    = useState("");
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [agentLogs,     setAgentLogs]     = useState<Record<string, LogMessage[]>>(INITIAL_LOGS);

  const logRef    = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const currentAgent = AGENTS.find((a) => a.id === selectedId) ?? AGENTS[0];
  const filteredAgents = AGENTS.filter((a) => filter === "all" || a.status === filter);

  const activeCount     = AGENTS.filter((a) => a.status === "active").length;
  const processingCount = AGENTS.filter((a) => a.status === "processing").length;

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [agentLogs, selectedId, isProcessing]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isProcessing) return;

    const text    = inputQuery.trim();
    const agentId = selectedId;
    setInputQuery("");
    setIsProcessing(true);

    setAgentLogs((prev) => ({
      ...prev,
      [agentId]: [...(prev[agentId] ?? []), { id: `u-${Date.now()}`, type: "user", text }],
    }));

    setTimeout(() => {
      const reply = getMockResponse(currentAgent.type, text);
      setAgentLogs((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] ?? []), { id: `r-${Date.now()}`, type: "response", text: reply }],
      }));
      setIsProcessing(false);
      inputRef.current?.focus();
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <PageHeader
        title="AI Agents"
        subtitle="Specialized AI agents for maintenance prediction, RCA, compliance analysis, and knowledge retrieval."
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
              <Activity className="h-3 w-3" />
              {activeCount + processingCount} running
            </span>
          </div>
        }
      />

      {/* System status bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-[12px] font-semibold text-zinc-700">Agent System Online</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Cpu className="h-3 w-3" />
          <span>Compute: 12.4%</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="font-semibold text-zinc-700">{activeCount}</span> active ·
          <span className="font-semibold text-blue-600">{processingCount}</span> computing ·
          <span className="font-semibold text-zinc-400">{AGENTS.filter((a) => a.status === "idle").length}</span> idle
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left: agent list ─────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 border-b border-zinc-100 pb-3">
            {(["all", "active", "processing", "idle"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold capitalize rounded-xl transition-all",
                  filter === f
                    ? "bg-zinc-900 text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                    : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/60"
                )}
              >
                {f === "all" ? "All Agents" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Agent rows */}
          <div className="space-y-2.5">
            {filteredAgents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                selected={selectedId === agent.id}
                onSelect={() => setSelectedId(agent.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Right: terminal ───────────────────────────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col h-[480px]">
            {/* Terminal header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="h-3 w-3 rounded-full bg-red-500/60" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-[10px] font-mono tracking-wider uppercase">Live Runtime Inspector</span>
                </div>
              </div>
              <Settings2 className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
            </div>

            {/* Agent label */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/60 shrink-0">
              <Fingerprint className="h-3.5 w-3.5 text-[#FF6B2C]" />
              <span className="text-xs font-bold text-white tracking-tight">{currentAgent.name}</span>
              <span className={cn(
                "ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border",
                STATUS_CFG[currentAgent.status].badge
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_CFG[currentAgent.status].dot)} />
                {STATUS_CFG[currentAgent.status].label}
              </span>
            </div>

            {/* Log stream */}
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-2 font-mono text-[11px] text-zinc-400"
            >
              <p className="text-zinc-600">&gt; channel: {currentAgent.type.toUpperCase()} | session start</p>
              {(agentLogs[currentAgent.id] ?? []).map((log) => (
                <div key={log.id}>
                  {log.type === "user" && (
                    <p className="text-sky-400">&gt; <span className="text-sky-300 font-semibold">you:</span> {log.text}</p>
                  )}
                  {log.type === "response" && (
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2.5 my-1">
                      <span className="text-[#FF6B2C] font-bold text-[10px] uppercase tracking-wider block mb-1">
                        ▸ {currentAgent.name}:
                      </span>
                      <span className="text-zinc-100 leading-relaxed">{log.text}</span>
                    </div>
                  )}
                  {log.type === "system" && (
                    <p className="text-zinc-600 italic">&gt; sys: {log.text}</p>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-400">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>processing query…</span>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-zinc-800 px-4 py-3 space-y-2.5 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`Ask ${currentAgent.name}…`}
                  disabled={isProcessing}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-[12px] font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !inputQuery.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B2C] text-white hover:bg-[#FF824E] disabled:opacity-30 transition-all shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Controls row */}
              <div className="flex items-center gap-2">
                <button className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                  currentAgent.status !== "idle"
                    ? "bg-red-950/30 text-red-400 border-red-900/30 hover:bg-red-900/40"
                    : "bg-emerald-950/30 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900/40"
                )}>
                  {currentAgent.status !== "idle"
                    ? <><Pause className="h-3 w-3 fill-current" /><span>Suspend</span></>
                    : <><Play className="h-3 w-3 fill-current" /><span>Deploy</span></>}
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                  <AlertCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
