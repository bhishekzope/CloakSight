/**
 * CloakSight — PII Detector
 *
 * Scans page DOM snapshots and text chunks on-device to detect sensitive
 * personal and enterprise identifiers (SIH 26171).
 *
 * PRIVACY: Produces SensitiveEntity objects containing raw PII values.
 * All output is strictly LOCAL ONLY. Never transmit SensitiveEntity objects.
 */

import type { SensitiveEntity, PrivacyPolicy, PIIType } from "../types/privacy";
import type { PageSnapshot, DOMElement } from "../types/dom";
import type { UniqueId } from "../types/common";
import { PII_PATTERNS, CONTEXTUAL_PII_KEYWORDS } from "./piiPatterns";
import { getDefaultPolicy } from "./privacyPolicy";
import { createLogger } from "../utils/logger";

const logger = createLogger("piiDetector");

let entityCounter = 0;

function generateEntityId(): UniqueId {
  entityCounter += 1;
  return `pii_${entityCounter.toString().padStart(4, "0")}`;
}

/**
 * Reset entity counter (used for new sessions or testing)
 */
export function resetEntityCounter(): void {
  entityCounter = 0;
}

/**
 * Scan a plain text string for deterministic regex PII patterns.
 *
 * @param text Raw text string to analyze
 * @param sourceElementId Optional ID of the originating DOM element
 * @param minConfidence Minimum confidence threshold (defaults to 0.5)
 * @returns Array of detected SensitiveEntity objects
 */
