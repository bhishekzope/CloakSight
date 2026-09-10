/**
 * CloakSight — Phase 6: Local OCR Engine Tests
 *
 * Tests on-device optical character recognition on image data,
 * screenshot visual regions, and batch region annotations.
 */

import { describe, it, expect } from "vitest";
import {
  extractTextFromImage,
  extractTextFromRegion,
  annotateRegionsWithOCR,
  preprocessImageForOCR,
} from "../../src/perception/ocrEngine";
import type { VisualRegion } from "../../src/types/perception";

describe("Phase 6: Local OCR Engine", () => {
  const sampleDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAJSON";

  describe("extractTextFromImage", () => {
    it("should handle empty or whitespace-only image strings gracefully", async () => {
      const result = await extractTextFromImage("");
      expect(result.rawText).toBe("");
      expect(result.words).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
    });

    it("should extract text and word bounding boxes on-device", async () => {
      const result = await extractTextFromImage(sampleDataUrl);

      expect(result).toBeDefined();
      expect(typeof result.rawText).toBe("string");
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(Array.isArray(result.words)).toBe(true);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.extractedAt).toBeDefined();
    });
  });

  describe("extractTextFromRegion", () => {
    it("should extract text from a specific visual bounding box in a screenshot", async () => {
      const region: VisualRegion = {
        regionId: "reg_receipt_001",
        category: "receipt",
        boundingRect: { x: 50, y: 50, width: 300, height: 200 },
        confidence: 0.95,
        isMasked: false,
      };

      const text = await extractTextFromRegion(sampleDataUrl, region, 1);
      expect(typeof text).toBe("string");
    });
  });

  describe("annotateRegionsWithOCR", () => {
    it("should batch annotate multiple visual regions with extracted OCR text", async () => {
      const regions: VisualRegion[] = [
        {
          regionId: "reg_invoice_001",
          category: "invoice",
          boundingRect: { x: 20, y: 20, width: 250, height: 150 },
          confidence: 0.92,
          isMasked: false,
        },
        {
          regionId: "reg_id_002",
          category: "id_card",
          boundingRect: { x: 300, y: 50, width: 200, height: 120 },
          confidence: 0.89,
          isMasked: false,
        },
      ];

      const annotated = await annotateRegionsWithOCR(sampleDataUrl, regions, 1);

      expect(annotated).toHaveLength(2);
      expect(annotated[0]?.regionId).toBe("reg_invoice_001");
      expect(annotated[0]?.ocrText).toBeDefined();
      expect(annotated[1]?.regionId).toBe("reg_id_002");
      expect(annotated[1]?.ocrText).toBeDefined();
    });
  });

  describe("preprocessImageForOCR", () => {
    it("should preprocess canvas context without throwing errors", () => {
      if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 50, 50);
          const processed = preprocessImageForOCR(canvas);
          expect(processed).toBeDefined();
        }
      }
    });
  });
});
