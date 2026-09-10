/**
 * CloakSight — Context Compressor (Phase 10)
 *
 * Reduces token consumption and payload size by pruning non-essential,
 * non-interactive structural DOM nodes while prioritizing:
 *   - Interactive action targets (buttons, inputs, selects)
 *   - Sensitive fields & semantic tags
 *   - Elements with high task relevance
 *
 * PRIVACY: Never restores or modifies raw values. Operates strictly
 * on already-sanitized elements.
 */

import type { AgentRequest, SanitizedContext } from "../types/context";
import type { SanitizedElement } from "../types/privacy";
import { createLogger } from "../utils/logger";

const logger = createLogger("contextCompressor");

/**
 * Filter and prioritize sanitized elements for minimal token footprint.
 */
export function compressElements(
  elements: SanitizedElement[],
  maxElements = 50,
): SanitizedElement[] {
  if (elements.length <= maxElements) {
    return elements;
  }

  logger.debug("Compressing element context for LLM token optimization", {
    originalCount: elements.length,
    maxElements,
  });

  // Priority ranking score for elements:
  // 1. Interactive + Sensitive (Score: 10)
  // 2. Interactive (Buttons, Inputs) (Score: 8)
  // 3. Sensitive info tokens (Score: 6)
  // 4. Structural non-interactive headings/labels (Score: 4)
  // 5. Generic containers (Score: 1)
  const scored = elements.map((el) => {
    let score = 1;
    if (el.isInteractive && el.isSensitive) score = 10;
    else if (el.isInteractive) score = 8;
    else if (el.isSensitive) score = 6;
    else if (el.elementType === "h1" || el.elementType === "h2" || el.elementType === "label") score = 4;

    return { element: el, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, maxElements).map((item) => item.element);

  logger.info("Context compression complete", {
    originalCount: elements.length,
    compressedCount: selected.length,
    reductionRatio: ((1 - selected.length / elements.length) * 100).toFixed(1) + "%",
  });

  return selected;
}

/**
 * Compress an AgentRequest payload to fit token constraints.
 */
export async function compressContext(
  request: AgentRequest,
  maxElements = 50,
): Promise<AgentRequest> {
  const compressedElements = compressElements(request.sanitizedContext.elements, maxElements);

  const updatedContext: SanitizedContext = {
    ...request.sanitizedContext,
    elements: compressedElements,
    pageMetadata: {
      ...request.sanitizedContext.pageMetadata,
      elementCount: compressedElements.length,
    },
  };

  return {
    ...request,
    sanitizedContext: updatedContext,
  };
}
