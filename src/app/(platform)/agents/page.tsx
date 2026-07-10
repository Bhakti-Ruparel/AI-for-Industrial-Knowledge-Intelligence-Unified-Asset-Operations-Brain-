"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Wrench, 
  Shield, 
  Search, 
  Terminal, 
  Settings2, 
  Play, 
  Pause,
  AlertCircle,
  Cpu,
  Fingerprint,
  Send,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: "active" | "idle" | "processing";
  tasksCompleted: number;
  accuracy: number;
  lastActive: string;
  icon: "brain" | "wrench" | "shield" | "search";
}

const mockAgents: AIAgent[] = [
  { id: "1", name: "Knowledge Agent", description: "Retrieves and synthesizes information from your document knowledge base using RAG. Answers technical queries about machines, processes, and standards.", type: "knowledge", status: "active", tasksCompleted: 1247, accuracy: 94.2, lastActive: "Just now", icon: "brain" },
  { id: "2", name: "Maintenance Agent", description: "Monitors equipment health scores, predicts failures, and generates maintenance schedules based on usage patterns and manufacturer guidelines.", type: "maintenance", status: "active", tasksCompleted: 342, accuracy: 91.8, lastActive: "5m ago", icon: "wrench" },
  { id: "3", name: "Compliance Agent", description: "Tracks regulatory compliance status, identifies gaps, and recommends corrective actions for Factory Act, ISO, PESO, and OISD standards.", type: "compliance", status: "idle", tasksCompleted: 89, accuracy: 96.1, lastActive: "2h ago", icon: "shield" },
  { id: "4", name: "RCA Agent", description: "Performs root cause analysis on equipment incidents using historical data, sensor readings, and maintenance logs to identify failure patterns.", type: "rca", status: "processing", tasksCompleted: 56, accuracy: 88.5, lastActive: "Running...", icon: "search" },
];

const iconMap = {
  brain: Brain,
  wrench: Wrench,
  shield: Shield,
  search: Search,
};

const statusConfig = {
  active: { glow: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]", text: "text-emerald-600", bg: "bg-emerald-50/50", label: "Active Execution" },
  idle: { glow: "bg-zinc-300", text: "text-zinc-400", bg: "bg-zinc-50/50", label: "Standby Mode" },
  processing: { glow: "bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]", text: "text-blue-600", bg: "bg-blue-50/40", label: "Deep Compute" },
};

const getAgentMockResponse = (type: string, query: string): string => {
  const q = query.toLowerCase();
  switch (type) {
    case "knowledge":
      if (q.includes("machine") || q.includes("standard")) return "RAG Matrix: ISO 13374 architecture dictates a semantic score match threshold above 88% for heavy rotary assembly tolerances.";
      return "Synthesizing documentation: Identified matching context in asset manual cluster section B-4. All thresholds are currently indexed within normal operational guidelines.";
    case "maintenance":
      if (q.includes("fail") || q.includes("predict")) return "Predictive Core: Vibration frequency spike at node-4G hints bearing wear degradation over next 42 production hours.";
      return "Scheduling matrix generated: System recommends scheduling a lubricant flush cycle for the hydraulic unit within 4 business days.";
    case "compliance":
      return "Compliance Auditor: Cross-referencing against OISD-118 and PESO norms. Current plant structural logs evaluate to 100% compliant. No anomalies flagged.";
    case "rca":
      return "Root-Cause-Engine: Thermal telemetry spike was matched to an intermittent encoder drop-out event observed historically during high load shifts.";
    default:
      return "Agent thread response pipeline successfully generated output matrices.";
  }
};

interface LogMessage {
  id: string;
  type: "system" | "user" | "response";
  text: string;
}

