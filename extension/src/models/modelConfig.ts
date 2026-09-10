/**
 * CloakSight — Model Config
 *
 * Static configuration for ONNX models used by the perception pipeline.
 *
 * STATUS: Placeholder — no models are loaded or downloaded in Phase 0/1.
 * TODO(phase-4): Populate with real model configs when models are added.
 */

export type ModelBackend = "webgpu" | "wasm" | "cpu";

export type ModelId =
  | "ocr_engine_v1"
  | "visual_detector_v1"
  | "pii_ner_v1";

/** Configuration for a single ONNX model */
export interface ModelConfig {
  id: ModelId;
  name: string;
  version: string;
  /** Path to .onnx file relative to extension root */
  onnxPath: string;
  /** Preferred execution backend */
  preferredBackend: ModelBackend;
  /** Fallback backends in priority order */
  fallbackBackends: ModelBackend[];
  /** Input shape for the model */
  inputShape: number[];
  /** Maximum input image dimensions */
  maxImageDimensions?: { width: number; height: number };
  /** Whether this model is quantized (INT8/FP16) */
  isQuantized: boolean;
  /** Whether this model is available for use */
  isAvailable: boolean;
}

/**
 * Static model configuration registry.
 * Models are NOT downloaded or loaded until Phase 4+.
 */
export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  ocr_engine_v1: {
    id: "ocr_engine_v1",
    name: "CloakSight OCR Engine",
    version: "1.0.0",
    onnxPath: "models/ocr_engine_v1.onnx",
    preferredBackend: "webgpu",
    fallbackBackends: ["wasm", "cpu"],
    inputShape: [1, 3, 640, 640],
    maxImageDimensions: { width: 1920, height: 1080 },
    isQuantized: false,
    isAvailable: false, // Not available until Phase 4
  },

  visual_detector_v1: {
    id: "visual_detector_v1",
    name: "CloakSight Visual Sensitivity Detector",
    version: "1.0.0",
    onnxPath: "models/visual_detector_v1.onnx",
    preferredBackend: "webgpu",
    fallbackBackends: ["wasm", "cpu"],
    inputShape: [1, 3, 640, 640],
    maxImageDimensions: { width: 1920, height: 1080 },
    isQuantized: false,
    isAvailable: false, // Not available until Phase 4
  },

  pii_ner_v1: {
    id: "pii_ner_v1",
    name: "CloakSight PII NER Model",
    version: "1.0.0",
    onnxPath: "models/pii_ner_v1.onnx",
    preferredBackend: "wasm", // NER models typically run on WASM
    fallbackBackends: ["cpu"],
    inputShape: [1, 128], // Token sequence length
    isQuantized: false,
    isAvailable: false, // Not available until Phase 3
  },
};
