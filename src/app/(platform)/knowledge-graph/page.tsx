"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";

// Placeholder for React Flow — will render a static representation
const mockNodes = [
  { id: "1", label: "CVM-850", type: "equipment", x: 200, y: 100 },
  { id: "2", label: "ISO 9001", type: "regulation", x: 400, y: 200 },
  { id: "3", label: "Spindle Manual", type: "document", x: 150, y: 300 },
  { id: "4", label: "Bearing Failure", type: "incident", x: 450, y: 350 },
  { id: "5", label: "DYNAMILL-1200", type: "equipment", x: 350, y: 80 },
  { id: "6", label: "Monthly Report", type: "document", x: 550, y: 150 },
];

const nodeColors: Record<string, string> = {
  equipment: "bg-blue-500",
  document: "bg-emerald-500",
  regulation: "bg-amber-500",
  incident: "bg-red-500",
  person: "bg-purple-500",
};

export default function KnowledgeGraphPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-muted-foreground">Visualize relationships between equipment, documents, and regulations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{mockNodes.length} nodes</Badge>
        </div>
      </div>

      {/* Graph Area */}
      <Card className="relative h-[calc(100vh-14rem)] border-border/50 bg-card/30 backdrop-blur overflow-hidden">
        {/* Toolbar */}
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-1 rounded-lg border border-border bg-card/80 backdrop-blur p-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"><ZoomIn className="h-4 w-4" /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"><ZoomOut className="h-4 w-4" /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"><Maximize2 className="h-4 w-4" /></button>
        </div>

        {/* Legend */}
        <div className="absolute right-4 top-4 z-10 rounded-lg border border-border bg-card/80 backdrop-blur p-3 space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Legend</p>
          {Object.entries(nodeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-xs capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Placeholder Graph Visualization */}
        <div className="flex h-full items-center justify-center">
          <div className="relative w-full h-full">
            {/* SVG connections */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              <line x1="30%" y1="20%" x2="55%" y2="35%" stroke="hsl(217 33% 25%)" strokeWidth="1" />
              <line x1="30%" y1="20%" x2="22%" y2="55%" stroke="hsl(217 33% 25%)" strokeWidth="1" />
              <line x1="55%" y1="35%" x2="65%" y2="60%" stroke="hsl(217 33% 25%)" strokeWidth="1" />
              <line x1="50%" y1="15%" x2="55%" y2="35%" stroke="hsl(217 33% 25%)" strokeWidth="1" />
              <line x1="50%" y1="15%" x2="75%" y2="25%" stroke="hsl(217 33% 25%)" strokeWidth="1" />
            </svg>

            {/* Nodes */}
            {mockNodes.map((node, i) => {
              const positions = [
                { left: "28%", top: "18%" },
                { left: "53%", top: "33%" },
                { left: "20%", top: "53%" },
                { left: "63%", top: "58%" },
                { left: "48%", top: "13%" },
                { left: "73%", top: "23%" },
              ];
              const pos = positions[i];
              return (
                <div
                  key={node.id}
                  className="absolute flex flex-col items-center gap-1 cursor-pointer group"
                  style={pos}
                >
                  <div className={`h-8 w-8 rounded-full ${nodeColors[node.type]} flex items-center justify-center shadow-lg shadow-${node.type === "equipment" ? "blue" : "emerald"}-500/20 group-hover:scale-110 transition-transform`}>
                    <Network className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{node.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector placeholder */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="rounded-lg border border-border bg-card/90 backdrop-blur p-4 flex items-center gap-4">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">Click on a node to inspect relationships and metadata. Full React Flow graph will be rendered when connected.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
