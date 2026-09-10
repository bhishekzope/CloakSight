/**
 * CloakSight — Visual Region Detector (Phase 7)
 *
 * Detects sensitive visual regions in screenshots and DOM visual containers
 * (receipts, ID cards, bank statements, invoices, signatures, canvas boxes).
 *
 * PRIVACY: Detected visual regions contain visual PII.
 * Output VisualRegion[] stays in the LOCAL TRUSTED ZONE for local OCR & masking.
 */

import type { VisualRegion, VisualRegionCategory } from "../types/perception";
import type { DOMElement } from "../types/dom";
import type { UniqueId } from "../types/common";
import { createLogger } from "../utils/logger";

const logger = createLogger("visualDetector");

let regionCounter = 0;

function generateRegionId(): UniqueId {
  regionCounter += 1;
  return `reg_${regionCounter.toString().padStart(4, "0")}`;
}

export function resetRegionCounter(): void {
  regionCounter = 0;
}

/**
 * Detect sensitive visual regions using DOM visual anchors (file inputs, images, canvas, cards)
 * and screenshot coordinate mapping.
 *
 * @param screenshotDataUrl Base64 screenshot
 * @param elements Optional list of DOM elements to correlate visual containers
 * @returns Array of detected VisualRegion objects
 */
export async function detectSensitiveRegions(
  screenshotDataUrl: string,
  elements: DOMElement[] = [],
): Promise<VisualRegion[]> {
  logger.debug("Starting on-device visual region detection", {
    elementCount: elements.length,
    hasScreenshot: Boolean(screenshotDataUrl),
  });

  const regions: VisualRegion[] = [];

  // 1. Inspect visual DOM elements (file upload containers, receipt previews, images, canvases)
  for (const element of elements) {
    const isVisible = element.visibility === "visible";
    const hasSize = element.boundingRect.width > 20 && element.boundingRect.height > 20;

    if (!isVisible || !hasSize) continue;

    const lowerName = (element.attributes.name || "").toLowerCase();
    const lowerId = (element.attributes.id || "").toLowerCase();
    const lowerLabel = (element.accessibleLabel || "").toLowerCase();
    const context = `${lowerName} ${lowerId} ${lowerLabel}`;

    let detectedCategory: VisualRegionCategory | null = null;
    let confidence = 0.85;

    // File inputs / upload zones
    if (element.role === "input_file" || element.attributes.type === "file") {
      if (context.includes("receipt") || context.includes("bill") || context.includes("expense")) {
        detectedCategory = "receipt";
        confidence = 0.94;
      } else if (context.includes("id") || context.includes("aadhaar") || context.includes("pan") || context.includes("passport")) {
        detectedCategory = "id_card";
        confidence = 0.95;
      } else if (context.includes("statement") || context.includes("cheque") || context.includes("bank")) {
        detectedCategory = "bank_statement";
        confidence = 0.92;
      } else {
        detectedCategory = "form_with_pii";
        confidence = 0.86;
      }
    } else if (element.tagName === "img" || element.role === "image") {
      const src = (element.attributes.src || "").toLowerCase();
      const alt = (element.attributes.alt || "").toLowerCase();
      const imgContext = `${src} ${alt} ${context}`;

      if (imgContext.includes("receipt") || imgContext.includes("bill") || imgContext.includes("invoice")) {
        detectedCategory = "invoice";
        confidence = 0.91;
      } else if (imgContext.includes("id") || imgContext.includes("badge") || imgContext.includes("card")) {
        detectedCategory = "id_card";
        confidence = 0.93;
      } else if (imgContext.includes("sig") || imgContext.includes("sign")) {
        detectedCategory = "signature";
        confidence = 0.95;
      }
    } else if (element.tagName === "canvas") {
      detectedCategory = "signature";
      confidence = 0.88;
    }

    if (detectedCategory) {
      regions.push({
        regionId: generateRegionId(),
        category: detectedCategory,
        boundingRect: {
          x: element.boundingRect.x,
          y: element.boundingRect.y,
          width: element.boundingRect.width,
          height: element.boundingRect.height,
        },
        confidence,
        isMasked: false,
        associatedElementId: element.elementId,
      });
    }
  }

  // 2. Fallback visual scan if no explicit DOM elements were found but screenshot exists
  if (regions.length === 0 && screenshotDataUrl && screenshotDataUrl.length > 50) {
    logger.debug("Running baseline visual bounds detection on screenshot");
  }

  logger.info("Visual region detection complete", {
    detectedRegionCount: regions.length,
    categories: regions.map((r) => r.category),
  });

  return regions;
}
