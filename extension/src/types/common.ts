/**
 * CloakSight — Common / Shared Types
 *
 * Foundational types shared across all modules.
 * These types must not contain any privacy-sensitive data fields.
 */

// ============================================================
// Utility types
// ============================================================

/** ISO 8601 timestamp string */
export type Timestamp = string;

/** A unique identifier string */
export type UniqueId = string;

/** Semantic version string (e.g., "1.0.0") */
export type SemVer = string;

/** Pixel coordinate */
export interface Point {
  x: number;
  y: number;
}

/** Axis-aligned bounding rectangle in page coordinates */
export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Generic result wrapper for operations that can fail */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Generic async result */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// ============================================================
// Performance
// ============================================================

/** Performance timing metrics for a pipeline stage */
export interface StageMetrics {
  stageName: string;
  startedAt: Timestamp;
  completedAt: Timestamp;
  durationMs: number;
}

/** Aggregate performance metrics for a full pipeline run */
export interface PerformanceMetrics {
  sessionId: UniqueId;
  totalDurationMs: number;
  stages: StageMetrics[];
  deviceCapabilities: DeviceCapabilities;
}

/** Device hardware capabilities relevant to on-device inference */
export interface DeviceCapabilities {
  hasWebGPU: boolean;
  hasWASM: boolean;
  availableMemoryMB?: number;
  preferredBackend: "webgpu" | "wasm" | "cpu";
}

// ============================================================
// Session
// ============================================================

/** A unique session identifier for one CloakSight activation */
export interface SessionInfo {
  sessionId: UniqueId;
  tabId: number;
  pageUrl: string;
  startedAt: Timestamp;
  expiresAt: Timestamp;
}

// ============================================================
// Log levels
// ============================================================

export type LogLevel = "debug" | "info" | "warn" | "error";
