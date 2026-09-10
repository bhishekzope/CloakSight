/**
 * CloakSight — Content Script
 *
 * Injected into web pages. Responsible for:
 *   1. DOM ingestion — walking the live page DOM (Phase 2)
 *   2. Local PII detection — identifying sensitive fields on-device (Phase 3)
 *   3. Semantic redaction & Tagging — replacing PII with cloud-safe TAGs (Phase 4)
 *   4. Action execution — (Phase 14) clicking, filling, scrolling DOM elements
 *
 * PRIVACY NOTE: This script has direct access to the raw DOM and local in-memory
 * vault. All raw data remains strictly inside the LOCAL TRUSTED ZONE and is
 * NEVER transmitted to the cloud.
 */

import type { PageSnapshot } from "../types/dom";
import type { UniqueId } from "../types/common";
import type { SensitiveEntity, SemanticTag, SanitizedElement } from "../types/privacy";
import { parsePage } from "../ingestion/domParser";
import { getRegistrySize } from "../action/elementRegistry";
import { detectPII } from "../privacy/piiDetector";
import { createTags } from "../privacy/semanticTagger";
import { redactElements, redactText } from "../privacy/redactor";
import { createLogger } from "../utils/logger";

const logger = createLogger("content");

logger.info("CloakSight content script initialized on page", {
  url: typeof window !== "undefined" ? window.location.href : "unknown",
});

/**
 * Capture the current live page state as a PageSnapshot.
 */
export async function capturePageSnapshot(sessionId: UniqueId = `session_${Date.now()}`): Promise<PageSnapshot> {
  logger.info("Content script triggering DOM snapshot capture", { sessionId });
  const snapshot = await parsePage(sessionId);

  logger.info("DOM snapshot captured successfully", {
    elementsIngested: snapshot.elementCount,
    interactiveElements: snapshot.interactiveElementCount,
    registrySize: getRegistrySize(),
  });

  return snapshot;
}

/**
 * Run full on-device PII detection on the current page.
 */
export async function runLocalPIIDetection(sessionId: UniqueId = `session_${Date.now()}`): Promise<{
  snapshot: PageSnapshot;
  entities: SensitiveEntity[];
}> {
  const snapshot = await capturePageSnapshot(sessionId);
  const entities = await detectPII(snapshot);
  return { snapshot, entities };
}

/**
 * Run full Phase 4 Semantic Redaction pipeline:
 * DOM Ingestion -> PII Detection -> Semantic Tagging & Vault Storage -> SanitizedElement Output.
 */
export async function runLocalRedaction(sessionId: UniqueId = `session_${Date.now()}`): Promise<{
  snapshot: PageSnapshot;
  entities: SensitiveEntity[];
  tags: SemanticTag[];
  sanitizedElements: SanitizedElement[];
  sanitizedPageText: string;
}> {
  logger.info("Starting local semantic redaction pipeline", { sessionId });

  // 1. Ingest DOM
  const snapshot = await capturePageSnapshot(sessionId);

  // 2. Detect sensitive entities on-device
  const entities = await detectPII(snapshot);

  // 3. Generate cloud-safe SemanticTags and store raw values in the local RAM vault
  const tags = createTags(entities, sessionId);

  // 4. Produce SanitizedElements with raw PII completely stripped
  const sanitizedElements = redactElements(Object.values(snapshot.elements), entities, tags);

  // 5. Redact free page text
  const sanitizedPageText = redactText(snapshot.rawPageText, entities, tags);

  logger.info("Local semantic redaction pipeline complete", {
    totalElements: sanitizedElements.length,
    sensitiveTagsCreated: tags.length,
  });

  return {
    snapshot,
    entities,
    tags,
    sanitizedElements,
    sanitizedPageText,
  };
}

import { captureScreenshot, cropScreenshotRegion, getViewportMetadata } from "../ingestion/screenshotCapture";
import { extractTextFromImage, extractTextFromRegion, annotateRegionsWithOCR } from "../perception/ocrEngine";
import { runPerceptionPipeline } from "../perception/perceptionPipeline";
import { classifyElements } from "../perception/elementClassifier";
import { detectSensitiveRegions } from "../perception/visualDetector";

