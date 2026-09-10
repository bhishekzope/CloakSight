/**
 * CloakSight — Tag Resolver
 *
 * Resolves a cloud action plan's semantic tag ID (e.g. "TAG_001") to:
 *   1. The live in-memory DOM Element (via elementRegistry.ts)
 *   2. The raw original value (via tagVault.ts)
 *
 * PRIVACY: Tag resolution is strictly on-device. The cloud never has access
 * to the resolved live DOM element or the real value it re-injects.
 */

import type { UniqueId } from "../types/common";
import { lookupElement } from "./elementRegistry";
import { getOriginalValue, isTagActive } from "../storage/tagVault";
import { createLogger } from "../utils/logger";

const logger = createLogger("tagResolver");

export interface ResolvedTarget {
  tagId: UniqueId;
  element: Element;
  elementType: string;
  isValid: boolean;
}

/**
 * Resolve a semantic tag ID to a live DOM element.
 * Returns null if the tag is unknown or the element is no longer attached to the DOM.
 *
 * @param tagId Semantic tag identifier or element ID
 * @returns ResolvedTarget with live Element reference, or null
 */
export function resolveTag(tagId: UniqueId): ResolvedTarget | null {
  const entry = lookupElement(tagId);
  if (!entry || !entry.isValid) {
    logger.warn("Failed to resolve tag to live DOM element", { tagId });
    return null;
  }

  return {
    tagId,
    element: entry.element,
    elementType: entry.elementType,
    isValid: entry.isValid,
  };
}

/**
 * Resolve the original raw value associated with a tag from the local vault.
 * Used during Phase 14 action execution to re-inject real user data into inputs locally.
 *
 * @param sessionId Session identifier
 * @param tagId Semantic tag identifier
 * @returns The original raw PII value if active in vault, or undefined
 */
export function resolveTagValue(
  sessionId: UniqueId,
  tagId: UniqueId,
): string | undefined {
  if (!isTagActive(sessionId, tagId)) {
    logger.debug("Tag value not active or present in local vault", { sessionId, tagId });
    return undefined;
  }

  return getOriginalValue(sessionId, tagId);
}
