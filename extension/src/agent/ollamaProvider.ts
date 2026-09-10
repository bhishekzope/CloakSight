/**
 * CloakSight — Ollama Agent Provider
 *
 * Connects to a locally running Ollama instance via HTTP REST API.
 * Uses Ollama's native JSON mode (`format: "json"`) to enforce strict
 * structured ActionPlan generation from open-weight models (Llama 3.2, Qwen 2.5, Mistral).
 *
 * Zero cloud quota exhaustion, zero network data egress, 100% free and private.
 */

import type { AgentRequest, AgentResponse } from "../types/context";
import type { ActionPlan, Action, ActionTarget } from "../types/action";
import type { AgentConfig, AgentProvider, ProviderName } from "./agentTypes";
import { AgentProviderError, ActionPlanParseError, DEFAULT_AGENT_CONFIG } from "./agentTypes";
import { buildChatMessages } from "./promptBuilder";
import { generateActionId, generatePlanId } from "../utils/ids";
import { now } from "../utils/timing";
import { createLogger } from "../utils/logger";

const logger = createLogger("ollamaProvider");

export class OllamaAgentProvider implements AgentProvider {
  public readonly name: ProviderName = "ollama";
  private readonly endpoint: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly timeoutMs: number;

  constructor(config: Partial<AgentConfig> = {}) {
    this.endpoint = (config.ollamaEndpoint || DEFAULT_AGENT_CONFIG.ollamaEndpoint || "http://localhost:11434").replace(/\/+$/, "");
    this.model = config.ollamaModel || DEFAULT_AGENT_CONFIG.ollamaModel || "llama3.2:latest";
    this.temperature = config.temperature ?? DEFAULT_AGENT_CONFIG.temperature ?? 0.1;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_AGENT_CONFIG.timeoutMs ?? 30000;
  }

  /**
   * Health check to test whether the Ollama server is running and accessible.
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${this.endpoint}/api/version`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generates a structured ActionPlan using Ollama's /api/chat endpoint with JSON mode.
   */
  public async generatePlan(
    request: AgentRequest,
    externalSignal?: AbortSignal
  ): Promise<AgentResponse> {
    logger.info("Dispatching agent request to Ollama", {
      endpoint: this.endpoint,
      model: this.model,
      sessionId: request.sessionId,
    });

    const messages = buildChatMessages(request);

    // Setup timeout and abort handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    // Propagate external signal if provided
    if (externalSignal) {
      externalSignal.addEventListener("abort", () => controller.abort());
    }

    let response: Response;
    try {
      response = await fetch(`${this.endpoint}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          format: "json", // Forces Ollama to constrain decoding to valid JSON
          options: {
            temperature: this.temperature,
          },
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new AgentProviderError(
          "ollama",
          `Request timed out after ${this.timeoutMs}ms or was cancelled.`,
          err
        );
      }
      throw new AgentProviderError(
        "ollama",
        `Failed to connect to Ollama at ${this.endpoint}. Ensure Ollama is installed and running ('ollama serve' or 'ollama run ${this.model}').`,
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new AgentProviderError(
        "ollama",
        `Ollama returned HTTP ${response.status} ${response.statusText}: ${errorText}`
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch (err) {
      throw new AgentProviderError("ollama", "Failed to parse Ollama response envelope as JSON", err);
    }

    const rawContent = data?.message?.content;
    if (!rawContent || typeof rawContent !== "string") {
      throw new AgentProviderError("ollama", "Ollama returned an empty response message");
    }

    const actionPlan = this.parseActionPlan(rawContent);

    logger.info("Successfully generated action plan via Ollama", {
      sessionId: request.sessionId,
      planId: actionPlan.planId,
      actionCount: actionPlan.actions.length,
      confidence: actionPlan.confidence,
    });

    return {
      sessionId: request.sessionId,
      status: "success",
      actionPlan,
      reasoningSummary: actionPlan.summary || `Ollama (${this.model}) planned ${actionPlan.actions.length} action(s).`,
      planConfidence: actionPlan.confidence,
      respondedAt: now(),
    };
  }

  /**
   * Robustly parses and validates the ActionPlan JSON produced by the LLM.
   */
  public parseActionPlan(rawOutput: string): ActionPlan {
    let parsed: any;

    try {
      parsed = JSON.parse(rawOutput.trim());
    } catch (initialErr) {
      // Attempt to extract JSON from markdown fences or text wrappers if model included any
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          throw new ActionPlanParseError("Failed to parse JSON action plan from model response", rawOutput);
        }
      } else {
        throw new ActionPlanParseError("Model response did not contain a valid JSON action plan", rawOutput);
      }
    }

    if (!parsed || typeof parsed !== "object") {
      throw new ActionPlanParseError("Parsed ActionPlan is not an object", rawOutput);
    }

    if (!Array.isArray(parsed.actions)) {
      throw new ActionPlanParseError("ActionPlan is missing required 'actions' array", rawOutput);
    }

    const validatedActions: Action[] = [];
    for (let i = 0; i < parsed.actions.length; i++) {
      const act = parsed.actions[i];
      if (!act || typeof act !== "object") continue;

      if (!act.target || typeof act.target.tagId !== "string") {
        throw new ActionPlanParseError(
          `Action at index ${i} is missing valid target.tagId. Every action must target a semantic tag.`,
          rawOutput
        );
      }

      const target: ActionTarget = {
        tagId: act.target.tagId,
      };
      if (typeof act.target.expectedLabel === "string") {
        target.expectedLabel = act.target.expectedLabel;
      }
      if (typeof act.target.expectedElementType === "string") {
        target.expectedElementType = act.target.expectedElementType;
      }

      const action: Action = {
        actionId: act.actionId || generateActionId(),
        type: act.type || "click",
        target,
        requiresConfirmation: Boolean(act.requiresConfirmation),
        sequenceNumber: typeof act.sequenceNumber === "number" ? act.sequenceNumber : i + 1,
      };
      if (typeof act.value === "string") {
        action.value = act.value;
      }
      if (typeof act.description === "string") {
        action.description = act.description;
      }
      validatedActions.push(action);
    }

    return {
      planId: parsed.planId || generatePlanId(),
      actions: validatedActions,
      summary: parsed.summary || "Generated action plan",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
      generatedAt: now(),
    };
  }
}