import { fusePerceptionData } from "../perception/fusionEngine";
import {
  loadPolicyForDomain,
  savePolicyForDomain,
  getDefaultPolicy,
  getStrictPolicy,
  shouldRedactEntity,
} from "../privacy/privacyPolicy";
import {
  buildSanitizedContextFromUnified,
  buildAgentRequest,
} from "../context/contextBuilder";
import { compressContext } from "../context/contextCompressor";
import { validateAgentRequest } from "../context/contextValidator";
import { checkForLeaks, quickRegexScan } from "../privacy/leakGuard";
import { validateAction, validateActionPlan } from "../action/actionValidator";
import { normalizeActionPlan, optimizeActionPlan, buildReadyActionPlan } from "../action/actionPlanner";
import { AgentClient } from "../agent/agentClient";
import { executeAction, executeActionPlan } from "../action/actionDispatcher";

// Expose on window for manual console testing / debugging in developer mode
if (typeof window !== "undefined") {
  (window as unknown as {
    __cloaksight_captureSnapshot?: typeof capturePageSnapshot;
    __cloaksight_detectPII?: typeof runLocalPIIDetection;
    __cloaksight_redactDOM?: typeof runLocalRedaction;
    __cloaksight_captureScreenshot?: typeof captureScreenshot;
    __cloaksight_cropScreenshotRegion?: typeof cropScreenshotRegion;
    __cloaksight_getViewport?: typeof getViewportMetadata;
    __cloaksight_extractTextFromImage?: typeof extractTextFromImage;
    __cloaksight_extractTextFromRegion?: typeof extractTextFromRegion;
    __cloaksight_annotateRegionsWithOCR?: typeof annotateRegionsWithOCR;
    __cloaksight_runPerception?: typeof runPerceptionPipeline;
    __cloaksight_classifyElements?: typeof classifyElements;
    __cloaksight_detectVisualRegions?: typeof detectSensitiveRegions;
    __cloaksight_fusePerception?: typeof fusePerceptionData;
    __cloaksight_loadPolicy?: typeof loadPolicyForDomain;
    __cloaksight_savePolicy?: typeof savePolicyForDomain;
    __cloaksight_getDefaultPolicy?: typeof getDefaultPolicy;
    __cloaksight_getStrictPolicy?: typeof getStrictPolicy;
    __cloaksight_shouldRedactEntity?: typeof shouldRedactEntity;
  }).__cloaksight_captureSnapshot = capturePageSnapshot;

  (window as unknown as {
    __cloaksight_detectPII?: typeof runLocalPIIDetection;
  }).__cloaksight_detectPII = runLocalPIIDetection;

  (window as unknown as {
    __cloaksight_redactDOM?: typeof runLocalRedaction;
  }).__cloaksight_redactDOM = runLocalRedaction;

  (window as unknown as {
    __cloaksight_captureScreenshot?: typeof captureScreenshot;
  }).__cloaksight_captureScreenshot = captureScreenshot;

  (window as unknown as {
    __cloaksight_cropScreenshotRegion?: typeof cropScreenshotRegion;
  }).__cloaksight_cropScreenshotRegion = cropScreenshotRegion;

  (window as unknown as {
    __cloaksight_getViewport?: typeof getViewportMetadata;
  }).__cloaksight_getViewport = getViewportMetadata;

  (window as unknown as {
    __cloaksight_extractTextFromImage?: typeof extractTextFromImage;
  }).__cloaksight_extractTextFromImage = extractTextFromImage;

  (window as unknown as {
    __cloaksight_extractTextFromRegion?: typeof extractTextFromRegion;
  }).__cloaksight_extractTextFromRegion = extractTextFromRegion;

  (window as unknown as {
    __cloaksight_annotateRegionsWithOCR?: typeof annotateRegionsWithOCR;
  }).__cloaksight_annotateRegionsWithOCR = annotateRegionsWithOCR;

  (window as unknown as {
    __cloaksight_runPerception?: typeof runPerceptionPipeline;
  }).__cloaksight_runPerception = runPerceptionPipeline;

  (window as unknown as {
    __cloaksight_classifyElements?: typeof classifyElements;
  }).__cloaksight_classifyElements = classifyElements;

  (window as unknown as {
    __cloaksight_detectVisualRegions?: typeof detectSensitiveRegions;
  }).__cloaksight_detectVisualRegions = detectSensitiveRegions;

  (window as unknown as {
    __cloaksight_fusePerception?: typeof fusePerceptionData;
  }).__cloaksight_fusePerception = fusePerceptionData;

  (window as unknown as {
    __cloaksight_loadPolicy?: typeof loadPolicyForDomain;
  }).__cloaksight_loadPolicy = loadPolicyForDomain;

  (window as unknown as {
    __cloaksight_savePolicy?: typeof savePolicyForDomain;
  }).__cloaksight_savePolicy = savePolicyForDomain;

  (window as unknown as {
    __cloaksight_getDefaultPolicy?: typeof getDefaultPolicy;
  }).__cloaksight_getDefaultPolicy = getDefaultPolicy;

  (window as unknown as {
    __cloaksight_getStrictPolicy?: typeof getStrictPolicy;
  }).__cloaksight_getStrictPolicy = getStrictPolicy;

  (window as unknown as {
    __cloaksight_shouldRedactEntity?: typeof shouldRedactEntity;
  }).__cloaksight_shouldRedactEntity = shouldRedactEntity;

  (window as unknown as {
    __cloaksight_buildSanitizedContext?: typeof buildSanitizedContextFromUnified;
  }).__cloaksight_buildSanitizedContext = buildSanitizedContextFromUnified;

  (window as unknown as {
    __cloaksight_buildAgentRequest?: typeof buildAgentRequest;
  }).__cloaksight_buildAgentRequest = buildAgentRequest;

  (window as unknown as {
    __cloaksight_compressContext?: typeof compressContext;
  }).__cloaksight_compressContext = compressContext;

  (window as unknown as {
    __cloaksight_validateAgentRequest?: typeof validateAgentRequest;
  }).__cloaksight_validateAgentRequest = validateAgentRequest;

  (window as unknown as {
    __cloaksight_checkForLeaks?: typeof checkForLeaks;
  }).__cloaksight_checkForLeaks = checkForLeaks;

  (window as unknown as {
    __cloaksight_quickRegexScan?: typeof quickRegexScan;
  }).__cloaksight_quickRegexScan = quickRegexScan;

  (window as unknown as {
    __cloaksight_validateAction?: typeof validateAction;
  }).__cloaksight_validateAction = validateAction;

  (window as unknown as {
    __cloaksight_validateActionPlan?: typeof validateActionPlan;
  }).__cloaksight_validateActionPlan = validateActionPlan;

  (window as unknown as {
    __cloaksight_normalizeActionPlan?: typeof normalizeActionPlan;
  }).__cloaksight_normalizeActionPlan = normalizeActionPlan;

  (window as unknown as {
    __cloaksight_optimizeActionPlan?: typeof optimizeActionPlan;
  }).__cloaksight_optimizeActionPlan = optimizeActionPlan;

  (window as unknown as {
    __cloaksight_buildReadyActionPlan?: typeof buildReadyActionPlan;
  }).__cloaksight_buildReadyActionPlan = buildReadyActionPlan;

  (window as unknown as {
    __cloaksight_AgentClient?: typeof AgentClient;
  }).__cloaksight_AgentClient = AgentClient;

  (window as unknown as {
    __cloaksight_runFullTask?: typeof runFullAutonomousTask;
  }).__cloaksight_runFullTask = runFullAutonomousTask;

  (window as unknown as {
    __cloaksight_executeAction?: typeof executeAction;
  }).__cloaksight_executeAction = executeAction;

  (window as unknown as {
    __cloaksight_executeActionPlan?: typeof executeActionPlan;
  }).__cloaksight_executeActionPlan = executeActionPlan;
}

