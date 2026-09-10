/**
 * CloakSight — Action Dispatcher (Phase 14)
 *
 * Orchestrates local action execution and browser event dispatching.
 *
 * ARCHITECTURAL GUARANTEE:
 * 1. Tag-to-DOM Resolution: Resolves opaque tags (TAG_001) to live DOM nodes.
 * 2. Local Value Re-hydration: Pulls real raw values from in-memory TagVault
 *    strictly on-device. The cloud NEVER handles the re-hydrated values.
 * 3. Framework-Compatible Synthetic Events: Dispatches input, change, and mouse
 *    events with prototype setter bypass for React/Vue/Angular compatibility.
 * 4. Human-In-The-Loop Confirmation: Honors confirmation policies on destructive steps.
 */

import type { Action, ActionPlan, ActionResult, ActionPlanResult } from "../types/action";
import type { UniqueId } from "../types/common";
import { resolveTag, resolveTagValue } from "./tagResolver";
import { validateAction, validateActionPlan, type ActionValidationOptions } from "./actionValidator";
import { now, sleep } from "../utils/timing";
import { createLogger } from "../utils/logger";

const logger = createLogger("actionDispatcher");

// ============================================================
// Execution Options
// ============================================================

export interface ActionExecutionOptions {
  /** Inter-step delay in milliseconds (default: 50ms) */
  stepDelayMs?: number;

  /** Automatically confirm dangerous actions (for test/demo automation; default: false) */
  autoConfirmDangerousActions?: boolean;

  /** Callback for user confirmation prompt */
  onConfirmAction?: (action: Action) => Promise<boolean> | boolean;

  /** Options to pass to actionValidator */
  validationOptions?: ActionValidationOptions;
}

// ============================================================
// Single Action Execution & Re-hydration
// ============================================================

/**
 * Executes a single action locally:
 * 1. Validates safety rules.
 * 2. Resolves DOM element reference.
 * 3. Re-hydrates raw vaulted value if applicable.
 * 4. Dispatches synthetic browser events.
 */
export async function executeAction(
  action: Action,
  sessionId: UniqueId,
  options: ActionExecutionOptions = {}
): Promise<ActionResult> {
  const startTime = performance.now();
  const executedAt = now();

  logger.info("Executing action", {
    actionId: action.actionId,
    type: action.type,
    targetTag: action.target.tagId,
    sequence: action.sequenceNumber,
  });

  // 1. Safety validation
  const validation = validateAction(action, options.validationOptions);
  if (!validation.valid) {
    const durationMs = Math.round(performance.now() - startTime);
    logger.error("Action rejected by safety validator", {
      actionId: action.actionId,
      reason: validation.reason,
    });
    const result: ActionResult = {
      actionId: action.actionId,
      status: "failed_validation",
      executedAt,
      durationMs,
    };
    if (validation.reason) {
      result.errorMessage = validation.reason;
    }
    return result;
  }

  // 2. User confirmation check for dangerous actions
  if (validation.requiresConfirmation && !options.autoConfirmDangerousActions) {
    let confirmed = false;
    if (options.onConfirmAction) {
      confirmed = await options.onConfirmAction(action);
    }

    if (!confirmed) {
      const durationMs = Math.round(performance.now() - startTime);
      logger.warn("Action skipped: user confirmation required but not granted", {
        actionId: action.actionId,
      });
      return {
        actionId: action.actionId,
        status: "skipped_by_user",
        errorMessage: "Action requires explicit user confirmation.",
        executedAt,
        durationMs,
      };
    }
  }

  // 3. Resolve live DOM element
  const resolved = resolveTag(action.target.tagId);
  if (!resolved || !resolved.element || !resolved.isValid) {
    const durationMs = Math.round(performance.now() - startTime);
    logger.error("Failed to resolve target tag to live attached DOM element", {
      actionId: action.actionId,
      tagId: action.target.tagId,
    });
    return {
      actionId: action.actionId,
      status: "failed_element_not_found",
      errorMessage: `Element for tag "${action.target.tagId}" is not attached to the DOM.`,
      executedAt,
      durationMs,
    };
  }

  const el = resolved.element;

  // 4. Value Re-hydration (Local Trusted Zone only)
  let valueToApply: string = action.value || "";
  const vaultedVal = resolveTagValue(sessionId, action.target.tagId);

  if (vaultedVal !== undefined) {
    // Value was vaulted! Re-hydrate with real on-device data.
    valueToApply = vaultedVal;
    logger.info("Re-hydrated real value from local RAM vault for action", {
      actionId: action.actionId,
      tagId: action.target.tagId,
      // Value is NOT logged to preserve privacy!
    });
  }

  // 5. Browser Event Dispatching
  try {
    await dispatchBrowserEvents(el, action.type, valueToApply);
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("Failed to execute browser event on element", {
      actionId: action.actionId,
      error: errorMsg,
    });
    return {
      actionId: action.actionId,
      status: "failed_dom_change",
      errorMessage: errorMsg,
      executedAt,
      durationMs,
    };
  }

  const durationMs = Math.round(performance.now() - startTime);
  logger.info("Action executed successfully", {
    actionId: action.actionId,
    durationMs,
  });

  return {
    actionId: action.actionId,
    status: "success",
    executedAt,
    durationMs,
  };
}

// ============================================================
// Multi-Action Plan Execution
// ============================================================

