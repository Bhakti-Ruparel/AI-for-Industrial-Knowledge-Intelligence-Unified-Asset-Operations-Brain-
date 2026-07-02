// ═══════════════════════════════════════════════════════════════════════════════
// Relationship Extraction — Discovers connections between entities
// ═══════════════════════════════════════════════════════════════════════════════

import { createLogger } from "@/utils/logger";
import type { EntityOutput, RelationshipOutput } from "@/lib/pipeline/types";

const logger = createLogger("intelligence:relationship");

const RELATIONSHIP_PATTERNS: { pattern: RegExp; relationship: string; sourceType: string; targetType: string }[] = [
  { pattern: /([A-Z0-9\-]+)\s+(?:maintained|serviced|repaired)\s+(?:by|from)\s+(.+)/gi, relationship: "MAINTAINED_BY", sourceType: "EQUIPMENT_ID", targetType: "PERSON_NAME" },
  { pattern: /([A-Z0-9\-]+)\s+(?:located|installed)\s+(?:at|in)\s+(.+)/gi, relationship: "LOCATED_AT", sourceType: "EQUIPMENT_ID", targetType: "LOCATION" },
  { pattern: /([A-Z0-9\-]+)\s+(?:complies|conforms)\s+(?:with|to)\s+(ISO\s*\d+)/gi, relationship: "COMPLIES_WITH", sourceType: "EQUIPMENT_ID", targetType: "ISO_STANDARD" },
  { pattern: /([A-Z0-9\-]+)\s+(?:uses|requires)\s+(?:part|component)\s+(.+)/gi, relationship: "REQUIRES_PART", sourceType: "EQUIPMENT_ID", targetType: "PART_NUMBER" },
  { pattern: /(?:failure|fault)\s+(?:of|in)\s+([A-Z0-9\-]+)\s+(?:caused|due)/gi, relationship: "HAS_FAILURE", sourceType: "EQUIPMENT_ID", targetType: "FAILURE_MODE" },
];

export async function extractRelationships(text: string, entities: EntityOutput[]): Promise<RelationshipOutput[]> {
  const relationships: RelationshipOutput[] = [];

  // Pattern-based relationship extraction
  for (const { pattern, relationship, sourceType, targetType } of RELATIONSHIP_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1] && match[2]) {
        relationships.push({
          source: match[1].trim(),
          sourceType,
          target: match[2].trim(),
          targetType,
          relationship,
          confidence: 0.75,
        });
      }
    }
  }

  // Proximity-based relationships (entities within 200 chars of each other)
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i];
      const b = entities[j];
      if (a.type === b.type) continue;

      const posA = (a.metadata?.position as any)?.start || 0;
      const posB = (b.metadata?.position as any)?.start || 0;
      const distance = Math.abs(posA - posB);

      if (distance < 200 && distance > 0) {
        relationships.push({
          source: a.value,
          sourceType: a.type,
          target: b.value,
          targetType: b.type,
          relationship: "RELATED_TO",
          confidence: Math.max(0.5, 1 - distance / 200),
        });
      }
    }
  }

  logger.info({ count: relationships.length }, "Relationships extracted");
  return relationships.slice(0, 100); // Cap to prevent explosion
}
