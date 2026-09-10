/**
 * CloakSight — Messaging Types
 *
 * Defines all messages that flow between extension contexts:
 *   - popup ↔ background
 *   - content ↔ background
 *   - background → content (action injection)
 *
 * All messages are typed as a discriminated union on `type`.
 *
 * PRIVACY: Messages must not carry raw PII fields.
 * Use SemanticTag IDs and SanitizedContext for cross-context communication.
 */

import type { UniqueId } from "../types/common";
import type { AgentRequest, AgentResponse } from "../types/context";
import type { ActionPlan, ActionPlanResult } from "../types/action";
import type { PrivacyPolicy } from "../types/privacy";
import type { PerformanceMetrics } from "../types/common";

// ============================================================
// Message direction annotations (documentation only)
// FROM_CONTENT = content → background
// FROM_BACKGROUND = background → content
// FROM_POPUP = popup → background
// ============================================================

/** Sent by content script when user activates CloakSight */
export interface ActivateScanMessage {
  type: "ACTIVATE_SCAN";
  tabId: number;
  userTask: string;
}

/** Sent by background after context is built and ready for cloud */
export interface ScanCompleteMessage {
  type: "SCAN_COMPLETE";
  sessionId: UniqueId;
  request: AgentRequest; // Sanitized — safe to log structure (not values)
}

/** Sent by background when cloud response is received */
export interface AgentResponseMessage {
  type: "AGENT_RESPONSE";
  sessionId: UniqueId;
  response: AgentResponse;
}

/** Sent by background to content script to execute action plan */
export interface ExecuteActionPlanMessage {
  type: "EXECUTE_ACTION_PLAN";
  sessionId: UniqueId;
  actionPlan: ActionPlan;
}

/** Sent by content script when action plan execution completes */
export interface ActionPlanCompleteMessage {
  type: "ACTION_PLAN_COMPLETE";
  sessionId: UniqueId;
  result: ActionPlanResult;
}

/** Sent by popup to request current status */
export interface RequestStatusMessage {
  type: "REQUEST_STATUS";
  tabId: number;
}

/** Sent by background in response to status request */
export interface StatusResponseMessage {
  type: "STATUS_RESPONSE";
  sessionState: SessionState;
  metrics?: PerformanceMetrics;
}

/** Sent by popup to update privacy policy */
export interface UpdatePrivacyPolicyMessage {
  type: "UPDATE_PRIVACY_POLICY";
  policy: PrivacyPolicy;
}

/** Sent by background when an error occurs */
export interface ErrorMessage {
  type: "ERROR";
  sessionId?: UniqueId;
  code: string;
  message: string;
}

/** Sent when leak guard blocks transmission */
export interface LeakGuardBlockedMessage {
  type: "LEAK_GUARD_BLOCKED";
  sessionId: UniqueId;
  summary: string;
  /** PII types detected (no raw values) */
  detectedPIITypes: string[];
}

// ============================================================
// Session state (for popup display)
// ============================================================

export type SessionState =
  | "idle"
  | "scanning"
  | "perceiving"
  | "sanitizing"
  | "awaiting_cloud"
  | "executing"
  | "complete"
  | "error"
  | "blocked_by_leak_guard";

// ============================================================
// Discriminated union of all messages
// ============================================================

export type BrowserMessage =
  | ActivateScanMessage
  | ScanCompleteMessage
  | AgentResponseMessage
  | ExecuteActionPlanMessage
  | ActionPlanCompleteMessage
  | RequestStatusMessage
  | StatusResponseMessage
  | UpdatePrivacyPolicyMessage
  | ErrorMessage
  | LeakGuardBlockedMessage;

/** Type guard helpers */
export function isMessage<T extends BrowserMessage>(
  msg: BrowserMessage,
  type: T["type"],
): msg is T {
  return msg.type === type;
}