/**
 * Executes a full ActionPlan sequentially.
 */
export async function executeActionPlan(
  plan: ActionPlan,
  sessionId: UniqueId,
  options: ActionExecutionOptions = {}
): Promise<ActionPlanResult> {
  const startTime = performance.now();
  const stepDelayMs = options.stepDelayMs ?? 50;

  logger.info("Starting action plan execution", {
    planId: plan.planId,
    sessionId,
    actionCount: plan.actions.length,
  });

  // Pre-validate plan
  const planValidation = validateActionPlan(plan.actions, options.validationOptions);
  if (!planValidation.valid) {
    logger.error("Pre-execution plan validation failed", { reason: planValidation.reason });
    return {
      planId: plan.planId,
      sessionId,
      results: [
        {
          actionId: plan.actions[0]?.actionId || "initial",
          status: "failed_validation",
          errorMessage: planValidation.reason || "Action plan pre-validation failed.",
          executedAt: now(),
          durationMs: Math.round(performance.now() - startTime),
        },
      ],
      overallStatus: "failed",
      completedAt: now(),
    };
  }

  const results: ActionResult[] = [];
  let overallStatus: "completed" | "partial" | "failed" | "cancelled" = "completed";

  for (let i = 0; i < plan.actions.length; i++) {
    const action = plan.actions[i];

    const result = await executeAction(action, sessionId, options);
    results.push(result);

    if (result.status === "skipped_by_user") {
      overallStatus = "cancelled";
      break;
    } else if (result.status !== "success") {
      overallStatus = "partial";
      logger.warn("Action execution failed; halting subsequent steps", {
        failedStep: i + 1,
        actionId: action.actionId,
        status: result.status,
      });
      break;
    }

    // Step delay for realism and DOM stabilization
    if (stepDelayMs > 0 && i < plan.actions.length - 1) {
      await sleep(stepDelayMs);
    }
  }

  const totalDurationMs = Math.round(performance.now() - startTime);
  logger.info("Action plan execution finished", {
    planId: plan.planId,
    overallStatus,
    actionsExecuted: results.length,
    totalDurationMs,
  });

  return {
    planId: plan.planId,
    sessionId,
    results,
    overallStatus,
    completedAt: now(),
  };
}

// ============================================================
// Synthetic Event Dispatching Helpers
// ============================================================

/**
 * Dispatches simulated browser interactions corresponding to the given action type.
 */
async function dispatchBrowserEvents(
  element: Element,
  actionType: string,
  value: string
): Promise<void> {
  const htmlEl = element as HTMLElement;

  switch (actionType) {
    case "fill": {
      // Focus element
      htmlEl.focus?.();

      if ((element as HTMLInputElement).type === "file") {
        logger.warn("Skipping fill on file input; file inputs cannot be programmatically filled with text values");
        break;
      }

      // Framework value setter bypass (React, Angular, Vue)
      const prototype = Object.getPrototypeOf(element);
      const nativeSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

      if (nativeSetter) {
        nativeSetter.call(element, value);
      } else {
        (element as HTMLInputElement).value = value;
      }

      // Dispatch synthetic input and change events with bubble support
      element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
      break;
    }

    case "click": {
      htmlEl.scrollIntoView?.({ block: "center", inline: "nearest" });

      element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));

      if (typeof htmlEl.click === "function") {
        htmlEl.click();
      } else {
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      }

      // If clicking a submit button inside a form, ensure form submission triggers even in simulated/JSDOM environments
      if (
        (element.tagName.toLowerCase() === "button" || element.tagName.toLowerCase() === "input") &&
        element.getAttribute("type")?.toLowerCase() === "submit"
      ) {
        const parentForm = element.closest("form");
        if (parentForm) {
          if (typeof parentForm.requestSubmit === "function") {
            try {
              parentForm.requestSubmit(element as HTMLElement);
            } catch {
              parentForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
            }
          } else {
            parentForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          }
        }
      }
      break;
    }

    case "check":
    case "uncheck": {
      const input = element as HTMLInputElement;
      htmlEl.focus?.();
      input.checked = actionType === "check";

      element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
      break;
    }

    case "select": {
      const select = element as HTMLSelectElement;
      htmlEl.focus?.();

      // Select by value or label
      let optionFound = false;
      for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (opt.value === value || opt.text === value || opt.text.toLowerCase() === value.toLowerCase()) {
          select.selectedIndex = i;
          optionFound = true;
          break;
        }
      }

      if (!optionFound && select.options.length > 0) {
        select.value = value;
      }

      element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
      break;
    }

    case "clear": {
      const input = element as HTMLInputElement;
      htmlEl.focus?.();
      input.value = "";
      element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
      break;
    }

    case "focus": {
      htmlEl.focus?.();
      element.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
      break;
    }

    case "scroll": {
      htmlEl.scrollIntoView?.({ block: "center", behavior: "smooth" });
      break;
    }

    case "wait": {
      const ms = parseInt(value, 10);
      if (!isNaN(ms) && ms > 0) {
        await sleep(Math.min(ms, 5000));
      }
      break;
    }

    case "submit": {
      if (element.tagName.toLowerCase() === "form") {
        const form = element as HTMLFormElement;
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.submit();
        }
      } else {
        htmlEl.click?.();
      }
      break;
    }

    default: {
      logger.warn(`Unhandled browser action type: ${actionType}`);
      break;
    }
  }
}
