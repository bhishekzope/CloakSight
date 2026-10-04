/**
 * CloakSight — Dashboard Type Definitions
 *
 * Types for demo state, perception, privacy firewall, agent execution,
 * and audit telemetry.
 */

export type NavigationSection =
  | "overview"
  | "perception"
  | "redaction"
  | "firewall"
  | "agent"
  | "audit";

export type PIICategory =
  | "PERSON_NAME"
  | "EMPLOYEE_ID"
  | "EMAIL"
  | "PHONE"
  | "BANK_ACCOUNT"
  | "IFSC_CODE";

export type DetectionMethod =
  | "Pattern"
  | "DOM Context"
  | "OCR Simulation"
  | "Visual Region";

export interface DetectedEntity {
  entityId: string;
  category: PIICategory;
  rawValue: string;
  confidence: number;
  detectionMethod: DetectionMethod;
  sourceField: string;
  redacted: boolean;
  assignedTagId: string;
  semanticLabel: string;
  fieldId: string;
}

export interface SemanticTag {
  tagId: string;
  category: PIICategory;
  semanticLabel: string;
  sourceField: string;
  isVaultedLocally: boolean;
  maskedFormat: string;
}

export interface SanitizedElement {
  tagId: string;
  elementType: string;
  elementRole: string;
  semanticLabel: string;
  isSensitive: boolean;
  isInteractive: boolean;
  safeValue?: string;
  selector: string;
}

export interface SanitizedPayload {
  sessionId: string;
  pageMetadata: {
    title: string;
    url: string;
    elementCount: number;
    sensitiveCount: number;
    interactiveCount: number;
    redactionRatio: number;
  };
  elements: SanitizedElement[];
  availableActions: string[];
  builtAt: string;
  isTaintedForDemo?: boolean;
  taintedSecretValue?: string;
}

export interface LeakGuardCheck {
  name: string;
  description: string;
  passed: boolean;
  details: string;
}

export interface LeakGuardResult {
  passed: boolean;
  status: "PASSED" | "BLOCKED";
  summary: string;
  reasons: string[];
  checksRun: LeakGuardCheck[];
  timestamp: string;
  detectedCategories: PIICategory[];
}

export type ActionRiskLevel = "safe" | "sensitive" | "dangerous";
export type ActionExecutionStatus = "pending" | "in_progress" | "completed" | "failed";

export interface StructuredAction {
  actionId: string;
  sequenceNumber: number;
  type: "fill" | "select" | "click" | "submit" | "verify";
  targetTag: string;
  targetFieldName: string;
  targetSelector: string;
  permittedValue?: string;
  description: string;
  riskLevel: ActionRiskLevel;
  requiresConfirmation: boolean;
  status: ActionExecutionStatus;
  executedAt?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  stageName: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  metadata?: Record<string, any>;
}

export interface DemoReimbursementFormState {
  employeeName: string;
  employeeId: string;
  email: string;
  phone: string;
  bankAccount: string;
  ifscCode: string;
  expenseCategory: string;
  travelDate: string;
  amount: string;
  description: string;
  isSubmitted: boolean;
  claimRefId?: string;
}

export type OrchestratorStage =
  | 1 // Initialize demo data
  | 2 // Inspect fictional reimbursement form
  | 3 // Detect configured PII
  | 4 // Create semantic tags
  | 5 // Prepare sanitized context
  | 6 // Run LeakGuard
  | 7 // Display sanitized AI input
  | 8 // Generate deterministic demo action plan
  | 9 // Require confirmation before final submission
  | 10 // Execute actions on visible demo form
  | 11; // Display final audit summary

export interface OrchestratorStatus {
  currentStage: OrchestratorStage;
  stageTitle: string;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isBlocked: boolean;
  stepSpeedMs: number;
}
