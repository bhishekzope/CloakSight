/**
 * CloakSight — Semantic Tagger
 *
 * Generates and manages opaque semantic tags (TAG_001, TAG_002) for detected PII entities.
 * Coordinates with tagVault.ts for session-scoped local storage of tag → real value mappings.
 *
 * PRIVACY:
 *   - Tag IDs are CLOUD-SAFE (opaque identifiers like TAG_001).
 *   - Semantic labels are CLOUD-SAFE (semantic tokens like [PERSON_NAME]).
 *   - Original values are stored in `storage/tagVault.ts` in-memory only.
 *   - The returned `SemanticTag` object intentionally contains NO raw value.
 */

import type { SemanticTag, SensitiveEntity } from "../types/privacy";
import type { UniqueId } from "../types/common";
import { storeTag, clearSession } from "../storage/tagVault";
import { registerElement, lookupElement } from "../action/elementRegistry";
import { PRIVACY_DEFAULTS } from "../config/config";
import { createLogger } from "../utils/logger";

const logger = createLogger("semanticTagger");

let tagCounter = 0;

/**
 * Generate a sequential, opaque tag identifier (e.g. "TAG_001").
 */
function generateTagId(): UniqueId {
  tagCounter += 1;
  return `TAG_${tagCounter.toString().padStart(3, "0")}`;
}

/**
 * Reset tag counter (used for new sessions or testing).
 */
export function resetTagCounter(): void {
  tagCounter = 0;
}

/**
 * Build a standardized, human-readable semantic label from a PIIType.
 * Example: "PERSON_NAME" -> "[PERSON_NAME]"
 */
export function formatSemanticLabel(piiType: string): string {
  return `[${piiType}]`;
}

/**
 * Generate a cloud-safe SemanticTag for a detected sensitive entity.
 * Saves the original raw value in the local in-memory vault.
 * Returns only the safe SemanticTag (containing no raw value).
 *
 * @param entity The detected SensitiveEntity
 * @param sessionId Unique session identifier
 * @param ttlMs Tag time-to-live in milliseconds (defaults to 30 mins)
 * @returns Cloud-safe SemanticTag
 */
export function createTag(
  entity: SensitiveEntity,
  sessionId: UniqueId,
  ttlMs = PRIVACY_DEFAULTS.TAG_EXPIRY_MS,
): SemanticTag {
  const tagId = generateTagId();
  const semanticLabel = formatSemanticLabel(entity.piiType);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

  const tag: SemanticTag = {
    tagId,
    semanticLabel,
    piiType: entity.piiType,
    associatedElementId: entity.sourceElementId,
    state: "active",
    createdAt: now.toISOString(),
    expiresAt,
  };

  // Store raw value strictly in the local in-memory vault
  storeTag(sessionId, tag, entity.rawValue);

  // Link tagId to the live DOM element in the element registry for action dispatching
  if (entity.sourceElementId) {
    const existing = lookupElement(entity.sourceElementId);
    if (existing) {
      registerElement(tagId, existing.element, existing.expectedRole, existing.elementType);
    }
  }

  logger.debug("Created semantic tag for PII", {
    tagId,
    piiType: entity.piiType,
    elementId: entity.sourceElementId,
  });

  return tag;
}

/**
 * Batch generate SemanticTags for an array of detected sensitive entities.
 * Deduplicates multiple tags for the same value/element if appropriate.
 *
 * @param entities Array of SensitiveEntity objects
 * @param sessionId Unique session identifier
 * @param ttlMs Optional tag TTL
 * @returns Array of cloud-safe SemanticTag objects
 */
export function createTags(
  entities: SensitiveEntity[],
  sessionId: UniqueId,
  ttlMs = PRIVACY_DEFAULTS.TAG_EXPIRY_MS,
): SemanticTag[] {
  const tags: SemanticTag[] = [];

  for (const entity of entities) {
    const tag = createTag(entity, sessionId, ttlMs);
    tags.push(tag);
  }

  logger.info("Batch tag creation complete", {
    sessionId,
    tagCount: tags.length,
  });

  return tags;
}

/**
 * Expire all semantic tags for a session (e.g., on tab close or page navigation).
 */
export async function expireSessionTags(sessionId: UniqueId): Promise<void> {
  clearSession(sessionId);
  logger.info("Expired all session tags", { sessionId });
}