/**
 * Run complete Phase 15 autonomous task loop:
 * 1. DOM Ingestion & Local PII Detection
 * 2. Semantic Tagging & RAM Vault Storage
 * 3. Sanitized Context & Agent Request Construction
 * 4. Outbound Leak Guard Inspection (Fail-closed)
 * 5. AI Reasoning via AgentClient (Ollama with Mock fallback)
 * 6. Action Plan Optimization & Safety Gating
 * 7. Live Action Dispatch & Local Value Re-hydration
 */
export async function runFullAutonomousTask(
  sessionId: UniqueId = `session_${Date.now()}`,
  task = "Fill travel details for Hotel stay with amount 4500 on 2026-09-12 and submit reimbursement"
): Promise<{
  ok: boolean;
  sessionId: string;
  piiCount: number;
  tagsCreated: number;
  piiCategories: string[];
  sanitizedCount: number;
  leakGuardPassed: boolean;
  leakGuardSummary: string;
  providerUsed: string;
  planActionCount: number;
  executionStatus: string;
  actionsExecuted: number;
  durationMs: number;
  error?: string;
}> {
  const startTime = performance.now();
  logger.info("Initiating autonomous CloakSight task", { sessionId, task });

  // 1. Ingestion, PII Detection, and Tag Vaulting
  const { snapshot, entities, tags, sanitizedElements } = await runLocalRedaction(sessionId);
  const piiTypes = Array.from(new Set(entities.map((e) => e.piiType)));

  // 2. Build cloud-safe AgentRequest
  const agentRequest = await buildAgentRequest(
    sessionId,
    task,
    sanitizedElements,
    snapshot.pageUrl,
    snapshot.pageTitle
  );

  // 3. Mandatory Outbound Leak Guard Inspection
  const leakCheck = await checkForLeaks(agentRequest, entities);
  if (!leakCheck.passed || leakCheck.shouldBlock) {
    logger.error("Leak Guard blocked autonomous task execution", {
      detectedPII: leakCheck.detectedPIITypes,
    });
    return {
      ok: false,
      sessionId,
      piiCount: entities.length,
      tagsCreated: tags.length,
      piiCategories: piiTypes,
      sanitizedCount: sanitizedElements.length,
      leakGuardPassed: false,
      leakGuardSummary: leakCheck.summary,
      providerUsed: "none (blocked)",
      planActionCount: 0,
      executionStatus: "blocked_by_leak_guard",
      actionsExecuted: 0,
      durationMs: Math.round(performance.now() - startTime),
      error: leakCheck.summary,
    };
  }

  // 4. Dispatch to Agent Client (Ollama / Mock)
  const client = new AgentClient({ provider: "ollama" });
  const agentResponse = await client.plan(agentRequest, entities);

  if (!agentResponse.actionPlan || !agentResponse.actionPlan.actions) {
    throw new Error("Agent failed to produce a structured action plan");
  }

  const providerUsed = client.getActiveProvider().name;

  // 5. Action Plan Optimization & Safety Gating
  const { plan: readyPlan } = buildReadyActionPlan(agentResponse);

  // 6. Execute Actions with Live DOM Synthetic Dispatch & Local Re-hydration
  const planResult = await executeActionPlan(readyPlan, sessionId, {
    autoConfirmDangerousActions: true,
    stepDelayMs: 100, // Cadence for visible interactive demonstration
  });

  const durationMs = Math.round(performance.now() - startTime);
  logger.info("Autonomous task completed", {
    sessionId,
    overallStatus: planResult.overallStatus,
    actionsExecuted: planResult.results.length,
    durationMs,
  });

  return {
    ok: planResult.overallStatus === "completed",
    sessionId,
    piiCount: entities.length,
    tagsCreated: tags.length,
    piiCategories: piiTypes,
    sanitizedCount: sanitizedElements.length,
    leakGuardPassed: true,
    leakGuardSummary: leakCheck.summary,
    providerUsed,
    planActionCount: readyPlan.actions.length,
    executionStatus: planResult.overallStatus,
    actionsExecuted: planResult.results.length,
    durationMs,
  };
}

