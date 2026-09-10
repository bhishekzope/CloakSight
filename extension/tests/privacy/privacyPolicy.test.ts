/**
 * CloakSight — Phase 9: Privacy Policy Engine Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getDefaultPolicy,
  getStrictPolicy,
  normalizeDomain,
  savePolicyForDomain,
  loadPolicyForDomain,
  deletePolicyForDomain,
  clearPolicyRegistry,
  shouldRedactEntity,
} from "../../src/privacy/privacyPolicy";
import type { SensitiveEntity, PrivacyPolicy } from "../../src/types/privacy";

describe("Phase 9: Privacy Policy Engine", () => {
  beforeEach(() => {
    clearPolicyRegistry();
  });

  describe("normalizeDomain", () => {
    it("should normalize URLs with protocols and ports into domain keys", () => {
      expect(normalizeDomain("http://localhost:3000/portal")).toBe("localhost");
      expect(normalizeDomain("https://app.corp.example.in:8080/path")).toBe("app.corp.example.in");
      expect(normalizeDomain("*")).toBe("*");
      expect(normalizeDomain("")).toBe("*");
    });
  });

  describe("Policy Resolution & Storage", () => {
    it("should return default strict policy when no domain policy is registered", async () => {
      const policy = await loadPolicyForDomain("example.com");
      expect(policy).toBeDefined();
      expect(policy.blockOnLeakDetection).toBe(true);
      expect(policy.redactionRules.length).toBeGreaterThan(10);
    });

    it("should save and load domain-specific policy overrides", async () => {
      const customPolicy: PrivacyPolicy = {
        policyId: "custom_localhost",
        domain: "http://localhost:3000",
        redactionRules: [
          {
            piiType: "EMAIL",
            enabled: false, // Don't redact email for this specific domain
            minimumConfidence: 0.9,
            strictMode: false,
          },
          {
            piiType: "AADHAAR",
            enabled: true,
            minimumConfidence: 0.8,
            strictMode: true,
          },
        ],
        blockOnLeakDetection: false,
        requireActionConfirmation: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await savePolicyForDomain(customPolicy);
      const loaded = await loadPolicyForDomain("localhost:3000");

      expect(loaded.policyId).toBe("custom_localhost");
      expect(loaded.domain).toBe("localhost");

      const emailRule = loaded.redactionRules.find((r) => r.piiType === "EMAIL");
      expect(emailRule?.enabled).toBe(false);

      // Cleanup
      await deletePolicyForDomain("localhost");
      const fallback = await loadPolicyForDomain("localhost");
      expect(fallback.policyId).toBe("default_strict");
    });
  });

  describe("shouldRedactEntity Evaluation", () => {
    const mockEmailEntity: SensitiveEntity = {
      entityId: "pii_001",
      piiType: "EMAIL",
      rawValue: "test@example.com",
      confidence: 0.88,
      detectionMethod: "regex_pattern",
      detectedAt: new Date().toISOString(),
    };

    it("should approve redaction when confidence exceeds minimum threshold", () => {
      const policy = getDefaultPolicy(); // threshold = 0.85
      expect(shouldRedactEntity(mockEmailEntity, policy)).toBe(true);
    });

    it("should reject redaction when entity confidence is below minimum threshold", () => {
      const lowConfidenceEntity: SensitiveEntity = {
        ...mockEmailEntity,
        confidence: 0.70,
      };
      const policy = getDefaultPolicy(); // threshold = 0.85
      expect(shouldRedactEntity(lowConfidenceEntity, policy)).toBe(false);
    });

    it("should force redaction in strict mode regardless of threshold", () => {
      const lowConfidenceEntity: SensitiveEntity = {
        ...mockEmailEntity,
        confidence: 0.60,
      };
      const strictPolicy = getStrictPolicy();
      expect(shouldRedactEntity(lowConfidenceEntity, strictPolicy)).toBe(true);
    });

    it("should bypass redaction if rule is disabled for that PII category", () => {
      const disabledRulePolicy: PrivacyPolicy = {
        ...getDefaultPolicy(),
        redactionRules: [
          {
            piiType: "EMAIL",
            enabled: false,
            minimumConfidence: 0.5,
            strictMode: false,
          },
        ],
      };
      expect(shouldRedactEntity(mockEmailEntity, disabledRulePolicy)).toBe(false);
    });
  });
});