export function detectPIIInText(
  text: string,
  sourceElementId?: UniqueId,
  minConfidence = 0.5,
): SensitiveEntity[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const detected: SensitiveEntity[] = [];

  for (const rule of PII_PATTERNS) {
    // Reset regex state for global regexes
    rule.regex.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = rule.regex.exec(text)) !== null) {
      const matchedString = match[0].trim();
      const start = match.index;
      const end = start + match[0].length;

      // Apply custom validator if defined (e.g. Luhn checksum for cards, Aadhaar structure)
      if (rule.validator && !rule.validator(matchedString)) {
        continue;
      }

      if (rule.confidence >= minConfidence) {
        detected.push({
          entityId: generateEntityId(),
          piiType: rule.piiType,
          rawValue: matchedString,
          confidence: rule.confidence,
          detectionMethod: "regex_pattern",
          sourceOffset: { start, end },
          sourceElementId,
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  return detected;
}

/**
 * Detect PII in a single DOM element using both direct pattern matching
 * and contextual semantic field inspection (labels, name, autocomplete, id).
 */
export function detectPIIInElement(
  element: DOMElement,
  minConfidence = 0.5,
): SensitiveEntity[] {
  const detected: SensitiveEntity[] = [];
  const textToScan = element.value || element.textContent || element.placeholder || "";
  const trimmed = textToScan.trim();


  // 1. Direct Regex Pattern Matching on the element's text/value
  if (trimmed.length > 0) {
    const directMatches = detectPIIInText(trimmed, element.elementId, minConfidence);
    detected.push(...directMatches);
  }

  // 2. Contextual Field Inference (using accessible labels, HTML name, id, and autocomplete)
  const label = (element.accessibleLabel || "").toLowerCase();
  const name = (element.attributes.name || "").toLowerCase();
  const id = (element.attributes.id || "").toLowerCase();
  const autocomplete = (element.attributes.autocomplete || "").toLowerCase();
  const combinedContext = `${label} ${name} ${id} ${autocomplete}`.trim();

  if (trimmed.length > 0 && combinedContext.length > 0) {
    for (const [keyword, piiType] of Object.entries(CONTEXTUAL_PII_KEYWORDS)) {
      if (combinedContext.includes(keyword)) {
        // Check if we already detected this exact PII type via regex
        const alreadyDetected = detected.some((d) => d.piiType === piiType);
        if (alreadyDetected) continue;

        // Specialized heuristics per contextual PII type
        let isContextValid = false;
        let confidence = 0.88;

        if (piiType === "BANK_ACCOUNT") {
          // Bank accounts are typically 9 to 18 digits
          const cleaned = trimmed.replace(/[\s-]/g, "");
          if (/^\d{9,18}$/.test(cleaned)) {
            isContextValid = true;
            confidence = 0.94;
          }
        } else if (piiType === "PERSON_NAME") {
          // Names are typically 2+ alphabetic words
          if (/^[a-zA-Z]{2,}(?:['\s.-][a-zA-Z]{2,})+$/.test(trimmed)) {
            isContextValid = true;
            confidence = 0.88;
          }
        } else if (piiType === "DATE_OF_BIRTH") {
          // Dates in common formats (DD/MM/YYYY, YYYY-MM-DD)
          if (/^\d{1,4}[/-]\d{1,2}[/-]\d{2,4}$/.test(trimmed)) {
            isContextValid = true;
            confidence = 0.92;
          }
        } else if (piiType === "EMPLOYEE_ID") {
          if (trimmed.length >= 3 && trimmed.length <= 15) {
            isContextValid = true;
            confidence = 0.90;
          }
        } else if (piiType === "SALARY" || piiType === "AMOUNT") {
          // Numbers with or without currency signs
          if (/^[\d,]+(?:\.\d{1,2})?$/.test(trimmed.replace(/[₹$€£Rs.\s]/gi, ""))) {
            isContextValid = true;
            confidence = 0.88;
          }
        } else if (piiType === "AADHAAR" || piiType === "PAN" || piiType === "IFSC_CODE" || piiType === "PHONE" || piiType === "EMAIL") {
          // If the field explicitly specifies Aadhaar/PAN/etc., even partial or unformatted values are captured
          isContextValid = true;
          confidence = 0.90;
        }

        if (isContextValid && confidence >= minConfidence) {
          detected.push({
            entityId: generateEntityId(),
            piiType,
            rawValue: trimmed,
            confidence,
            detectionMethod: "heuristic",
            sourceElementId: element.elementId,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  // 3. Password input types are ALWAYS considered sensitive credentials
  if (element.role === "input_password" && trimmed.length > 0) {
    const hasPassword = detected.some((d) => d.piiType === "UNKNOWN_SENSITIVE");
    if (!hasPassword) {
      detected.push({
        entityId: generateEntityId(),
        piiType: "UNKNOWN_SENSITIVE",
        rawValue: trimmed,
        confidence: 0.99,
        detectionMethod: "heuristic",
        sourceElementId: element.elementId,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return detected;
}

/**
 * Detect all sensitive PII entities in a PageSnapshot.
 *
 * PRIVACY: The output contains raw PII values.
 * Stays strictly inside the LOCAL TRUSTED ZONE.
 *
 * @param snapshot Complete PageSnapshot from Phase 2
 * @param policy Optional active PrivacyPolicy (defaults to strict policy)
 * @returns Array of detected SensitiveEntity objects
 */
export async function detectPII(
  snapshot: PageSnapshot,
  policy: PrivacyPolicy = getDefaultPolicy(),
): Promise<SensitiveEntity[]> {
  logger.info("Starting on-device PII detection scan", {
    sessionId: snapshot.sessionId,
    elementCount: snapshot.elementCount,
  });

  const allEntities: SensitiveEntity[] = [];

  // Create a policy lookup map for minimum confidence per PII type
  const policyMap = new Map<PIIType, number>();
  for (const rule of policy.redactionRules) {
    if (rule.enabled) {
      policyMap.set(rule.piiType, rule.minimumConfidence);
    }
  }

  // 1. Scan each extracted DOM element
  for (const element of Object.values(snapshot.elements)) {
    const elementEntities = detectPIIInElement(element, 0.5);

    for (const entity of elementEntities) {
      const minConfidence = policyMap.get(entity.piiType) ?? 0.85;
      if (entity.confidence >= minConfidence) {
        allEntities.push(entity);
      }
    }
  }

  // 2. Scan raw page text for any stray PII not tied to single form inputs
  if (snapshot.rawPageText && snapshot.rawPageText.length > 0) {
    const textMatches = detectPIIInText(snapshot.rawPageText, undefined, 0.85);
    for (const match of textMatches) {
      // Avoid duplicate detections if the same value was already found in an element
      const alreadyFound = allEntities.some(
        (e) => e.rawValue.toLowerCase() === match.rawValue.toLowerCase() && e.piiType === match.piiType,
      );
      if (!alreadyFound) {
        allEntities.push(match);
      }
    }
  }

  // Group summary for logging (NEVER log raw values)
  const categorySummary: Record<string, number> = {};
  for (const entity of allEntities) {
    categorySummary[entity.piiType] = (categorySummary[entity.piiType] || 0) + 1;
  }

  logger.info("PII detection completed", {
    totalEntitiesFound: allEntities.length,
    categories: categorySummary,
  });

  return allEntities;
}
