"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Search, Filter, Eye, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";

const mockDocuments: Document[] = [
  { id: "1", title: "CVM-850 Operation Manual", type: "manual", status: "indexed", uploadedAt: "2026-06-15T10:00:00Z", size: 4500000, pages: 145, tags: ["VMC", "CVM", "operation"], embedding_status: "complete" },
  { id: "2", title: "ISO 9001:2015 Quality Manual", type: "regulation", status: "indexed", uploadedAt: "2026-06-10T08:00:00Z", size: 2300000, pages: 89, tags: ["ISO", "quality", "compliance"], embedding_status: "complete" },
  { id: "3", title: "Monthly Maintenance Report - June 2026", type: "report", status: "indexed", uploadedAt: "2026-07-01T12:00:00Z", size: 1800000, pages: 32, tags: ["maintenance", "report"], embedding_status: "complete" },
  { id: "4", title: "VTL Safety Procedures", type: "sop", status: "processing", uploadedAt: "2026-07-02T09:30:00Z", size: 980000, pages: 28, tags: ["VTL", "safety"], embedding_status: "pending", ocr_status: "complete" },
  { id: "5", title: "Spindle Assembly Drawing - DYNAMILL", type: "drawing", status: "indexed", uploadedAt: "2026-05-20T14:00:00Z", size: 12000000, pages: 3, tags: ["drawing", "spindle"], embedding_status: "complete" },
];

const statusConfig = {
  indexed: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  processing: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

function formatSize(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dragOver, setDragOver] = useState(false);

  const filtered = mockDocuments.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Upload, search, and manage your knowledge base.</p>
        </div>
        <Badge variant="secondary">{mockDocuments.length} documents</Badge>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); /* TODO: handle upload */ }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
        )}
      >
        <Upload className={cn("h-8 w-8 mb-3", dragOver ? "text-primary" : "text-muted-foreground")} />
        <p className="text-sm font-medium">Drag & drop documents here</p>
        <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, Images — Up to 50MB</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="manual">Manuals</SelectItem>
            <SelectItem value="report">Reports</SelectItem>
            <SelectItem value="regulation">Regulations</SelectItem>
            <SelectItem value="sop">SOPs</SelectItem>
            <SelectItem value="drawing">Drawings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {filtered.map((doc) => {
          const { icon: StatusIcon, color, bg } = statusConfig[doc.status];
          return (
            <Card key={doc.id} className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">{doc.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatSize(doc.size)}</span>
                    {doc.pages && <span className="text-[10px] text-muted-foreground">{doc.pages} pages</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5", bg)}>
                    <StatusIcon className={cn("h-3 w-3", color)} />
                    <span className={cn("text-[10px] font-medium", color)}>{doc.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
