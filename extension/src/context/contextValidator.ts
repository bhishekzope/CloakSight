/**
 * CloakSight — Context Validator (Phase 10)
 *
 * Validates the structural integrity and security properties of
 * `SanitizedContext` and `AgentRequest` schemas before Leak Guard verification.
 *
 * PRIVACY FIREWALL RULES:
 *   1. Must verify required fields are populated.
 *   2. Must verify NO raw PII keys (`rawValue`, `originalValue`, `entityId`)
 *      exist anywhere in the payload.
 */

import type { AgentRequest, SanitizedContext } from "../types/context";
import { createLogger } from "../utils/logger";

const logger = createLogger("contextValidator");

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a SanitizedContext object.
 */
export function validateSanitizedContext(context: SanitizedContext): ValidationResult {
  const errors: string[] = [];

  if (!context.sessionId || context.sessionId.trim().length === 0) {
    errors.push("Missing required field: sessionId");
  }

  if (!context.pageMetadata) {
    errors.push("Missing required field: pageMetadata");
  } else {
    if (typeof context.pageMetadata.elementCount !== "number") {
      errors.push("Invalid pageMetadata: elementCount must be a number");
    }
    if (typeof context.pageMetadata.redactionRatio !== "number") {
      errors.push("Invalid pageMetadata: redactionRatio must be a number");
    }
  }

  if (!Array.isArray(context.elements)) {
    errors.push("Invalid context: elements must be an array");
  } else {
    for (let i = 0; i < context.elements.length; i++) {
      const el = context.elements[i];
      if (!el) continue;

      if (!el.tagId) {
        errors.push(`Element at index ${i} is missing tagId`);
      }
      if (!el.semanticLabel) {
        errors.push(`Element at index ${i} is missing semanticLabel`);
      }

      // Security check: ensure no forbidden raw fields exist on sanitized elements
      const forbiddenKeys = ["rawValue", "originalValue", "entityId", "rawText"];
      for (const key of forbiddenKeys) {
        if (key in el) {
          errors.push(`SECURITY VIOLATION: SanitizedElement contains forbidden key '${key}' at index ${i}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an AgentRequest against schema and privacy constraints.
 */
export function validateAgentRequest(request: AgentRequest): ValidationResult {
  const errors: string[] = [];

  if (!request.sessionId) {
    errors.push("Missing required field: sessionId");
  }

  if (!request.task || request.task.trim().length === 0) {
    errors.push("Missing required field: task");
  }

  if (!request.sanitizedContext) {
    errors.push("Missing required field: sanitizedContext");
  } else {
    const contextValidation = validateSanitizedContext(request.sanitizedContext);
    errors.push(...contextValidation.errors);
  }

  const valid = errors.length === 0;

  if (!valid) {
    logger.error("AgentRequest validation failed", { errors });
  } else {
    logger.debug("AgentRequest passed schema validation");
  }

  return { valid, errors };
}
