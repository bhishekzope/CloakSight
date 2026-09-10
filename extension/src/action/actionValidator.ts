/**
 * CloakSight — Action Validator (Phase 13)
 *
 * Validates each action plan received from the AI agent before execution.
 * Ensures actions are safe, within scope, use registered tags, and DO NOT
 * contain raw PII injected into input values.
 *
 * SECURITY GUARANTEES:
 * 1. Tag Verification: Actions can only target registered in-memory tags.
 * 2. Whitelist Enforcement: Action types are strictly validated.
 * 3. Anti-PII Injection: Value fields are scanned for regex patterns and raw entities.
 * 4. Dangerous Action Gating: Irreversible operations (submit, payment, delete)
 *    are forcibly marked with requiresConfirmation = true.
 */

import type { Action, ActionType } from "../types/action";
import type { SensitiveEntity } from "../types/privacy";
import { lookupElement, getRegistrySize } from "./elementRegistry";
import { quickRegexScan } from "../privacy/leakGuard";
import { createLogger } from "../utils/logger";

const logger = createLogger("actionValidator");

// ============================================================
// Types & Whitelists
// ============================================================

export interface ActionValidationResult {
  valid: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  actionId?: string;
}

export interface ActionValidationOptions {
  /** Optional set or array of known valid tag IDs */
  validTags?: Set<string> | string[];

  /** Known sensitive entities from the local session */
  knownEntities?: SensitiveEntity[];

  /** Whitelist of permitted action types */
  allowedActions?: ActionType[];

  /** Force confirmation on dangerous actions (default: true) */
  enforceConfirmation?: boolean;
}

export const DEFAULT_ALLOWED_ACTIONS: ActionType[] = [
  "click",
  "fill",
  "select",
  "check",
  "uncheck",
  "upload",
  "scroll",
  "focus",
  "clear",
  "submit",
  "navigate",
  "wait",
  "screenshot",
];

export const DANGEROUS_KEYWORDS = [
  "submit",
  "pay",
  "payment",
  "delete",
  "remove",
  "confirm",
  "claim",
  "order",
  "buy",
  "transfer",
  "checkout",
  "apply",
  "purchase",
  "send money",
];

// ============================================================
// Single Action Validation
// ============================================================

/**
 * Validates a single action from an action plan against on-device safety rules.
 */
