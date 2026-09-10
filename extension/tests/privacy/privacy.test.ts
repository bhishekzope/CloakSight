// @vitest-environment jsdom
/**
 * CloakSight — Phase 3 & Phase 4 Privacy Tests
 * Covers Local PII Detection, Semantic Tagging, TagVault, and Redaction.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { detectPII, detectPIIInText, detectPIIInElement, resetEntityCounter } from "../../src/privacy/piiDetector";
import { isValidLuhn, isValidAadhaarStructure } from "../../src/privacy/piiPatterns";
import { createTag, createTags, resetTagCounter, formatSemanticLabel } from "../../src/privacy/semanticTagger";
import { storeTag, getOriginalValue, isTagActive, clearSession, getVaultStats } from "../../src/storage/tagVault";
import { redactElement, redactElements, redactText } from "../../src/privacy/redactor";
import { resolveTag, resolveTagValue } from "../../src/action/tagResolver";
import { parsePage } from "../../src/ingestion/domParser";
import { clearRegistry, registerElement } from "../../src/action/elementRegistry";
import type { SensitiveEntity } from "../../src/types/privacy";

describe("Phase 3: Local PII Detection", () => {
  beforeEach(() => {
    resetEntityCounter();
    resetTagCounter();
    document.body.innerHTML = "";
    clearRegistry();
    clearSession("test_session");
  });

  describe("piiPatterns & Validators", () => {
    it("should validate credit card numbers using the Luhn algorithm", () => {
      // Standard valid test card numbers (Luhn compliant)
      expect(isValidLuhn("49927398716")).toBe(true);
      expect(isValidLuhn("4532-0150-1234-5671")).toBe(true);

      // Invalid card numbers (fails Luhn)
      expect(isValidLuhn("49927398717")).toBe(false);
      expect(isValidLuhn("1234-5678-9012-3456")).toBe(false);
      expect(isValidLuhn("abc")).toBe(false);
    });

    it("should validate Indian Aadhaar structural constraints", () => {
      expect(isValidAadhaarStructure("2345 6789 0123")).toBe(true);
      expect(isValidAadhaarStructure("987654321098")).toBe(true);

      // Invalid: starts with 0 or 1
      expect(isValidAadhaarStructure("0123 4567 8901")).toBe(false);
      expect(isValidAadhaarStructure("1234 5678 9012")).toBe(false);

      // Invalid: trivial repeating digits
      expect(isValidAadhaarStructure("2222 2222 2222")).toBe(false);
    });
  });

  describe("detectPIIInText (Direct Pattern Scanning)", () => {
    it("should detect an Aadhaar number in plain text", () => {
      const text = "Employee submitted Aadhaar card: 2345 6789 0123 for verification.";
      const entities = detectPIIInText(text);

      expect(entities.length).toBe(1);
      expect(entities[0].piiType).toBe("AADHAAR");
      expect(entities[0].rawValue).toBe("2345 6789 0123");
      expect(entities[0].confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("should detect an Indian PAN number in plain text", () => {
      const text = "Tax deduction under PAN ABCDE1234F recorded.";
      const entities = detectPIIInText(text);

      expect(entities.length).toBe(1);
      expect(entities[0].piiType).toBe("PAN");
      expect(entities[0].rawValue).toBe("ABCDE1234F");
      expect(entities[0].confidence).toBeGreaterThanOrEqual(0.95);
    });

    it("should detect an email address in plain text", () => {
      const text = "Send confirmation to priya.sharma@enterprise.co.in immediately.";
      const entities = detectPIIInText(text);

      expect(entities.length).toBe(1);
      expect(entities[0].piiType).toBe("EMAIL");
      expect(entities[0].rawValue).toBe("priya.sharma@enterprise.co.in");
    });

    it("should detect an Indian mobile phone number", () => {
      const text1 = "Contact number: +91 9876543210 for queries.";
      const entities1 = detectPIIInText(text1);
      expect(entities1.some((e) => e.piiType === "PHONE")).toBe(true);

      const text2 = "Alternate: 8123456789";
      const entities2 = detectPIIInText(text2);
      expect(entities2.some((e) => e.piiType === "PHONE")).toBe(true);
    });

    it("should detect an Indian IFSC code", () => {
      const text = "Bank branch IFSC: SBIN0001234 confirmed.";
      const entities = detectPIIInText(text);

      expect(entities.length).toBe(1);
      expect(entities[0].piiType).toBe("IFSC_CODE");
      expect(entities[0].rawValue).toBe("SBIN0001234");
    });

    it("should detect an Employee ID", () => {
      const text = "Staff member EMP-48291 checked in.";
      const entities = detectPIIInText(text);

      expect(entities.length).toBe(1);
      expect(entities[0].piiType).toBe("EMPLOYEE_ID");
      expect(entities[0].rawValue).toBe("EMP-48291");
    });

    it("should not detect PII in safe, generic text", () => {
      const text = "Expense reimbursement for hotel stay in Mumbai on business trip.";
      const entities = detectPIIInText(text);

      expect(entities.length).toBe(0);
    });
  });

  describe("detectPIIInElement & Contextual Detection", () => {
    it("should detect Bank Account number from contextual form labels", async () => {
      document.body.innerHTML = `
        <label for="acc-no">Bank Account Number</label>
        <input id="acc-no" name="account_number" type="text" value="987654321098" />
      `;

      const snapshot = await parsePage("test_context_bank", document);
      const accElement = Object.values(snapshot.elements).find((e) => e.attributes.id === "acc-no")!;

      const entities = detectPIIInElement(accElement);
      expect(entities.some((e) => e.piiType === "BANK_ACCOUNT")).toBe(true);
      expect(entities.find((e) => e.piiType === "BANK_ACCOUNT")?.rawValue).toBe("987654321098");
    });

    it("should detect Person Name from input label context", async () => {
      document.body.innerHTML = `
        <label for="emp-name">Employee Full Name</label>
        <input id="emp-name" name="full_name" type="text" value="Vikram Malhotra" />
      `;

      const snapshot = await parsePage("test_context_name", document);
      const nameElement = Object.values(snapshot.elements).find((e) => e.attributes.id === "emp-name")!;

      const entities = detectPIIInElement(nameElement);
      expect(entities.some((e) => e.piiType === "PERSON_NAME")).toBe(true);
      expect(entities.find((e) => e.piiType === "PERSON_NAME")?.rawValue).toBe("Vikram Malhotra");
    });

    it("should detect Date of Birth from field context", async () => {
      document.body.innerHTML = `
        <label for="dob">Date of Birth</label>
        <input id="dob" name="birth_date" type="text" value="1992-05-18" />
      `;

      const snapshot = await parsePage("test_context_dob", document);
      const dobElement = Object.values(snapshot.elements).find((e) => e.attributes.id === "dob")!;

      const entities = detectPIIInElement(dobElement);
      expect(entities.some((e) => e.piiType === "DATE_OF_BIRTH")).toBe(true);
    });

    it("should detect passwords as unknown sensitive credentials", async () => {
      document.body.innerHTML = `
        <input id="pwd" type="password" value="SuperSecret123!" />
      `;

      const snapshot = await parsePage("test_context_pwd", document);
      const pwdElement = Object.values(snapshot.elements).find((e) => e.attributes.id === "pwd")!;

      const entities = detectPIIInElement(pwdElement);
      expect(entities.some((e) => e.piiType === "UNKNOWN_SENSITIVE")).toBe(true);
    });
  });

  describe("detectPII (End-to-End Page Snapshot Scan)", () => {
    it("should scan the complete reimbursement portal form and find all PII entities", async () => {
      document.body.innerHTML = `
        <form id="reimbursement-form">
          <label for="name">Employee Name</label>
          <input id="name" type="text" value="Rahul Sharma" />

          <label for="email">Work Email</label>
          <input id="email" type="email" value="rahul.sharma@acme.com" />

          <label for="phone">Phone Number</label>
          <input id="phone" type="tel" value="9876543210" />

          <label for="aadhaar">Aadhaar Number</label>
          <input id="aadhaar" type="text" value="2345 6789 0123" />

          <label for="pan">PAN Card</label>
          <input id="pan" type="text" value="ABCDE1234F" />

          <label for="bank">Bank Account</label>
          <input id="bank" type="text" value="123456789012" />

          <label for="ifsc">IFSC Code</label>
          <input id="ifsc" type="text" value="HDFC0001234" />
        </form>
      `;

      const snapshot = await parsePage("portal_test_session", document);
      const detectedEntities = await detectPII(snapshot);

      expect(detectedEntities.length).toBeGreaterThanOrEqual(7);

      const types = detectedEntities.map((e) => e.piiType);
      expect(types).toContain("PERSON_NAME");
      expect(types).toContain("EMAIL");
      expect(types).toContain("PHONE");
      expect(types).toContain("AADHAAR");
      expect(types).toContain("PAN");
      expect(types).toContain("BANK_ACCOUNT");
      expect(types).toContain("IFSC_CODE");

      for (const entity of detectedEntities) {
        expect(entity.sourceElementId).toBeDefined();
        expect(entity.confidence).toBeGreaterThanOrEqual(0.85);
      }
    });
  });
});

describe("Phase 4: Semantic Redaction and Tagging", () => {
  const testSessionId = "session_phase4_test";

  beforeEach(() => {
    resetEntityCounter();
    resetTagCounter();
    clearSession(testSessionId);
    clearRegistry();
    document.body.innerHTML = "";
  });

  describe("semanticTagger & tagVault", () => {
    it("should generate a sequential, cloud-safe SemanticTag for a PII entity", () => {
      const entity: SensitiveEntity = {
        entityId: "pii_0001",
        piiType: "PERSON_NAME",
        rawValue: "Rahul Sharma",
        confidence: 0.95,
        detectionMethod: "heuristic",
        sourceElementId: "el_0001",
        detectedAt: new Date().toISOString(),
      };

      const tag = createTag(entity, testSessionId);

      expect(tag.tagId).toBe("TAG_001");
      expect(tag.semanticLabel).toBe("[PERSON_NAME]");
      expect(tag.piiType).toBe("PERSON_NAME");
      expect(tag.associatedElementId).toBe("el_0001");
      expect(tag.state).toBe("active");

      // Verify that the returned SemanticTag contains NO originalValue (Rule 1 & Rule 2)
      expect((tag as unknown as { originalValue?: string }).originalValue).toBeUndefined();

      // Verify that the raw value was safely stored in the local RAM vault
      const rawInVault = getOriginalValue(testSessionId, "TAG_001");
      expect(rawInVault).toBe("Rahul Sharma");
    });

    it("should batch generate unique tags for multiple entities", () => {
      const entities: SensitiveEntity[] = [
        {
          entityId: "pii_0001",
          piiType: "EMAIL",
          rawValue: "rahul@acme.com",
          confidence: 0.98,
          detectionMethod: "regex_pattern",
          sourceElementId: "el_0001",
          detectedAt: new Date().toISOString(),
        },
        {
          entityId: "pii_0002",
          piiType: "AADHAAR",
          rawValue: "2345 6789 0123",
          confidence: 0.95,
          detectionMethod: "regex_pattern",
          sourceElementId: "el_0002",
          detectedAt: new Date().toISOString(),
        },
      ];

      const tags = createTags(entities, testSessionId);

      expect(tags.length).toBe(2);
      expect(tags[0].tagId).toBe("TAG_001");
      expect(tags[0].semanticLabel).toBe("[EMAIL]");
      expect(tags[1].tagId).toBe("TAG_002");
      expect(tags[1].semanticLabel).toBe("[AADHAAR]");

      expect(getOriginalValue(testSessionId, "TAG_001")).toBe("rahul@acme.com");
      expect(getOriginalValue(testSessionId, "TAG_002")).toBe("2345 6789 0123");
    });

    it("should handle tag expiration and session clearance in vault", () => {
      const entity: SensitiveEntity = {
        entityId: "pii_0001",
        piiType: "PAN",
        rawValue: "ABCDE1234F",
        confidence: 0.98,
        detectionMethod: "regex_pattern",
        detectedAt: new Date().toISOString(),
      };

      // Create tag with 1ms TTL (immediate expiration)
      const tag = createTag(entity, testSessionId, 1);
      expect(tag.tagId).toBe("TAG_001");

      // Clear session
      clearSession(testSessionId);
      expect(getOriginalValue(testSessionId, "TAG_001")).toBeUndefined();
      expect(isTagActive(testSessionId, "TAG_001")).toBe(false);
    });
  });

  describe("redactor (SanitizedElement Generation)", () => {
    it("should sanitize DOM elements by completely stripping raw PII and assigning Tag IDs", async () => {
      document.body.innerHTML = `
        <form id="reimb-form">
          <label for="name">Employee Name</label>
          <input id="name" type="text" value="Alice Smith" />

          <label for="category">Expense Category</label>
          <select id="category">
            <option value="travel" selected>Hotel Stay</option>
          </select>

          <button id="submit-btn" type="submit">Submit Claim</button>
        </form>
      `;

      const snapshot = await parsePage(testSessionId, document);
      const entities = await detectPII(snapshot);
      const tags = createTags(entities, testSessionId);

      const sanitizedElements = redactElements(Object.values(snapshot.elements), entities, tags);
      expect(sanitizedElements.length).toBe(snapshot.elementCount);

      // Sensitive field: Name input
      const sanitizedName = sanitizedElements.find((e) => e.semanticLabel === "[PERSON_NAME]");
      expect(sanitizedName).toBeDefined();
      expect(sanitizedName?.isSensitive).toBe(true);
      expect(sanitizedName?.currentValue).toBeUndefined(); // RAW VALUE COMPLETELY STRIPPED
      expect(sanitizedName?.tagId).toBe("TAG_001");

      // Non-sensitive field: Category select
      const sanitizedCategory = sanitizedElements.find((e) => e.elementRole === "select");
      expect(sanitizedCategory).toBeDefined();
      expect(sanitizedCategory?.isSensitive).toBe(false);
      expect(sanitizedCategory?.currentValue).toBe("travel"); // Safe benign value preserved

      // Non-sensitive field: Submit button
      const sanitizedButton = sanitizedElements.find((e) => e.elementRole === "button_submit");
      expect(sanitizedButton).toBeDefined();
      expect(sanitizedButton?.isSensitive).toBe(false);
      expect(sanitizedButton?.semanticLabel).toBe("Submit Claim");
    });

    it("should redact raw PII occurrences inside free text", () => {
      const rawParagraph = "Employee Alice Smith with email alice@acme.com submitted claim for Aadhaar 2345 6789 0123.";
      const entities: SensitiveEntity[] = [
        {
          entityId: "pii_1",
          piiType: "PERSON_NAME",
          rawValue: "Alice Smith",
          confidence: 0.9,
          detectionMethod: "heuristic",
          detectedAt: new Date().toISOString(),
        },
        {
          entityId: "pii_2",
          piiType: "EMAIL",
          rawValue: "alice@acme.com",
          confidence: 0.98,
          detectionMethod: "regex_pattern",
          detectedAt: new Date().toISOString(),
        },
        {
          entityId: "pii_3",
          piiType: "AADHAAR",
          rawValue: "2345 6789 0123",
          confidence: 0.95,
          detectionMethod: "regex_pattern",
          detectedAt: new Date().toISOString(),
        },
      ];

      const tags = createTags(entities, testSessionId);
      const redactedText = redactText(rawParagraph, entities, tags);

      expect(redactedText).toContain("[PERSON_NAME]");
      expect(redactedText).toContain("[EMAIL]");
      expect(redactedText).toContain("[AADHAAR]");
      expect(redactedText).not.toContain("Alice Smith");
      expect(redactedText).not.toContain("alice@acme.com");
      expect(redactedText).not.toContain("2345 6789 0123");
    });
  });

  describe("tagResolver (Local Re-hydration Hook)", () => {
    it("should resolve a Tag ID to both the live DOM element and the raw vault value", async () => {
      const input = document.createElement("input");
      input.id = "live-input";
      input.value = "Rahul Sharma";
      document.body.appendChild(input);

      // Register live element in ElementRegistry (Phase 2)
      registerElement("TAG_001", input, "input_text");

      // Register raw value in TagVault (Phase 4)
      const tag = createTag(
        {
          entityId: "pii_0001",
          piiType: "PERSON_NAME",
          rawValue: "Rahul Sharma",
          confidence: 0.95,
          detectionMethod: "heuristic",
          sourceElementId: "live-input",
          detectedAt: new Date().toISOString(),
        },
        testSessionId,
      );

      // Resolve live DOM element
      const resolvedDOM = resolveTag(tag.tagId);
      expect(resolvedDOM).not.toBeNull();
      expect(resolvedDOM?.element).toBe(input);
      expect(resolvedDOM?.isValid).toBe(true);

      // Resolve raw original value for local re-injection (Phase 14)
      const resolvedValue = resolveTagValue(testSessionId, tag.tagId);
      expect(resolvedValue).toBe("Rahul Sharma");
    });
  });
});

// Stubs for future phases
describe("leakGuard (Phase 11)", () => {
  it.todo("should block context containing raw Aadhaar number");
  it.todo("should block context containing raw email");
  it.todo("should pass clean sanitized context");
});
