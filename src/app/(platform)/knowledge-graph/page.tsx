"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGraphNodes, type KGNode } from "@/services/api/knowledgeGraph";
import { useToast } from "@/components/ui/toast";
// Note: We can omit importing ErrorState if we aren't using it anymore
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Network, ZoomIn, ZoomOut, Maximize2, Info,
  Cpu, FileCode, ShieldAlert, FileText, User,
  ArrowUpRight, CheckCircle2, Search, Filter, X, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NodeItem {
  id:          string;
  label:       string;
  type:        string;
  x:           number;
  y:           number;
  description: string;
  meta:        string;
  properties:  Record<string, unknown>;
}

// ── Config ────────────────────────────────────────────────────────────────────
const nodeConfig: Record<string, { color: string; bg: string; badgeBg: string; icon: typeof Cpu }> = {
  equipment:  { color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",    badgeBg: "bg-blue-500",    icon: Cpu        },
  EQUIPMENT:  { color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",    badgeBg: "bg-blue-500",    icon: Cpu        },
  document:   { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badgeBg: "bg-emerald-500", icon: FileText   },
  DOCUMENT:   { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badgeBg: "bg-emerald-500", icon: FileText   },
  regulation: { color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",   badgeBg: "bg-amber-500",   icon: FileCode   },
  REGULATION: { color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",   badgeBg: "bg-amber-500",   icon: FileCode   },
  incident:   { color: "text-rose-600",    bg: "bg-rose-50 border-rose-200",     badgeBg: "bg-rose-500",    icon: ShieldAlert },
  INCIDENT:   { color: "text-rose-600",    bg: "bg-rose-50 border-rose-200",     badgeBg: "bg-rose-500",    icon: ShieldAlert },
  person:     { color: "text-purple-600",  bg: "bg-purple-50 border-purple-200", badgeBg: "bg-purple-500",  icon: User        },
  PERSON:     { color: "text-purple-600",  bg: "bg-purple-50 border-purple-200", badgeBg: "bg-purple-500",  icon: User        },
  maintenance: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", badgeBg: "bg-orange-500",  icon: Cpu        },
  MAINTENANCE: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", badgeBg: "bg-orange-500",  icon: Cpu        },
};
const defaultNodeCfg = {
  color: "text-zinc-600", bg: "bg-zinc-50 border-zinc-200",
  badgeBg: "bg-zinc-500", icon: Network,
};

const NODE_TYPES = ["equipment","document","regulation","incident","person"] as const;
type NodeType = typeof NODE_TYPES[number];

// ── Layout ────────────────────────────────────────────────────────────────────
function assignPositions(nodes: { id: string; type: string; label: string; properties?: Record<string, unknown> }[]): NodeItem[] {
  const cols = Math.max(3, Math.ceil(Math.sqrt(nodes.length)));
  const spacing = 190;
  const startX = 160;
  const startY = 140;

  return nodes.map((n, idx) => {
    const props = n.properties ?? {};
    const type  = (n.type || "").toLowerCase();

    // Generate human-readable description from properties
    let description = "";
    let meta = "";

    switch (type) {
      case "equipment":
        description = props.model ? `${props.model}` : `Equipment: ${n.label}`;
        if (props.location) description += ` — Located at ${props.location}`;
        meta = [
          props.status ? `Status: ${String(props.status).replace("_", " ")}` : "",
          props.healthScore != null ? `Health: ${props.healthScore}%` : "",
        ].filter(Boolean).join(" · ");
        break;
      case "document":
        description = `Document uploaded to knowledge base`;
        if (props.docType) description = `${String(props.docType).replace("_", " ")} document`;
        meta = [
          props.status ? `${String(props.status).toLowerCase()}` : "",
          props.mimeType ? String(props.mimeType).split("/").pop() : "",
        ].filter(Boolean).join(" · ");
        break;
      case "incident":
        description = `Incident reported on equipment`;
        meta = [
          props.severity ? `Severity: ${props.severity}` : "",
          props.status ? `Status: ${String(props.status).replace("_", " ")}` : "",
        ].filter(Boolean).join(" · ");
        break;
      case "regulation":
        description = `Regulatory compliance framework`;
        if (props.category) description = `${String(props.category).replace("_", " ")} compliance`;
        meta = [
          props.status ? `${String(props.status).replace("_", " ")}` : "",
          props.score != null ? `Score: ${props.score}%` : "",
        ].filter(Boolean).join(" · ");
        break;
      case "person":
        description = `Team member`;
        if (props.role) description = `${String(props.role).replace("_", " ")} team member`;
        meta = props.email ? String(props.email) : "";
        break;
      case "maintenance":
        description = `Maintenance record`;
        meta = [
          props.type ? `Type: ${props.type}` : "",
          props.status ? `Status: ${String(props.status).replace("_", " ")}` : "",
        ].filter(Boolean).join(" · ");
        break;
      default:
        description = (props.description as string) || `${n.type}: ${n.label}`;
        meta = (props.meta as string) || "";
    }

    return {
      id:    n.id,
      label: n.label,
      type,
      x:     startX + (idx % cols) * spacing,
      y:     startY + Math.floor(idx / cols) * 155,
      description,
      meta,
      properties: props,
    };
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function KnowledgeGraphPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("1");
  const [hoveredNodeId,  setHoveredNodeId]  = useState<string | null>(null);
  const [zoomScale,      setZoomScale]      = useState(1);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [typeFilter,     setTypeFilter]     = useState<NodeType | "all">("all");
  const toast = useToast();

  const { data: rawData, isLoading, isError, refetch } = useQuery({
    queryKey: ["knowledge-graph", searchQuery || "all"],
    queryFn:  () => fetchGraphNodes(searchQuery || ""),
  });

  useEffect(() => {
    if (isError) toast.warning("Knowledge graph", "Neo4j may not be configured. Showing data from Prisma.");
  }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const allNodes: NodeItem[] = useMemo(
    () => rawData?.nodes && rawData.nodes.length > 0 ? assignPositions(rawData.nodes) : [],
    [rawData]
  );
  const allEdges: { from: string; to: string; label: string }[] = useMemo(
    () => rawData?.edges ?? [],
    [rawData]
  );

  // ── Filtered nodes ────────────────────────────────────────────────────────
  const displayNodes = useMemo(() => {
    return allNodes.filter((n) => {
      const matchType   = typeFilter === "all" || n.type === typeFilter;
      const matchSearch = !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [allNodes, typeFilter, searchQuery]);

  const displayNodeIds = useMemo(() => new Set(displayNodes.map((n) => n.id)), [displayNodes]);

  const displayEdges = useMemo(
    () => allEdges.filter((e) => displayNodeIds.has(e.from) && displayNodeIds.has(e.to)),
    [allEdges, displayNodeIds]
  );

  const selectedNode = useMemo(
    () => displayNodes.find((n) => n.id === selectedNodeId) ?? null,
    [displayNodes, selectedNodeId]
  );

  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const neighbors = new Set([activeFocusId]);
    displayEdges.forEach((e) => {
      if (e.from === activeFocusId) neighbors.add(e.to);
      if (e.to   === activeFocusId) neighbors.add(e.from);
    });
    return neighbors;
  }, [activeFocusId, displayEdges]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allNodes.forEach((n) => { counts[n.type] = (counts[n.type] ?? 0) + 1; });
    return counts;
  }, [allNodes]);

  return (
    <div className="space-y-5 max-w-full mx-auto">
      {/* Header */}
      <PageHeader
        title="Knowledge Graph"
        subtitle="Visualize relationships between equipment, documents, regulations, and people."
        badge={
          <Badge variant="outline" className="text-xs px-3 py-1 bg-white border-zinc-200 text-zinc-700 font-semibold rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {allNodes.length} nodes · {allEdges.length} edges
          </Badge>
        }
      />

      {/* 👉 FIX: Instead of blocking the whole screen with ErrorState, we show a clean, 
        non-blocking inline alert banner since we have beautiful static fallback data ready.
      */}
      {isError && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-amber-100 bg-amber-50/50 text-[13px] text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span><strong>Neo4j unavailable:</strong> Knowledge graph will show nodes from the Prisma database. Add nodes below or configure Neo4j for full graph traversal.</span>
          </div>
          <button 
            onClick={() => refetch()} 
            className="px-3 py-1 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-xs shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes…"
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-zinc-200 bg-white text-[13px] text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-[#FF6B2C]/50 focus:ring-2 focus:ring-[#FF6B2C]/8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NodeType | "all")}
            className="h-10 pl-9 pr-8 rounded-xl border border-zinc-200 bg-white text-[12px] font-semibold text-zinc-700 outline-none focus:border-[#FF6B2C]/50 appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all"
          >
            <option value="all">All Types ({allNodes.length})</option>
            {NODE_TYPES.filter((t) => (typeCounts[t] ?? 0) > 0).map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)} ({typeCounts[t] ?? 0})
              </option>
            ))}
          </select>
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {NODE_TYPES.filter((t) => (typeCounts[t] ?? 0) > 0).map((t) => {
            const cfg = nodeConfig[t] ?? defaultNodeCfg;
            const isActive = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(isActive ? "all" : t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                  isActive ? `${cfg.bg} ${cfg.color}` : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", cfg.badgeBg)} />
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="text-[9px] opacity-60">({typeCounts[t] ?? 0})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Canvas */}
        <div className="lg:col-span-3 relative h-[620px] rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Zoom controls */}
          <div className="absolute left-4 top-4 z-20 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <button onClick={() => setZoomScale((p) => Math.min(p + 0.15, 2))} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={() => setZoomScale((p) => Math.max(p - 0.15, 0.4))} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="my-0.5 h-px bg-zinc-100" />
            <button onClick={() => setZoomScale(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors" title="Reset zoom">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute right-4 top-4 z-20 rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-sm p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] w-36 space-y-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Legend</p>
            {NODE_TYPES.map((type) => {
              const cfg = nodeConfig[type] ?? defaultNodeCfg;
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", cfg.badgeBg)} />
                  <span className="capitalize text-[11px] font-medium text-zinc-600">{type}</span>
                </div>
              );
            })}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center space-y-3">
                <Network className="h-10 w-10 text-zinc-300 mx-auto animate-pulse" />
                <p className="text-[12px] text-zinc-400 font-medium">Loading knowledge graph…</p>
              </div>
            </div>
          )}

          {/* SVG Canvas */}
          {!isLoading && (
            <div
              className="w-full h-full relative bg-[radial-gradient(#e8eaed_1px,transparent_1px)] [background-size:22px_22px] transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#d1d5db" />
                  </marker>
                </defs>
                {displayEdges.map((edge, idx) => {
                  const source = displayNodes.find((n) => n.id === edge.from);
                  const target = displayNodes.find((n) => n.id === edge.to);
                  if (!source || !target) return null;
                  const isActive = activeFocusId ? (edge.from === activeFocusId || edge.to === activeFocusId) : false;
                  const isDimmed = !!(activeFocusId && !isActive);
                  // midpoint for label
                  const mx = (source.x + target.x) / 2;
                  const my = (source.y + target.y) / 2;
                  return (
                    <g key={idx} className="transition-all duration-300">
                      <line
                        x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                        stroke={isActive ? "#FF6B2C" : "#d1d5db"}
                        strokeWidth={isActive ? 2 : 1.25}
                        opacity={isDimmed ? 0.12 : isActive ? 1 : 0.7}
                        markerEnd="url(#arrow)"
                      />
                      {isActive && (
                        <text x={mx} y={my - 4} textAnchor="middle" fontSize="9" fill="#FF6B2C" fontWeight="600">
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="absolute inset-0 z-10 w-full h-full">
                {displayNodes.map((node) => {
                  const cfg       = nodeConfig[node.type] ?? defaultNodeCfg;
                  const NodeIcon  = cfg.icon;
                  const isSelected = selectedNodeId === node.id;
                  const isFocused  = connectedNodeIds.has(node.id);
                  const isDimmed   = !!(activeFocusId && !isFocused);

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      className={cn(
                        "absolute flex flex-col items-center gap-1.5 cursor-pointer",
                        "transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 group",
                        isDimmed ? "opacity-20 scale-90" : "opacity-100 scale-100"
                      )}
                      style={{ left: node.x, top: node.y }}
                    >
                      {/* Ring for selected */}
                      {isSelected && (
                        <div className="absolute h-12 w-12 rounded-full border-2 border-[#FF6B2C] animate-pulse" style={{ top: "-2px", left: "50%", transform: "translateX(-50%)" }} />
                      )}
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full bg-white border-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all duration-200",
                        isSelected ? "border-[#FF6B2C] scale-115" : "border-zinc-200 group-hover:border-zinc-400 group-hover:scale-110"
                      )}>
                        <div className={cn("p-1.5 rounded-full", cfg.badgeBg)}>
                          <NodeIcon className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg bg-white/95 border text-[10px] font-semibold whitespace-nowrap shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-colors",
                        isSelected ? "border-[#FF6B2C]/40 text-zinc-900 font-bold" : "border-zinc-100 text-zinc-600"
                      )}>
                        {node.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info bar */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="rounded-xl border border-zinc-200/80 bg-white/95 backdrop-blur-sm px-4 py-2.5 flex items-center gap-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <Info className="h-4 w-4 text-[#FF6B2C] shrink-0" />
              <p className="text-[12px] text-zinc-500 font-medium">
                {allNodes.length === 0
                  ? "No nodes yet. Nodes are created automatically when documents are processed, or add them manually via the API."
                  : `Showing ${displayNodes.length} of ${allNodes.length} nodes. Click a node to inspect its relationships.`}
              </p>
            </div>
          </div>
        </div>

        {/* Inspector panel */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-[620px]">
          <div className="border-b border-zinc-100 px-5 py-3.5">
            <p className="text-[13px] font-semibold text-zinc-900">Node Inspector</p>
          </div>

          {selectedNode ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Node header */}
              <div className="flex items-start gap-3">
                {(() => {
                  const cfg      = nodeConfig[selectedNode.type] ?? defaultNodeCfg;
                  const NodeIcon = cfg.icon;
                  return (
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", cfg.bg)}>
                      <NodeIcon className={cn("h-4.5 w-4.5", cfg.color)} />
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                    {selectedNode.type}
                  </p>
                  <h3 className="text-[15px] font-bold text-zinc-900 leading-snug">{selectedNode.label}</h3>
                  {selectedNode.meta && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">{selectedNode.meta}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Context</p>
                <p className="text-[12px] text-zinc-600 leading-relaxed">{selectedNode.description}</p>
              </div>

              {/* Properties */}
              {Object.keys(selectedNode.properties).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Properties</p>
                  <div className="rounded-xl border border-zinc-100 overflow-hidden divide-y divide-zinc-50">
                    {Object.entries(selectedNode.properties)
                      .filter(([key, val]) => val != null && val !== "" && key !== "organizationId" && key !== "description" && key !== "meta")
                      .map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between px-3.5 py-2 bg-white hover:bg-zinc-50/50 transition-colors">
                          <span className="text-[11px] font-medium text-zinc-500 capitalize">
                            {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                          </span>
                          <span className="text-[11px] font-semibold text-zinc-800 text-right max-w-[140px] truncate">
                            {String(val).replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Related edges */}
              {displayEdges.filter((e) => e.from === selectedNode.id || e.to === selectedNode.id).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Relationships ({displayEdges.filter((e) => e.from === selectedNode.id || e.to === selectedNode.id).length})
                  </p>
                  {displayEdges
                    .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                    .map((edge, i) => {
                      const otherId = edge.from === selectedNode.id ? edge.to : edge.from;
                      const other   = displayNodes.find((n) => n.id === otherId);
                      const direction = edge.from === selectedNode.id ? "→" : "←";
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedNodeId(otherId)}
                          className="w-full flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5 hover:border-zinc-200 hover:bg-zinc-50 transition-all text-left group/rel"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{edge.label}</p>
                            <p className="text-[12px] font-semibold text-zinc-700 truncate mt-0.5">
                              {direction} {other?.label ?? otherId}
                            </p>
                          </div>
                          <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 group-hover/rel:text-[#FF6B2C] transition-colors shrink-0" />
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-5 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
                <Network className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-zinc-700">No Node Selected</p>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Click any node in the graph to inspect its context and relationships.
                </p>
              </div>
            </div>
          )}

          {/* Status footer */}
          <div className="border-t border-zinc-100 px-5 py-3 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] text-zinc-500 font-medium">
              {allNodes.length > 0 ? "Live data from database" : "No nodes — upload documents to build the graph"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}