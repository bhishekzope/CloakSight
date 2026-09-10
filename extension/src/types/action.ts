/**
 * CloakSight — Action Types
 *
 * Types for the action planning and execution layer.
 *
 * ARCHITECTURE:
 *   - ActionPlan comes from the cloud (uses tag IDs, not real values).
 *   - ActionTarget resolution happens locally (tag → DOM element).
 *   - ActionResult is generated locally after execution.
 *
 * PRIVACY: Action `value` fields must contain only non-sensitive data.
 * If the cloud tries to put raw PII into an action value, the
 * actionValidator must reject it.
 */

import type { UniqueId, Timestamp } from "./common";

// ============================================================
// Action Types
// ============================================================

/** The type of browser action to perform */
export type ActionType =
  | "click"
  | "fill"         // Fill a text input
  | "select"       // Select a dropdown option
  | "check"        // Check a checkbox
  | "uncheck"      // Uncheck a checkbox
  | "upload"       // Trigger file upload
  | "scroll"       // Scroll to element or position
  | "focus"        // Focus an element
  | "clear"        // Clear an input field
  | "submit"       // Submit a form
  | "navigate"     // Navigate to a URL (requires user confirmation)
  | "wait"         // Wait for a condition
  | "screenshot";  // Capture a screenshot (local only)

// ============================================================
// Action Target
// ============================================================

/**
 * A reference to an action target, using a semantic tag.
 * The cloud specifies targets by tag ID only.
 * Real DOM element resolution happens locally.
 */
export interface ActionTarget {
  /** Semantic tag ID (e.g., "TAG_007") */
  tagId: UniqueId;

  /** Optional fallback: semantic label for validation */
  expectedLabel?: string;

  /** Optional: expected element type for validation */
  expectedElementType?: string;
}

// ============================================================
// Action
// ============================================================

/**
 * A single action in an action plan.
 *
 * PRIVACY: The `value` field for fill/select actions must be non-sensitive.
 * If the cloud returns a raw PII value here, `actionValidator` must reject it.
 */
export interface Action {
  /** Unique ID for this action */
  actionId: UniqueId;

  /** Type of action */
  type: ActionType;

  /** Target element (referenced by tag) */
  target: ActionTarget;

  /** Value for fill/select/check actions (must be non-sensitive) */
  value?: string;

  /** Human-readable description from the cloud AI */
  description?: string;

  /** Whether this action requires user confirmation before execution */
  requiresConfirmation: boolean;

  /** Sequence number within the plan */
  sequenceNumber: number;
}

// ============================================================
// Action Plan (from cloud)
// ============================================================

/**
 * A structured plan of actions returned by the cloud AI.
 * All targets are tag-based; no real DOM selectors or raw values.
 */
export interface ActionPlan {
  /** Unique plan identifier */
  planId: UniqueId;

  /** Ordered list of actions to execute */
  actions: Action[];

  /** Human-readable summary from the AI */
  summary?: string;

  /** AI confidence in this plan (0.0–1.0) */
  confidence: number;

  /** When the plan was generated */
  generatedAt: Timestamp;
}

// ============================================================
// Element Registry
// ============================================================

/**
 * An entry in the local element registry.
 * Maps a semantic tag to a live DOM element reference.
 *
 * PRIVACY: `element` is a live DOM reference. It stays in memory only.
 * Never serialized.
 */
export interface ElementRegistryEntry {
  /** Tag ID this entry belongs to */
  tagId: UniqueId;

  /** The live DOM element (in-memory reference only) */
  element: Element;

  /** Element type for validation */
  elementType: string;

  /** Expected semantic role for validation */
  expectedRole: string;

  /** When this entry was registered */
  registeredAt: Timestamp;

  /** Whether this entry is still valid (element still in DOM) */
  isValid: boolean;
}

// ============================================================
// Action Execution Result
// ============================================================

/** Result of executing a single action */
export type ActionResultStatus =
  | "success"
  | "failed_tag_not_found"
  | "failed_element_not_found"
  | "failed_validation"
  | "failed_dom_change"
  | "failed_execution"
  | "skipped_by_user";

export interface ActionResult {
  actionId: UniqueId;
  status: ActionResultStatus;
  errorMessage?: string;
  executedAt: Timestamp;
  durationMs: number;
}

/** Result of executing a full action plan */
export interface ActionPlanResult {
  planId: UniqueId;
  sessionId: UniqueId;
  results: ActionResult[];
  overallStatus: "completed" | "partial" | "failed" | "cancelled";
  completedAt: Timestamp;
}
