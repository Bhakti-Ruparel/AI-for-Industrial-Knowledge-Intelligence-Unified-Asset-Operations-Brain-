"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Network, ZoomIn, ZoomOut, Maximize2, Info, 
  Cpu, FileCode, ShieldAlert, FileText, User, 
  Layers, ArrowUpRight, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeItem {
  id: string;
  label: string;
  type: "equipment" | "document" | "regulation" | "incident" | "person";
  x: number; // Absolute coordinates within a 1000x500 box for crisp rendering
  y: number;
  description: string;
  meta: string;
}

interface EdgeItem {
  from: string;
  to: string;
  label: string;
}

// Fixed positions mapping directly to your platform UI screenshot
const mockNodes: NodeItem[] = [
  { id: "1", label: "CVM-850", type: "equipment", x: 420, y: 210, description: "Vertical Machining Center running critical automotive die tooling operations.", meta: "Dept: Production-Line A • Status: Nominal" },
  { id: "2", label: "ISO 9001", type: "regulation", x: 620, y: 260, description: "Quality management framework criteria controlling plant-wide standardization compliance.", meta: "Audited: June 2026 • Ref: Annex-4" },
  { id: "3", label: "Spindle Manual", type: "document", x: 360, y: 350, description: "Manufacturer engineering documentation covering spindle torque curves and setup parameters.", meta: "Ver: 4.2 • Size: 4.5 MB" },
  { id: "4", label: "Bearing Failure", type: "incident", x: 710, y: 370, description: "Predictive anomaly flagged: CVM-850 spindle bearing shows early cyclical acoustic wear patterns.", meta: "Severity: High • Triggered: 2h ago" },
  { id: "5", label: "DYNAMILL-1200", type: "equipment", x: 590, y: 180, description: "High-speed portal milling machine dedicated to heavy industrial workpiece sizing.", meta: "Dept: Toolroom B • Status: Maintenance" },
  { id: "6", label: "Monthly Report", type: "document", x: 790, y: 230, description: "Consolidated report analyzing wear trends, oil levels, and mechanical lifecycle vectors.", meta: "Date: June 2026 • Compiled by AI Agent" },
];

const mockEdges: EdgeItem[] = [
  { from: "1", to: "3", label: "Documented In" },
  { from: "1", to: "2", label: "Governed By" },
  { from: "5", to: "2", label: "Governed By" },
  { from: "5", to: "6", label: "Logged In" },
  { from: "2", to: "4", label: "Triggered Violations" },
];

