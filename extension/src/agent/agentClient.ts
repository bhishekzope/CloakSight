/**
 * CloakSight — Agent Client (Phase 12 Orchestrator)
 *
 * Central dispatcher for AI reasoning requests.
 * Enforces CloakSight's privacy guarantees:
 *   1. Outbound Leak Guard verification BEFORE any network dispatch.
 *   2. Provider abstraction (Ollama local by default, Mock, Cloud).
 *   3. Semantic tag validation on returned action plans.
 *
 * PRIVACY GUARANTEE:
 * Fail-Closed: If LeakGuard finds ANY unredacted PII in the request,
 * transmission is halted immediately with a LeakDetectedError.
 */

import type { AgentRequest, AgentResponse } from "../types/context";
import type { SensitiveEntity, LeakCheckResult } from "../types/privacy";
import type { AgentConfig, AgentProvider, ProviderName } from "./agentTypes";
import { DEFAULT_AGENT_CONFIG, AgentProviderError } from "./agentTypes";
import { OllamaAgentProvider } from "./ollamaProvider";
import { MockAgentProvider } from "./mockProvider";
import { checkForLeaks } from "../privacy/leakGuard";
import { createLogger } from "../utils/logger";

const logger = createLogger("agentClient");

export class LeakDetectedError extends Error {
  constructor(public readonly checkResult: LeakCheckResult) {
    super(
      `[CloakSight:LeakGuard] Transmission blocked: raw PII detected in payload (${checkResult.detectedPIITypes.join(", ")}).`
    );
    this.name = "LeakDetectedError";
  }
}

export class AgentClient {
  private config: AgentConfig;
  private provider: AgentProvider;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.provider = this.createProvider(this.config.provider);
  }

  /**
   * Updates configuration and switches provider if necessary.
   */
  public setConfig(newConfig: Partial<AgentConfig>): void {
    const updated = { ...this.config, ...newConfig };
    if (updated.provider !== this.config.provider || !this.provider) {
      this.provider = this.createProvider(updated.provider, updated);
    }
    this.config = updated;
    logger.info("Agent client configuration updated", {
      provider: this.config.provider,
      endpoint: this.config.ollamaEndpoint,
      model: this.config.ollamaModel,
    });
  }

  /**
   * Returns current active configuration.
   */
  public getConfig(): Readonly<AgentConfig> {
    return { ...this.config };
  }

  /**
   * Returns the active provider instance.
   */
  public getActiveProvider(): AgentProvider {
    return this.provider;
  }

  /**
   * Dispatches an AgentRequest through the privacy firewall and to the active provider.
   *
   * @param request The cloud-safe AgentRequest payload.
   * @param rawEntities In-memory raw sensitive entities to cross-reference against leaks.
   * @param signal Optional AbortSignal.
   * @returns Validated AgentResponse with structured ActionPlan.
   * @throws LeakDetectedError if raw PII is found in the payload.
   */
  public async plan(
    request: AgentRequest,
    rawEntities: SensitiveEntity[] = [],
    signal?: AbortSignal
  ): Promise<AgentResponse> {
    logger.info("Initiating agent planning pipeline", {
      sessionId: request.sessionId,
      provider: this.config.provider,
      task: request.task,
    });

    // ============================================================
    // 1. Mandatory Outbound Leak Guard Check
    // ============================================================
    const leakResult = await checkForLeaks(request, rawEntities);

    if (!leakResult.passed || leakResult.shouldBlock) {
      logger.error("Outbound Leak Guard intercepted sensitive payload", {
        sessionId: request.sessionId,
        categories: leakResult.detectedPIITypes,
        entityCount: leakResult.detectedEntityIds.length,
      });
      throw new LeakDetectedError(leakResult);
    }

    // ============================================================
    // 2. Dispatch to Active Provider (with graceful local fallback)
    // ============================================================
    let response: AgentResponse;
    try {
      if (this.config.provider === "ollama") {
        const isUp = await this.provider.isAvailable();
        if (!isUp) {
          logger.warn("Ollama daemon is not responding at localhost:11434; using MockAgentProvider for execution.");
          const fallback = new MockAgentProvider();
          response = await fallback.generatePlan(request, signal);
        } else {
          response = await this.provider.generatePlan(request, signal);
        }
      } else {
        response = await this.provider.generatePlan(request, signal);
      }
    } catch (err: any) {
      if (this.config.provider === "ollama") {
        logger.warn("Ollama planning encountered an issue; falling back to MockAgentProvider", { error: err.message });
        const fallback = new MockAgentProvider();
        response = await fallback.generatePlan(request, signal);
      } else {
        throw err;
      }
    }

    // ============================================================
    // 3. Post-Plan Semantic Tag Validation
    // ============================================================
    if (response.actionPlan && response.actionPlan.actions) {
      const validTags = new Set(request.sanitizedContext.elements.map((e) => e.tagId));

      for (const action of response.actionPlan.actions) {
        if (!validTags.has(action.target.tagId)) {
          logger.warn("Action targets an unrecognized tag ID", {
            actionId: action.actionId,
            targetTagId: action.target.tagId,
            knownTags: Array.from(validTags),
          });
        }
      }
    }

    return response;
  }

  /**
   * Factory method to instantiate provider instances.
   */
  private createProvider(providerName: ProviderName, config: AgentConfig = this.config): AgentProvider {
    switch (providerName) {
      case "ollama":
        return new OllamaAgentProvider(config);
      case "mock":
        return new MockAgentProvider();
      case "openai":
      case "gemini":
      case "claude":
        // Future cloud adapters will slot here seamlessly.
        // Falls back to mock or throws informative error.
        logger.warn(`${providerName} provider not yet configured; falling back to MockAgentProvider`);
        return new MockAgentProvider();
      default:
        throw new AgentProviderError("mock", `Unsupported provider: ${providerName}`);
    }
  }
}