// Listen for messages from the popup or background worker
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "INGEST_DOM") {
      const sessionId = message.sessionId || `session_${Date.now()}`;
      runLocalRedaction(sessionId)
        .then(({ snapshot, entities, tags, sanitizedElements }) => {
          const piiTypes = Array.from(new Set(entities.map((e) => e.piiType)));
          sendResponse({
            ok: true,
            elementCount: snapshot.elementCount,
            interactiveElementCount: snapshot.interactiveElementCount,
            piiCount: entities.length,
            tagsCreated: tags.length,
            sanitizedCount: sanitizedElements.length,
            piiCategories: piiTypes,
            title: snapshot.pageTitle,
            url: snapshot.pageUrl,
          });
        })
        .catch((err: Error) => {
          logger.error("Redaction pipeline failed", { error: err.message });
          sendResponse({ ok: false, error: err.message });
        });
      return true; // Keep message channel open for async sendResponse
    }

    if (message?.type === "RUN_FULL_TASK") {
      const sessionId = message.sessionId || `session_${Date.now()}`;
      const task =
        message.userTask ||
        "Fill travel details for Hotel stay with amount 4500 on 2026-09-12 and submit reimbursement";
      runFullAutonomousTask(sessionId, task)
        .then((result) => {
          sendResponse(result);
        })
        .catch((err: Error) => {
          logger.error("Autonomous task execution failed", { error: err.message });
          sendResponse({ ok: false, error: err.message });
        });
      return true;
    }

    return false;
  });
}
