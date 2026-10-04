/**
 * CloakSight — Central Demo State Store (React Context)
 *
 * Manages the entire CloakSight engine lifecycle:
 * - Active view navigation
 * - Live form state & field highlights
 * - On-device PII detection records
 * - In-memory semantic tag vault
 * - Sanitized context and Outbound LeakGuard verification
 * - Structured action plan and animated execution
 * - End-to-end 11-stage automated orchestrator
 * - Chronological event timeline
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import {
  NavigationSection,
  DemoReimbursementFormState,
  DetectedEntity,
  SemanticTag,
  SanitizedPayload,
  LeakGuardResult,
  StructuredAction,
  TimelineEvent,
  OrchestratorStatus,
  OrchestratorStage,
} from "../types/cloaksight";
import {
  INITIAL_FORM_STATE,
  FICTIONAL_EMPLOYEE_PROFILE,
  FICTIONAL_TRIP_DETAILS,
  ORCHESTRATOR_STAGES_INFO,
} from "../data/demoData";
import { detectPIIFromForm } from "../lib/piiDetection";
import { generateSemanticTags, inMemoryVault } from "../lib/semanticTagging";
import { buildSanitizedContext } from "../lib/contextBuilder";
import { runLeakGuardInspection } from "../lib/leakGuard";
import { generateStructuredActionPlan } from "../lib/actionPlanner";

interface DemoContextType {
  // Navigation
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;

  // Form State
  formState: DemoReimbursementFormState;
  updateFormField: (field: keyof DemoReimbursementFormState, value: string) => void;
  autofillProfile: () => void;
  populateTrip: () => void;
  highlightFields: boolean;
  setHighlightFields: (highlight: boolean) => void;

  // Privacy & Perception Telemetry
  detectedEntities: DetectedEntity[];
  semanticTags: SemanticTag[];
  sanitizedPayload: SanitizedPayload;
  leakGuardResult: LeakGuardResult;
  isLeakSimulated: boolean;
  activePolicy: "strict" | "balanced";
  setActivePolicy: (policy: "strict" | "balanced") => void;

  // Agent Actions
  actionPlan: StructuredAction[];
  executeAction: (actionId: string) => void;
  confirmationModalOpen: boolean;
  setConfirmationModalOpen: (open: boolean) => void;
  confirmFinalSubmission: () => void;

  // Orchestrator
  orchestrator: OrchestratorStatus;
  startOrchestration: () => void;
  pauseOrchestration: () => void;
  stepNextOrchestration: () => void;
  resetDemo: () => void;
  setStepSpeed: (speedMs: number) => void;

  // Simulated Leak Trigger
  simulatePiiLeak: () => void;
  restoreSafePayload: () => void;

  // Timeline / Audit
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (
    stageName: string,
    title: string,
    description: string,
    type?: TimelineEvent["type"]
  ) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Navigation
  const [activeSection, setActiveSection] = useState<NavigationSection>("overview");

  // 2. Form state
  const [formState, setFormState] = useState<DemoReimbursementFormState>(INITIAL_FORM_STATE);
  const [highlightFields, setHighlightFields] = useState<boolean>(true);

  // 3. Privacy & LeakGuard
  const [detectedEntities, setDetectedEntities] = useState<DetectedEntity[]>([]);
  const [semanticTags, setSemanticTags] = useState<SemanticTag[]>([]);
  const [isLeakSimulated, setIsLeakSimulated] = useState<boolean>(false);
  const [activePolicy, setActivePolicy] = useState<"strict" | "balanced">("strict");

  const [sanitizedPayload, setSanitizedPayload] = useState<SanitizedPayload>(() =>
    buildSanitizedContext(INITIAL_FORM_STATE, [], [], false)
  );

  const [leakGuardResult, setLeakGuardResult] = useState<LeakGuardResult>(() =>
    runLeakGuardInspection(sanitizedPayload)
  );

  // 4. Action Plan
  const [actionPlan, setActionPlan] = useState<StructuredAction[]>(generateStructuredActionPlan());
  const [confirmationModalOpen, setConfirmationModalOpen] = useState<boolean>(false);

  // 5. Timeline Events
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    {
      id: "evt_init",
      timestamp: new Date().toLocaleTimeString(),
      stageName: "System Setup",
      title: "CloakSight Demo Sandbox Initialized",
      description: "Ephemeral in-memory vault armed; local trusted zone verified with zero external dependencies.",
      type: "info",
    },
  ]);

  // 6. Orchestrator Status
  const [orchestrator, setOrchestrator] = useState<OrchestratorStatus>({
    currentStage: 1,
    stageTitle: ORCHESTRATOR_STAGES_INFO[1].title,
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    isBlocked: false,
    stepSpeedMs: 1400,
  });

  const orchestratorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to add timeline events
  const addTimelineEvent = (
    stageName: string,
    title: string,
    description: string,
    type: TimelineEvent["type"] = "info"
  ) => {
    setTimelineEvents((prev) => [
      {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
        stageName,
        title,
        description,
        type,
      },
      ...prev,
    ]);
  };

  // Re-run perception and context generation whenever formState or leak simulation changes
  useEffect(() => {
    // 1. Detect PII
    const entities = detectPIIFromForm(formState);
    setDetectedEntities(entities);

    // 2. In-memory tagging & vaulting
    inMemoryVault.clear();
    const tags = generateSemanticTags(entities);
    setSemanticTags(tags);
    entities.forEach((entity, idx) => {
      inMemoryVault.store(tags[idx].tagId, entity.rawValue);
    });

    // 3. Build sanitized payload
    const payload = buildSanitizedContext(
      formState,
      entities,
      tags,
      isLeakSimulated,
      "rahul.sharma@corp.acme.in"
    );
    setSanitizedPayload(payload);

    // 4. Run LeakGuard
    const leakCheck = runLeakGuardInspection(payload);
    setLeakGuardResult(leakCheck);
  }, [formState, isLeakSimulated]);

  // Form field updater
  const updateFormField = (field: keyof DemoReimbursementFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Autofill sample employee profile
  const autofillProfile = () => {
    setFormState((prev) => ({
      ...prev,
      ...FICTIONAL_EMPLOYEE_PROFILE,
    }));
    addTimelineEvent(
      "DOM Ingestion",
      "Employee Profile Populated",
      "Loaded employee identity fields into reimbursement form for on-device detection.",
      "info"
    );
  };

  // Populate sample trip details
  const populateTrip = () => {
    setFormState((prev) => ({
      ...prev,
      ...FICTIONAL_TRIP_DETAILS,
    }));
    addTimelineEvent(
      "Action Planning",
      "Sample Trip Details Populated",
      "Injected Hotel stay claim details (INR 4,500) from verified OCR receipt.",
      "info"
    );
  };

  // Simulate PII Leak Button
  const simulatePiiLeak = () => {
    setIsLeakSimulated(true);
    addTimelineEvent(
      "Security Test",
      "Simulate PII Leak Triggered",
      "Deliberately injected unredacted email secret into outbound payload to test Outbound LeakGuard defense.",
      "warning"
    );
    // If orchestrator is running, block it
    setOrchestrator((prev) => ({
      ...prev,
      isRunning: false,
      isBlocked: true,
    }));
  };

  // Restore Safe Payload Button
  const restoreSafePayload = () => {
    setIsLeakSimulated(false);
    setOrchestrator((prev) => ({
      ...prev,
      isBlocked: false,
    }));
    addTimelineEvent(
      "Security Test",
      "Safe Payload Restored",
      "Raw secret removed; Outbound LeakGuard verified zero raw PII; safe pipeline resumed.",
      "success"
    );
  };

  // Execute an individual action step
  const executeAction = (actionId: string) => {
    setActionPlan((prev) =>
      prev.map((act) => {
        if (act.actionId === actionId) {
          // Apply changes to form state
          if (act.targetTag === "TAG_008" && act.permittedValue) {
            updateFormField("expenseCategory", act.permittedValue);
          } else if (act.targetTag === "TAG_007" && act.permittedValue) {
            updateFormField("travelDate", act.permittedValue);
          } else if (act.targetTag === "TAG_009" && act.permittedValue) {
            updateFormField("amount", act.permittedValue);
          } else if (act.targetTag === "TAG_010" && act.permittedValue) {
            updateFormField("description", act.permittedValue);
          }

          return {
            ...act,
            status: "completed",
            executedAt: new Date().toLocaleTimeString(),
          };
        }
        return act;
      })
    );

    const target = actionPlan.find((a) => a.actionId === actionId);
    if (target) {
      addTimelineEvent(
        "Local Dispatch",
        `Action Executed: ${target.description}`,
        `Dispatched synthetic browser events to ${target.targetFieldName} (${target.targetTag}).`,
        "success"
      );
    }
  };

  // Confirm final dangerous submit action
  const confirmFinalSubmission = () => {
    setConfirmationModalOpen(false);
    setActionPlan((prev) =>
      prev.map((act) =>
        act.actionId === "act_005"
          ? { ...act, status: "completed", executedAt: new Date().toLocaleTimeString() }
          : act
      )
    );

    const refId = `ACME-CLM-${Math.floor(10000 + Math.random() * 90000)}`;
    setFormState((prev) => ({
      ...prev,
      isSubmitted: true,
      claimRefId: refId,
    }));

    addTimelineEvent(
      "Claim Submission",
      "Reimbursement Submitted Successfully",
      `Final claim reference ${refId} created. Zero bytes of sensitive employee PII were exposed to the AI model.`,
      "success"
    );

    // Advance orchestrator to stage 11
    setOrchestrator((prev) => ({
      ...prev,
      currentStage: 11,
      stageTitle: ORCHESTRATOR_STAGES_INFO[11].title,
      isCompleted: true,
      isRunning: false,
    }));
  };

  // Reset entire demo
  const resetDemo = () => {
    if (orchestratorTimerRef.current) {
      clearTimeout(orchestratorTimerRef.current);
    }

    inMemoryVault.clear();
    setFormState(INITIAL_FORM_STATE);
    setDetectedEntities([]);
    setSemanticTags([]);
    setIsLeakSimulated(false);
    setActionPlan(generateStructuredActionPlan());
    setConfirmationModalOpen(false);

    setOrchestrator({
      currentStage: 1,
      stageTitle: ORCHESTRATOR_STAGES_INFO[1].title,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      isBlocked: false,
      stepSpeedMs: 1400,
    });

    setTimelineEvents([
      {
        id: `evt_reset_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        stageName: "System Reset",
        title: "Demo State Completely Reset",
        description: "In-memory vault wiped; form cleared; Outbound LeakGuard re-armed in pristine fail-closed state.",
        type: "info",
      },
    ]);
  };

  // -------------------------------------------------------------
  // Orchestrator Execution Logic (Stages 1 through 11)
  // -------------------------------------------------------------
  const advanceOrchestrationStage = (targetStage: OrchestratorStage) => {
    setOrchestrator((prev) => ({
      ...prev,
      currentStage: targetStage,
      stageTitle: ORCHESTRATOR_STAGES_INFO[targetStage].title,
    }));

    switch (targetStage) {
      case 1:
        // Initialize
        addTimelineEvent("Stage 1", "Demo Data Initialized", "Setting up isolated memory sandbox.", "info");
        break;

      case 2:
        // Inspect form
        autofillProfile();
        addTimelineEvent("Stage 2", "Form Inspected", "Ingested form DOM inputs and layout coordinates.", "info");
        break;

      case 3:
        // Detect PII
        addTimelineEvent("Stage 3", "PII Detected", "Detected 6 sensitive entities on-device.", "info");
        break;

      case 4:
        // Tagging
        addTimelineEvent("Stage 4", "Semantic Tags Assigned", "Generated TAG_001 through TAG_006 in RAM vault.", "info");
        break;

      case 5:
        // Context
        addTimelineEvent("Stage 5", "Sanitized Context Assembled", "Stripped raw secrets; structural JSON compiled.", "info");
        break;

      case 6:
        // LeakGuard check
        if (isLeakSimulated) {
          addTimelineEvent("Stage 6", "LeakGuard BLOCKED Payload", "Halting automated execution due to PII leak.", "error");
          setOrchestrator((prev) => ({ ...prev, isRunning: false, isBlocked: true }));
          return;
        }
        addTimelineEvent("Stage 6", "Outbound LeakGuard Cleared", "Verified 0 raw PII bytes in outbound context.", "success");
        break;

      case 7:
        // Show sanitized input
        addTimelineEvent("Stage 7", "AI Context Dispatched", "Simulated transmission of safe structural tags.", "info");
        break;

      case 8:
        // Generate action plan
        addTimelineEvent("Stage 8", "Action Plan Prepared", "AI returned structured 5-step action plan.", "info");
        break;

      case 9:
        // Require confirmation
        addTimelineEvent("Stage 9", "Safety Gate Activated", "Pausing for human confirmation before submission.", "warning");
        setOrchestrator((prev) => ({ ...prev, isRunning: false, isPaused: true }));
        setConfirmationModalOpen(true);
        return; // Pause here until confirmed

      case 10:
        // Execute actions 1..4
        executeAction("act_001");
        executeAction("act_002");
        executeAction("act_003");
        executeAction("act_004");
        break;

      case 11:
        // Final audit
        setOrchestrator((prev) => ({ ...prev, isRunning: false, isCompleted: true }));
        break;
    }
  };

  const startOrchestration = () => {
    if (orchestrator.isBlocked) return;
    setOrchestrator((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  };

  const pauseOrchestration = () => {
    if (orchestratorTimerRef.current) {
      clearTimeout(orchestratorTimerRef.current);
    }
    setOrchestrator((prev) => ({ ...prev, isRunning: false, isPaused: true }));
  };

  const stepNextOrchestration = () => {
    if (orchestrator.currentStage < 11 && !orchestrator.isBlocked) {
      const next = (orchestrator.currentStage + 1) as OrchestratorStage;
      advanceOrchestrationStage(next);
    }
  };

  const setStepSpeed = (speedMs: number) => {
    setOrchestrator((prev) => ({ ...prev, stepSpeedMs: speedMs }));
  };

  // Automation loop
  useEffect(() => {
    if (orchestrator.isRunning && !orchestrator.isPaused && !orchestrator.isBlocked) {
      if (orchestrator.currentStage < 11) {
        orchestratorTimerRef.current = setTimeout(() => {
          const next = (orchestrator.currentStage + 1) as OrchestratorStage;
          advanceOrchestrationStage(next);
        }, orchestrator.stepSpeedMs);
      } else {
        setOrchestrator((prev) => ({ ...prev, isRunning: false, isCompleted: true }));
      }
    }

    return () => {
      if (orchestratorTimerRef.current) {
        clearTimeout(orchestratorTimerRef.current);
      }
    };
  }, [orchestrator.isRunning, orchestrator.currentStage, orchestrator.isPaused, orchestrator.isBlocked]);

  return (
    <DemoContext.Provider
      value={{
        activeSection,
        setActiveSection,
        formState,
        updateFormField,
        autofillProfile,
        populateTrip,
        highlightFields,
        setHighlightFields,
        detectedEntities,
        semanticTags,
        sanitizedPayload,
        leakGuardResult,
        isLeakSimulated,
        activePolicy,
        setActivePolicy,
        actionPlan,
        executeAction,
        confirmationModalOpen,
        setConfirmationModalOpen,
        confirmFinalSubmission,
        orchestrator,
        startOrchestration,
        pauseOrchestration,
        stepNextOrchestration,
        resetDemo,
        setStepSpeed,
        simulatePiiLeak,
        restoreSafePayload,
        timelineEvents,
        addTimelineEvent,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
