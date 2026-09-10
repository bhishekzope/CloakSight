/**
 * CloakSight — Perception Pipeline (Phase 7)
 *
 * Orchestrates all on-device perception modules:
 *   1. DOM Element Semantic Classification (`elementClassifier.ts`)
 *   2. Visual Sensitive Region Detection (`visualDetector.ts`)
 *   3. Local OCR Extraction & Region Annotation (`ocrEngine.ts`)
 *
 * PRIVACY FIREWALL GUARANTEE:
 * All outputs (`PerceptionResult`) reside strictly in the LOCAL TRUSTED ZONE.
 * Never serializes raw perception outputs to external cloud APIs.
 */

import type { PerceptionResult } from "../types/perception";
import type { PageSnapshot } from "../types/dom";
import { classifyElements } from "./elementClassifier";
import { detectSensitiveRegions } from "./visualDetector";
import { annotateRegionsWithOCR } from "./ocrEngine";
import { createLogger } from "../utils/logger";

const logger = createLogger("perceptionPipeline");

/**
 * Run the full on-device perception pipeline on a PageSnapshot.
 *
 * @param snapshot PageSnapshot from DOM ingestion (Phase 2)
 * @param screenshotDataUrl Optional base64 screenshot from Phase 5
 * @returns Complete, unified PerceptionResult
 */
export async function runPerceptionPipeline(
  snapshot: PageSnapshot,
  screenshotDataUrl?: string,
): Promise<PerceptionResult> {
  const startTime = Date.now();
  const sessionId = snapshot.sessionId;
  const elements = Object.values(snapshot.elements);

  logger.info("Starting on-device perception pipeline", {
    sessionId,
    elementCount: elements.length,
    hasScreenshot: Boolean(screenshotDataUrl || snapshot.screenshotDataUrl),
  });

  // 1. Semantic DOM Element Classification
  const elementClassifications = classifyElements(elements);

  // 2. Visual Sensitive Region Detection
  const effectiveScreenshot = screenshotDataUrl || snapshot.screenshotDataUrl || "";
  const detectedRegions = await detectSensitiveRegions(effectiveScreenshot, elements);

  // 3. Local OCR on Visual Regions
  let annotatedRegions = detectedRegions;
  let ocrRun = false;

  if (effectiveScreenshot && detectedRegions.length > 0) {
    try {
      annotatedRegions = await annotateRegionsWithOCR(effectiveScreenshot, detectedRegions);
      ocrRun = true;
    } catch (ocrErr) {
      logger.warn("OCR annotation encountered partial error, continuing with visual regions", {
        error: String(ocrErr),
      });
    }
  }

  // Calculate overall perception confidence
  const avgElementConf =
    elementClassifications.length > 0
      ? elementClassifications.reduce((acc, c) => acc + c.confidence, 0) / elementClassifications.length
      : 0.85;

  const avgRegionConf =
    annotatedRegions.length > 0
      ? annotatedRegions.reduce((acc, r) => acc + r.confidence, 0) / annotatedRegions.length
      : 1.0;

  const overallConfidence = Number(((avgElementConf + avgRegionConf) / 2).toFixed(3));
  const completedAt = new Date().toISOString();

  logger.info("Perception pipeline completed successfully", {
    sessionId,
    classifiedCount: elementClassifications.length,
    visualRegionCount: annotatedRegions.length,
    ocrRun,
    overallConfidence,
    durationMs: Date.now() - startTime,
  });

  return {
    sessionId,
    snapshotId: snapshot.sessionId,
    elementClassifications,
    visualRegions: annotatedRegions,
    ocrRun,
    visualDetectionRun: true,
    backendUsed: "wasm",
    completedAt,
    overallConfidence,
  };
}
