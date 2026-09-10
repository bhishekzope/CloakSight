/**
 * CloakSight — Phase 11: Outbound Leak Guard Tests
 */

import { describe, it, expect } from "vitest";
import { checkForLeaks, quickRegexScan } from "../../src/privacy/leakGuard";
import type { AgentRequest } from "../../src/types/context";
import type { SensitiveEntity } from "../../src/types/privacy";

describe("Phase 11: Outbound Leak Guard", () => {
  const cleanRequest: AgentRequest = {
    sessionId: "session_clean_001",
    task: "Submit reimbursement claim",
    requestedAt: new Date().toISOString(),
    sanitizedContext: {
      sessionId: "session_clean_001",
      pageMetadata: {
        pageUrl: "http://localhost:3000",
        pageTitle: "Portal",
        elementCount: 2,
        sensitiveElementCount: 1,
        interactiveElementCount: 1,
        redactionRatio: 0.5,
        perceptionConfidence: 0.95,
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
        },
      ],
      availableActions: ["FILL_INPUT (TAG_001)"],
      builtAt: new Date().toISOString(),
      leakGuardPassed: false,
    },
  };

  describe("quickRegexScan", () => {
    it("should detect emails and Aadhaar numbers in strings", () => {
      expect(quickRegexScan("Contact user at rahul@example.com")).toBe(true);
      expect(quickRegexScan("Aadhaar: 2345 6789 0123")).toBe(true);
      expect(quickRegexScan("Clean string with [PERSON_NAME] and TAG_001")).toBe(false);
    });
  });

  describe("checkForLeaks", () => {
    it("should PASS a clean sanitized payload and set leakGuardPassed = true", async () => {
      const result = await checkForLeaks(cleanRequest, []);

      expect(result.passed).toBe(true);
      expect(result.shouldBlock).toBe(false);
      expect(result.detectedPIITypes).toHaveLength(0);
      expect(result.summary).toContain("CLEARED");
      expect(cleanRequest.sanitizedContext.leakGuardPassed).toBe(true);
    });

    it("should BLOCK transmission when a raw entity value is caught in the payload", async () => {
      const taintedRequest: AgentRequest = {
        ...cleanRequest,
        sanitizedContext: {
          ...cleanRequest.sanitizedContext,
          elements: [
            {
              tagId: "TAG_001",
              semanticLabel: "[PERSON_NAME]",
              elementType: "input",
              elementRole: "input_text",
              isSensitive: true,
              isInteractive: true,
              isVisible: true,
              currentValue: "Abhishek Zope", // LEAKED RAW NAME
            },
          ],
        },
      };

      const knownEntities: SensitiveEntity[] = [
        {
          entityId: "pii_001",
          piiType: "PERSON_NAME",
          rawValue: "Abhishek Zope",
          confidence: 0.92,
          detectionMethod: "heuristic",
          detectedAt: new Date().toISOString(),
        },
      ];

      const result = await checkForLeaks(taintedRequest, knownEntities);

      expect(result.passed).toBe(false);
      expect(result.shouldBlock).toBe(true);
      expect(result.detectedPIITypes).toContain("PERSON_NAME");
      expect(result.summary).toContain("BLOCKED");
      expect(taintedRequest.sanitizedContext.leakGuardPassed).toBe(false);
    });

    it("should BLOCK transmission when raw unredacted regex patterns appear in task or metadata", async () => {
      const leakedEmailRequest: AgentRequest = {
        ...cleanRequest,
        task: "Send email to rahul.sharma@corp.example.in urgently", // LEAKED EMAIL IN PROMPT
      };

      const result = await checkForLeaks(leakedEmailRequest, []);
      expect(result.passed).toBe(false);
      expect(result.shouldBlock).toBe(true);
      expect(result.detectedPIITypes).toContain("EMAIL");
    });

    it("should NOT falsely flag Unix timestamps or Date.now() session IDs as phone numbers", async () => {
      const timestampRequest: AgentRequest = {
        ...cleanRequest,
        sessionId: `session_${Date.now()}`,
        sanitizedContext: {
          ...cleanRequest.sanitizedContext,
          sessionId: `session_${Date.now()}`,
        },
      };

      const result = await checkForLeaks(timestampRequest, []);
      expect(result.passed).toBe(true);
      expect(result.detectedPIITypes).not.toContain("PHONE");
    });
  });
});

