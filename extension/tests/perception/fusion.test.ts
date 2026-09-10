/**
 * CloakSight — Phase 8: DOM + Visual Perception Fusion Engine Tests
 */

import { describe, it, expect } from "vitest";
import { fusePerceptionData, checkSpatialOverlap } from "../../src/perception/fusionEngine";
import type { PageSnapshot } from "../../src/types/dom";
import type { PerceptionResult } from "../../src/types/perception";

describe("Phase 8: DOM + Visual Fusion Engine", () => {
  describe("checkSpatialOverlap", () => {
    it("should correctly identify overlapping bounding rectangles", () => {
      const rectA = { x: 10, y: 10, width: 100, height: 100 };
      const rectB = { x: 50, y: 50, width: 100, height: 100 };
      expect(checkSpatialOverlap(rectA, rectB, 0.2)).toBe(true);
    });

    it("should return false for non-overlapping bounding rectangles", () => {
      const rectA = { x: 10, y: 10, width: 50, height: 50 };
      const rectB = { x: 200, y: 200, width: 50, height: 50 };
      expect(checkSpatialOverlap(rectA, rectB)).toBe(false);
    });
  });

  describe("fusePerceptionData", () => {
    it("should fuse DOM elements, classifications, visual regions, and OCR text into UnifiedPageRepresentation", () => {
      const sampleSnapshot: PageSnapshot = {
        sessionId: "session_fusion_001",
        tabId: 1,
        pageUrl: "http://localhost:3000",
        pageTitle: "Reimbursement Portal",
        rootElementId: "el_root",
        rawPageText: "Travel Reimbursement Request",
        capturedAt: new Date().toISOString(),
        elementCount: 2,
        interactiveElementCount: 2,
        elements: {
          el_name: {
            elementId: "el_name",
            tagName: "input",
            role: "input_text",
            visibility: "visible",
            attributes: { name: "employee_name" },
            boundingRect: { x: 10, y: 10, width: 200, height: 30 },
            isInteractive: true,
            looksLikeSensitiveField: true,
            childIds: [],
            accessibleLabel: "Full Name",
          },
          el_upload: {
            elementId: "el_upload",
            tagName: "input",
            role: "input_file",
            visibility: "visible",
            attributes: { name: "receipt", id: "receipt" },
            boundingRect: { x: 10, y: 100, width: 300, height: 60 },
            isInteractive: true,
            looksLikeSensitiveField: true,
            childIds: [],
            accessibleLabel: "Upload Receipt",
          },
        },
      };

      const samplePerception: PerceptionResult = {
        sessionId: "session_fusion_001",
        snapshotId: "session_fusion_001",
        elementClassifications: [
          {
            elementId: "el_name",
            label: "employee_name_field",
            confidence: 0.95,
            isLikelySensitive: true,
          },
          {
            elementId: "el_upload",
            label: "file_upload_field",
            confidence: 0.94,
            isLikelySensitive: true,
          },
        ],
        visualRegions: [
          {
            regionId: "reg_001",
            category: "receipt",
            boundingRect: { x: 10, y: 100, width: 300, height: 60 },
            confidence: 0.94,
            isMasked: false,
            associatedElementId: "el_upload",
            ocrText: "HOTEL GRAND TOTAL: INR 4,500.00",
          },
        ],
        ocrRun: true,
        visualDetectionRun: true,
        backendUsed: "wasm",
        completedAt: new Date().toISOString(),
        overallConfidence: 0.94,
      };

      const unified = fusePerceptionData(sampleSnapshot, samplePerception);

      expect(unified).toBeDefined();
      expect(unified.sessionId).toBe("session_fusion_001");
      expect(unified.elementCount).toBe(2);
      expect(unified.sensitiveCount).toBe(2);
      expect(unified.interactiveCount).toBe(2);

      // Verify fused element properties
      const fusedName = unified.fusedElements["el_name"];
      expect(fusedName?.semanticLabel).toBe("employee_name_field");
      expect(fusedName?.isSensitive).toBe(true);

      const fusedUpload = unified.fusedElements["el_upload"];
      expect(fusedUpload?.semanticLabel).toBe("file_upload_field");
      expect(fusedUpload?.associatedVisualRegionId).toBe("reg_001");
      expect(fusedUpload?.ocrText).toBe("HOTEL GRAND TOTAL: INR 4,500.00");

      // Verify aggregated OCR snippets
      expect(unified.ocrTextSnippets).toContain("HOTEL GRAND TOTAL: INR 4,500.00");
      expect(unified.fusionConfidence).toBeGreaterThan(0.9);
    });
  });
});
