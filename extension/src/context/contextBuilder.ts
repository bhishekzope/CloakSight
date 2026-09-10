/**
 * CloakSight — Sanitized Context Builder (Phase 10)
 *
 * Converts a UnifiedPageRepresentation or SanitizedElement[] into
 * a cloud-safe `SanitizedContext` and `AgentRequest`.
 *
 * PRIVACY GUARANTEE:
 * Produces structured schemas containing ONLY sanitized elements,
 * opaque tag IDs, and semantic labels. No raw values or TagVault entries.
 */

import type { AgentRequest, SanitizedContext, PageMetadata } from "../types/context";
import type { SanitizedElement } from "../types/privacy";
import type { UnifiedPageRepresentation } from "../types/perception";
import type { UniqueId } from "../types/common";
import { createLogger } from "../utils/logger";

const logger = createLogger("contextBuilder");

/**
 * Infer available high-level actions on the page from sanitized elements.
 */
function inferAvailableActions(elements: SanitizedElement[]): string[] {
  const actions: string[] = [];

  for (const el of elements) {
    if (!el.isInteractive) continue;

    if (el.elementRole === "button_submit" || el.semanticLabel === "submit_button") {
      actions.push(`SUBMIT (${el.tagId})`);
    } else if (el.elementRole === "button_generic" || el.elementType === "button") {
      actions.push(`CLICK (${el.tagId})`);
    } else if (el.elementType === "select") {
      actions.push(`SELECT_OPTION (${el.tagId})`);
    } else if (el.elementType === "input" || el.elementType === "textarea") {
      actions.push(`FILL_INPUT (${el.tagId}: ${el.semanticLabel})`);
    }
  }

  return actions;
}

/**
 * Build a cloud-safe SanitizedContext from a UnifiedPageRepresentation.
 *
 * @param unified The multi-modal UnifiedPageRepresentation from Phase 8
 * @param tagMapping Map of elementId -> tagId / semantic label
 * @returns Complete SanitizedContext (CLOUD-SAFE)
 */
export function buildSanitizedContextFromUnified(
  unified: UnifiedPageRepresentation,
  tagMapping: Map<UniqueId, { tagId: UniqueId; semanticLabel: string }> = new Map(),
): SanitizedContext {
  logger.info("Building SanitizedContext from UnifiedPageRepresentation", {
    sessionId: unified.sessionId,
    elementCount: unified.elementCount,
  });

  const sanitizedElements: SanitizedElement[] = [];

  for (const [elementId, fused] of Object.entries(unified.fusedElements)) {
    const tagInfo = tagMapping.get(elementId);
    const tagId = tagInfo?.tagId || `TAG_${elementId.replace(/[^0-9]/g, "").padStart(3, "0")}`;
    const semanticLabel = tagInfo?.semanticLabel || `[${fused.semanticLabel.toUpperCase()}]`;

    sanitizedElements.push({
      tagId,
      semanticLabel: fused.isSensitive ? semanticLabel : fused.textContent || semanticLabel,
      elementType: fused.tagName,
      elementRole: fused.role,
      isSensitive: fused.isSensitive,
      currentValue: fused.isSensitive ? undefined : fused.value,
      position: {
        x: fused.boundingRect.x,
        y: fused.boundingRect.y,
        width: fused.boundingRect.width,
        height: fused.boundingRect.height,
      },
      isInteractive: fused.isInteractive,
      isVisible: true,
    });
  }

  const sensitiveCount = sanitizedElements.filter((el) => el.isSensitive).length;
  const interactiveCount = sanitizedElements.filter((el) => el.isInteractive).length;
  const redactionRatio =
    sanitizedElements.length > 0
      ? Number((sensitiveCount / sanitizedElements.length).toFixed(3))
      : 0;

  const pageMetadata: PageMetadata = {
    pageUrl: unified.pageUrl,
    pageTitle: unified.pageTitle,
    elementCount: sanitizedElements.length,
    sensitiveElementCount: sensitiveCount,
    interactiveElementCount: interactiveCount,
    redactionRatio,
    perceptionConfidence: unified.fusionConfidence,
  };

  const availableActions = inferAvailableActions(sanitizedElements);

  return {
    sessionId: unified.sessionId,
    pageMetadata,
    elements: sanitizedElements,
    availableActions,
    builtAt: new Date().toISOString(),
    leakGuardPassed: false, // Set to true after Leak Guard verification in Phase 11
  };
}

/**
 * Build a complete cloud-ready AgentRequest payload.
 *
 * @param sessionId Unique session ID
 * @param userTask Prompt / task instruction
 * @param sanitizedElements Array of sanitized elements
 * @param pageUrl Target URL
 * @param pageTitle Target page title
 * @param perceptionConfidence Overall perception confidence score
 * @returns Fully constructed AgentRequest
 */
export async function buildAgentRequest(
  sessionId: UniqueId,
  userTask: string,
  sanitizedElements: SanitizedElement[],
  pageUrl: string,
  pageTitle: string,
  perceptionConfidence = 0.9,
): Promise<AgentRequest> {
  logger.debug("Assembling AgentRequest payload", { sessionId, userTask });

  const sensitiveCount = sanitizedElements.filter((el) => el.isSensitive).length;
  const interactiveCount = sanitizedElements.filter((el) => el.isInteractive).length;
  const redactionRatio =
    sanitizedElements.length > 0
      ? Number((sensitiveCount / sanitizedElements.length).toFixed(3))
      : 0;

  const pageMetadata: PageMetadata = {
    pageUrl,
    pageTitle,
    elementCount: sanitizedElements.length,
    sensitiveElementCount: sensitiveCount,
    interactiveElementCount: interactiveCount,
    redactionRatio,
    perceptionConfidence,
  };

  const availableActions = inferAvailableActions(sanitizedElements);

  const sanitizedContext: SanitizedContext = {
    sessionId,
    pageMetadata,
    elements: sanitizedElements,
    availableActions,
    builtAt: new Date().toISOString(),
    leakGuardPassed: false,
  };

  return {
    sessionId,
    task: userTask,
    sanitizedContext,
    requestedAt: new Date().toISOString(),
  };
}
