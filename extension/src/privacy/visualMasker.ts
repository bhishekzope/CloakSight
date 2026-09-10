/**
 * CloakSight — Visual Masker
 *
 * Applies pixel-level masking to screenshot regions containing PII
 * before any image data is considered for cloud context.
 *
 * STATUS: Not implemented.
 * TODO(phase-4): Implement Canvas-based pixel masking.
 */

import type { VisualRegion } from "../types/perception";
import { createLogger } from "../utils/logger";

const logger = createLogger("visualMasker");

/**
 * Apply masking to all sensitive visual regions in a screenshot.
 * Returns a new screenshot data URL with regions masked.
 *
 * PRIVACY: Even the masked screenshot should be treated with care.
 * Only pass to cloud if strictly needed for layout understanding.
 *
 * @throws Error("Not implemented")
 */
export async function maskSensitiveRegions(
  _screenshotDataUrl: string,
  _regions: VisualRegion[],
): Promise<string> {
  logger.debug("maskSensitiveRegions called — not implemented");
  // TODO(phase-4): Use Canvas 2D API to draw opaque rectangles over sensitive regions
  // TODO(phase-4): Return masked image as base64 data URL
  throw new Error("Not implemented: maskSensitiveRegions");
}
