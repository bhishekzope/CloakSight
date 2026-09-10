/**
 * CloakSight — Local Store
 *
 * General-purpose key/value store using Chrome Storage API.
 * Stores non-sensitive data: user preferences, privacy policies, session metadata.
 *
 * NOTE: Do NOT store raw PII or tag vault entries here.
 * Use tagVault.ts for sensitive tag mappings.
 *
 * STATUS: Not implemented.
 * TODO(phase-1): Implement using chrome.storage.local.
 */

import { createLogger } from "../utils/logger";

const logger = createLogger("localStore");

/**
 * Get a value from local storage.
 * @throws Error("Not implemented")
 */
export async function get<T>(key: string): Promise<T | undefined> {
  logger.debug("localStore.get called — not implemented", { key });
  // TODO(phase-1): chrome.storage.local.get([key])
  throw new Error("Not implemented: localStore.get");
}

/**
 * Set a value in local storage.
 * @throws Error("Not implemented")
 */
export async function set<T>(key: string, _value: T): Promise<void> {
  logger.debug("localStore.set called — not implemented", { key });
  // TODO(phase-1): chrome.storage.local.set({ [key]: value })
  throw new Error("Not implemented: localStore.set");
}

/**
 * Remove a key from local storage.
 * @throws Error("Not implemented")
 */
export async function remove(key: string): Promise<void> {
  logger.debug("localStore.remove called — not implemented", { key });
  throw new Error("Not implemented: localStore.remove");
}
