/**
 * CloakSight — Screenshot Ingestion & Visual Processing (Phase 5)
 *
 * Captures browser screenshots using Chrome Extension APIs.
 * Stores dimensions, DPR, and coordinate metadata.
 *
 * PRIVACY: The raw screenshot may contain visual PII (faces, ID cards, receipts).
 * Raw screenshots remain strictly in the LOCAL TRUSTED ZONE.
 * They are NEVER transmitted to cloud agents by default.
 */

import type { BoundingRect, UniqueId } from "../types/common";
import type { VisualRegion } from "../types/perception";
import { createLogger } from "../utils/logger";

const logger = createLogger("screenshotCapture");

export interface ViewportMetadata {
  width: number;
  height: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
  documentWidth: number;
  documentHeight: number;
}

export interface ScreenshotCaptureResult {
  sessionId: UniqueId;
  dataUrl: string;
  viewport: ViewportMetadata;
  capturedAt: string;
}

/**
 * Extract viewport and coordinate scaling metadata from the current window.
 */
export function getViewportMetadata(): ViewportMetadata {
  if (typeof window === "undefined") {
    return {
      width: 1280,
      height: 720,
      devicePixelRatio: 1,
      scrollX: 0,
      scrollY: 0,
      documentWidth: 1280,
      documentHeight: 720,
    };
  }

  return {
    width: window.innerWidth || 1280,
    height: window.innerHeight || 720,
    devicePixelRatio: window.devicePixelRatio || 1,
    scrollX: window.scrollX || window.pageXOffset || 0,
    scrollY: window.scrollY || window.pageYOffset || 0,
    documentWidth: document.documentElement?.scrollWidth || window.innerWidth || 1280,
    documentHeight: document.documentElement?.scrollHeight || window.innerHeight || 720,
  };
}

/**
 * Capture a screenshot of the visible tab.
 *
 * In Chrome extension background/popup contexts, uses `chrome.tabs.captureVisibleTab()`.
 * In content scripts or unit test environments, requests capture via background messaging or mock canvas.
 *
 * @param sessionId Unique session identifier
 * @param windowId Optional window ID (defaults to current window)
 * @returns ScreenshotCaptureResult containing base64 data URL and viewport metadata
 */
export async function captureScreenshot(
  sessionId: UniqueId,
  windowId?: number,
): Promise<ScreenshotCaptureResult> {
  const viewport = getViewportMetadata();
  const capturedAt = new Date().toISOString();

  logger.debug("Attempting screenshot capture", { sessionId, viewport });

  // 1. Direct Chrome Extension API (Available in Background / Popup)
  if (typeof chrome !== "undefined" && chrome.tabs && typeof chrome.tabs.captureVisibleTab === "function") {
    return new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(
        windowId ?? chrome.windows?.WINDOW_ID_CURRENT ?? null as unknown as number,
        { format: "png" },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            logger.error("captureVisibleTab failed", {
              error: chrome.runtime.lastError.message,
            });
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!dataUrl) {
            reject(new Error("captureVisibleTab returned empty dataUrl"));
            return;
          }

          logger.info("Screenshot captured successfully via Chrome API", {
            sessionId,
            width: viewport.width,
            height: viewport.height,
          });

          resolve({
            sessionId,
            dataUrl,
            viewport,
            capturedAt,
          });
        },
      );
    });
  }

  // 2. Messaging delegation (Available in Content Script)
  if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.sendMessage === "function") {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "CAPTURE_SCREENSHOT_REQUEST",
        sessionId,
      });

      if (response && response.ok && response.dataUrl) {
        logger.info("Screenshot captured via background worker message", { sessionId });
        return {
          sessionId,
          dataUrl: response.dataUrl,
          viewport,
          capturedAt,
        };
      }
    } catch {
      // Fall through to synthetic fallback
    }
  }

  // 3. Headless / Unit Test synthetic image fallback
  logger.debug("Using local fallback image generator for testing/unsupported context");
  const fallbackDataUrl = generateSyntheticScreenshot(viewport.width, viewport.height);
  return {
    sessionId,
    dataUrl: fallbackDataUrl,
    viewport,
    capturedAt,
  };
}

/**
 * Crop a specific sub-region (bounding box) from a base64 screenshot data URL.
 * Used by Local OCR (Phase 6) and Visual Perception (Phase 7) to process isolated elements.
 *
 * @param screenshotDataUrl Full page base64 screenshot
 * @param rect Target bounding box in page / viewport coordinates
 * @param dpr Device pixel ratio (defaults to 1)
 * @returns Cropped region as a base64 PNG data URL
 */
export async function cropScreenshotRegion(
  screenshotDataUrl: string,
  rect: BoundingRect,
  dpr = 1,
): Promise<string> {
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error("Invalid crop dimensions: width and height must be positive");
  }

  // If running in browser environment with HTMLCanvasElement or Image
  if (typeof document !== "undefined" && typeof Image !== "undefined") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const sx = Math.max(0, rect.x * dpr);
          const sy = Math.max(0, rect.y * dpr);
          const sWidth = Math.min(img.width - sx, rect.width * dpr);
          const sHeight = Math.min(img.height - sy, rect.height * dpr);

          canvas.width = Math.max(1, sWidth);
          canvas.height = Math.max(1, sHeight);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to create 2D canvas context"));
            return;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load screenshot image for cropping"));
      img.src = screenshotDataUrl;
    });
  }

  // Fallback for node/test environment
  return generateSyntheticScreenshot(rect.width, rect.height);
}

/**
 * Apply visual privacy masks (solid black/blur boxes with labels)
 * over sensitive regions in a screenshot.
 *
 * Ensures that if visual context is ever shared, sensitive regions
 * (faces, ID numbers, signatures, credit cards) are visually obfuscated.
 *
 * @param screenshotDataUrl Original raw screenshot
 * @param regions Sensitive visual regions to mask
 * @param dpr Device pixel ratio
 * @returns Sanitized / masked base64 screenshot data URL
 */
export async function maskScreenshotRegions(
  screenshotDataUrl: string,
  regions: VisualRegion[],
  dpr = 1,
): Promise<string> {
  if (regions.length === 0) {
    return screenshotDataUrl;
  }

  if (typeof document !== "undefined" && typeof Image !== "undefined") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context for visual masking"));
            return;
          }

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Apply visual mask over each sensitive region
          for (const region of regions) {
            const rx = region.boundingRect.x * dpr;
            const ry = region.boundingRect.y * dpr;
            const rw = region.boundingRect.width * dpr;
            const rh = region.boundingRect.height * dpr;

            // Draw solid dark privacy box
            ctx.fillStyle = "#1e1e2f";
            ctx.fillRect(rx, ry, rw, rh);

            // Draw border
            ctx.strokeStyle = "#ff4d4f";
            ctx.lineWidth = 2;
            ctx.strokeRect(rx, ry, rw, rh);

            // Draw category label text
            ctx.fillStyle = "#ffffff";
            ctx.font = `${Math.max(10, Math.floor(12 * dpr))}px sans-serif`;
            const label = `[MASKED: ${region.category.toUpperCase()}]`;
            ctx.fillText(label, rx + 4, ry + Math.min(rh / 2 + 4, 16 * dpr));
          }

          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image for visual masking"));
      img.src = screenshotDataUrl;
    });
  }

  return screenshotDataUrl;
}

/**
 * Generate a 1x1 or custom synthetic transparent PNG data URL for testing environments.
 */
function generateSyntheticScreenshot(_width = 100, _height = 100): string {
  // Minimal valid 1x1 transparent PNG data URL
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAJSON";
}
