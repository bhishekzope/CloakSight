/**
 * CloakSight — ID Generation Utilities
 *
 * Generate unique, opaque identifiers for sessions, tags, elements, etc.
 * IDs must be random and non-guessable to prevent enumeration attacks.
 */

import type { UniqueId } from "../types/common";

/**
 * Generate a cryptographically random unique ID.
 * Uses the Web Crypto API (available in both browser and extension contexts).
 */
export function generateId(prefix?: string): UniqueId {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return prefix ? `${prefix}_${hex}` : hex;
}

/**
 * Generate a session ID.
 * Format: cs_session_<hex>
 */
export function generateSessionId(): UniqueId {
  return generateId("cs_session");
}

/**
 * Generate a semantic tag ID.
 * Format: TAG_<zero-padded-sequence>
 * Note: In Phase 3+, this will use a session-scoped counter.
 */
export function generateTagId(sequenceNumber: number): UniqueId {
  return `TAG_${String(sequenceNumber).padStart(3, "0")}`;
}

/**
 * Generate an element registry ID.
 * Format: elem_<hex>
 */
export function generateElementId(): UniqueId {
  return generateId("elem");
}

/**
 * Generate an action ID.
 * Format: act_<hex>
 */
export function generateActionId(): UniqueId {
  return generateId("act");
}

/**
 * Generate a plan ID.
 * Format: plan_<hex>
 */
export function generatePlanId(): UniqueId {
  return generateId("plan");
}
