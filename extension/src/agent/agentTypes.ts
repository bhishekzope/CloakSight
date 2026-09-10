/**
 * CloakSight — Agent Types & Provider Interfaces
 *
 * Types for the AI agent reasoning layer.
 * Provider-agnostic interface allowing seamless switching between
 * Ollama (local/free), OpenAI, Gemini, Claude, or deterministic Mocks.
 *
 * PRIVACY GUARANTEE:
 * Providers only ever receive SanitizedContext.
 * Raw PII, original values, and tag vault contents NEVER reach this layer.
 */

import type { AgentRequest, AgentResponse } from "../types/context";

// ============================================================
// Provider Identifiers & Models
// ============================================================

export type ProviderName = "ollama" | "openai" | "gemini" | "claude" | "mock";

export interface AgentConfig {
  /** The active reasoning provider */
  provider: ProviderName;

  /** Ollama server base URL (default: http://localhost:11434) */
  ollamaEndpoint?: string;

  /** Ollama model name (default: llama3.2:latest) */
  ollamaModel?: string;

  /** Generic model override */
  modelName?: string;

  /** Sampling temperature (0.0 to 1.0, default 0.1 for planning) */
  temperature?: number;

  /** Maximum execution timeout in milliseconds */
  timeoutMs?: number;

  /** API Key for cloud providers (if used) */
  apiKey?: string;
}

/**
 * Standard default agent configuration.
 * Defaults to local Ollama with llama3.2 for zero-cost, unlimited local execution.
 */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  provider: "ollama",
  ollamaEndpoint: "http://localhost:11434",
  ollamaModel: "llama3.2:latest",
  temperature: 0.1,
  timeoutMs: 30000,
};

// ============================================================
// Agent Provider Interface
// ============================================================

/**
 * Abstract interface for an AI reasoning agent.
 * All implementations must consume only sanitized requests
 * and produce typed, tag-based ActionPlan objects.
 */
export interface AgentProvider {
  /** The provider name */
  readonly name: ProviderName;

  /**
   * Generates a structured ActionPlan based on sanitized context.
   *
   * @param request - Cloud-safe AgentRequest containing only sanitized elements.
   * @param signal - Optional AbortSignal for cancellation or timeouts.
   * @returns AgentResponse containing the structured action plan.
   */
  generatePlan(request: AgentRequest, signal?: AbortSignal): Promise<AgentResponse>;

  /**
   * Checks whether the provider service is currently reachable/ready.
   */
  isAvailable(): Promise<boolean>;
}

// ============================================================
// Errors
// ============================================================

export class AgentProviderError extends Error {
  constructor(
    public readonly provider: ProviderName,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`[CloakSight:Agent:${provider}] ${message}`);
    this.name = "AgentProviderError";
  }
}

export class ActionPlanParseError extends Error {
  constructor(
    message: string,
    public readonly rawOutput?: string
  ) {
    super(`[CloakSight:ActionPlanParseError] ${message}`);
    this.name = "ActionPlanParseError";
  }
}
