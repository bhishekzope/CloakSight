/**
 * CloakSight — Tag Vault
 *
 * Session-scoped, in-memory store for SemanticTag → original value mappings.
 *
 * PRIVACY: This is the most sensitive module in the extension.
 *   - The vault MUST be in-memory only (never written to disk in plaintext).
 *   - The vault MUST NOT be accessible from any context other than privacy/ and action/.
 *   - The vault entries MUST expire when the session ends or page navigates.
 *   - The vault MUST NOT be serialized into any message or log.
 *
 * ACCESS POLICY:
 *   - Write: privacy/semanticTagger.ts only
 *   - Read: action/tagResolver.ts only (to fill real values locally)
 *   - No other module may import this file directly.
 */

import type { TagVaultEntry, SemanticTag } from "../types/privacy";
import type { UniqueId } from "../types/common";
import { createLogger } from "../utils/logger";

const logger = createLogger("tagVault");

// In-memory vault — never persisted, never serialized
// sessionId → (tagId → TagVaultEntry)
const vault = new Map<UniqueId, Map<UniqueId, TagVaultEntry>>();

/**
 * Store a tag and its raw original value in the vault.
 * Called only by semanticTagger.ts during on-device redaction.
 */
export function storeTag(
  sessionId: UniqueId,
  tag: SemanticTag,
  originalValue: string,
): void {
  let sessionMap = vault.get(sessionId);
  if (!sessionMap) {
    sessionMap = new Map<UniqueId, TagVaultEntry>();
    vault.set(sessionId, sessionMap);
  }

  const entry: TagVaultEntry = {
    ...tag,
    originalValue,
  };

  sessionMap.set(tag.tagId, entry);
  logger.debug("Stored tag in local vault", {
    sessionId,
    tagId: tag.tagId,
    piiType: tag.piiType,
  });
}

/**
 * Retrieve the raw original value for a given tag.
 * Called only by tagResolver.ts during local action re-hydration.
 *
 * PRIVACY: The returned value is raw PII. Use immediately for browser actions,
 * do not store elsewhere or log.
 */
export function getOriginalValue(
  sessionId: UniqueId,
  tagId: UniqueId,
): string | undefined {
  const sessionMap = vault.get(sessionId);
  if (!sessionMap) return undefined;

  const entry = sessionMap.get(tagId);
  if (!entry) return undefined;

  // Verify expiry
  const now = new Date().getTime();
  const expiresAt = new Date(entry.expiresAt).getTime();
  if (now > expiresAt) {
    entry.state = "expired";
    logger.warn("Attempted to retrieve expired tag from vault", { tagId });
    return undefined;
  }

  return entry.originalValue;
}

/**
 * Retrieve the full TagVaultEntry for a tag (for local verification).
 */
export function getTagEntry(
  sessionId: UniqueId,
  tagId: UniqueId,
): TagVaultEntry | undefined {
  const sessionMap = vault.get(sessionId);
  return sessionMap ? sessionMap.get(tagId) : undefined;
}

/**
 * Return all active tag entries for a session.
 */
export function getAllSessionTags(sessionId: UniqueId): TagVaultEntry[] {
  const sessionMap = vault.get(sessionId);
  return sessionMap ? Array.from(sessionMap.values()) : [];
}

/**
 * Check if a tag exists and is currently active (not expired).
 */
export function isTagActive(sessionId: UniqueId, tagId: UniqueId): boolean {
  const sessionMap = vault.get(sessionId);
  if (!sessionMap) return false;

  const entry = sessionMap.get(tagId);
  if (!entry || entry.state !== "active") return false;

  const now = new Date().getTime();
  const expiresAt = new Date(entry.expiresAt).getTime();
  return now <= expiresAt;
}

/**
 * Clear all entries for a session (called on page navigation or session end).
 */
export function clearSession(sessionId: UniqueId): void {
  const sessionMap = vault.get(sessionId);
  const count = sessionMap ? sessionMap.size : 0;
  vault.delete(sessionId);
  logger.debug("Cleared session from local vault", { sessionId, clearedCount: count });
}

/**
 * Return diagnostic statistics about the vault (counts only, zero PII).
 */
export function getVaultStats(): { totalSessions: number; totalTags: number } {
  let totalTags = 0;
  for (const sessionMap of vault.values()) {
    totalTags += sessionMap.size;
  }
  return {
    totalSessions: vault.size,
    totalTags,
  };
}
