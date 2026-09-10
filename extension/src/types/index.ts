/**
 * CloakSight — Types Barrel
 *
 * Central export point for all shared TypeScript types.
 * Import from here rather than individual files where possible.
 *
 * Exception: Modules that are privacy-sensitive (e.g., privacy.ts)
 * should be imported directly in local-only code to make the
 * privacy boundary explicit.
 */

// Common utilities
export type {
  Timestamp,
  UniqueId,
  SemVer,
  Point,
  BoundingRect,
  Result,
  AsyncResult,
  StageMetrics,
  PerformanceMetrics,
  DeviceCapabilities,
  SessionInfo,
  LogLevel,
} from "./common";

// DOM types (LOCAL ONLY)
export type {
  ElementRole,
  ElementVisibility,
  DOMElement,
  PageSnapshot,
} from "./dom";

// Perception types (LOCAL ONLY)
export type {
  VisualRegionCategory,
  VisualRegion,
  ElementClassificationLabel,
  ElementClassification,
  PerceptionResult,
} from "./perception";

// Privacy types (mixed — some LOCAL ONLY, some CLOUD-SAFE)
// See privacy.ts file for per-type classification
export type {
  PIIType,
  DetectionConfidence,
  DetectionMethod,
  SensitiveEntity,    // LOCAL ONLY
  SemanticTag,        // tag_id and semanticLabel are cloud-safe; originalValue is local
  TagVaultEntry,      // LOCAL ONLY — stays in storage/
  PIIRedactionRule,
  PrivacyPolicy,
  SanitizedElement,   // CLOUD-SAFE
  LeakCheckResult,    // LOCAL ONLY
} from "./privacy";

// Context types (CLOUD-SAFE)
export type {
  PageMetadata,
  SanitizedContext,   // CLOUD-SAFE
  AgentRequest,       // CLOUD-SAFE
  AgentResponse,      // CLOUD-SAFE
} from "./context";

// Action types (CLOUD-SAFE for ActionPlan; LOCAL for ElementRegistryEntry)
export type {
  ActionType,
  ActionTarget,
  Action,
  ActionPlan,
  ElementRegistryEntry,  // LOCAL ONLY
  ActionResultStatus,
  ActionResult,
  ActionPlanResult,
} from "./action";
