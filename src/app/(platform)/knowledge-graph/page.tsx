"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGraphNodes } from "@/services/api/knowledgeGraph";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/page-skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Network, ZoomIn, ZoomOut, Maximize2, Info,
  Cpu, FileCode, ShieldAlert, FileText, User, ArrowUpRight, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NodeItem {
  id: string;
  label: string;
  type: "equipment" | "document" | "regulation" | "incident" | "person" | string;
  x: number;
  y: number;
  description: string;
  meta: string;
}

// ── Visual config ─────────────────────────────────────────────────────────────
const nodeConfig: Record<string, { color: string; bg: string; badgeBg: string; icon: typeof Cpu }> = {
  equipment:  { color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",    badgeBg: "bg-blue-500",    icon: Cpu      },
  EQUIPMENT:  { color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",    badgeBg: "bg-blue-500",    icon: Cpu      },
  document:   { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badgeBg: "bg-emerald-500", icon: FileText },
  DOCUMENT:   { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badgeBg: "bg-emerald-500", icon: FileText },
  regulation: { color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",   badgeBg: "bg-amber-500",   icon: FileCode },
  REGULATION: { color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",   badgeBg: "bg-amber-500",   icon: FileCode },
  incident:   { color: "text-rose-600",    bg: "bg-rose-50 border-rose-200",     badgeBg: "bg-rose-500",    icon: ShieldAlert },
  INCIDENT:   { color: "text-rose-600",    bg: "bg-rose-50 border-rose-200",     badgeBg: "bg-rose-500",    icon: ShieldAlert },
  person:     { color: "text-purple-600",  bg: "bg-purple-50 border-purple-200", badgeBg: "bg-purple-500",  icon: User     },
  PERSON:     { color: "text-purple-600",  bg: "bg-purple-50 border-purple-200", badgeBg: "bg-purple-500",  icon: User     },
};

const defaultNodeCfg = { color: "text-zinc-600", bg: "bg-zinc-50 border-zinc-200", badgeBg: "bg-zinc-500", icon: Network };

// Assign layout positions deterministically
function assignPositions(nodes: { id: string; type: string; label: string; properties?: Record<string, unknown> }[]): NodeItem[] {
  const cols = Math.max(3, Math.ceil(Math.sqrt(nodes.length)));
  return nodes.map((n, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return {
      id: n.id,
      label: n.label,
      type: (n.type || "").toLowerCase(),
      x: 120 + col * 180,
      y: 120 + row * 140,
      description: (n.properties?.description as string) || `${n.type} node: ${n.label}`,
      meta: (n.properties?.meta as string) || "",
    };
  });
}

// ── Fallback static data shown when Neo4j returns empty ──────────────────────
const fallbackNodes: NodeItem[] = [
  { id: "1", label: "CVM-850",      type: "equipment",  x: 420, y: 210, description: "Vertical Machining Center.", meta: "Status: Nominal" },
  { id: "2", label: "ISO 9001",     type: "regulation", x: 620, y: 260, description: "Quality management framework.", meta: "Audited: June 2026" },
  { id: "3", label: "Spindle Manual", type: "document", x: 360, y: 350, description: "Spindle torque curves and setup.", meta: "Ver: 4.2" },
  { id: "4", label: "Bearing Failure", type: "incident", x: 710, y: 370, description: "Early wear pattern detected.", meta: "Severity: High" },
  { id: "5", label: "DYNAMILL-1200", type: "equipment", x: 590, y: 180, description: "Portal milling machine.", meta: "Status: Maintenance" },
  { id: "6", label: "Monthly Report", type: "document", x: 790, y: 230, description: "AI-compiled wear trends report.", meta: "June 2026" },
];

const fallbackEdges = [
  { from: "1", to: "3", label: "Documented In" },
  { from: "1", to: "2", label: "Governed By" },
  { from: "5", to: "2", label: "Governed By" },
  { from: "5", to: "6", label: "Logged In" },
  { from: "2", to: "4", label: "Triggered Violations" },
];

export default function KnowledgeGraphPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("1");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const toast = useToast();

  const { data: rawNodes, isLoading, isError, refetch } = useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: () => fetchGraphNodes("equipment"),
  });

  useEffect(() => {
    if (isError) toast.warning("Knowledge graph unavailable", "Neo4j may not be configured. Showing sample data.");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Use API data if available, otherwise fallback
  const displayNodes: NodeItem[] = useMemo(() => {
    if (!rawNodes || rawNodes.length === 0) return fallbackNodes;
    return assignPositions(rawNodes);
  }, [rawNodes]);

  const displayEdges = (!rawNodes || rawNodes.length === 0) ? fallbackEdges : [];

  const isUsingFallback = !rawNodes || rawNodes.length === 0;

  const selectedNode = useMemo(() => displayNodes.find((n) => n.id === selectedNodeId) ?? null, [selectedNodeId, displayNodes]);

  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const neighbors = new Set<string>([activeFocusId]);
    displayEdges.forEach((e) => {
      if (e.from === activeFocusId) neighbors.add(e.to);
      if (e.to === activeFocusId) neighbors.add(e.from);
    });
    return neighbors;
  }, [activeFocusId, displayEdges]);

  return (
    <div className="space-y-6 max-w-full mx-auto p-1 text-zinc-900 antialiased">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Knowledge Graph</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Visualize relationships between equipment, documents, and regulations.</p>
        </div>
        <div className="flex items-center gap-2">
          {isUsingFallback && (
            <Badge variant="outline" className="text-xs px-3 py-1 bg-amber-50 border-amber-200 text-amber-700 font-semibold rounded-xl">
              Sample Data
            </Badge>
          )}
          <Badge variant="outline" className="text-xs px-3 py-1 bg-white border-zinc-200 text-zinc-800 font-semibold rounded-xl shadow-3xs">
            {displayNodes.length} nodes
          </Badge>
        </div>
      </div>

      {isError && (
        <ErrorState message="Failed to connect to knowledge graph." onRetry={refetch} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Graph Canvas */}
        <Card className="lg:col-span-3 relative h-[620px] border-zinc-200 bg-white shadow-xs overflow-hidden rounded-2xl group">

          {/* Zoom controls */}
          <div className="absolute left-4 top-4 z-20 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-xs">
            <button onClick={() => setZoomScale((p) => Math.min(p + 0.1, 1.5))} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={() => setZoomScale((p) => Math.max(p - 0.1, 0.5))} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button onClick={() => setZoomScale(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors border-t border-zinc-100 mt-1 pt-1">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute right-4 top-4 z-20 rounded-xl border border-zinc-200 bg-white/90 backdrop-blur-xs p-3.5 space-y-2.5 shadow-xs w-40">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Legend</p>
            {["equipment", "document", "regulation", "incident", "person"].map((type) => {
              const cfg = nodeConfig[type] ?? defaultNodeCfg;
              return (
                <div key={type} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-600">
                  <div className={cn("h-2.5 w-2.5 rounded-full", cfg.badgeBg)} />
                  <span className="capitalize text-[11px] font-medium">{type}</span>
                </div>
              );
            })}
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="space-y-3 text-center">
                <Network className="h-10 w-10 text-zinc-300 mx-auto animate-pulse" />
                <p className="text-xs text-zinc-400 font-medium">Loading knowledge graph…</p>
              </div>
            </div>
          )}

          {/* Canvas */}
          {!isLoading && (
            <div
              className="w-full h-full relative transition-transform duration-300 ease-out bg-[radial-gradient(#e4e4e7_1.2px,transparent_1.2px)] [background-size:20px_20px]"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                {displayEdges.map((edge, idx) => {
                  const source = displayNodes.find((n) => n.id === edge.from);
                  const target = displayNodes.find((n) => n.id === edge.to);
                  if (!source || !target) return null;
                  const isActive = activeFocusId ? (edge.from === activeFocusId || edge.to === activeFocusId) : false;
                  const isDimmed = activeFocusId && !isActive;
                  return (
                    <line
                      key={idx}
                      x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                      stroke={isActive ? "#3b82f6" : "#bcbec2"}
                      strokeWidth={isActive ? "2" : "1.25"}
                      opacity={isDimmed ? 0.15 : 0.85}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-0 z-10 w-full h-full">
                {displayNodes.map((node) => {
                  const cfg = nodeConfig[node.type] ?? defaultNodeCfg;
                  const NodeIcon = cfg.icon;
                  const isSelected = selectedNodeId === node.id;
                  const isFocused = connectedNodeIds.has(node.id);
                  const isDimmed = activeFocusId && !isFocused;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      className={cn(
                        "absolute flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 group",
                        isDimmed ? "opacity-25 scale-90" : "opacity-100 scale-100"
                      )}
                      style={{ left: node.x, top: node.y }}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-xs transition-all duration-200",
                        isSelected ? "border-blue-500 ring-4 ring-blue-500/10 scale-110" : "border-zinc-200/90 group-hover:border-zinc-400 group-hover:scale-105"
                      )}>
                        <div className={cn("p-1.5 rounded-full text-white", cfg.badgeBg)}>
                          <NodeIcon className="h-3 w-3" />
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/90 shadow-3xs border transition-colors whitespace-nowrap",
                        isSelected ? "border-zinc-300 text-zinc-900 font-bold" : "border-zinc-100 text-zinc-600"
                      )}>
                        {node.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info strip */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="rounded-xl border border-zinc-200/80 bg-white/95 backdrop-blur-xs p-3 flex items-center gap-2.5 shadow-3xs">
              <Info className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-xs text-zinc-500 font-medium">
                {isUsingFallback
                  ? "Showing sample data. Connect Neo4j to see real graph."
                  : "Click a node to inspect relationships and metadata."}
              </p>
            </div>
          </div>
        </Card>

        {/* Inspector Panel */}
        <Card className="border-zinc-200 bg-white p-5 rounded-2xl shadow-xs h-[620px] flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Inspector</span>
                <Badge variant="outline" className={cn(
                  "text-[9px] font-bold uppercase px-2 py-0.5 tracking-wider rounded-md border-transparent text-white",
                  (nodeConfig[selectedNode.type] ?? defaultNodeCfg).badgeBg
                )}>
                  {selectedNode.type}
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">{selectedNode.label}</h3>
                <p className="text-[11px] text-zinc-400 font-medium">{selectedNode.meta}</p>
              </div>

              <hr className="border-zinc-100" />

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Functional Context</h4>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium bg-zinc-50 p-3 rounded-xl border border-zinc-100/70">
                  {selectedNode.description}
                </p>
              </div>

              {displayEdges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active Links</h4>
                  <div className="space-y-1.5">
                    {displayEdges
                      .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                      .map((edge, i) => {
                        const counterpart = displayNodes.find((n) =>
                          n.id === (edge.from === selectedNode.id ? edge.to : edge.from)
                        );
                        return (
                          <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                            <span className="text-zinc-500 font-medium text-[11px] flex items-center gap-1">
                              <ArrowUpRight className="h-3 w-3 text-zinc-400" />
                              {edge.label}
                            </span>
                            <span className="font-bold text-zinc-700 text-[11px] truncate max-w-[120px]">
                              {counterpart?.label}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 my-auto space-y-1">
              <Network className="h-5 w-5 text-zinc-300" />
              <p className="text-xs font-semibold text-zinc-700">No Node Selected</p>
            </div>
          )}

          {selectedNode && (
            <div className="border-t border-zinc-100 pt-3 flex items-center gap-2 text-[11px] text-emerald-600 font-semibold bg-emerald-50/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{isUsingFallback ? "Sample Data — Connect Neo4j for live graph" : "Model Synced with RAG Vector Base"}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
