/**
 * CloakSight — Extension Configuration
 *
 * Static and runtime configuration for the extension.
 * Sensitive values (API keys) are NEVER stored here.
 */

import type { LogLevel } from "../types/common";

// ============================================================
// Build-time constants
// ============================================================

export const EXTENSION_VERSION = "0.1.0";
export const EXTENSION_NAME = "CloakSight";

// ============================================================
// Server configuration
// ============================================================

export const SERVER_BASE_URL = "http://127.0.0.1:8000";
export const API_V1_PREFIX = "/api/v1";

export const ENDPOINTS = {
  HEALTH: `${SERVER_BASE_URL}${API_V1_PREFIX}/health`,
  AGENT_PLAN: `${SERVER_BASE_URL}${API_V1_PREFIX}/agent/plan`,
  PROVIDERS: `${SERVER_BASE_URL}${API_V1_PREFIX}/agent/providers`,
} as const;

// ============================================================
// Privacy defaults
// ============================================================

export const PRIVACY_DEFAULTS = {
  /** Minimum PII detection confidence to trigger redaction */
  PII_CONFIDENCE_THRESHOLD: 0.85,

  /** Block outbound transmission if leak guard detects PII */
  BLOCK_ON_LEAK_DETECTION: true,

  /** Require user confirmation before executing destructive actions */
  REQUIRE_ACTION_CONFIRMATION: true,

  /** Tag expiry duration in milliseconds (default: 30 minutes) */
  TAG_EXPIRY_MS: 30 * 60 * 1000,
} as const;

// ============================================================
// Performance defaults
// ============================================================

export const PERFORMANCE_DEFAULTS = {
  /** Maximum time to wait for DOM stabilization (ms) */
  DOM_SETTLE_TIMEOUT_MS: 2000,

  /** Maximum time to wait for screenshot capture (ms) */
  SCREENSHOT_TIMEOUT_MS: 5000,

  /** Maximum time to wait for cloud agent response (ms) */
  AGENT_TIMEOUT_MS: 30000,

  /** Maximum context size in characters */
  MAX_CONTEXT_LENGTH: 100_000,
} as const;

// ============================================================
// Logging
// ============================================================

export const LOG_LEVEL: LogLevel =
  (typeof process !== "undefined" && process?.env?.["CLOAKSIGHT_LOG_LEVEL"] as LogLevel) || "info";

// ============================================================
// Feature flags
// ============================================================

/**
 * Feature flags for enabling/disabling capabilities.
 * All are disabled by default in Phase 0/1.
 */
export const FEATURE_FLAGS = {
  /** Enable OCR-based perception (Phase 4+) */
  ENABLE_OCR: false,

  /** Enable visual detection (Phase 4+) */
  ENABLE_VISUAL_DETECTION: false,

  /** Enable WebGPU backend (Phase 4+) */
  ENABLE_WEBGPU: false,

  /** Enable context compression (Phase 10+) */
  ENABLE_CONTEXT_COMPRESSION: false,

  /** Enable dashboard integration (Phase 9+) */
  ENABLE_DASHBOARD: false,
} as const;
