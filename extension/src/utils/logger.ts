/**
 * CloakSight — Logger Utility
 *
 * Structured logger for the extension.
 *
 * PRIVACY RULE: NEVER log raw PII values. Logger must refuse
 * to log SensitiveEntity.rawValue or TagVaultEntry.originalValue.
 * Log entity IDs and types only.
 */

import { LOG_LEVEL } from "../config/config";
import type { LogLevel } from "../types/common";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL = LEVELS[LOG_LEVEL] ?? LEVELS.info;

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= CURRENT_LEVEL;
}

function formatMessage(
  level: LogLevel,
  module: string,
  message: string,
): string {
  return `[CloakSight:${module}] [${level.toUpperCase()}] ${message}`;
}

function serializeMeta(meta?: Record<string, unknown>): string {
  if (!meta) return "";
  try {
    return " " + JSON.stringify(meta);
  } catch {
    return " [unserializable metadata]";
  }
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
}

/**
 * Create a module-scoped logger.
 * @param module - The module name (e.g., "domParser", "leakGuard")
 */
export function createLogger(module: string): Logger {
  return {
    debug(message, meta) {
      if (!shouldLog("debug")) return;
      console.debug(formatMessage("debug", module, message) + serializeMeta(meta));
    },

    info(message, meta) {
      if (!shouldLog("info")) return;
      console.info(formatMessage("info", module, message) + serializeMeta(meta));
    },

    warn(message, meta) {
      if (!shouldLog("warn")) return;
      console.warn(formatMessage("warn", module, message) + serializeMeta(meta));
    },

    error(message, error, meta) {
      if (!shouldLog("error")) return;
      let errStr = "";
      if (error !== undefined && error !== null) {
        if (error instanceof Error) {
          errStr = ` | ${error.message}`;
        } else if (typeof error === "object") {
          try {
            errStr = ` | ${JSON.stringify(error)}`;
          } catch {
            errStr = ` | [object]`;
          }
        } else {
          errStr = ` | ${String(error)}`;
        }
      }
      console.error(formatMessage("error", module, message) + errStr + serializeMeta(meta));
    },
  };
}
