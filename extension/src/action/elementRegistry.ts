/**
 * CloakSight — Element Registry
 *
 * Maintains a live in-memory map of stable identifiers / tags to actual DOM element references.
 * This is the LOCAL bridge between cloud action plans / IDs and live DOM elements.
 *
 * PRIVACY: ElementRegistryEntry contains live DOM references.
 * The registry is strictly in-memory only and is NEVER serialized or transmitted.
 */

import type { ElementRegistryEntry } from "../types/action";
import type { UniqueId } from "../types/common";
import { createLogger } from "../utils/logger";

const logger = createLogger("elementRegistry");

// In-memory registry (never persisted)
const registry = new Map<UniqueId, ElementRegistryEntry>();

// Reverse lookup WeakMap to quickly find if a live DOM element already has an assigned ID
const elementToIdMap = new WeakMap<Element, UniqueId>();

/**
 * Register a live DOM element with a unique identifier.
 *
 * @param id Unique identifier (elementId or tagId)
 * @param element Live DOM element
 * @param expectedRole Semantic role of the element
 * @param elementType HTML tag or input type
 * @returns The created registry entry
 */
export function registerElement(
  id: UniqueId,
  element: Element,
  expectedRole: string = "unknown",
  elementType: string = element.tagName.toLowerCase(),
): ElementRegistryEntry {
  const entry: ElementRegistryEntry = {
    tagId: id,
    element,
    elementType,
    expectedRole,
    registeredAt: new Date().toISOString(),
    isValid: true,
  };

  registry.set(id, entry);
  elementToIdMap.set(element, id);

  return entry;
}

/**
 * Look up a registered entry by its identifier.
 * Checks whether the live DOM element is still connected to the document.
 *
 * @param id Unique identifier
 * @returns The registry entry with updated validity, or undefined if not found
 */
export function lookupElement(id: UniqueId): ElementRegistryEntry | undefined {
  const entry = registry.get(id);
  if (!entry) {
    return undefined;
  }

  // Live validity check: verify the element is still attached to the DOM
  entry.isValid = entry.element.isConnected;

  return entry;
}

/**
 * Direct lookup to retrieve the live DOM Element by ID.
 *
 * @param id Unique identifier
 * @returns The live DOM element if valid and connected, or undefined
 */
export function getElement(id: UniqueId): Element | undefined {
  const entry = lookupElement(id);
  return entry && entry.isValid ? entry.element : undefined;
}

/**
 * Look up the registered identifier for a given live DOM Element.
 *
 * @param element Live DOM element
 * @returns The assigned identifier if registered, or undefined
 */
export function getElementId(element: Element): UniqueId | undefined {
  return elementToIdMap.get(element);
}

/**
 * Check if a registered element exists and is currently attached to the DOM.
 */
export function isElementValid(id: UniqueId): boolean {
  const entry = lookupElement(id);
  return !!entry?.isValid;
}

/**
 * Return the total number of registered elements in the current session.
 */
export function getRegistrySize(): number {
  return registry.size;
}

/**
 * Return all currently active entries.
 */
export function getAllEntries(): ElementRegistryEntry[] {
  return Array.from(registry.values());
}

/**
 * Clear all registrations for a session (called on page navigation or session reset).
 */
export function clearRegistry(_sessionId?: UniqueId): void {
  const size = registry.size;
  registry.clear();
  logger.debug("Element registry cleared", { clearedEntries: size });
}