export default function AgentsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<string>("1");
  const [inputQuery, setInputQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Scoped message history mapped explicitly by Agent ID
  const [agentLogs, setAgentLogs] = useState<Record<string, LogMessage[]>>({
    "1": [
      { id: "init-1", type: "system", text: "Initialized RAG parsing layers..." },
      { id: "init-2", type: "response", text: "Telemetry link handshake complete. Ready for document structural requests." }
    ],
    "2": [{ id: "init-3", type: "system", text: "Monitoring equipment vibration vectors... stability 98.4%" }],
    "3": [{ id: "init-4", type: "system", text: "Standby sequence active. Waiting for manual audit trigger." }],
    "4": [{ id: "init-5", type: "system", text: "Computing historical incident clusters for pump system #3..." }]
  });

  const logContainerRef = useRef<HTMLDivElement>(null);

  const filteredAgents = mockAgents.filter(
    (agent) => activeFilter === "all" || agent.status === activeFilter
  );

  const currentAgentDetails = mockAgents.find((a) => a.id === selectedAgent) || mockAgents[0];

  // Force scroll target window downward on layout streams
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [agentLogs, selectedAgent, isProcessing]);

  const handleSendQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isProcessing) return;

    const userText = inputQuery;
    const targetAgentId = selectedAgent;
    setInputQuery("");
    setIsProcessing(true);

    // Append user query item safely
    const userMessage: LogMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: userText
    };

    setAgentLogs((prev) => ({
      ...prev,
      [targetAgentId]: [...(prev[targetAgentId] || []), userMessage]
    }));

    // Generate response text block with precise state delay
    setTimeout(() => {
      const responseText = getAgentMockResponse(currentAgentDetails.type, userText);
      const aiMessage: LogMessage = {
        id: `ai-${Date.now()}`,
        type: "response",
        text: responseText
      };

      setAgentLogs((prev) => ({
        ...prev,
        [targetAgentId]: [...(prev[targetAgentId] || []), aiMessage]
      }));
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="p-6 font-sans antialiased max-w-[1600px] mx-auto text-zinc-900 bg-[#fafafa]/40 min-h-screen space-y-6">
      
      {/* 1. Header Control Hub */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-zinc-200/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-zinc-900" />
            <h1 className="text-lg font-black tracking-tight text-zinc-900 uppercase">Agent Core Control Deck</h1>
          </div>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">Initialize, pipeline, and track telemetry weights of specialized cluster worker nodes.</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="bg-white border border-zinc-200/80 px-3 py-1.5 rounded-lg shadow-4xs flex items-center gap-4 text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              <span className="text-zinc-400 font-medium">Active:</span>
              <span className="text-zinc-800">3 Nodes</span>
            </div>
            <div className="h-3 w-px bg-zinc-200" />
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-zinc-400" />
              <span className="text-zinc-400 font-medium">Compute Load:</span>
              <span className="text-zinc-800">12.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Split Layout Matrix */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Left Controller Panel Stack */}
        <div className="col-span-12 lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-1">
              {[
                { id: "all", label: "All Subsystems" },
                { id: "active", label: "Active Threads" },
                { id: "processing", label: "Computing" }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActiveFilter(btn.id)}
                  className={cn(
                    "px-3 py-1 text-[11px] font-bold tracking-tight transition-all rounded-md",
                    activeFilter === btn.id 
                      ? "bg-zinc-900 text-white shadow-3xs" 
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/50"
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              {filteredAgents.length} Nodes Mapped
            </span>
          </div>

          <div className="space-y-2">
            {filteredAgents.map((agent) => {
              const Icon = iconMap[agent.icon] || Brain;
              const status = statusConfig[agent.status];
              const isSelected = agent.id === selectedAgent;

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={cn(
                    "bg-white border rounded-xl transition-all duration-200 cursor-pointer group shadow-4xs overflow-hidden relative",
                    isSelected 
                      ? "border-zinc-900 ring-1 ring-zinc-900 bg-zinc-50/10" 
                      : "border-zinc-200/70 hover:border-zinc-300"
                  )}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900" />}

                  <div className="grid grid-cols-12 gap-4 items-center p-4">
                    <div className="col-span-12 md:col-span-6 flex items-center gap-3.5">
                      <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border border-zinc-100 shadow-5xs transition-transform group-hover:scale-105",
                        status.bg
                      )}>
                        <Icon className={cn("h-4 w-4", status.text)} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-900 tracking-tight">{agent.name}</h4>
                          <Badge variant="secondary" className="text-[8px] font-black bg-zinc-50 border border-zinc-200/50 text-zinc-400 px-1 py-0 uppercase tracking-widest rounded-sm">
                            {agent.type}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5 max-w-[280px] md:max-w-[340px]">
                          {agent.description}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-4 md:col-span-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.glow)} />
                        <span className={cn("text-[11px] font-bold tracking-tight", status.text)}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-800">{agent.accuracy}%</span>
                        <div className="h-1 w-10 rounded-full bg-zinc-100 overflow-hidden hidden sm:block">
                          <div 
                            className={cn("h-full rounded-full", agent.accuracy > 93 ? "bg-emerald-500" : "bg-zinc-400")} 
                            style={{ width: `${agent.accuracy}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 text-right pr-1">
                      <span className="text-[10px] font-extrabold text-zinc-400">{agent.tasksCompleted}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Terminal Terminal Viewport Panel */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="border border-zinc-900 bg-zinc-950 text-zinc-100 rounded-xl shadow-2xs overflow-hidden h-[480px] flex flex-col justify-between">
            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3 overflow-hidden">
              
              <div className="space-y-2 shrink-0">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] font-mono tracking-wider uppercase">Live Runtime Inspector</span>
                  </div>
                  <Settings2 className="h-3.5 w-3.5 text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors" />
                </div>

                <div className="flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5 text-zinc-400" />
                  <h3 className="text-xs font-bold text-white tracking-tight">{currentAgentDetails.name}</h3>
                </div>
              </div>

              {/* Dynamic Console Stream logs window */}
              <div 
                ref={logContainerRef}
                className="flex-1 font-mono text-[11px] space-y-2 overflow-y-auto pr-1 py-1 border-y border-zinc-900/60 text-zinc-400 scrollbar-none"
              >
                <p className="text-zinc-600">&gt; linked channel context: {currentAgentDetails.type.toUpperCase()}</p>
                
                {(agentLogs[currentAgentDetails.id] || []).map((log) => (
                  <div key={log.id} className="leading-relaxed">
                    {log.type === "user" && (
                      <p className="text-sky-400 font-medium">&gt; ? {log.text}</p>
                    )}
                    {log.type === "response" && (
                      <div className="text-zinc-100 bg-zinc-900/50 p-2.5 border border-zinc-800/80 rounded-lg my-1.5">
                        <span className="text-emerald-500 font-bold block text-[10px] uppercase tracking-wider mb-0.5">■ System Output:</span>
                        {log.text}
                      </div>
                    )}
                    {log.type === "system" && (
                      <p className="text-zinc-500 italic">&gt; {log.text}</p>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <p className="text-blue-400 animate-pulse flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>&gt; pipeline calculating context matrices...</span>
                  </p>
                )}
              </div>

              {/* Live Input Controller */}
              <div className="space-y-2.5 shrink-0 pt-1">
                <form onSubmit={handleSendQuery} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={`Ask ${currentAgentDetails.name}...`}
                    disabled={isProcessing}
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-xs font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !inputQuery.trim()}
                    className="bg-white hover:bg-zinc-200 transition-colors text-zinc-950 px-3 rounded-lg flex items-center justify-center disabled:opacity-30"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                <div className="flex items-center gap-2">
                  <button className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                    currentAgentDetails.status === "active" || currentAgentDetails.status === "processing"
                      ? "bg-red-950/30 text-red-400 border-red-900/30 hover:bg-red-900/40"
                      : "bg-emerald-950/30 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900/40"
                  )}>
                    {currentAgentDetails.status === "active" || currentAgentDetails.status === "processing" ? (
                      <>
                        <Pause className="h-3 w-3 fill-current" />
                        <span>Suspend Thread</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" />
                        <span>Deploy Instance</span>
                      </>
                    )}
                  </button>

                  <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}