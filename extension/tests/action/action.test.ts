// @vitest-environment jsdom
/**
 * CloakSight — Phase 13: Structured Action Planner & Action Validator Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { validateAction, validateActionPlan } from "../../src/action/actionValidator";
import {
  normalizeActionPlan,
  optimizeActionPlan,
  buildReadyActionPlan,
} from "../../src/action/actionPlanner";
import {
  registerElement,
  lookupElement,
  clearRegistry,
} from "../../src/action/elementRegistry";
import { resolveTag } from "../../src/action/tagResolver";
import { executeAction, executeActionPlan } from "../../src/action/actionDispatcher";
import { storeTag, clearSession } from "../../src/storage/tagVault";
import type { Action, ActionPlan } from "../../src/types/action";
import type { AgentResponse } from "../../src/types/context";
import type { SensitiveEntity } from "../../src/types/privacy";

describe("Phase 13: Structured Action Planner & Action Validator", () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe("actionValidator", () => {
    it("should pass a valid click action with registered tag", () => {
      const validTags = new Set(["TAG_001", "TAG_002"]);
      const action: Action = {
        actionId: "act_1",
        type: "click",
        target: { tagId: "TAG_001", expectedLabel: "Next Step" },
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = validateAction(action, { validTags });
      expect(result.valid).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it("should fail if tag is not registered", () => {
      const validTags = new Set(["TAG_001"]);
      const action: Action = {
        actionId: "act_bad",
        type: "click",
        target: { tagId: "TAG_UNKNOWN" },
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = validateAction(action, { validTags });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("TAG_UNKNOWN");
    });

    it("should fail if value field contains raw PII matching regex", () => {
      const validTags = new Set(["TAG_001"]);
      const action: Action = {
        actionId: "act_pan",
        type: "fill",
        target: { tagId: "TAG_001", expectedLabel: "PAN Number" },
        value: "ABCDE1234F", // Raw PAN format!
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = validateAction(action, { validTags });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("raw PII pattern");
    });

    it("should fail if value field contains known raw session entity", () => {
      const validTags = new Set(["TAG_001"]);
      const knownEntities: SensitiveEntity[] = [
        {
          entityId: "ent_name",
          piiType: "PERSON_NAME",
          rawValue: "Rahul Sharma",
          confidence: 0.95,
          sourceElementId: "el_1",
          detectedAt: new Date().toISOString(),
          detectionMethod: "heuristic",
        },
      ];

      const action: Action = {
        actionId: "act_leak",
        type: "fill",
        target: { tagId: "TAG_001" },
        value: "Rahul Sharma", // Raw session entity
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = validateAction(action, { validTags, knownEntities });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("unredacted raw personal data");
    });

    it("should flag navigate actions as requiring confirmation", () => {
      const validTags = new Set(["TAG_NAV"]);
      const action: Action = {
        actionId: "act_nav",
        type: "navigate",
        target: { tagId: "TAG_NAV" },
        value: "https://external.bank.com",
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = validateAction(action, { validTags });
      expect(result.valid).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it("should flag submit actions as requiring confirmation", () => {
      const validTags = new Set(["TAG_SUBMIT"]);
      const action: Action = {
        actionId: "act_submit",
        type: "submit",
        target: { tagId: "TAG_SUBMIT", expectedLabel: "Submit Application" },
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = validateAction(action, { validTags });
      expect(result.valid).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it("should flag destructive buttons (delete, pay) as requiring confirmation", () => {
      const validTags = new Set(["TAG_PAY"]);
      const action: Action = {
        actionId: "act_pay",
        type: "click",
        target: { tagId: "TAG_PAY", expectedLabel: "Pay INR 500 Now" },
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = validateAction(action, { validTags });
      expect(result.valid).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it("should validate a multi-action plan and track overall confirmation", () => {
      const validTags = new Set(["TAG_001", "TAG_002", "TAG_003"]);
      const actions: Action[] = [
        {
          actionId: "act_1",
          type: "fill",
          target: { tagId: "TAG_001", expectedLabel: "Category" },
          value: "Travel",
          requiresConfirmation: false,
          sequenceNumber: 1,
        },
        {
          actionId: "act_2",
          type: "click",
          target: { tagId: "TAG_002", expectedLabel: "Submit Claim" },
          requiresConfirmation: false,
          sequenceNumber: 2,
        },
      ];

      const result = validateActionPlan(actions, { validTags });
      expect(result.valid).toBe(true);
      expect(result.requiresConfirmation).toBe(true); // Submit triggered plan confirmation
    });
  });

  describe("actionPlanner", () => {
    it("should normalize action types, assign IDs, and fix casing", () => {
      const rawPlan: Partial<ActionPlan> = {
        actions: [
          {
            type: "type" as any, // Alias for fill
            target: { tagId: "TAG_001" },
            value: "Hotel",
          } as any,
          {
            type: "PRESS" as any, // Alias for click
            target: { tagId: "TAG_002" },
          } as any,
        ],
      };

      const normalized = normalizeActionPlan(rawPlan);
      expect(normalized.planId).toBeDefined();
      expect(normalized.actions).toHaveLength(2);
      expect(normalized.actions[0].type).toBe("fill");
      expect(normalized.actions[0].actionId).toBeDefined();
      expect(normalized.actions[0].sequenceNumber).toBe(1);
      expect(normalized.actions[1].type).toBe("click");
      expect(normalized.actions[1].sequenceNumber).toBe(2);
    });

    it("should optimize action plan by placing fills before submit and deduplicating", () => {
      const plan: ActionPlan = {
        planId: "plan_test",
        actions: [
          {
            actionId: "act_submit",
            type: "click",
            target: { tagId: "TAG_SUBMIT", expectedLabel: "Submit Form" },
            requiresConfirmation: true,
            sequenceNumber: 1,
          },
          {
            actionId: "act_focus",
            type: "focus",
            target: { tagId: "TAG_INPUT", expectedLabel: "Expense Amount" },
            requiresConfirmation: false,
            sequenceNumber: 2,
          },
          {
            actionId: "act_fill",
            type: "fill",
            target: { tagId: "TAG_INPUT", expectedLabel: "Expense Amount" },
            value: "1500",
            requiresConfirmation: false,
            sequenceNumber: 3,
          },
        ],
        confidence: 0.95,
        generatedAt: new Date().toISOString(),
      };

      const optimized = optimizeActionPlan(plan);
      expect(optimized.actions).toHaveLength(2); // redundant focus removed
      expect(optimized.actions[0].type).toBe("fill"); // fill moved before submit
      expect(optimized.actions[0].sequenceNumber).toBe(1);
      expect(optimized.actions[1].type).toBe("click"); // submit moved to end
      expect(optimized.actions[1].sequenceNumber).toBe(2);
    });

    it("should run buildReadyActionPlan end-to-end", () => {
      const validTags = new Set(["TAG_001", "TAG_002"]);
      const response: AgentResponse = {
        sessionId: "session_plan_e2e",
        status: "success",
        actionPlan: {
          planId: "plan_raw_1",
          actions: [
            {
              actionId: "a1",
              type: "fill",
              target: { tagId: "TAG_001", expectedLabel: "Notes" },
              value: "Business Trip",
              requiresConfirmation: false,
              sequenceNumber: 1,
            },
            {
              actionId: "a2",
              type: "click",
              target: { tagId: "TAG_002", expectedLabel: "Submit" },
              requiresConfirmation: false,
              sequenceNumber: 2,
            },
          ],
          confidence: 0.92,
          generatedAt: new Date().toISOString(),
        },
        respondedAt: new Date().toISOString(),
      };

      const { plan, validation } = buildReadyActionPlan(response, { validTags });
      expect(validation.valid).toBe(true);
      expect(validation.requiresConfirmation).toBe(true);
      expect(plan.actions).toHaveLength(2);
      expect(plan.actions[0].target.tagId).toBe("TAG_001");
      expect(plan.actions[1].target.tagId).toBe("TAG_002");
    });
  });

  describe("elementRegistry & tagResolver", () => {
    it("should register an element with a tag ID and resolve it", () => {
      const mockElement = document.createElement("input");
      document.body.appendChild(mockElement);

      registerElement("TAG_INPUT_001", mockElement, "input_text", "input");

      const entry = lookupElement("TAG_INPUT_001");
      expect(entry).toBeDefined();
      expect(entry?.tagId).toBe("TAG_INPUT_001");
      expect(entry?.element).toBe(mockElement);

      const resolved = resolveTag("TAG_INPUT_001");
      expect(resolved).toBeDefined();
      expect(resolved?.element).toBe(mockElement);

      mockElement.remove();
    });

    it("should return null/undefined for unknown tag IDs", () => {
      expect(lookupElement("TAG_DOES_NOT_EXIST")).toBeUndefined();
      expect(resolveTag("TAG_DOES_NOT_EXIST")).toBeNull();
    });
  });

  describe("actionDispatcher & Local Value Re-hydration", () => {
    it("should execute a fill action and re-hydrate real raw PII from local tagVault", async () => {
      const sessionId = "session_rehydrate_test";
      const mockInput = document.createElement("input");
      document.body.appendChild(mockInput);

      registerElement("TAG_PII_NAME", mockInput, "input_text", "input");

      // Store sensitive user name in local RAM vault
      storeTag(
        sessionId,
        {
          tagId: "TAG_PII_NAME",
          semanticLabel: "[PERSON_NAME]",
          piiType: "PERSON_NAME",
          state: "active",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        "Rahul Sharma" // Real PII
      );

      let inputEventFired = false;
      let changeEventFired = false;
      mockInput.addEventListener("input", () => { inputEventFired = true; });
      mockInput.addEventListener("change", () => { changeEventFired = true; });

      const action: Action = {
        actionId: "act_fill_name",
        type: "fill",
        target: { tagId: "TAG_PII_NAME", expectedLabel: "Full Name" },
        value: "[PERSON_NAME]", // Cloud AI only saw and sent the placeholder!
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = await executeAction(action, sessionId, {
        validationOptions: { validTags: new Set(["TAG_PII_NAME"]) },
      });

      expect(result.status).toBe("success");
      // The real raw value must be re-hydrated directly into the DOM input!
      expect(mockInput.value).toBe("Rahul Sharma");
      expect(inputEventFired).toBe(true);
      expect(changeEventFired).toBe(true);

      mockInput.remove();
      clearSession(sessionId);
    });

    it("should execute a click action and dispatch mouse events", async () => {
      const mockButton = document.createElement("button");
      mockButton.textContent = "Submit Form";
      document.body.appendChild(mockButton);

      registerElement("TAG_BTN_SUBMIT", mockButton, "button", "button");

      let clicked = false;
      mockButton.addEventListener("click", () => { clicked = true; });

      const action: Action = {
        actionId: "act_click_submit",
        type: "click",
        target: { tagId: "TAG_BTN_SUBMIT", expectedLabel: "Submit Form" },
        requiresConfirmation: true,
        sequenceNumber: 1,
      };

      const result = await executeAction(action, "session_test", {
        autoConfirmDangerousActions: true,
        validationOptions: { validTags: new Set(["TAG_BTN_SUBMIT"]) },
      });

      expect(result.status).toBe("success");
      expect(clicked).toBe(true);

      mockButton.remove();
    });

    it("should execute check and uncheck actions on a checkbox", async () => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = false;
      document.body.appendChild(checkbox);

      registerElement("TAG_CHECKBOX", checkbox, "checkbox", "input");

      const checkAction: Action = {
        actionId: "act_chk",
        type: "check",
        target: { tagId: "TAG_CHECKBOX" },
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const resCheck = await executeAction(checkAction, "session_test", {
        validationOptions: { validTags: new Set(["TAG_CHECKBOX"]) },
      });
      expect(resCheck.status).toBe("success");
      expect(checkbox.checked).toBe(true);

      const uncheckAction: Action = {
        actionId: "act_unchk",
        type: "uncheck",
        target: { tagId: "TAG_CHECKBOX" },
        requiresConfirmation: false,
        sequenceNumber: 2,
      };

      const resUncheck = await executeAction(uncheckAction, "session_test", {
        validationOptions: { validTags: new Set(["TAG_CHECKBOX"]) },
      });
      expect(resUncheck.status).toBe("success");
      expect(checkbox.checked).toBe(false);

      checkbox.remove();
    });

    it("should execute a select action on a dropdown", async () => {
      const select = document.createElement("select");
      const opt1 = document.createElement("option");
      opt1.value = "hotel";
      opt1.text = "Hotel";
      const opt2 = document.createElement("option");
      opt2.value = "flight";
      opt2.text = "Flight";
      select.appendChild(opt1);
      select.appendChild(opt2);
      document.body.appendChild(select);

      registerElement("TAG_SELECT", select, "select", "select");

      const selectAction: Action = {
        actionId: "act_select",
        type: "select",
        target: { tagId: "TAG_SELECT" },
        value: "flight",
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = await executeAction(selectAction, "session_test", {
        validationOptions: { validTags: new Set(["TAG_SELECT"]) },
      });

      expect(result.status).toBe("success");
      expect(select.value).toBe("flight");

      select.remove();
    });

    it("should fail gracefully when target element is detached or missing", async () => {
      const action: Action = {
        actionId: "act_missing",
        type: "click",
        target: { tagId: "TAG_NOT_EXIST" },
        requiresConfirmation: false,
        sequenceNumber: 1,
      };

      const result = await executeAction(action, "session_test", {
        validationOptions: { validTags: new Set(["TAG_NOT_EXIST"]) },
      });

      expect(result.status).toBe("failed_element_not_found");
      expect(result.errorMessage).toContain("not attached to the DOM");
    });

    it("should execute an action plan sequentially and return completed status", async () => {
      const input = document.createElement("input");
      const button = document.createElement("button");
      document.body.appendChild(input);
      document.body.appendChild(button);

      registerElement("TAG_IN", input, "input_text", "input");
      registerElement("TAG_BT", button, "button", "button");

      let buttonClicked = false;
      button.addEventListener("click", () => { buttonClicked = true; });

      const plan: ActionPlan = {
        planId: "plan_seq_001",
        actions: [
          {
            actionId: "a1",
            type: "fill",
            target: { tagId: "TAG_IN" },
            value: "Safe Note",
            requiresConfirmation: false,
            sequenceNumber: 1,
          },
          {
            actionId: "a2",
            type: "click",
            target: { tagId: "TAG_BT", expectedLabel: "Submit Form" },
            requiresConfirmation: true,
            sequenceNumber: 2,
          },
        ],
        confidence: 0.95,
        generatedAt: new Date().toISOString(),
      };

      const planResult = await executeActionPlan(plan, "session_test", {
        stepDelayMs: 5,
        autoConfirmDangerousActions: true,
        validationOptions: { validTags: new Set(["TAG_IN", "TAG_BT"]) },
      });

      expect(planResult.overallStatus).toBe("completed");
      expect(planResult.results).toHaveLength(2);
      expect(input.value).toBe("Safe Note");
      expect(buttonClicked).toBe(true);

      input.remove();
      button.remove();
    });
  });
});