export function validateAction(
  action: Action,
  options: ActionValidationOptions = {}
): ActionValidationResult {
  const allowedActions = options.allowedActions || DEFAULT_ALLOWED_ACTIONS;
  const enforceConfirmation = options.enforceConfirmation ?? true;

  if (!action || typeof action !== "object") {
    return {
      valid: false,
      requiresConfirmation: false,
      reason: "Action is null or not an object.",
    };
  }

  // 1. Check action type whitelist
  if (!allowedActions.includes(action.type)) {
    logger.warn("Rejected action with unpermitted action type", {
      actionId: action.actionId,
      type: action.type,
    });
    return {
      valid: false,
      requiresConfirmation: false,
      actionId: action.actionId,
      reason: `Action type "${action.type}" is not in the permitted action whitelist.`,
    };
  }

  // 2. Check target presence and tag ID
  if (!action.target || typeof action.target.tagId !== "string" || action.target.tagId.trim() === "") {
    return {
      valid: false,
      requiresConfirmation: false,
      actionId: action.actionId,
      reason: "Action target is missing a valid tagId.",
    };
  }

  const tagId = action.target.tagId.trim();

  // 3. Verify tag registration
  if (options.validTags) {
    const tagSet = options.validTags instanceof Set ? options.validTags : new Set(options.validTags);
    if (!tagSet.has(tagId)) {
      logger.warn("Rejected action targeting unregistered tag", { actionId: action.actionId, tagId });
      return {
        valid: false,
        requiresConfirmation: false,
        actionId: action.actionId,
        reason: `Target tag "${tagId}" is not registered in valid page tags.`,
      };
    }
  } else if (getRegistrySize() > 0) {
    const entry = lookupElement(tagId);
    if (!entry) {
      logger.warn("Rejected action targeting tag not found in live registry", {
        actionId: action.actionId,
        tagId,
      });
      return {
        valid: false,
        requiresConfirmation: false,
        actionId: action.actionId,
        reason: `Target tag "${tagId}" is not registered in the element registry.`,
      };
    }
  }

  // 4. Anti-PII Injection check on value fields
  if (typeof action.value === "string" && action.value.trim().length > 0) {
    const val = action.value.trim();

    // 4a. Regex scan for known PII formats (Aadhaar, PAN, Credit Card, Email, etc.)
    if (quickRegexScan(val)) {
      logger.error("Anti-PII Injection gate tripped by regex scan on action value", {
        actionId: action.actionId,
        tagId,
      });
      return {
        valid: false,
        requiresConfirmation: false,
        actionId: action.actionId,
        reason: `Action value matches a raw PII pattern and was blocked for security.`,
      };
    }

    // 4b. Cross-reference against in-memory raw entities
    if (options.knownEntities && options.knownEntities.length > 0) {
      for (const entity of options.knownEntities) {
        if (entity.rawValue && val.toLowerCase().includes(entity.rawValue.toLowerCase())) {
          logger.error("Anti-PII Injection gate caught leaked raw session entity in action value", {
            actionId: action.actionId,
            entityType: entity.piiType,
          });
          return {
            valid: false,
            requiresConfirmation: false,
            actionId: action.actionId,
            reason: `Action value contains unredacted raw personal data (${entity.piiType}).`,
          };
        }
      }
    }
  }

  // 5. Dangerous action classification (requires user confirmation)
  let requiresConfirmation = Boolean(action.requiresConfirmation);

  if (enforceConfirmation) {
    if (action.type === "submit" || action.type === "navigate" || action.type === "upload") {
      requiresConfirmation = true;
    }

    const label = (action.target.expectedLabel || "").toLowerCase();
    const desc = (action.description || "").toLowerCase();

    for (const kw of DANGEROUS_KEYWORDS) {
      if (label.includes(kw) || desc.includes(kw)) {
        requiresConfirmation = true;
        break;
      }
    }
  }

  return {
    valid: true,
    requiresConfirmation,
    actionId: action.actionId,
  };
}

// ============================================================
// Full Action Plan Validation
// ============================================================

/**
 * Validates all actions in an action plan.
 * Returns first failure, or success with overall requiresConfirmation status.
 */
export function validateActionPlan(
  actions: Action[],
  options: ActionValidationOptions = {}
): ActionValidationResult {
  if (!Array.isArray(actions) || actions.length === 0) {
    return {
      valid: false,
      requiresConfirmation: false,
      reason: "Action plan contains no actions.",
    };
  }

  let planRequiresConfirmation = false;
  let lastFillIndex = -1;
  let submitIndex = -1;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const result = validateAction(action, options);

    if (!result.valid) {
      logger.error("Action plan validation failed on step", {
        step: i + 1,
        actionId: action.actionId,
        reason: result.reason,
      });
      return result;
    }

    if (result.requiresConfirmation) {
      planRequiresConfirmation = true;
    }

    // Track sequence ordering of fills vs submits
    if (action.type === "fill" || action.type === "select" || action.type === "check") {
      lastFillIndex = i;
    } else if (
      action.type === "submit" ||
      (action.type === "click" && (action.target.expectedLabel || "").toLowerCase().includes("submit"))
    ) {
      if (submitIndex === -1) {
        submitIndex = i;
      }
    }
  }

  // Sequencing safety warning: if submit is clicked before form fills
  if (submitIndex !== -1 && lastFillIndex !== -1 && submitIndex < lastFillIndex) {
    logger.warn("Suspicious action sequencing: submit is scheduled before form input completion", {
      submitStep: submitIndex + 1,
      lastFillStep: lastFillIndex + 1,
    });
  }

  return {
    valid: true,
    requiresConfirmation: planRequiresConfirmation,
  };
}
