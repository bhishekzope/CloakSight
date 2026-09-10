/**
 * CloakSight — Phase 5: Screenshot Ingestion & Visual Region Tests
 *
 * Tests visible tab screenshot capture, viewport metadata extraction,
 * coordinate scaling with devicePixelRatio, region cropping, and visual masking.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getViewportMetadata,
  captureScreenshot,
  cropScreenshotRegion,
  maskScreenshotRegions,
} from "../../src/ingestion/screenshotCapture";
import type { VisualRegion } from "../../src/types/perception";

describe("Phase 5: Screenshot Ingestion & Coordinate Geometry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getViewportMetadata", () => {
    it("should extract viewport dimensions, DPR, and scroll coordinates", () => {
      const viewport = getViewportMetadata();

      expect(viewport).toBeDefined();
      expect(typeof viewport.width).toBe("number");
      expect(typeof viewport.height).toBe("number");
      expect(typeof viewport.devicePixelRatio).toBe("number");
      expect(typeof viewport.scrollX).toBe("number");
      expect(typeof viewport.scrollY).toBe("number");
      expect(viewport.width).toBeGreaterThan(0);
      expect(viewport.height).toBeGreaterThan(0);
    });
  });

  describe("captureScreenshot", () => {
    it("should capture screenshot dataUrl and bundle viewport metadata", async () => {
      const result = await captureScreenshot("test_session_screenshot");

      expect(result).toBeDefined();
      expect(result.sessionId).toBe("test_session_screenshot");
      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.viewport.width).toBeGreaterThan(0);
      expect(result.capturedAt).toBeDefined();
    });

    it("should use chrome.tabs.captureVisibleTab when available in browser context", async () => {
      const mockDataUrl = "data:image/png;base64,mockTabScreenshotData";
      const captureVisibleTabMock = vi.fn((_windowId, _opts, callback) => {
        callback(mockDataUrl);
      });

      // Mock chrome extension API
      (globalThis as unknown as { chrome: unknown }).chrome = {
        tabs: {
          captureVisibleTab: captureVisibleTabMock,
        },
        windows: {
          WINDOW_ID_CURRENT: 1,
        },
        runtime: {},
      };

      const result = await captureScreenshot("session_chrome_api");

      expect(captureVisibleTabMock).toHaveBeenCalled();
      expect(result.dataUrl).toBe(mockDataUrl);

      // Clean up mock
      delete (globalThis as unknown as { chrome?: unknown }).chrome;
    });

    it("should handle captureVisibleTab error gracefully", async () => {
      (globalThis as unknown as { chrome: unknown }).chrome = {
        tabs: {
          captureVisibleTab: (_windowId: number, _opts: unknown, callback: (url?: string) => void) => {
            (globalThis as unknown as { chrome: { runtime: { lastError?: { message: string } } } }).chrome.runtime.lastError = {
              message: "Cannot access contents of the page",
            };
            callback(undefined);
          },
        },
        windows: {
          WINDOW_ID_CURRENT: 1,
        },
        runtime: {},
      };

      await expect(captureScreenshot("session_error")).rejects.toThrow("Cannot access contents of the page");

      // Clean up mock
      delete (globalThis as unknown as { chrome?: unknown }).chrome;
    });
  });

  describe("cropScreenshotRegion", () => {
    it("should reject negative or zero dimension bounding rects", async () => {
      const mockDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAJSON";

      await expect(
        cropScreenshotRegion(mockDataUrl, { x: 0, y: 0, width: 0, height: 100 }),
      ).rejects.toThrow("Invalid crop dimensions");

      await expect(
        cropScreenshotRegion(mockDataUrl, { x: 0, y: 0, width: 100, height: -5 }),
      ).rejects.toThrow("Invalid crop dimensions");
    });

    it("should return a cropped base64 data URL for valid bounding rects", async () => {
      const mockDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAJSON";

      const cropped = await cropScreenshotRegion(
        mockDataUrl,
        { x: 10, y: 20, width: 200, height: 100 },
        2, // DPR = 2
      );

      expect(cropped).toBeDefined();
      expect(cropped).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("maskScreenshotRegions", () => {
    it("should return the original dataUrl when no sensitive regions are present", async () => {
      const mockDataUrl = "data:image/png;base64,originalImageNoMask";
      const result = await maskScreenshotRegions(mockDataUrl, []);
      expect(result).toBe(mockDataUrl);
    });

    it("should process visual regions for visual privacy masking", async () => {
      const mockDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAJSON";

      const regions: VisualRegion[] = [
        {
          regionId: "reg_001",
          category: "id_card",
          boundingRect: { x: 50, y: 50, width: 300, height: 200 },
          confidence: 0.95,
          isMasked: true,
        },
        {
          regionId: "reg_002",
          category: "receipt",
          boundingRect: { x: 400, y: 100, width: 250, height: 400 },
          confidence: 0.92,
          isMasked: true,
        },
      ];

      const masked = await maskScreenshotRegions(mockDataUrl, regions, 1);
      expect(masked).toBeDefined();
    });
  });
});
