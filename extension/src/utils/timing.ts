/**
 * CloakSight — Timing Utilities
 *
 * Helpers for measuring performance across pipeline stages.
 */

import type { StageMetrics, Timestamp } from "../types/common";

/**
 * Get current ISO timestamp string.
 */
export function now(): Timestamp {
  return new Date().toISOString();
}

/**
 * Create a simple timer for measuring stage durations.
 */
export function createStageTimer(stageName: string) {
  const startedAt = now();
  const startMs = performance.now();

  return {
    complete(): StageMetrics {
      const completedAt = now();
      const durationMs = Math.round(performance.now() - startMs);
      return { stageName, startedAt, completedAt, durationMs };
    },
  };
}

/**
 * Sleep for a given number of milliseconds.
 * Use sparingly — prefer event-driven patterns.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
