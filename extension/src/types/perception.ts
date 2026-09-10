/**
 * CloakSight — Perception Types
 *
 * Types representing the output of the on-device perception pipeline.
 *
 * PRIVACY NOTE: PerceptionResult may contain raw extracted text from OCR
 * and detected visual regions. These must remain local until sanitized.
 */

import type { BoundingRect, UniqueId, Timestamp } from "./common";

// ============================================================
// Visual Regions
// ============================================================

/** Category of a visually detected sensitive region */
export type VisualRegionCategory =
  | "receipt"
  | "invoice"
  | "id_card"
  | "passport"
  | "bank_statement"
  | "cheque"
  | "medical_document"
  | "form_with_pii"
  | "face"
  | "signature"
  | "qr_code"
  | "barcode"
  | "unknown_sensitive";

/**
 * A visually detected region of interest in the screenshot.
 *
 * PRIVACY: `ocrText` may contain raw PII. Keep local until redacted.
 */
export interface VisualRegion {
  /** Unique ID for this region */
  regionId: UniqueId;

  /** Category of the detected region */
  category: VisualRegionCategory;

  /** Bounding rectangle in screenshot pixel coordinates */
  boundingRect: BoundingRect;

  /** Detection confidence (0.0–1.0) */
  confidence: number;

  /** Raw OCR text extracted from this region (LOCAL ONLY — may contain PII) */
  ocrText?: string | undefined;

  /** Whether this region has been visually masked for outbound context */
  isMasked: boolean;

  /** Associated DOM element ID, if the region overlaps with a known element */
  associatedElementId?: UniqueId | undefined;
}

// ============================================================
// Element Classification
// ============================================================

/** Classification label for an element's semantic meaning in the UI context */
export type ElementClassificationLabel =
  | "employee_name_field"
  | "employee_id_field"
  | "email_field"
  | "phone_field"
  | "bank_account_field"
  | "credit_card_field"
  | "aadhaar_field"
  | "pan_field"
  | "date_of_birth_field"
  | "address_field"
  | "salary_field"
  | "amount_field"
  | "expense_category_field"
  | "date_field"
  | "file_upload_field"
  | "submit_button"
  | "cancel_button"
  | "generic_text_field"
  | "non_sensitive_field"
  | "unknown";

/** Classification result for a single DOM element */
export interface ElementClassification {
  elementId: UniqueId;
  label: ElementClassificationLabel;
  confidence: number;
  isLikelySensitive: boolean;
}

// ============================================================
// Perception Result
// ============================================================

/**
 * The unified output of the CloakSight perception pipeline.
 *
 * Combines DOM, OCR, and visual detection results.
 *
 * PRIVACY: Contains raw classification data and OCR text. Local only.
 */
export interface PerceptionResult {
  sessionId: UniqueId;

  /** Source page snapshot ID */
  snapshotId: UniqueId;

  /** Element classifications from DOM + visual analysis */
  elementClassifications: ElementClassification[];

  /** Visually detected sensitive regions */
  visualRegions: VisualRegion[];

  /** Whether OCR was run */
  ocrRun: boolean;

  /** Whether visual detection was run */
  visualDetectionRun: boolean;

  /** ONNX model backend used */
  backendUsed?: "webgpu" | "wasm" | "cpu" | undefined;

  /** When perception completed */
  completedAt: Timestamp;

  /** Overall confidence in the perception result */
  overallConfidence: number;
}

// ============================================================
// DOM + Visual Fusion (Phase 8)
// ============================================================

/**
 * A fused element combining DOM structural properties, semantic classification,
 * spatial bounding box, and any correlated visual/OCR regions.
 */
export interface FusedElement {
  elementId: UniqueId;
  tagName: string;
  role: string;
  semanticLabel: ElementClassificationLabel;
  isInteractive: boolean;
  isSensitive: boolean;
  confidence: number;
  boundingRect: BoundingRect;
  accessibleLabel?: string | undefined;
  placeholder?: string | undefined;
  value?: string | undefined;
  textContent?: string | undefined;
  associatedVisualRegionId?: UniqueId | undefined;
  ocrText?: string | undefined;
  xpath?: string | undefined;
  cssSelector?: string | undefined;
}

/**
 * The unified multi-modal representation of the webpage combining
 * DOM, Visual Regions, and OCR into a single spatial-semantic model.
 *
 * PRIVACY: Stays strictly inside the LOCAL TRUSTED ZONE.
 */
export interface UnifiedPageRepresentation {
  sessionId: UniqueId;
  pageUrl: string;
  pageTitle: string;
  capturedAt: Timestamp;
  elementCount: number;
  interactiveCount: number;
  sensitiveCount: number;
  fusedElements: Record<UniqueId, FusedElement>;
  visualRegions: VisualRegion[];
  ocrTextSnippets: string[];
  fusionConfidence: number;
}

