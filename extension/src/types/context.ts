/**
 * CloakSight — Context Types
 *
 * Types for the sanitized context that crosses the privacy boundary
 * and the cloud agent request/response schemas.
 *
 * IMPORTANT: Everything in this file must be SAFE for cloud transmission.
 * No raw PII, no original values, no tag vault contents.
 */

import type { UniqueId, Timestamp } from "./common";
import type { SanitizedElement } from "./privacy";

// ============================================================
// Sanitized Context (CLOUD-SAFE)
// ============================================================

/**
 * Metadata about the page, without PII.
 * Safe for cloud transmission.
 */
export interface PageMetadata {
  pageUrl: string;          // Full URL (user must consent)
  pageTitle: string;        // Page title
  elementCount: number;
  sensitiveElementCount: number;
  interactiveElementCount: number;
  /** Proportion of elements that were redacted */
  redactionRatio: number;
  /** Overall confidence of the perception result */
  perceptionConfidence: number;
}

/**
 * The sanitized, cloud-safe representation of a page.
 * All PII has been removed or replaced with semantic tags.
 *
 * This is what the cloud AI receives for reasoning.
 */
export interface SanitizedContext {
  /** Session identifier (opaque, non-identifying) */
  sessionId: UniqueId;

  /** Page metadata (non-sensitive) */
  pageMetadata: PageMetadata;

  /** Sanitized element list — no raw PII */
  elements: SanitizedElement[];

  /** Actions available on this page */
  availableActions: string[];

  /** When this context was built */
  builtAt: Timestamp;

  /** Whether the leak guard passed */
  leakGuardPassed: boolean;
}

// ============================================================
// Agent Request / Response (CLOUD-SAFE)
// ============================================================

/**
 * The full request payload sent from the extension to the cloud agent.
 *
 * PRIVACY GUARANTEE: This object must pass `leakGuard.ts` before transmission.
 * It must not contain any `SensitiveEntity`, `TagVaultEntry`, or raw values.
 */
export interface AgentRequest {
  /** Session identifier */
  sessionId: UniqueId;

  /** The user's task description */
  task: string;

  /** The sanitized page context */
  sanitizedContext: SanitizedContext;

  /** Request timestamp */
  requestedAt: Timestamp;
}

/**
 * The response from the cloud agent containing a structured action plan.
 */
export interface AgentResponse {
  /** Matches the corresponding AgentRequest sessionId */
  sessionId: UniqueId;

  /** Overall status of the response */
  status: "success" | "partial" | "error" | "clarification_needed";

  /** The structured action plan */
  actionPlan?: ActionPlan;

  /** Optional human-readable reasoning summary from the AI */
  reasoningSummary?: string;

  /** Overall confidence in the action plan */
  planConfidence?: number;

  /** Error information if status is "error" */
  error?: {
    code: string;
    message: string;
  };

  /** Response timestamp */
  respondedAt: Timestamp;
}

// Import ActionPlan to avoid circular dependency
import type { ActionPlan } from "./action";
