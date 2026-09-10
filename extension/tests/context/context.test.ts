/**
 * CloakSight — Phase 10: Sanitized Context Builder & Compressor Tests
 */

import { describe, it, expect } from "vitest";
import {
  buildSanitizedContextFromUnified,
  buildAgentRequest,
} from "../../src/context/contextBuilder";
import { compressElements, compressContext } from "../../src/context/contextCompressor";
import { validateAgentRequest, validateSanitizedContext } from "../../src/context/contextValidator";
import type { UnifiedPageRepresentation } from "../../src/types/perception";
import type { SanitizedElement } from "../../src/types/privacy";

describe("Phase 10: Sanitized Context Builder & Compressor", () => {
  const mockUnified: UnifiedPageRepresentation = {
    sessionId: "session_context_001",
    pageUrl: "http://localhost:3000",
    pageTitle: "Reimbursement Portal",
    capturedAt: new Date().toISOString(),
    elementCount: 3,
    interactiveCount: 2,
    sensitiveCount: 1,
    fusionConfidence: 0.92,
    ocrTextSnippets: ["HOTEL GRAND TOTAL: INR 4,500.00"],
    visualRegions: [],
    fusedElements: {
      el_name: {
        elementId: "el_name",
        tagName: "input",
        role: "input_text",
        semanticLabel: "employee_name_field",
        isInteractive: true,
        isSensitive: true,
        confidence: 0.95,
        boundingRect: { x: 10, y: 10, width: 200, height: 30 },
        accessibleLabel: "Full Name",
        value: "Rahul Sharma", // Raw value in local DOM (must NOT cross into SanitizedContext)
      },
      el_category: {
        elementId: "el_category",
        tagName: "select",
        role: "select",
        semanticLabel: "expense_category_field",
        isInteractive: true,
        isSensitive: false,
        confidence: 0.92,
        boundingRect: { x: 10, y: 50, width: 200, height: 30 },
        value: "Hotel",
      },
      el_submit: {
        elementId: "el_submit",
        tagName: "button",
        role: "button_submit",
        semanticLabel: "submit_button",
        isInteractive: true,
        isSensitive: false,
        confidence: 0.96,
        boundingRect: { x: 10, y: 100, width: 120, height: 40 },
        textContent: "Submit",
      },
    },
  };

  describe("buildSanitizedContextFromUnified", () => {
    it("should build a valid SanitizedContext and compute metadata accurately", () => {
      const context = buildSanitizedContextFromUnified(mockUnified);

      expect(context).toBeDefined();
      expect(context.sessionId).toBe("session_context_001");
      expect(context.pageMetadata.elementCount).toBe(3);
      expect(context.pageMetadata.sensitiveElementCount).toBe(1);
      expect(context.pageMetadata.interactiveElementCount).toBe(3);
      expect(context.pageMetadata.redactionRatio).toBe(0.333);
      expect(context.availableActions.length).toBeGreaterThan(0);
    });

    it("should ensure sensitive elements have no raw values in SanitizedContext", () => {
      const context = buildSanitizedContextFromUnified(mockUnified);
      const sensitiveEl = context.elements.find((el) => el.isSensitive);

      expect(sensitiveEl).toBeDefined();
      expect(sensitiveEl?.currentValue).toBeUndefined();
      expect(sensitiveEl?.semanticLabel).toMatch(/\[.*\]/); // e.g. [EMPLOYEE_NAME_FIELD]
    });
  });

  describe("buildAgentRequest", () => {
    it("should assemble a complete cloud-ready AgentRequest payload", async () => {
      const sanitizedElements: SanitizedElement[] = [
        {
          tagId: "TAG_001",
          semanticLabel: "[PERSON_NAME]",
          elementType: "input",
          elementRole: "input_text",
          isSensitive: true,
          isInteractive: true,
          isVisible: true,
        },
      ];

      const request = await buildAgentRequest(
        "session_req_001",
        "Fill form and submit claim",
        sanitizedElements,
        "http://localhost:3000",
        "Reimbursement Portal",
        0.95,
      );

      expect(request).toBeDefined();
      expect(request.task).toBe("Fill form and submit claim");
      expect(request.sanitizedContext.elements).toHaveLength(1);
      expect(request.sanitizedContext.pageMetadata.sensitiveElementCount).toBe(1);
    });
  });

  describe("contextCompressor", () => {
    it("should compress elements and prioritize interactive & sensitive elements", () => {
      const elements: SanitizedElement[] = Array.from({ length: 20 }, (_, i) => ({
        tagId: `TAG_${i}`,
        semanticLabel: i < 3 ? "[PERSON_NAME]" : `Label ${i}`,
        elementType: i < 5 ? "button" : "div",
        elementRole: i < 5 ? "button_submit" : "container",
        isSensitive: i < 3,
        isInteractive: i < 5,
        isVisible: true,
      }));

      const compressed = compressElements(elements, 6);
      expect(compressed).toHaveLength(6);

      // The top 3 sensitive + interactive buttons should all be retained
      expect(compressed.filter((el) => el.isSensitive)).toHaveLength(3);
    });

    it("should compress full AgentRequest payloads without modifying schema", async () => {
      const elements: SanitizedElement[] = Array.from({ length: 10 }, (_, i) => ({
        tagId: `TAG_${i}`,
        semanticLabel: `Field ${i}`,
        elementType: "input",
        elementRole: "input_text",
        isSensitive: i % 2 === 0,
        isInteractive: true,
        isVisible: true,
      }));

      const request = await buildAgentRequest(
        "session_comp",
        "Test task",
        elements,
        "http://localhost",
        "Test",
      );

      const compressed = await compressContext(request, 4);
      expect(compressed.sanitizedContext.elements).toHaveLength(4);
      expect(compressed.sanitizedContext.pageMetadata.elementCount).toBe(4);
    });
  });

  describe("contextValidator", () => {
    it("should validate a conforming AgentRequest successfully", async () => {
      const validElements: SanitizedElement[] = [
        {
          tagId: "TAG_001",
          semanticLabel: "[PERSON_NAME]",
          elementType: "input",
          elementRole: "input_text",
          isSensitive: true,
          isInteractive: true,
          isVisible: true,
        },
      ];

      const request = await buildAgentRequest(
        "session_valid",
        "Submit travel reimbursement",
        validElements,
        "http://localhost:3000",
        "Portal",
      );

      const result = validateAgentRequest(request);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation and catch security violations if forbidden raw PII keys exist", () => {
      const taintedContext = {
        sessionId: "session_tainted",
        pageMetadata: {
          pageUrl: "http://localhost",
          pageTitle: "Test",
          elementCount: 1,
          sensitiveElementCount: 1,
          interactiveElementCount: 1,
          redactionRatio: 1,
          perceptionConfidence: 0.9,
        },
        elements: [
          {
            tagId: "TAG_001",
            semanticLabel: "[PERSON_NAME]",
            elementType: "input",
            elementRole: "input_text",
            isSensitive: true,
            isInteractive: true,
            isVisible: true,
            rawValue: "Rahul Sharma (LEAKED!)", // FORBIDDEN KEY
          } as unknown as SanitizedElement,
        ],
        availableActions: [],
        builtAt: new Date().toISOString(),
        leakGuardPassed: false,
      };

      const result = validateSanitizedContext(taintedContext);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("SECURITY VIOLATION"))).toBe(true);
    });
  });
});
