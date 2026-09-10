/**
 * CloakSight — Outbound Leak Guard (Phase 11)
 *
 * The final security barrier before any request crosses the trust boundary
 * to external cloud AI agents.
 *
 * ARCHITECTURE POSITION:
 *   sanitized context → LEAK GUARD → (PASS: 0 PII) ──► Cloud AI Agent
 *                                  → (BLOCK: >0 PII) ─► Transmission Blocked & User Alerted
 *
 * PRIVACY GUARANTEE:
 * Multi-layer inspection:
 *   1. Full stringified JSON serialization scan across all object keys/values.
 *   2. Regex pattern scan for all 20 PII categories.
 *   3. Cross-reference against in-memory detected raw entity values.
 * If ANY raw PII is found, TRANSMISSION IS BLOCKED IMMEDIATELY.
 */

import type { LeakCheckResult, SensitiveEntity, PIIType, DetectionConfidence } from "../types/privacy";
import type { AgentRequest } from "../types/context";
import { PII_PATTERNS } from "./piiPatterns";
import { createLogger } from "../utils/logger";

const logger = createLogger("leakGuard");

/**
 * Fast regex-based pre-check for common PII patterns across a string.
 *
 * @param payload Serialized string to inspect
 * @returns true if any PII pattern is matched
 */
export function quickRegexScan(payload: string): boolean {
  if (!payload || payload.trim().length === 0) return false;

  for (const rule of PII_PATTERNS) {
    rule.regex.lastIndex = 0;
    const match = rule.regex.exec(payload);
    if (match) {
      if (!rule.validator || rule.validator(match[0].trim())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Scan an AgentRequest for any potential raw PII leaks before cloud transmission.
 *
 * @param request Complete AgentRequest payload to be transmitted
 * @param detectedEntities Known raw sensitive entities detected in local session
 * @param minConfidence Minimum confidence threshold for regex matching
 * @returns LeakCheckResult
 */
export async function checkForLeaks(
  request: AgentRequest,
  detectedEntities: SensitiveEntity[] = [],
  minConfidence = 0.85,
): Promise<LeakCheckResult> {
  const checkedAt = new Date().toISOString();
  const serialized = JSON.stringify(request);

  logger.info("Executing Outbound Leak Guard security inspection", {
    sessionId: request.sessionId,
    payloadLength: serialized.length,
    knownEntityCount: detectedEntities.length,
  });

  const detectedPIITypes = new Set<PIIType>();
  const detectedEntityIds = new Set<string>();

  // -------------------------------------------------------------
  // Layer 1: Cross-reference known raw values from the local session
  // -------------------------------------------------------------
  for (const entity of detectedEntities) {
    const raw = entity.rawValue.trim();
    // Skip trivially short tokens to avoid false substring matching on numbers like "1"
    if (raw.length < 3) continue;

    // Check if the raw PII value appears in the serialized payload
    if (serialized.toLowerCase().includes(raw.toLowerCase())) {
      detectedPIITypes.add(entity.piiType);
      detectedEntityIds.add(entity.entityId);
      const matchPos = serialized.toLowerCase().indexOf(raw.toLowerCase());
      const contextSnippet = serialized.substring(
        Math.max(0, matchPos - 40),
        Math.min(serialized.length, matchPos + raw.length + 40)
      );
      logger.error("Leak Guard CAUGHT unredacted raw value from session", {
        piiType: entity.piiType,
        entityId: entity.entityId,
        matchPos,
        contextSnippet,
      });
    }
  }

  // -------------------------------------------------------------
  // Layer 2: Deep regex pattern scan across the entire payload
  // -------------------------------------------------------------
  for (const rule of PII_PATTERNS) {
    rule.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.regex.exec(serialized)) !== null) {
      const matchedStr = match[0].trim();

      // Avoid matching harmless token placeholders like "[PERSON_NAME]" or "TAG_001"
      if (matchedStr.startsWith("TAG_") || matchedStr.startsWith("[") || matchedStr.startsWith("cs_el_")) {
        continue;
      }

      if (rule.validator && !rule.validator(matchedStr)) {
        continue;
      }

      if (rule.confidence >= minConfidence) {
        detectedPIITypes.add(rule.piiType);
        const matchPos = match.index;
        const contextSnippet = serialized.substring(
          Math.max(0, matchPos - 40),
          Math.min(serialized.length, matchPos + matchedStr.length + 40)
        );
        logger.warn("Leak Guard detected raw PII pattern match in payload", {
          piiType: rule.piiType,
          matchedStr,
          matchPos,
          contextSnippet,
        });
      }
    }
  }

  const passed = detectedPIITypes.size === 0;
  const shouldBlock = !passed;
  const piiTypeList = Array.from(detectedPIITypes);
  const entityIdList = Array.from(detectedEntityIds);

  const totalElements = request.sanitizedContext?.elements?.length || 1;
  const sensitiveElements = request.sanitizedContext?.elements?.filter((e) => e.isSensitive).length || 0;
  const redactionRatio = Number((sensitiveElements / totalElements).toFixed(3));
  const confidence: DetectionConfidence = passed ? 0.99 : 0.95;

  let summary: string;
  if (passed) {
    summary = `CLEARED: Zero raw PII detected. Payload passed Outbound Leak Guard (${redactionRatio * 100}% protected).`;
    if (request.sanitizedContext) {
      request.sanitizedContext.leakGuardPassed = true;
    }
    logger.info("Outbound Leak Guard PASSED", {
      sessionId: request.sessionId,
      redactionRatio,
    });
  } else {
    summary = `BLOCKED: Detected ${piiTypeList.length} unredacted PII categories (${piiTypeList.join(", ")}). Transmission prevented.`;
    if (request.sanitizedContext) {
      request.sanitizedContext.leakGuardPassed = false;
    }
    logger.error("Outbound Leak Guard BLOCKED payload transmission", {
      sessionId: request.sessionId,
      blockedCategories: piiTypeList,
    });
  }

  return {
    passed,
    shouldBlock,
    detectedEntityIds: entityIdList,
    detectedPIITypes: piiTypeList,
    redactionRatio,
    confidence,
    summary,
    checkedAt,
  };
}
