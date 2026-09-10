/**
 * CloakSight — Message Bus
 *
 * Thin wrapper around Chrome's message passing APIs.
 * Provides type-safe send/receive for BrowserMessage.
 *
 * STATUS: Placeholder — not implemented.
 * TODO(phase-1): Implement message routing in Phase 1 skeleton.
 * TODO(phase-2): Connect to real ingestion triggers.
 */

import type { BrowserMessage } from "./messageTypes";

// ============================================================
// Sending messages
// ============================================================

/**
 * Send a message to the background service worker.
 * @throws Error("Not implemented")
 */
export async function sendToBackground(
  _message: BrowserMessage,
): Promise<BrowserMessage | undefined> {
  // TODO(phase-1): Implement using chrome.runtime.sendMessage
  throw new Error("Not implemented: sendToBackground");
}

/**
 * Send a message to a specific tab's content script.
 * @throws Error("Not implemented")
 */
export async function sendToTab(
  _tabId: number,
  _message: BrowserMessage,
): Promise<BrowserMessage | undefined> {
  // TODO(phase-1): Implement using chrome.tabs.sendMessage
  throw new Error("Not implemented: sendToTab");
}

// ============================================================
// Receiving messages
// ============================================================

export type MessageHandler = (
  message: BrowserMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: BrowserMessage) => void,
) => boolean | void;

/**
 * Register a handler for incoming messages.
 * @throws Error("Not implemented")
 */
export function onMessage(_handler: MessageHandler): void {
  // TODO(phase-1): Implement using chrome.runtime.onMessage.addListener
  throw new Error("Not implemented: onMessage");
}

/**
 * Remove a previously registered message handler.
 * @throws Error("Not implemented")
 */
export function offMessage(_handler: MessageHandler): void {
  // TODO(phase-1): Implement using chrome.runtime.onMessage.removeListener
  throw new Error("Not implemented: offMessage");
}
