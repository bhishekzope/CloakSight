/**
 * CloakSight — Privacy Types
 *
 * Types for the privacy/sanitization layer.
 *
 * PRIVACY ARCHITECTURE:
 *   - `SensitiveEntity` → LOCAL ONLY. Contains detected raw PII.
 *   - `SemanticTag` → LOCAL ONLY (the `originalValue` field).
 *   - `SanitizedElement` → SAFE for cloud. Contains only tags, not real values.
 *   - `LeakCheckResult` → LOCAL ONLY. Contains PII references.
 */

import type { UniqueId, Timestamp } from "./common";

// ============================================================
// PII Types
// ============================================================

/**
 * Enumeration of personally identifiable information types.
 * Includes India-specific PII types relevant to SIH 2026.
 */
export type PIIType =
  | "PERSON_NAME"
  | "EMAIL"
  | "PHONE"
  | "BANK_ACCOUNT"
  | "IFSC_CODE"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "EMPLOYEE_ID"
  | "DATE_OF_BIRTH"
  | "ADDRESS"
  | "PAN"           // Permanent Account Number (India)
  | "AADHAAR"       // Aadhaar UID (India)
  | "PASSPORT"
  | "DRIVING_LICENSE"
  | "SALARY"
  | "AMOUNT"        // Financial amount (context-dependent)
  | "MEDICAL_ID"
  | "IP_ADDRESS"
  | "DEVICE_ID"
  | "BIOMETRIC"
  | "UNKNOWN_SENSITIVE";

/** Confidence level for a PII detection */
export type DetectionConfidence = number; // 0.0 to 1.0

/** Method used to detect the PII */
export type DetectionMethod =
  | "regex_pattern"
  | "ner_model"
  | "visual_detection"
  | "heuristic"
  | "combined";

// ============================================================
// Sensitive Entity (LOCAL ONLY)
// ============================================================

/**
 * A detected sensitive entity in the page.
 *
 * PRIVACY: This type contains raw PII. It must NEVER be serialized
 * into any outbound message, AgentRequest, or cloud payload.
 * It belongs exclusively in the LOCAL TRUSTED ZONE.
 */
export interface SensitiveEntity {
  /** Unique ID for this detected entity */
  entityId: UniqueId;

  /** Type of PII detected */
  piiType: PIIType;

  /** The raw detected value (LOCAL ONLY — real PII) */
  rawValue: string;

  /** Detection confidence */
  confidence: DetectionConfidence;

  /** Method used for detection */
  detectionMethod: DetectionMethod;

  /** Position of entity in source text (character offsets) */
  sourceOffset?: { start: number; end: number } | undefined;

  /** ID of the DOM element this entity was found in */
  sourceElementId?: UniqueId | undefined;

  /** ID of the visual region this entity was found in (OCR path) */
  sourceRegionId?: UniqueId | undefined;

  /** When this entity was detected */
  detectedAt: Timestamp;
}

// ============================================================
// Semantic Tag (tag-id and label are cloud-safe; originalValue is LOCAL ONLY)
// ============================================================

/** Tag lifecycle state */
export type TagLifecycleState = "active" | "expired" | "invalidated";

/**
 * A semantic tag that represents a sensitive entity.
 *
 * PRIVACY SPLIT:
 *   - `tagId` and `semanticLabel` → SAFE for cloud transmission.
 *   - `originalValue` → LOCAL ONLY. Must never be transmitted.
 *
 * The `originalValue` is stored separately in `storage/tagVault.ts`.
 * This struct should NOT hold `originalValue` when crossing module
 * boundaries outside of `privacy/` and `storage/`.
 */
export interface SemanticTag {
  /** Opaque tag identifier (e.g., "TAG_001") */
  tagId: UniqueId;

  /** Human-readable semantic label (e.g., "[PERSON_NAME]") */
  semanticLabel: string;

  /** The PII type this tag represents */
  piiType: PIIType;

  /** ID of the associated DOM element */
  associatedElementId?: UniqueId | undefined;

  /** Current lifecycle state */
  state: TagLifecycleState;

  /** When this tag was created */
  createdAt: Timestamp;

  /** When this tag expires */
  expiresAt: Timestamp;
}

/**
 * A semantic tag entry as stored in the local vault.
 * This type MUST NOT leave the `storage/` module.
 */
export interface TagVaultEntry extends SemanticTag {
  /** The real original value (LOCAL ONLY — must not be transmitted) */
  originalValue: string;
}

// ============================================================
// Privacy Policy
// ============================================================

/** Configuration for redacting a specific PII type */
export interface PIIRedactionRule {
  piiType: PIIType;
  enabled: boolean;
  minimumConfidence: DetectionConfidence;
  /** Whether to redact even if confidence is below threshold (strict mode) */
  strictMode: boolean;
}

/** Privacy policy for a domain or globally */
export interface PrivacyPolicy {
  policyId: UniqueId;
  /** Domain this policy applies to. "*" for global. */
  domain: string;
  redactionRules: PIIRedactionRule[];
  /** Block all transmission if any unredacted PII detected */
  blockOnLeakDetection: boolean;
  /** Whether to show a confirmation dialog before executing actions */
  requireActionConfirmation: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// Sanitized Elements (SAFE for cloud)
// ============================================================

/**
 * A sanitized representation of a DOM element.
 * Contains no raw PII — only semantic tags and structural info.
 * SAFE for inclusion in AgentRequest.
 */
export interface SanitizedElement {
  /** The semantic tag ID (references real element in local registry) */
  tagId: UniqueId;

  /** Human-readable semantic label */
  semanticLabel: string;

  /** Element type (input, select, button, etc.) */
  elementType: string;

  /** Semantic role of the element */
  elementRole: string;

  /** Whether this element contains sensitive data */
  isSensitive: boolean;

  /** For non-sensitive fields: the current (safe) value */
  currentValue?: string | undefined;

  /** Position information for layout reasoning */
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | undefined;

  /** Whether the element is interactable */
  isInteractive: boolean;

  /** Whether the element is currently visible */
  isVisible: boolean;
}

// ============================================================
// Leak Check Result (LOCAL ONLY)
// ============================================================

/**
 * Result of the outbound leak guard scan.
 *
 * PRIVACY: This type may reference PII entity IDs.
 * Keep local; do not transmit.
 */
export interface LeakCheckResult {
  /** Whether the payload passed the leak check */
  passed: boolean;

  /** Whether transmission should be blocked */
  shouldBlock: boolean;

  /** Entity IDs of any detected unredacted PII */
  detectedEntityIds: UniqueId[];

  /** Types of PII detected (for reporting, no raw values) */
  detectedPIITypes: PIIType[];

  /** Proportion of total content that was redacted (0.0–1.0) */
  redactionRatio: number;

  /** Overall confidence in the leak check result */
  confidence: DetectionConfidence;

  /** Human-readable summary of the check */
  summary: string;

  /** When the check was performed */
  checkedAt: Timestamp;
}
