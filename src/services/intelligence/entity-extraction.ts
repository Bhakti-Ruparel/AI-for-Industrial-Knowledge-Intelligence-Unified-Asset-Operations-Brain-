// ═══════════════════════════════════════════════════════════════════════════════
// Entity Extraction — Structured knowledge from raw industrial text
// ═══════════════════════════════════════════════════════════════════════════════

import { createLogger } from "@/utils/logger";
import type { EntityOutput } from "@/lib/pipeline/types";

const logger = createLogger("intelligence:entity");

// Regex patterns for industrial entity extraction
const PATTERNS: Record<string, RegExp> = {
  EQUIPMENT_ID: /(?:machine|equipment|unit|asset)\s*(?:id|no|number|#)?\s*[:\-]?\s*([A-Z0-9\-]{3,20})/gi,
  PART_NUMBER: /(?:part|p\/n|pn|item)\s*(?:no|number|#)?\s*[:\-]?\s*([A-Z0-9\-]{4,25})/gi,
  TEMPERATURE: /(\d+(?:\.\d+)?)\s*°?\s*(?:C|F|celsius|fahrenheit)/gi,
  PRESSURE: /(\d+(?:\.\d+)?)\s*(?:bar|psi|kPa|MPa|atm)/gi,
  ISO_STANDARD: /ISO\s*\d{4,5}(?:[\-:]\d{4})?/gi,
  DATE: /\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4}|\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}/g,
  PERSON_NAME: /(?:engineer|operator|technician|inspector|manager)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
  LOCATION: /(?:bay|floor|line|area|section|zone|plant)\s*[:\-]?\s*([A-Z0-9\-\s]{2,30})/gi,
  MACHINE_MODEL: /(?:CVM|DM|MM|AM|TM|YCL|SG|RSG|CG|UM|HT)\s*[\-]?\s*\d{3,5}/gi,
  RPM: /(\d{3,6})\s*(?:rpm|RPM)/g,
  SAFETY_RULE: /(?:safety|caution|warning|danger)\s*[:\-]?\s*(.{10,100})/gi,
  FAILURE_MODE: /(?:failure|fault|defect|breakdown|malfunction)\s*[:\-]?\s*(.{10,100})/gi,
  MAINTENANCE_PROC: /(?:procedure|step|instruction|check)\s*\d*\s*[:\-]?\s*(.{10,150})/gi,
  INSPECTION_RESULT: /(?:pass|fail|acceptable|rejected|within limits|out of spec)/gi,
};

export async function extractEntities(text: string, organizationId: string): Promise<EntityOutput[]> {
  const entities: EntityOutput[] = [];

  for (const [type, pattern] of Object.entries(PATTERNS)) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const value = (match[1] || match[0]).trim();
      if (value.length >= 2 && value.length <= 200) {
        entities.push({
          type,
          value,
          confidence: 0.85, // Rule-based confidence
          metadata: { position: { start: match.index, end: match.index + match[0].length } },
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = entities.filter((e) => {
    const key = `${e.type}:${e.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  logger.info({ organizationId, entityCount: unique.length, types: [...new Set(unique.map(e => e.type))] }, "Entities extracted");
  return unique;
}
