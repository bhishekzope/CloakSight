/**
 * CloakSight — Perception Fusion Engine (Phase 8)
 *
 * Unites DOM structural elements, on-device semantic classifications,
 * visual bounding regions, and OCR text into a single cohesive
 * `UnifiedPageRepresentation`.
 *
 * PRIVACY FIREWALL GUARANTEE:
 * The UnifiedPageRepresentation resides strictly inside the LOCAL TRUSTED ZONE.
 * It contains spatial coordinates and raw/OCR content used locally to build
 * the minimal sanitized context and resolve agent action targets.
 */

import type { PageSnapshot } from "../types/dom";
import type {
  PerceptionResult,
  UnifiedPageRepresentation,
  FusedElement,
  VisualRegion,
} from "../types/perception";
import type { BoundingRect } from "../types/common";
import { createLogger } from "../utils/logger";

const logger = createLogger("fusionEngine");

/**
 * Check if two bounding boxes have meaningful spatial overlap / intersection.
 */
export function checkSpatialOverlap(
  rectA: BoundingRect,
  rectB: BoundingRect,
  threshold = 0.2,
): boolean {
  if (rectA.width <= 0 || rectA.height <= 0 || rectB.width <= 0 || rectB.height <= 0) {
    return false;
  }

  const xOverlap = Math.max(
    0,
    Math.min(rectA.x + rectA.width, rectB.x + rectB.width) - Math.max(rectA.x, rectB.x),
  );
  const yOverlap = Math.max(
    0,
    Math.min(rectA.y + rectA.height, rectB.y + rectB.height) - Math.max(rectA.y, rectB.y),
  );

  const intersectionArea = xOverlap * yOverlap;
  if (intersectionArea <= 0) return false;

  const areaA = rectA.width * rectA.height;
  const areaB = rectB.width * rectB.height;
  const minArea = Math.min(areaA, areaB);

  return intersectionArea / minArea >= threshold;
}

/**
 * Fuse DOM snapshot elements, visual regions, and OCR results
 * into a single unified multi-modal page representation.
 *
 * @param snapshot Raw PageSnapshot from DOM ingestion (Phase 2)
 * @param perception Unified PerceptionResult from Phase 7
 * @returns Complete UnifiedPageRepresentation (LOCAL ONLY)
 */
export function fusePerceptionData(
  snapshot: PageSnapshot,
  perception: PerceptionResult,
): UnifiedPageRepresentation {
  const startTime = Date.now();
  const sessionId = snapshot.sessionId;

  logger.info("Starting DOM + Visual Perception Fusion", {
    sessionId,
    domElements: snapshot.elementCount,
    visualRegions: perception.visualRegions.length,
    ocrRun: perception.ocrRun,
  });

  // Create fast lookup maps for classifications and visual regions
  const classificationMap = new Map(
    perception.elementClassifications.map((c) => [c.elementId, c]),
  );

  const regionByElementMap = new Map<string, VisualRegion>();
  for (const region of perception.visualRegions) {
    if (region.associatedElementId) {
      regionByElementMap.set(region.associatedElementId, region);
    }
  }

  const fusedElements: Record<string, FusedElement> = {};
  let sensitiveCount = 0;
  let interactiveCount = 0;

  // Merge each DOM element with classification and visual / OCR signals
  for (const [elementId, domEl] of Object.entries(snapshot.elements)) {
    const classification = classificationMap.get(elementId);
    const semanticLabel = classification?.label ?? "unknown";
    const classificationConfidence = classification?.confidence ?? 0.7;

    // Check for explicit or spatial correlation with a visual region
    let correlatedRegion = regionByElementMap.get(elementId);

    if (!correlatedRegion && perception.visualRegions.length > 0) {
      // Spatial overlap check if bounding rects match
      for (const region of perception.visualRegions) {
        if (checkSpatialOverlap(domEl.boundingRect, region.boundingRect)) {
          correlatedRegion = region;
          break;
        }
      }
    }

    const isSensitive = Boolean(
      domEl.looksLikeSensitiveField ||
      classification?.isLikelySensitive ||
      (correlatedRegion && correlatedRegion.isMasked),
    );

    if (isSensitive) sensitiveCount += 1;
    if (domEl.isInteractive) interactiveCount += 1;

    fusedElements[elementId] = {
      elementId,
      tagName: domEl.tagName,
      role: domEl.role,
      semanticLabel,
      isInteractive: domEl.isInteractive,
      isSensitive,
      confidence: classificationConfidence,
      boundingRect: domEl.boundingRect,
      accessibleLabel: domEl.accessibleLabel,
      placeholder: domEl.placeholder,
      value: domEl.value,
      textContent: domEl.textContent,
      associatedVisualRegionId: correlatedRegion?.regionId,
      ocrText: correlatedRegion?.ocrText,
      xpath: domEl.xpath,
      cssSelector: domEl.cssSelector,
    };
  }

  // Collect all unique OCR text snippets
  const ocrSnippets = perception.visualRegions
    .map((r) => r.ocrText)
    .filter((text): text is string => Boolean(text && text.trim().length > 0));

  const fusionConfidence = Number(
    ((perception.overallConfidence + (sensitiveCount > 0 ? 0.95 : 0.85)) / 2).toFixed(3),
  );

  const durationMs = Date.now() - startTime;
  logger.info("DOM + Visual Perception Fusion complete", {
    sessionId,
    totalFusedElements: Object.keys(fusedElements).length,
    sensitiveElements: sensitiveCount,
    interactiveElements: interactiveCount,
    ocrSnippetCount: ocrSnippets.length,
    fusionConfidence,
    durationMs,
  });

  return {
    sessionId,
    pageUrl: snapshot.pageUrl,
    pageTitle: snapshot.pageTitle,
    capturedAt: new Date().toISOString(),
    elementCount: Object.keys(fusedElements).length,
    interactiveCount,
    sensitiveCount,
    fusedElements,
    visualRegions: perception.visualRegions,
    ocrTextSnippets: ocrSnippets,
    fusionConfidence,
  };
}
