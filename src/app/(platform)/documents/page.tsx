"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Search, Filter, Eye, Trash2, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentItem {
  id: string;
  title: string;
  type: string;
  status: "indexed" | "processing" | "error";
  uploadedAt: string;
  size: number;
  pages?: number;
  tags: string[];
}

const initialDocuments: DocumentItem[] = [
  { id: "1", title: "CVM-850 Operation Manual", type: "manual", status: "indexed", uploadedAt: "2026-06-15T10:00:00Z", size: 4500000, pages: 145, tags: ["VMC", "CVM", "operation"] },
  { id: "2", title: "ISO 9001:2015 Quality Manual", type: "regulation", status: "indexed", uploadedAt: "2026-06-10T08:00:00Z", size: 2300000, pages: 89, tags: ["ISO", "quality", "compliance"] },
  { id: "3", title: "Monthly Maintenance Report - June 2026", type: "report", status: "indexed", uploadedAt: "2026-07-01T12:00:00Z", size: 1800000, pages: 32, tags: ["maintenance", "report"] },
  { id: "4", title: "VTL Safety Procedures", type: "sop", status: "processing", uploadedAt: "2026-07-02T09:30:00Z", size: 980000, pages: 28, tags: ["VTL", "safety"] },
  { id: "5", title: "Spindle Assembly Drawing - DYNAMILL", type: "drawing", status: "indexed", uploadedAt: "2026-05-20T14:00:00Z", size: 12000000, pages: 3, tags: ["drawing", "spindle"] },
];

const statusConfig = {
  indexed: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
  processing: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-100" },
};

const filterLabels: Record<string, string> = {
  all: "All Formats",
  manual: "Operation Manuals",
  report: "Analytical Reports",
  regulation: "Regulatory Docs",
  sop: "Standard Operations",
  drawing: "Technical Blueprints",
};

function formatSize(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Filtration Matrix logic
  const filtered = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  // Working Dustbin Handler
  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (deletingId === id) setDeletingId(null);
  };

  // Process and Insert Uploaded Files Stream Into State
  const processFiles = (files: FileList) => {
    const newDocs: DocumentItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      title: file.name.split('.').slice(0, -1).join('.') || file.name,
      type: file.name.endsWith('.dwg') || file.name.endsWith('.dxf') ? "drawing" : "manual",
      status: "processing",
      uploadedAt: new Date().toISOString(),
      size: file.size,
      pages: Math.floor(Math.random() * 20) + 1,
      tags: ["uploaded", "new"],
    }));
    setDocuments(prev => [...[...newDocs], ...prev]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-6 bg-[#f8f9fa] min-h-screen antialiased selection:bg-[#ff6b4a]/10">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        multiple 
        className="hidden" 
      />

      {/* Top Heading Panel */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Knowledge Base</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Central repo for training models, operational specifications, and machine layouts.</p>
        </div>
        <Badge variant="outline" className="text-xs px-3.5 py-1.5 bg-white border-zinc-200 text-zinc-800 font-semibold shadow-xs rounded-xl">
          {documents.length} Platform Artifacts
        </Badge>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 transition-all duration-300 bg-white shadow-xs group cursor-pointer",
          dragOver 
            ? "border-[#ff6b4a] bg-[#fff5f2]/40 scale-[0.99]" 
            : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-xs"
        )}
      >
        <div className={cn(
          "p-3 rounded-xl mb-3 transition-all duration-300",
          dragOver ? "bg-[#fff5f2] scale-110" : "bg-zinc-50 border border-zinc-100 group-hover:scale-105"
        )}>
          <Upload className={cn("h-5 w-5 transition-colors", dragOver ? "text-[#ff6b4a]" : "text-zinc-400 group-hover:text-zinc-600")} />
        </div>
        <p className="text-sm font-semibold text-zinc-800">Drag blueprints, manuals or procedures here or click to open browser</p>
        <p className="mt-1 text-xs text-zinc-400 font-normal">Secure server processing pipeline • Max file upload boundaries: 50MB</p>
      </div>

      {/* Search and Filters Strip */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document names, file structures, or hashes..."
            className="pl-10 text-xs border-zinc-200 bg-white h-10 shadow-xs rounded-xl focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/5 focus-visible:border-[#ff6b4a]/60 placeholder:text-zinc-400 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
          <SelectTrigger className="w-56 text-xs bg-white border-zinc-200 h-10 rounded-xl shadow-xs focus:ring-4 focus:ring-[#ff6b4a]/5 focus:border-[#ff6b4a]/60 text-zinc-700 font-semibold transition-all">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{filterLabels[typeFilter]}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-md text-xs font-medium">
            <SelectItem value="all">All Subsystem Formats</SelectItem>
            <SelectItem value="manual">Operation Manuals</SelectItem>
            <SelectItem value="report">Analytical Reports</SelectItem>
            <SelectItem value="regulation">Regulatory Docs</SelectItem>
            <SelectItem value="sop">Standard Operations (SOP)</SelectItem>
            <SelectItem value="drawing">Technical Blueprints</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document Stack List */}
      <div className="space-y-3">
        {filtered.map((doc) => {
          const { icon: StatusIcon, color, bg } = statusConfig[doc.status] || statusConfig.error;
          const isConfirmingDelete = deletingId === doc.id;

          return (
            <Card key={doc.id} className={cn(
              "border-zinc-200/70 bg-white shadow-xs hover:shadow-md hover:border-[#ff6b4a]/20 transition-all duration-200 rounded-2xl group overflow-hidden relative",
              isConfirmingDelete && "border-red-200 bg-red-50/20"
            )}>
              <CardContent className="flex items-center gap-4 p-4 relative z-10">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 group-hover:bg-[#fff5f2] group-hover:border-[#ffe6df] transition-colors duration-200">
                  <FileText className="h-4.5 w-4.5 text-zinc-400 group-hover:text-[#ff6b4a] transition-colors duration-200" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold text-zinc-800 tracking-tight truncate pr-4">{doc.title}</p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-50 text-zinc-500 border-zinc-200/80 rounded-md">
                      {doc.type}
                    </Badge>
                    <span className="text-[11px] text-zinc-400 font-medium">{formatSize(doc.size)}</span>
                    {doc.pages && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-zinc-300" />
                        <span className="text-[11px] text-zinc-400 font-medium">{doc.pages} pages</span>
                      </>
                    )}
                    <div className="flex items-center gap-1.5 ml-1">
                      {doc.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md font-medium group-hover:bg-zinc-200/60 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <div className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1 text-[11px] font-semibold border capitalize", bg)}>
                    <StatusIcon className={cn("h-3.5 w-3.5", color)} />
                    <span className={color}>{doc.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 border-l border-zinc-100 pl-3">
                  {!isConfirmingDelete ? (
                    <>
                      <button className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(doc.id); }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="text-[11px] font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 shadow-xs transition-colors"
                      >
                        Confirm Delete
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                        className="text-[11px] font-semibold border border-zinc-200 bg-white text-zinc-600 px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-zinc-200/80 text-center shadow-2xs">
            <div className="p-3 bg-zinc-50 rounded-full mb-3 border border-zinc-100">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">No index records discovered</p>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-sm">We couldn't locate documents mapping to your parameters.</p>
            {(search || typeFilter !== "all") && (
              <button 
                onClick={() => { setSearch(""); setTypeFilter("all"); }}
                className="mt-4 text-xs font-semibold text-[#ff6b4a] hover:text-[#e05638] underline underline-offset-4"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}