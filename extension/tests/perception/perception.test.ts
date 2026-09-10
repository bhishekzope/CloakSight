/**
 * CloakSight — Phase 7: Local Visual Perception & Classification Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { classifyElement, classifyElements } from "../../src/perception/elementClassifier";
import { detectSensitiveRegions, resetRegionCounter } from "../../src/perception/visualDetector";
import { runPerceptionPipeline } from "../../src/perception/perceptionPipeline";
import type { DOMElement, PageSnapshot } from "../../src/types/dom";

describe("Phase 7: Local Visual Perception", () => {
  beforeEach(() => {
    resetRegionCounter();
  });

  describe("elementClassifier", () => {
    it("should classify an email input correctly", () => {
      const emailElement: DOMElement = {
        elementId: "el_email",
        tagName: "input",
        role: "input_email",
        visibility: "visible",
        attributes: { type: "email", name: "user_email", id: "email" },
        boundingRect: { x: 10, y: 10, width: 200, height: 30 },
        isInteractive: true,
        looksLikeSensitiveField: true,
        childIds: [],
        accessibleLabel: "Email Address",
      };

      const result = classifyElement(emailElement);
      expect(result.label).toBe("email_field");
      expect(result.isLikelySensitive).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it("should classify an Aadhaar field correctly", () => {
      const aadhaarElement: DOMElement = {
        elementId: "el_aadhaar",
        tagName: "input",
        role: "input_text",
        visibility: "visible",
        attributes: { name: "aadhaar_number", id: "aadhaar" },
        boundingRect: { x: 10, y: 50, width: 200, height: 30 },
        isInteractive: true,
        looksLikeSensitiveField: true,
        childIds: [],
        accessibleLabel: "Aadhaar Number",
      };

      const result = classifyElement(aadhaarElement);
      expect(result.label).toBe("aadhaar_field");
      expect(result.isLikelySensitive).toBe(true);
    });

    it("should classify a bank account field correctly", () => {
      const bankElement: DOMElement = {
        elementId: "el_bank",
        tagName: "input",
        role: "input_text",
        visibility: "visible",
        attributes: { name: "bank_account", id: "bank-account" },
        boundingRect: { x: 10, y: 90, width: 200, height: 30 },
        isInteractive: true,
        looksLikeSensitiveField: true,
        childIds: [],
        accessibleLabel: "Bank Account Number",
      };

      const result = classifyElement(bankElement);
      expect(result.label).toBe("bank_account_field");
      expect(result.isLikelySensitive).toBe(true);
    });

    it("should classify a submit button correctly", () => {
      const submitBtn: DOMElement = {
        elementId: "el_btn",
        tagName: "button",
        role: "button_submit",
        visibility: "visible",
        attributes: { type: "submit" },
        boundingRect: { x: 10, y: 150, width: 120, height: 40 },
        isInteractive: true,
        looksLikeSensitiveField: false,
        childIds: [],
        textContent: "Submit Reimbursement",
      };

      const result = classifyElement(submitBtn);
      expect(result.label).toBe("submit_button");
      expect(result.isLikelySensitive).toBe(false);
    });

    it("should return generic/unknown for unrecognized elements", () => {
      const genericDiv: DOMElement = {
        elementId: "el_generic",
        tagName: "div",
        role: "unknown",
        visibility: "visible",
        attributes: { class: "spacer" },
        boundingRect: { x: 0, y: 0, width: 10, height: 10 },
        isInteractive: false,
        looksLikeSensitiveField: false,
        childIds: [],
      };

      const result = classifyElement(genericDiv);
      expect(result.label).toBe("unknown");
      expect(result.isLikelySensitive).toBe(false);
    });

    it("should batch classify all elements", () => {
      const elements: DOMElement[] = [
        {
          elementId: "el_1",
          tagName: "input",
          role: "input_phone",
          visibility: "visible",
          attributes: { name: "phone" },
          boundingRect: { x: 0, y: 0, width: 100, height: 20 },
          isInteractive: true,
          looksLikeSensitiveField: true,
          childIds: [],
          accessibleLabel: "Phone Number",
        },
      ];

      const results = classifyElements(elements);
      expect(results).toHaveLength(1);
      expect(results[0]?.label).toBe("phone_field");
    });
  });

  describe("visualDetector", () => {
    it("should detect a receipt upload area in visual regions", async () => {
      const uploadElement: DOMElement = {
        elementId: "el_receipt_upload",
        tagName: "input",
        role: "input_file",
        visibility: "visible",
        attributes: { type: "file", id: "receipt-upload", name: "receipt" },
        boundingRect: { x: 50, y: 300, width: 400, height: 80 },
        isInteractive: true,
        looksLikeSensitiveField: true,
        childIds: [],
        accessibleLabel: "Upload Receipt",
      };

      const regions = await detectSensitiveRegions("", [uploadElement]);
      expect(regions).toHaveLength(1);
      expect(regions[0]?.category).toBe("receipt");
      expect(regions[0]?.associatedElementId).toBe("el_receipt_upload");
      expect(regions[0]?.confidence).toBeGreaterThan(0.9);
    });

    it("should detect an ID card upload zone in visual regions", async () => {
      const idUploadElement: DOMElement = {
        elementId: "el_id_upload",
        tagName: "input",
        role: "input_file",
        visibility: "visible",
        attributes: { type: "file", id: "id-card-upload", name: "id_proof" },
        boundingRect: { x: 50, y: 400, width: 400, height: 80 },
        isInteractive: true,
        looksLikeSensitiveField: true,
        childIds: [],
        accessibleLabel: "Upload ID Card / Aadhaar",
      };

      const regions = await detectSensitiveRegions("", [idUploadElement]);
      expect(regions).toHaveLength(1);
      expect(regions[0]?.category).toBe("id_card");
    });

    it("should return empty array for non-sensitive layouts", async () => {
      const nonSensitiveElement: DOMElement = {
        elementId: "el_p",
        tagName: "p",
        role: "paragraph",
        visibility: "visible",
        attributes: {},
        boundingRect: { x: 10, y: 10, width: 100, height: 20 },
        isInteractive: false,
        looksLikeSensitiveField: false,
        childIds: [],
        textContent: "Hello world",
      };

      const regions = await detectSensitiveRegions("", [nonSensitiveElement]);
      expect(regions).toHaveLength(0);
    });
  });

  describe("perceptionPipeline", () => {
    it("should produce a PerceptionResult combining classifications and visual regions", async () => {
      const sampleSnapshot: PageSnapshot = {
        sessionId: "session_perception_001",
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

      const sampleScreenshot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAJSON";

      const result = await runPerceptionPipeline(sampleSnapshot, sampleScreenshot);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe("session_perception_001");
      expect(result.elementClassifications).toHaveLength(2);
      expect(result.visualRegions).toHaveLength(1);
      expect(result.visualRegions[0]?.category).toBe("receipt");
      expect(result.ocrRun).toBe(true);
      expect(result.overallConfidence).toBeGreaterThan(0.5);
    });
  });
});
