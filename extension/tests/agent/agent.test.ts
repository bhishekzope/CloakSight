/**
 * CloakSight — Phase 12: Cloud Agent Interface & Ollama Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CLOAKSIGHT_SYSTEM_PROMPT,
  buildUserPrompt,
  buildChatMessages,
} from "../../src/agent/promptBuilder";
import { MockAgentProvider } from "../../src/agent/mockProvider";
import { OllamaAgentProvider } from "../../src/agent/ollamaProvider";
import { AgentClient, LeakDetectedError } from "../../src/agent/agentClient";
import { ActionPlanParseError, AgentProviderError } from "../../src/agent/agentTypes";
import type { AgentRequest } from "../../src/types/context";
import type { SensitiveEntity } from "../../src/types/privacy";

describe("Phase 12: Cloud Agent Interface & Provider Abstraction", () => {
  const sampleRequest: AgentRequest = {
    sessionId: "session_agent_test_001",
    task: "Fill reimbursement claim and submit",
    requestedAt: new Date().toISOString(),
    sanitizedContext: {
      sessionId: "session_agent_test_001",
      pageMetadata: {
        pageUrl: "http://localhost:3000",
        pageTitle: "Employee Expense Portal",
        elementCount: 3,
        sensitiveElementCount: 1,
        interactiveElementCount: 2,
        redactionRatio: 0.33,
        perceptionConfidence: 0.95,
      },
      elements: [
        {
          tagId: "TAG_001",
          semanticLabel: "Full Name [PERSON_NAME]",
          elementType: "input",
          elementRole: "input_text",
          isSensitive: true,
          isInteractive: true,
          isVisible: true,
        },
        {
          tagId: "TAG_002",
          semanticLabel: "Amount (INR)",
          elementType: "input",
          elementRole: "input_text",
          isSensitive: false,
          isInteractive: true,
          isVisible: true,
        },
        {
          tagId: "TAG_003",
          semanticLabel: "Submit Claim",
          elementType: "button",
          elementRole: "button_submit",
          isSensitive: false,
          isInteractive: true,
          isVisible: true,
        },
      ],
      availableActions: ["fill TAG_001", "fill TAG_002", "click TAG_003"],
      builtAt: new Date().toISOString(),
      leakGuardPassed: true,
    },
  };

  describe("Prompt Builder", () => {
    it("should generate a system prompt enforcing privacy tags and JSON schema", () => {
      expect(CLOAKSIGHT_SYSTEM_PROMPT).toContain("CloakSight Agent");
      expect(CLOAKSIGHT_SYSTEM_PROMPT).toContain("tagId");
      expect(CLOAKSIGHT_SYSTEM_PROMPT).toContain("requiresConfirmation");
      expect(CLOAKSIGHT_SYSTEM_PROMPT).toContain('"actions"');
    });

    it("should build user prompt formatted with sanitized elements and task directives", () => {
      const userPrompt = buildUserPrompt(sampleRequest);
      expect(userPrompt).toContain('TASK: "Fill reimbursement claim and submit"');
      expect(userPrompt).toContain("PAGE: Employee Expense Portal");
      expect(userPrompt).toContain("Tag: [TAG_001]");
      expect(userPrompt).toContain("Tag: [TAG_002]");
      expect(userPrompt).toContain("Tag: [TAG_003]");
      expect(userPrompt).toContain("PERSON_NAME");
      // Must not contain any raw unredacted personal details
      expect(userPrompt).not.toContain("Rahul");
      expect(userPrompt).not.toContain("9876543210");
    });

    it("should generate structured chat messages for Ollama API", () => {
      const messages = buildChatMessages(sampleRequest);
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
      expect(messages[1].content).toContain("TAG_001");
    });
  });

  describe("MockAgentProvider", () => {
    it("should generate a valid ActionPlan targeting known tags", async () => {
      const provider = new MockAgentProvider();
      const response = await provider.generatePlan(sampleRequest);

      expect(response.status).toBe("success");
      expect(response.sessionId).toBe(sampleRequest.sessionId);
      expect(response.actionPlan).toBeDefined();

      const plan = response.actionPlan!;
      expect(plan.actions.length).toBeGreaterThanOrEqual(2);

      // Verify all actions target known tags
      const knownTags = ["TAG_001", "TAG_002", "TAG_003"];
      for (const act of plan.actions) {
        expect(knownTags).toContain(act.target.tagId);
        expect(act.sequenceNumber).toBeGreaterThan(0);
      }

      // Verify submit button requires confirmation
      const submitAction = plan.actions.find((a) => a.target.tagId === "TAG_003");
      expect(submitAction).toBeDefined();
      expect(submitAction?.type).toBe("click");
      expect(submitAction?.requiresConfirmation).toBe(true);
    });

    it("should report availability as true", async () => {
      const provider = new MockAgentProvider();
      expect(await provider.isAvailable()).toBe(true);
    });
  });

  describe("OllamaAgentProvider", () => {
    it("should correctly parse clean JSON action plans", () => {
      const provider = new OllamaAgentProvider();
      const rawJson = JSON.stringify({
        planId: "plan_ollama_001",
        actions: [
          {
            actionId: "act_1",
            type: "fill",
            target: { tagId: "TAG_001", expectedLabel: "Full Name" },
            value: "Test User",
            description: "Fill name field",
            requiresConfirmation: false,
            sequenceNumber: 1,
          },
        ],
        summary: "Plan to fill name",
        confidence: 0.94,
      });

      const parsed = provider.parseActionPlan(rawJson);
      expect(parsed.planId).toBe("plan_ollama_001");
      expect(parsed.actions).toHaveLength(1);
      expect(parsed.actions[0].target.tagId).toBe("TAG_001");
      expect(parsed.confidence).toBe(0.94);
    });

    it("should recover and parse JSON wrapped in markdown blocks", () => {
      const provider = new OllamaAgentProvider();
      const wrapped = `Here is your action plan:
\`\`\`json
{
  "planId": "plan_wrapped_001",
  "actions": [
    {
      "actionId": "act_1",
      "type": "click",
      "target": { "tagId": "TAG_003" },
      "requiresConfirmation": true
    }
  ],
  "summary": "Click submit",
  "confidence": 0.91
}
\`\`\`
Hope this helps!`;

      const parsed = provider.parseActionPlan(wrapped);
      expect(parsed.planId).toBe("plan_wrapped_001");
      expect(parsed.actions[0].target.tagId).toBe("TAG_003");
      expect(parsed.actions[0].requiresConfirmation).toBe(true);
    });

    it("should throw ActionPlanParseError on invalid or non-JSON input", () => {
      const provider = new OllamaAgentProvider();
      expect(() => provider.parseActionPlan("I cannot fulfill this request.")).toThrow(
        ActionPlanParseError
      );
    });

    it("should throw ActionPlanParseError when action target tagId is missing", () => {
      const provider = new OllamaAgentProvider();
      const invalidTargetJson = JSON.stringify({
        planId: "plan_bad",
        actions: [
          {
            actionId: "act_1",
            type: "click",
            target: { expectedLabel: "Button" }, // Missing tagId!
          },
        ],
      });
      expect(() => provider.parseActionPlan(invalidTargetJson)).toThrow(ActionPlanParseError);
    });

    it("should handle Ollama API responses via mock fetch", async () => {
      const provider = new OllamaAgentProvider({
        ollamaEndpoint: "http://localhost:11434",
        ollamaModel: "llama3.2:latest",
      });

      const mockOllamaResponse = {
        model: "llama3.2:latest",
        created_at: new Date().toISOString(),
        message: {
          role: "assistant",
          content: JSON.stringify({
            planId: "plan_ollama_live",
            actions: [
              {
                actionId: "act_fill_1",
                type: "fill",
                target: { tagId: "TAG_001", expectedLabel: "Full Name" },
                value: "Rahul",
                sequenceNumber: 1,
              },
              {
                actionId: "act_click_2",
                type: "click",
                target: { tagId: "TAG_003", expectedLabel: "Submit Claim" },
                requiresConfirmation: true,
                sequenceNumber: 2,
              },
            ],
            summary: "Fill and submit reimbursement",
            confidence: 0.96,
          }),
        },
        done: true,
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOllamaResponse,
      } as any);

      const response = await provider.generatePlan(sampleRequest);

      expect(fetchSpy).toHaveBeenCalled();
      expect(response.status).toBe("success");
      expect(response.actionPlan?.actions).toHaveLength(2);
      expect(response.actionPlan?.actions[0].target.tagId).toBe("TAG_001");

      fetchSpy.mockRestore();
    });

    it("should throw AgentProviderError on network timeout or connection refusal", async () => {
      const provider = new OllamaAgentProvider({
        ollamaEndpoint: "http://127.0.0.1:9999", // Unreachable port
        timeoutMs: 100,
      });

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
        new Error("fetch failed: ECONNREFUSED")
      );

      await expect(provider.generatePlan(sampleRequest)).rejects.toThrow(AgentProviderError);

      fetchSpy.mockRestore();
    });
  });

  describe("AgentClient Orchestrator & Outbound Leak Guard", () => {
    it("should successfully plan actions using Mock provider through AgentClient", async () => {
      const client = new AgentClient({ provider: "mock" });
      const response = await client.plan(sampleRequest);

      expect(response.status).toBe("success");
      expect(response.actionPlan).toBeDefined();
      expect(response.actionPlan?.actions.length).toBeGreaterThan(0);
    });

    it("should switch providers dynamically via setConfig", () => {
      const client = new AgentClient({ provider: "mock" });
      expect(client.getConfig().provider).toBe("mock");

      client.setConfig({ provider: "ollama", ollamaModel: "qwen2.5:7b" });
      expect(client.getConfig().provider).toBe("ollama");
      expect(client.getConfig().ollamaModel).toBe("qwen2.5:7b");
      expect(client.getActiveProvider().name).toBe("ollama");
    });

    it("MANDATORY PRIVACY: should block dispatch and throw LeakDetectedError if raw PII leaks into payload", async () => {
      const client = new AgentClient({ provider: "mock" });

      // Simulate a raw entity detected locally in the session
      const rawEntities: SensitiveEntity[] = [
        {
          id: "entity_pan_1",
          type: "PAN",
          rawValue: "ABCDE1234F",
          confidence: 0.99,
          elementId: "el_input_pan",
          detectedAt: new Date().toISOString(),
          detectionMethod: "regex",
        },
      ];

      // Corrupt request with the raw unredacted PAN number
      const leakyRequest: AgentRequest = {
        ...sampleRequest,
        task: "Submit reimbursement for PAN ABCDE1234F", // Leaked raw PII!
      };

      // AgentClient MUST intercept and throw LeakDetectedError BEFORE dispatching
      await expect(client.plan(leakyRequest, rawEntities)).rejects.toThrow(LeakDetectedError);
    });

    it("MANDATORY PRIVACY: should block dispatch if raw PII matches regex patterns even without known raw entities", async () => {
      const client = new AgentClient({ provider: "mock" });

      // Request containing an Aadhaar number regex match in the context
      const leakyRequest: AgentRequest = {
        ...sampleRequest,
        task: "My Aadhaar is 2345 6789 0123 please fill it", // Raw Aadhaar pattern
      };

      await expect(client.plan(leakyRequest, [])).rejects.toThrow(LeakDetectedError);
    });
  });
});
