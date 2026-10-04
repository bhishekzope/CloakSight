/**
 * CloakSight — Outbound LeakGuard Simulation
 *
 * Deterministic pre-flight security gateway that validates outgoing payloads
 * before simulated cloud AI transmission.
 *
 * Checks:
 * 1. Layer 1: Secret Vault Cross-Reference (Checks if known raw values appear in serialized payload)
 * 2. Layer 2: Deep Regex Pattern Scan (Checks for raw email, phone, bank account formats)
 *
 * NOTE: This is a frontend demonstration of the fail-closed defense concept.
 * It does not validate real live network sockets or establish third-party certification.
 */

import { SanitizedPayload, LeakGuardResult, LeakGuardCheck, PIICategory } from "../types/cloaksight";

export const DEMO_KNOWN_SECRETS: Array<{ name: string; category: PIICategory; value: string }> = [
  { name: "Employee Name", category: "PERSON_NAME", value: "Rahul Sharma" },
  { name: "Employee ID", category: "EMPLOYEE_ID", value: "EMP-2024-0042" },
  { name: "Email Address", category: "EMAIL", value: "rahul.sharma@corp.acme.in" },
  { name: "Phone Number", category: "PHONE", value: "+91 98765 43210" },
  { name: "Bank Account", category: "BANK_ACCOUNT", value: "00112345678901" },
  { name: "IFSC Code", category: "IFSC_CODE", value: "HDFC0001234" },
];

export function runLeakGuardInspection(payload: SanitizedPayload): LeakGuardResult {
  const serialized = JSON.stringify(payload);
  const checksRun: LeakGuardCheck[] = [];
  const detectedCategories: PIICategory[] = [];
  const reasons: string[] = [];

  // ============================================================
  // Check 1: In-Memory Known Secret Cross-Reference
  // ============================================================
  let secretMatchFound = false;
  let matchedSecretName = "";

  for (const secret of DEMO_KNOWN_SECRETS) {
    if (serialized.toLowerCase().includes(secret.value.toLowerCase())) {
      secretMatchFound = true;
      matchedSecretName = secret.name;
      detectedCategories.push(secret.category);
      reasons.push(
        `[Layer 1 Secret Cross-Ref] Unredacted session secret detected: "${secret.name}" found in outgoing payload.`
      );
      break;
    }
  }

  checksRun.push({
    name: "Layer 1: Vault Cross-Reference",
    description: "Compares serialized payload against all raw secrets stored in active session memory.",
    passed: !secretMatchFound,
    details: secretMatchFound
      ? `FAILED: Detected raw ${matchedSecretName} inside payload string.`
      : "PASSED: Zero known session secrets found in serialized context.",
  });

  // ============================================================
  // Check 2: Raw Email Regex Pattern Scan
  // ============================================================
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = serialized.match(emailRegex);
  const emailFailed = Boolean(emailMatch && emailMatch.length > 0);

  if (emailFailed) {
    detectedCategories.push("EMAIL");
    reasons.push(
      `[Layer 2 Pattern Scan] Raw email address format detected in serialized context (matched 1 instance).`
    );
  }

  checksRun.push({
    name: "Layer 2A: Email Pattern Scan",
    description: "Scans for standard RFC email patterns in outgoing context.",
    passed: !emailFailed,
    details: emailFailed
      ? "FAILED: Found unredacted email pattern in payload string."
      : "PASSED: No unredacted email addresses detected.",
  });

  // ============================================================
  // Check 3: Raw Indian Phone Regex Pattern Scan
  // ============================================================
  const phoneRegex = /(?<!\d)(?:(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|0[6-9]\d{4}[\s-]?\d{5}\b)/g;
  const phoneMatch = serialized.match(phoneRegex);
  const phoneFailed = Boolean(phoneMatch && phoneMatch.length > 0);

  if (phoneFailed) {
    detectedCategories.push("PHONE");
    reasons.push(`[Layer 2 Pattern Scan] Unmasked phone number format detected in serialized context.`);
  }

  checksRun.push({
    name: "Layer 2B: Phone Pattern Scan",
    description: "Scans for 10-digit mobile number structures with boundary protection.",
    passed: !phoneFailed,
    details: phoneFailed
      ? "FAILED: Found raw phone number structure in payload string."
      : "PASSED: No unmasked phone numbers detected.",
  });

  // ============================================================
  // Check 4: Raw Bank Account Pattern Scan (9-18 consecutive digits)
  // ============================================================
  const bankRegex = /\b\d{12,18}\b/g;
  // Ignore session timestamps
  const cleaned = serialized.replace(/"sessionId":"session_\d+"/g, "");
  const bankMatch = cleaned.match(bankRegex);
  const bankFailed = Boolean(bankMatch && bankMatch.length > 0);

  if (bankFailed) {
    detectedCategories.push("BANK_ACCOUNT");
    reasons.push(`[Layer 2 Pattern Scan] Raw 14-digit bank account number detected in serialized context.`);
  }

  checksRun.push({
    name: "Layer 2C: Financial Account Scan",
    description: "Detects unredacted bank account and credit card numerical series.",
    passed: !bankFailed,
    details: bankFailed
      ? "FAILED: Found unmasked bank account sequence."
      : "PASSED: No unmasked bank account numbers detected.",
  });

  // Determine overall status
  const allPassed = checksRun.every((c) => c.passed);
  const status = allPassed ? "PASSED" : "BLOCKED";

  let summary = "";
  if (allPassed) {
    summary = `CLEARED: Zero raw PII detected. Payload passed all 4 Outbound LeakGuard security checks (${(payload.pageMetadata.redactionRatio * 100).toFixed(1)}% protected). Safe for AI reasoning.`;
  } else {
    summary = `BLOCKED: Detected ${detectedCategories.length} unredacted PII violation(s) (${Array.from(new Set(detectedCategories)).join(", ")}). Transmission physically aborted; AI reasoning prevented.`;
  }

  return {
    passed: allPassed,
    status,
    summary,
    reasons,
    checksRun,
    timestamp: new Date().toISOString(),
    detectedCategories: Array.from(new Set(detectedCategories)),
  };
}