const nodeConfig = {
  equipment: { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", badgeBg: "bg-blue-500", icon: Cpu },
  document: { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badgeBg: "bg-emerald-500", icon: FileText },
  regulation: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", badgeBg: "bg-amber-500", icon: FileCode },
  incident: { color: "text-rose-600", bg: "bg-rose-50 border-rose-200", badgeBg: "bg-rose-500", icon: ShieldAlert },
  person: { color: "text-purple-600", bg: "bg-purple-50 border-purple-200", badgeBg: "bg-purple-500", icon: User },
};

export default function KnowledgeGraphPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("1");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Derive selected node attributes
  const selectedNode = useMemo(() => 
    mockNodes.find(n => n.id === selectedNodeId) || null, 
    [selectedNodeId]
  );

  // Focus mappings for isolated path highlighting
  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const neighbors = new Set<string>([activeFocusId]);
    mockEdges.forEach(edge => {
      if (edge.from === activeFocusId) neighbors.add(edge.to);
      if (edge.to === activeFocusId) neighbors.add(edge.from);
    });
    return neighbors;
  }, [activeFocusId]);

  return (
    <div className="space-y-6 max-w-full mx-auto p-1 text-zinc-900 antialiased">
      
      {/* Top Engineering Banner Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Knowledge Graph</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Visualize relationships between equipment, documents, and regulations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 bg-white border-zinc-200 text-zinc-800 font-semibold rounded-xl shadow-3xs">
            {mockNodes.length} nodes
          </Badge>
        </div>
      </div>

      {/* Main Interactive Workspace Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Dynamic Topology Workspace Viewport */}
        <Card className="lg:col-span-3 relative h-[620px] border-zinc-200 bg-white shadow-xs overflow-hidden rounded-2xl group">
          
          {/* View Control HUD */}
          <div className="absolute left-4 top-4 z-20 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-xs">
            <button 
              onClick={() => setZoomScale(p => Math.min(p + 0.1, 1.3))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setZoomScale(p => Math.max(p - 0.1, 0.7))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setZoomScale(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors border-t border-zinc-100 mt-1 pt-1"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* PlantMind Core Architectural Legend */}
          <div className="absolute right-4 top-4 z-20 rounded-xl border border-zinc-200 bg-white/90 backdrop-blur-xs p-3.5 space-y-2.5 shadow-xs w-40">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Legend</p>
            {Object.entries(nodeConfig).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-600">
                <div className={cn("h-2.5 w-2.5 rounded-full", cfg.badgeBg)} />
                <span className="capitalize text-[11px] font-medium">{type}</span>
              </div>
            ))}
          </div>

          {/* Map Vector Grid Canvas */}
          <div 
            className="w-full h-full relative transition-transform duration-300 ease-out bg-[radial-gradient(#e4e4e7_1.2px,transparent_1.2px)] [background-size:20px_20px]"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {/* SVG Linking Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              {mockEdges.map((edge, idx) => {
                const source = mockNodes.find(n => n.id === edge.from);
                const target = mockNodes.find(n => n.id === edge.to);
                if (!source || !target) return null;

                const isEdgeActive = activeFocusId ? (edge.from === activeFocusId || edge.to === activeFocusId) : false;
                const isDimmed = activeFocusId && !isEdgeActive;

                return (
                  <line
                    key={idx}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isEdgeActive ? "#3b82f6" : "#bcbec2"}
                    strokeWidth={isEdgeActive ? "2" : "1.25"}
                    opacity={isDimmed ? 0.15 : 0.85}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Render Coordinate Nodes Stack */}
            <div className="absolute inset-0 z-10 w-full h-full">
              {mockNodes.map((node) => {
                const cfg = nodeConfig[node.type];
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
                    {/* Node Dot Matrix Box */}
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-xs transition-all duration-200",
                      isSelected 
                        ? "border-blue-500 ring-4 ring-blue-500/10 scale-110" 
                        : "border-zinc-200/90 group-hover:border-zinc-400 group-hover:scale-105"
                    )}>
                      <div className={cn("p-1.5 rounded-full text-white", cfg.badgeBg)}>
                        <NodeIcon className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Captions Element */}
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

          {/* Bottom Descriptive Panel Strip */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="rounded-xl border border-zinc-200/80 bg-white/95 backdrop-blur-xs p-3 flex items-center gap-2.5 shadow-3xs">
              <Info className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-xs text-zinc-500 font-medium">
                Click on a node to inspect relationships and metadata. Full React Flow graph will be rendered when connected.
              </p>
            </div>
          </div>
        </Card>

        {/* Dynamic Topology Meta Inspector Side-Drawer */}
        <Card className="border-zinc-200 bg-white p-5 rounded-2xl shadow-xs h-[620px] flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Inspector</span>
                <Badge variant="outline" className={cn("text-[9px] font-bold uppercase px-2 py-0.5 tracking-wider rounded-md border-transparent text-white", nodeConfig[selectedNode.type].badgeBg)}>
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

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active Links</h4>
                <div className="space-y-1.5">
                  {mockEdges
                    .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                    .map((edge, i) => {
                      const counterpart = mockNodes.find(n => n.id === (edge.from === selectedNode.id ? edge.to : edge.from));
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
              <span>Model Synced with RAG Vector Base</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}