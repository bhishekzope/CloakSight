/**
 * CloakSight — Mock Agent Provider
 *
 * Deterministic, offline agent provider for unit testing, CI pipelines,
 * and offline development without requiring a live Ollama or Cloud LLM daemon.
 *
 * PRIVACY GUARANTEE:
 * Generates valid ActionPlan objects using ONLY tags present in the SanitizedContext.
 */

import type { AgentRequest, AgentResponse } from "../types/context";
import type { Action, ActionPlan, ActionType, ActionTarget } from "../types/action";
import type { AgentProvider, ProviderName } from "./agentTypes";
import { generateActionId, generatePlanId } from "../utils/ids";
import { now } from "../utils/timing";
import { createLogger } from "../utils/logger";

const logger = createLogger("mockProvider");

export class MockAgentProvider implements AgentProvider {
  public readonly name: ProviderName = "mock";

  /**
   * Generates a deterministic action plan matching the interactive elements
   * found in the sanitized context.
   */
  public async generatePlan(
    request: AgentRequest,
    signal?: AbortSignal
  ): Promise<AgentResponse> {
    logger.info("Generating mock action plan", {
      sessionId: request.sessionId,
      elementCount: request.sanitizedContext.elements.length,
      task: request.task,
    });

    if (signal?.aborted) {
      throw new Error("Action plan generation aborted.");
    }

    const { sanitizedContext } = request;
    const actions: Action[] = [];
    let seq = 1;

    // Filter interactive elements that can take actions
    const interactiveElements = sanitizedContext.elements.filter(
      (el) =>
        el.isInteractive ||
        el.elementType === "button" ||
        el.elementType === "input" ||
        el.elementType === "select" ||
        el.elementType === "textarea"
    );

    // Group elements into inputs (excluding file uploads) and submit buttons
    const inputs = interactiveElements.filter(
      (el) =>
        el.elementRole !== "input_file" &&
        (el.elementType === "input" ||
          el.elementType === "textarea" ||
          el.elementType === "select" ||
          el.elementRole.includes("input") ||
          el.elementRole.includes("select") ||
          el.elementRole.includes("combobox"))
    );
    const buttons = interactiveElements.filter(
      (el) => el.elementType === "button" || el.elementRole.includes("button")
    );

    // Step 1: Add actions to fill/interact with input fields
    for (const input of inputs) {
      let actionType: ActionType = "fill";
      let dummyVal = "test_value";

      if (input.elementRole.includes("checkbox")) {
        actionType = "check";
        dummyVal = "true";
      } else if (
        input.elementType === "select" ||
        input.elementRole.includes("select") ||
        input.elementRole.includes("combobox")
      ) {
        actionType = "select";
        dummyVal = "Hotel";
      } else {
        const labelLower = (input.semanticLabel || "").toLowerCase();
        if (labelLower.includes("date") || labelLower.includes("travel")) {
          dummyVal = "2026-09-12";
        } else if (
          labelLower.includes("amount") ||
          labelLower.includes("cost") ||
          labelLower.includes("price") ||
          input.elementRole === "input_number"
        ) {
          dummyVal = "4500";
        } else if (
          labelLower.includes("desc") ||
          labelLower.includes("note") ||
          labelLower.includes("reason") ||
          input.elementType === "textarea"
        ) {
          dummyVal = "Hotel stay in Jalgaon for technical site audit (Receipt #JAL-2026-88).";
        } else if (input.isSensitive) {
          // Tagged input — indicate task-driven filled value
          dummyVal = `[INPUT_${input.semanticLabel}]`;
        } else {
          dummyVal = input.currentValue || "Default Entry";
        }
      }

      const target: ActionTarget = {
        tagId: input.tagId,
        expectedElementType: input.elementType,
      };
      if (input.semanticLabel) {
        target.expectedLabel = input.semanticLabel;
      }

      actions.push({
        actionId: generateActionId(),
        type: actionType,
        target,
        value: dummyVal,
        description: `Fill field "${input.semanticLabel || input.tagId}"`,
        requiresConfirmation: false,
        sequenceNumber: seq++,
      });
    }

    // Step 2: Add action to click the primary action button (e.g., submit)
    const submitBtn =
      buttons.find(
        (b) =>
          b.elementRole === "button_submit" ||
          b.semanticLabel.toLowerCase().includes("submit")
      ) ||
      buttons.find(
        (b) =>
          b.semanticLabel.toLowerCase().includes("claim") &&
          !b.semanticLabel.toLowerCase().includes("fill")
      ) ||
      buttons[buttons.length - 1];

    if (submitBtn) {
      const submitTarget: ActionTarget = {
        tagId: submitBtn.tagId,
        expectedElementType: "button",
      };
      if (submitBtn.semanticLabel) {
        submitTarget.expectedLabel = submitBtn.semanticLabel;
      }

      actions.push({
        actionId: generateActionId(),
        type: "click",
        target: submitTarget,
        description: `Click "${submitBtn.semanticLabel || 'Submit'}" to complete the request`,
        requiresConfirmation: true, // Submit buttons require user confirmation
        sequenceNumber: seq++,
      });
    }

    const actionPlan: ActionPlan = {
      planId: generatePlanId(),
      actions,
      summary: `Automated plan with ${actions.length} action(s) for task: ${request.task}`,
      confidence: 0.98,
      generatedAt: now(),
    };

    return {
      sessionId: request.sessionId,
      status: "success",
      actionPlan,
      reasoningSummary: `Identified ${inputs.length} input field(s) and ${submitBtn ? "1 action button" : "0 buttons"} in sanitized context. Generated tag-targeted execution plan.`,
      planConfidence: 0.98,
      respondedAt: now(),
    };
  }

  public async isAvailable(): Promise<boolean> {
    return true;
  }
}
