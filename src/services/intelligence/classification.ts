// ═══════════════════════════════════════════════════════════════════════════════
// Document Classification — Categorizes industrial documents
// ═══════════════════════════════════════════════════════════════════════════════

import { createLogger } from "@/utils/logger";

const logger = createLogger("intelligence:classification");

export type DocumentCategory =
  | "maintenance_manual"
  | "safety_procedure"
  | "inspection_report"
  | "compliance_certificate"
  | "technical_drawing"
  | "incident_report"
  | "training_material"
  | "regulatory_document"
  | "equipment_specification"
  | "unknown";

const CATEGORY_KEYWORDS: Record<DocumentCategory, string[]> = {
  maintenance_manual: ["maintenance", "lubrication", "replacement", "service interval", "preventive", "corrective"],
  safety_procedure: ["safety", "hazard", "ppe", "lockout", "tagout", "emergency", "evacuation", "caution"],
  inspection_report: ["inspection", "audit", "findings", "observation", "recommendation", "checklist"],
  compliance_certificate: ["certificate", "compliance", "accreditation", "certification", "valid until"],
  technical_drawing: ["drawing", "dimension", "tolerance", "assembly", "exploded view", "section view"],
  incident_report: ["incident", "accident", "injury", "near miss", "root cause", "corrective action"],
  training_material: ["training", "module", "competency", "assessment", "learning objective"],
  regulatory_document: ["regulation", "act", "section", "clause", "schedule", "amendment", "statutory"],
  equipment_specification: ["specification", "capacity", "rpm", "travel", "spindle", "feed rate", "model"],
  unknown: [],
};

export function classifyDocument(text: string): { category: DocumentCategory; confidence: number; keywords: string[] } {
  const lowerText = text.toLowerCase();
  let bestCategory: DocumentCategory = "unknown";
  let bestScore = 0;
  let matchedKeywords: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter((kw) => lowerText.includes(kw));
    const score = matches.length / keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as DocumentCategory;
      matchedKeywords = matches;
    }
  }

  const confidence = Math.min(bestScore * 1.5, 1.0); // Scale up but cap at 1.0
  logger.debug({ category: bestCategory, confidence, keywordMatches: matchedKeywords.length }, "Document classified");
  return { category: bestCategory, confidence, keywords: matchedKeywords };
}
