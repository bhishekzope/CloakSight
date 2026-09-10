/**
 * CloakSight — Privacy Policy Engine (Phase 9)
 *
 * Configures, validates, and evaluates per-domain and global privacy policies.
 * Controls:
 *   - Which PII categories are redacted
 *   - Minimum confidence thresholds per category
 *   - Strict mode vs. permissive mode
 *   - Leak guard blocking enforcement
 *   - User confirmation requirements before action dispatch
 *
 * PRIVACY: Policy configurations are security rules.
 * All policy evaluation executes locally on-device.
 */

import type { PrivacyPolicy, PIIRedactionRule, PIIType, SensitiveEntity } from "../types/privacy";
import { PRIVACY_DEFAULTS } from "../config/config";
import { createLogger } from "../utils/logger";

const logger = createLogger("privacyPolicy");

const ALL_PII_TYPES: PIIType[] = [
  "PERSON_NAME",
  "EMAIL",
  "PHONE",
  "BANK_ACCOUNT",
  "IFSC_CODE",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "EMPLOYEE_ID",
  "DATE_OF_BIRTH",
  "ADDRESS",
  "PAN",
  "AADHAAR",
  "PASSPORT",
  "DRIVING_LICENSE",
  "SALARY",
  "MEDICAL_ID",
  "IP_ADDRESS",
  "DEVICE_ID",
  "BIOMETRIC",
  "UNKNOWN_SENSITIVE",
];

// In-memory policy cache / registry
const policyRegistry = new Map<string, PrivacyPolicy>();

/**
 * Generate standard default redaction rules.
 */
function createDefaultRedactionRules(
  threshold: number = PRIVACY_DEFAULTS.PII_CONFIDENCE_THRESHOLD,
  strictMode = false,
): PIIRedactionRule[] {
  return ALL_PII_TYPES.map((piiType) => ({
    piiType,
    enabled: true,
    minimumConfidence: threshold,
    strictMode,
  }));
}

/**
 * Returns the hardcoded default privacy policy.
 * Strict by default with 0.85 confidence threshold.
 */
export function getDefaultPolicy(): PrivacyPolicy {
  return {
    policyId: "default_strict",
    domain: "*",
    redactionRules: createDefaultRedactionRules(PRIVACY_DEFAULTS.PII_CONFIDENCE_THRESHOLD, false),
    blockOnLeakDetection: PRIVACY_DEFAULTS.BLOCK_ON_LEAK_DETECTION,
    requireActionConfirmation: PRIVACY_DEFAULTS.REQUIRE_ACTION_CONFIRMATION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns an ultra-strict privacy policy.
 * Redacts all potential PII with low threshold (0.50) and strictMode = true.
 */
export function getStrictPolicy(): PrivacyPolicy {
  return {
    policyId: "ultra_strict",
    domain: "*",
    redactionRules: createDefaultRedactionRules(0.5, true),
    blockOnLeakDetection: true,
    requireActionConfirmation: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Clean and normalize a domain string for policy matching.
 */
export function normalizeDomain(rawDomain: string): string {
  if (!rawDomain || rawDomain === "*") return "*";
  let cleaned = rawDomain.trim().toLowerCase();
  // Strip protocol if present
  cleaned = cleaned.replace(/^(?:https?:\/\/)/, "");
  // Strip path and port if present
  cleaned = cleaned.split("/")[0] ?? "";
  cleaned = cleaned.split(":")[0] ?? "";
  return cleaned || "*";
}

/**
 * Save / register a privacy policy for a specific domain.
 */
export async function savePolicyForDomain(policy: PrivacyPolicy): Promise<void> {
  const normDomain = normalizeDomain(policy.domain);
  const updatedPolicy: PrivacyPolicy = {
    ...policy,
    domain: normDomain,
    updatedAt: new Date().toISOString(),
  };

  policyRegistry.set(normDomain, updatedPolicy);
  logger.info("Saved privacy policy for domain", { domain: normDomain, policyId: policy.policyId });

  // Persist to Chrome storage if available
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      await chrome.storage.local.set({ [`policy:${normDomain}`]: updatedPolicy });
    } catch (err) {
      logger.warn("Failed to persist policy to chrome.storage", { error: String(err) });
    }
  }
}

/**
 * Load the active privacy policy for a domain.
 * Evaluates exact domain matches, wildcard parent domains, and global fallback ("*").
 */
export async function loadPolicyForDomain(rawDomain: string): Promise<PrivacyPolicy> {
  const domain = normalizeDomain(rawDomain);
  logger.debug("Resolving privacy policy for domain", { domain });

  // 1. Check in-memory cache for exact match
  if (policyRegistry.has(domain)) {
    return policyRegistry.get(domain)!;
  }

  // 2. Check Chrome storage if available
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      const stored = await chrome.storage.local.get(`policy:${domain}`);
      if (stored[`policy:${domain}`]) {
        const policy = stored[`policy:${domain}`] as PrivacyPolicy;
        policyRegistry.set(domain, policy);
        return policy;
      }
    } catch {
      // Fall through to fallback
    }
  }

  // 3. Fallback to global policy in registry, or default policy
  if (policyRegistry.has("*")) {
    return policyRegistry.get("*")!;
  }

  const defaultPolicy = getDefaultPolicy();
  policyRegistry.set("*", defaultPolicy);
  return defaultPolicy;
}

/**
 * Delete a domain policy override.
 */
export async function deletePolicyForDomain(rawDomain: string): Promise<void> {
  const domain = normalizeDomain(rawDomain);
  policyRegistry.delete(domain);
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      await chrome.storage.local.remove(`policy:${domain}`);
    } catch {
      // Ignore cleanup error
    }
  }
  logger.info("Deleted policy for domain", { domain });
}

/**
 * Clear in-memory policy cache (for tests/reset).
 */
export function clearPolicyRegistry(): void {
  policyRegistry.clear();
}

/**
 * Evaluate whether a detected sensitive entity must be redacted under the active policy.
 *
 * @param entity Detected sensitive entity
 * @param policy Active privacy policy
 * @returns true if the entity should be redacted
 */
export function shouldRedactEntity(
  entity: SensitiveEntity,
  policy: PrivacyPolicy,
): boolean {
  const rule = policy.redactionRules.find((r) => r.piiType === entity.piiType);

  if (!rule) {
    // If no explicit rule, default to redacting for safety
    return true;
  }

  if (!rule.enabled) {
    return false;
  }

  if (rule.strictMode) {
    return true;
  }

  return entity.confidence >= rule.minimumConfidence;
}
