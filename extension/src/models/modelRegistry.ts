/**
 * CloakSight — Model Registry
 *
 * Manages ONNX model loading, device capability detection, and backend selection.
 *
 * STATUS: Not implemented.
 * TODO(phase-4): Implement model loading using onnxruntime-web.
 * TODO(phase-4): Add WebGPU capability detection.
 */

import type { ModelId, ModelConfig } from "./modelConfig";
import { MODEL_CONFIGS } from "./modelConfig";
import { createLogger } from "../utils/logger";
import type { DeviceCapabilities } from "../types/common";

const logger = createLogger("modelRegistry");

/** Load state of a model */
export type ModelLoadState = "not_loaded" | "loading" | "loaded" | "error";

export interface ModelStatus {
  config: ModelConfig;
  loadState: ModelLoadState;
  error?: string;
}

const _modelStatus = new Map<ModelId, ModelStatus>();

// Initialize all models as not_loaded
(Object.keys(MODEL_CONFIGS) as ModelId[]).forEach((id) => {
  _modelStatus.set(id, {
    config: MODEL_CONFIGS[id],
    loadState: "not_loaded",
  });
});

/**
 * Detect device capabilities for backend selection.
 * @throws Error("Not implemented")
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  logger.debug("detectDeviceCapabilities called — not implemented");
  // TODO(phase-4): Check navigator.gpu for WebGPU availability
  // TODO(phase-4): Check WebAssembly for WASM availability
  throw new Error("Not implemented: detectDeviceCapabilities");
}

/**
 * Load an ONNX model by ID.
 * @throws Error("Not implemented")
 */
export async function loadModel(_modelId: ModelId): Promise<void> {
  logger.debug("loadModel called — not implemented", { modelId: _modelId });
  // TODO(phase-4): Import onnxruntime-web
  // TODO(phase-4): Load model from onnxPath
  // TODO(phase-4): Create InferenceSession with preferred backend
  throw new Error("Not implemented: loadModel");
}

/**
 * Get the status of a model.
 */
export function getModelStatus(modelId: ModelId): ModelStatus | undefined {
  return _modelStatus.get(modelId);
}

/**
 * Check if a model is ready for inference.
 */
export function isModelReady(modelId: ModelId): boolean {
  return _modelStatus.get(modelId)?.loadState === "loaded";
}
