/**
 * CloakSight — Layout Extractor
 *
 * Extracts spatial layout metadata from the page:
 * bounding boxes, z-index, visibility, and viewport containment.
 *
 * PRIVACY NOTE: Layout information is structural and spatial.
 * While bounding boxes are safe, they remain local during perception.
 */

import type { BoundingRect, UniqueId } from "../types/common";
import { getElement } from "../action/elementRegistry";
import { createLogger } from "../utils/logger";

const logger = createLogger("layoutExtractor");

export interface ElementLayout {
  elementId: UniqueId;
  boundingRect: BoundingRect;
  isVisible: boolean;
  isInViewport: boolean;
  zIndex?: number | undefined;
  opacity: number;
}

/**
 * Get the bounding rect for a specific live DOM element.
 * Safely handles elements that might not have getBoundingClientRect (e.g. in test envs).
 */
export function getElementBoundingRect(element: Element): BoundingRect {
  if (typeof element.getBoundingClientRect === "function") {
    const rect = element.getBoundingClientRect();
    return {
      x: Math.round(rect.x ?? rect.left ?? 0),
      y: Math.round(rect.y ?? rect.top ?? 0),
      width: Math.round(rect.width ?? 0),
      height: Math.round(rect.height ?? 0),
    };
  }

  return { x: 0, y: 0, width: 0, height: 0 };
}

/**
 * Check whether a bounding rect is within the visible viewport window.
 */
export function isRectInViewport(rect: BoundingRect): boolean {
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth || document.documentElement.clientWidth : 1920;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight || document.documentElement.clientHeight : 1080;

  return (
    rect.x < viewportWidth &&
    rect.x + rect.width > 0 &&
    rect.y < viewportHeight &&
    rect.y + rect.height > 0
  );
}

/**
 * Extract layout information for a list of tracked element IDs.
 */
export async function extractLayout(
  elementIds: UniqueId[],
): Promise<ElementLayout[]> {
  logger.debug("extractLayout called", { count: elementIds.length });
  const layouts: ElementLayout[] = [];

  for (const id of elementIds) {
    const el = getElement(id);
    if (!el) continue;

    const boundingRect = getElementBoundingRect(el);
    const isInViewport = isRectInViewport(boundingRect);

    let opacity = 1;
    let zIndex: number | undefined;
    let isVisible = true;

    if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
      try {
        const style = window.getComputedStyle(el);
        opacity = parseFloat(style.opacity || "1");
        const parsedZ = parseInt(style.zIndex, 10);
        if (!isNaN(parsedZ)) zIndex = parsedZ;

        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          opacity === 0
        ) {
          isVisible = false;
        }
      } catch {
        // Fallback for detached elements or mock environments
      }
    }

    if (el.hasAttribute("hidden")) {
      isVisible = false;
    }

    layouts.push({
      elementId: id,
      boundingRect,
      isVisible,
      isInViewport,
      zIndex,
      opacity,
    });
  }

  return layouts;
}
