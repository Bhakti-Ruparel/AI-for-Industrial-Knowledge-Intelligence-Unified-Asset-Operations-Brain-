// ═══════════════════════════════════════════════════════════════════════════════
// Documents Service — Placeholder
// ═══════════════════════════════════════════════════════════════════════════════

import type { Document } from "@/types";

export async function getDocuments(): Promise<Document[]> {
  // TODO: Connect to Supabase / Flask
  return [
    { id: "1", title: "CVM-850 Operation Manual", type: "manual", status: "indexed", uploadedAt: "2026-06-15T10:00:00Z", size: 4500000, pages: 145, tags: ["VMC", "CVM", "operation"], embedding_status: "complete" },
    { id: "2", title: "ISO 9001:2015 Quality Manual", type: "regulation", status: "indexed", uploadedAt: "2026-06-10T08:00:00Z", size: 2300000, pages: 89, tags: ["ISO", "quality", "compliance"], embedding_status: "complete" },
    { id: "3", title: "Monthly Maintenance Report - June 2026", type: "report", status: "indexed", uploadedAt: "2026-07-01T12:00:00Z", size: 1800000, pages: 32, tags: ["maintenance", "report", "monthly"], embedding_status: "complete" },
    { id: "4", title: "VTL Safety Procedures", type: "sop", status: "processing", uploadedAt: "2026-07-02T09:30:00Z", size: 980000, pages: 28, tags: ["VTL", "safety", "SOP"], embedding_status: "pending", ocr_status: "complete" },
    { id: "5", title: "Spindle Assembly Drawing - DYNAMILL", type: "drawing", status: "indexed", uploadedAt: "2026-05-20T14:00:00Z", size: 12000000, pages: 3, tags: ["drawing", "spindle", "DYNAMILL"], embedding_status: "complete" },
  ];
}

export async function uploadDocument(file: File): Promise<Document> {
  // TODO: Upload to Supabase Storage, trigger OCR + embedding pipeline
  return {
    id: crypto.randomUUID(),
    title: file.name,
    type: "manual",
    status: "processing",
    uploadedAt: new Date().toISOString(),
    size: file.size,
    tags: [],
    embedding_status: "pending",
    ocr_status: "pending",
  };
}

export async function deleteDocument(id: string): Promise<void> {
  // TODO: Connect to backend
}

export async function searchDocuments(query: string): Promise<Document[]> {
  const all = await getDocuments();
  return all.filter(d => d.title.toLowerCase().includes(query.toLowerCase()));
}
