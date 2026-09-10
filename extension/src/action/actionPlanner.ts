/**
 * CloakSight — Structured Action Planner (Phase 13)
 *
 * Normalizes, sequences, and optimizes action plans returned by AI agents.
 * Ensures strict schema adherence, corrects action aliases, guarantees logical
 * sequence ordering (e.g. form fields filled before submit), and integrates
 * with the ActionValidator for security gating.
 */

import type { Action, ActionPlan, ActionType, ActionTarget } from "../types/action";
import type { AgentResponse } from "../types/context";
import { generateActionId, generatePlanId } from "../utils/ids";
import { now } from "../utils/timing";
import { validateActionPlan, type ActionValidationOptions, type ActionValidationResult } from "./actionValidator";
import { createLogger } from "../utils/logger";

const logger = createLogger("actionPlanner");

// Mapping of common LLM action aliases to canonical ActionType
const ACTION_ALIASES: Record<string, ActionType> = {
  click: "click",
  press: "click",
  tap: "click",
  fill: "fill",
  type: "fill",
  input: "fill",
  write: "fill",
  select: "select",
  choose: "select",
  check: "check",
  tick: "check",
  uncheck: "uncheck",
  untick: "uncheck",
  upload: "upload",
  attach: "upload",
  scroll: "scroll",
  focus: "focus",
  clear: "clear",
  erase: "clear",
  submit: "submit",
  navigate: "navigate",
  goto: "navigate",
  wait: "wait",
  sleep: "wait",
  screenshot: "screenshot",
};

/**
 * Normalizes a raw action plan from an AI agent into canonical CloakSight schema.
 */
export function normalizeActionPlan(rawPlan: Partial<ActionPlan>): ActionPlan {
  const planId = rawPlan.planId || generatePlanId();
  const rawActions = Array.isArray(rawPlan.actions) ? rawPlan.actions : [];

  const normalizedActions: Action[] = [];
  let seq = 1;

  for (let i = 0; i < rawActions.length; i++) {
    const raw = rawActions[i];
    if (!raw || typeof raw !== "object") continue;

    // Resolve action type with alias mapping
    const rawTypeStr = String(raw.type || "click").toLowerCase().trim();
    const type: ActionType = ACTION_ALIASES[rawTypeStr] || "click";

    // Standardize target
    const targetTagId = raw.target && typeof raw.target.tagId === "string" ? raw.target.tagId.trim() : "";
    const target: ActionTarget = {
      tagId: targetTagId,
    };
    if (raw.target?.expectedLabel) {
      target.expectedLabel = String(raw.target.expectedLabel).trim();
    }
    if (raw.target?.expectedElementType) {
      target.expectedElementType = String(raw.target.expectedElementType).trim();
    }

    const action: Action = {
      actionId: raw.actionId || generateActionId(),
      type,
      target,
      requiresConfirmation: Boolean(raw.requiresConfirmation),
      sequenceNumber: seq++,
    };

    if (typeof raw.value === "string") {
      action.value = raw.value;
    }
    if (typeof raw.description === "string") {
      action.description = raw.description;
    }

    normalizedActions.push(action);
  }

  return {
    planId,
    actions: normalizedActions,
    summary: rawPlan.summary || `Normalized plan with ${normalizedActions.length} action(s)`,
    confidence: typeof rawPlan.confidence === "number" ? Math.max(0, Math.min(1, rawPlan.confidence)) : 0.85,
    generatedAt: rawPlan.generatedAt || now(),
  };
}

/**
 * Optimizes an action plan for natural browser workflow:
 * 1. Deduplicates redundant consecutive clicks or identical actions on the same tag.
 * 2. Removes redundant 'focus' actions that immediately precede a 'click' or 'fill'.
 * 3. Ensures form submission actions occur strictly AFTER all data input actions.
 * 4. Re-indexes sequence numbers strictly from 1..N.
 */
export function optimizeActionPlan(plan: ActionPlan): ActionPlan {
  const actions = [...plan.actions];
  if (actions.length <= 1) {
    return plan;
  }

  // Step 1: Remove redundant focus actions preceding clicks/fills on same tag
  const filtered: Action[] = [];
  for (let i = 0; i < actions.length; i++) {
    const curr = actions[i];
    const next = actions[i + 1];

    if (curr.type === "focus" && next && next.target.tagId === curr.target.tagId) {
      // Focus is redundant if followed immediately by fill or click
      continue;
    }

    // Deduplicate consecutive identical clicks
    if (curr.type === "click" && next && next.type === "click" && next.target.tagId === curr.target.tagId) {
      continue;
    }

    filtered.push(curr);
  }

  // Step 2: Separate input/fill actions and final submission actions
  const inputActions: Action[] = [];
  const submissionActions: Action[] = [];
  const otherActions: Action[] = [];

  for (const action of filtered) {
    const isSubmit =
      action.type === "submit" ||
      (action.type === "click" &&
        ((action.target.expectedLabel || "").toLowerCase().includes("submit") ||
          (action.target.expectedLabel || "").toLowerCase().includes("claim") ||
          (action.description || "").toLowerCase().includes("submit")));

    if (isSubmit) {
      submissionActions.push(action);
    } else if (action.type === "fill" || action.type === "select" || action.type === "check" || action.type === "clear") {
      inputActions.push(action);
    } else {
      otherActions.push(action);
    }
  }

  // Combine: other pre-requisites -> form fills -> final submission
  const optimizedList = [...otherActions, ...inputActions, ...submissionActions];

  // Step 3: Re-index sequence numbers
  for (let i = 0; i < optimizedList.length; i++) {
    optimizedList[i].sequenceNumber = i + 1;
  }

  logger.info("Action plan optimized", {
    originalCount: plan.actions.length,
    optimizedCount: optimizedList.length,
  });

  return {
    ...plan,
    actions: optimizedList,
  };
}

/**
 * Full Phase 13 pipeline: takes an AgentResponse, normalizes, optimizes,
 * and validates the resulting ActionPlan for on-device browser readiness.
 */
export function buildReadyActionPlan(
  response: AgentResponse,
  options: ActionValidationOptions = {}
): { plan: ActionPlan; validation: ActionValidationResult } {
  if (!response.actionPlan) {
    throw new Error("AgentResponse does not contain an action plan.");
  }

  // 1. Normalize
  const normalized = normalizeActionPlan(response.actionPlan);

  // 2. Optimize sequence
  const optimized = optimizeActionPlan(normalized);

  // 3. Security Validate
  const validation = validateActionPlan(optimized.actions, options);

  if (!validation.valid) {
    logger.error("Action plan rejected by on-device safety gate", {
      reason: validation.reason,
      actionId: validation.actionId,
    });
  } else {
    logger.info("Action plan passed on-device safety validation", {
      planId: optimized.planId,
      actionCount: optimized.actions.length,
      requiresConfirmation: validation.requiresConfirmation,
    });
  }

  return {
    plan: optimized,
    validation,
  };
}
