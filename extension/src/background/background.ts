/**
 * CloakSight — Background Service Worker
 *
 * Entry point for the extension background service worker.
 * Orchestrates the full CloakSight pipeline:
 *   receive user task → trigger content scan → build context
 *   → leak guard → cloud → receive action plan → dispatch to content
 *
 * STATUS: Placeholder. Pipeline connections not implemented.
 * TODO(phase-1): Wire message handlers.
 * TODO(phase-2): Connect ingestion pipeline.
 * TODO(phase-6): Connect leak guard + cloud interface.
 * TODO(phase-7): Connect cloud agent.
 * TODO(phase-8): Connect action dispatcher.
 */

import { onMessage } from "../messaging/messageBus";
import { createLogger } from "../utils/logger";

const logger = createLogger("background");

// ============================================================
// Service worker lifecycle
// ============================================================

chrome.runtime.onInstalled.addListener((details) => {
  logger.info("CloakSight installed", { reason: details.reason });
  // TODO(phase-1): Initialize default privacy policy in storage.
  // TODO(phase-1): Set extension badge to "idle" state.
});

// ============================================================
// Message routing
// ============================================================

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "CAPTURE_SCREENSHOT_REQUEST") {
      const windowId = sender?.tab?.windowId ?? null;
      if (chrome.tabs && typeof chrome.tabs.captureVisibleTab === "function") {
        chrome.tabs.captureVisibleTab(
          windowId as unknown as number,
          { format: "png" },
          (dataUrl) => {
            if (chrome.runtime.lastError) {
              logger.error("Background captureVisibleTab failed", {
                error: chrome.runtime.lastError.message,
              });
              sendResponse({ ok: false, error: chrome.runtime.lastError.message });
            } else {
              sendResponse({ ok: true, dataUrl });
            }
          },
        );
        return true; // Keep channel open for async response
      } else {
        sendResponse({ ok: false, error: "tabs.captureVisibleTab not available" });
      }
    }
    return false;
  });
}

logger.info("CloakSight background service worker initialized");

// ============================================================
// Pipeline stub functions (not implemented)
// ============================================================

/**
 * Trigger the ingestion pipeline for a tab.
 * TODO(phase-2): Implement by messaging content script and awaiting PageSnapshot.
 */
async function triggerIngestion(
  _tabId: number,
  _userTask: string,
): Promise<void> {
  throw new Error("Not implemented: triggerIngestion");
}

/**
 * Run the full privacy pipeline on a page snapshot.
 * TODO(phase-3–6): perception → PII detection → redaction → context → leak guard
 */
async function runPrivacyPipeline(_sessionId: string): Promise<void> {
  throw new Error("Not implemented: runPrivacyPipeline");
}

/**
 * Send sanitized context to cloud agent and receive action plan.
 * TODO(phase-7): Implement HTTP call to FastAPI server.
 */
async function callCloudAgent(_sessionId: string): Promise<void> {
  throw new Error("Not implemented: callCloudAgent");
}

/**
 * Dispatch action plan to content script for execution.
 * TODO(phase-8): Implement by messaging content script with ActionPlan.
 */
async function dispatchActionPlan(
  _tabId: number,
  _sessionId: string,
): Promise<void> {
  throw new Error("Not implemented: dispatchActionPlan");
}

// Suppress "declared but never used" errors during scaffolding
void triggerIngestion;
void runPrivacyPipeline;
void callCloudAgent;
void dispatchActionPlan;
void onMessage;
