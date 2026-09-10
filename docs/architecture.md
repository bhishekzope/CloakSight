# CloakSight — System Architecture

> Last updated: Phase 0 · SIH 2026

---

## 1. Overview

CloakSight is a **local-first privacy firewall and intelligent perception layer** that interposes between a user's browser and cloud AI agents (LLM/VLM-based browser automation systems).

The core guarantee:

> **Raw personally identifiable information (PII) must never leave the local trusted zone.**

The system achieves this through:

1. **On-device perception** — DOM parsing, OCR, visual detection run entirely inside the browser extension.
2. **Semantic redaction** — detected PII is replaced with local tags before any outbound transmission.
3. **Leak guard** — a final check that scans sanitized context before it is sent to the cloud.
4. **Local action re-hydration** — the cloud returns action plans with tags; the extension resolves tags back to real DOM elements and executes actions locally.

---

## 2. System Layers

### Layer 1 — Client Ingestion

**Location:** `extension/src/ingestion/`

**Responsibility:** Capture the complete state of the current browser page.

**Sub-modules:**
- `domParser.ts` — Walk the live DOM and build a structured `DOMElement` tree, preserving element roles, text content, attributes, and positions.
- `pageTextExtractor.ts` — Extract visible text from the page for NLP-based PII detection.
- `screenshotCapture.ts` — Capture full-page or viewport screenshots via Chrome Extension APIs for visual perception.
- `layoutExtractor.ts` — Extract spatial layout metadata (bounding boxes, z-index, visibility) for UI element understanding.

**Output:** `PageSnapshot` — a structured, local representation of the page state.

**Privacy rule:** All ingestion output stays local. No ingestion module transmits data externally.

---

### Layer 2 — On-device Perception

**Location:** `extension/src/perception/`

**Responsibility:** Analyse the `PageSnapshot` to produce enriched `PerceptionResult` objects — understanding what each element is, what it contains, and whether it looks sensitive.

**Sub-modules:**
- `visualDetector.ts` — Run ONNX-based visual models (WebGPU/WASM) to detect sensitive visual regions (receipts, ID cards, cheques).
- `ocrEngine.ts` — Run on-device OCR on screenshot regions to extract text from images and receipts.
- `elementClassifier.ts` — Classify DOM elements by semantic role (input field, bank field, address field, etc.).
- `perceptionPipeline.ts` — Orchestrate all perception sub-tasks into a single `PerceptionResult`.

**Output:** `PerceptionResult` containing enriched elements with classification labels and visual region annotations.

**Privacy rule:** All OCR output and detected text stays local. Raw OCR text must not be transmitted.

**Technology (future):**
- ONNX Runtime Web for model inference
- WebGPU backend (primary)
- WASM/CPU fallback
- Possible: Transformers.js, OpenCV.js, Tesseract.js

---

### Layer 3 — Privacy / Sanitization

**Location:** `extension/src/privacy/`

**Responsibility:** Detect PII in perceived content and produce a sanitized, tag-based representation.

**Sub-modules:**
- `piiDetector.ts` — Identify sensitive entities in text (NER-based or pattern-based). Produces `SensitiveEntity[]`.
- `redactor.ts` — Replace detected PII in the context with semantic placeholders or local tags. Produces `SanitizedElement[]`.
- `semanticTagger.ts` — Generate stable, opaque `SemanticTag` identifiers for detected entities. Manages tag lifecycle.
- `visualMasker.ts` — Apply pixel-level masking to screenshot regions containing PII before any visual context is transmitted.
- `privacyPolicy.ts` — Load and enforce per-user or per-domain privacy rules.
- `leakGuard.ts` — Final outbound scan. Answers: "Does this payload contain raw PII?" before allowing transmission.

**Output:** `SanitizedContext` — a redacted, tag-annotated representation of the page.

**Privacy rule:** The mapping from `SemanticTag → real value` is only accessible within this layer and `storage/tagVault.ts`. It is never serialised into the `SanitizedContext`.

---

### Layer 4 — Context Transformation

**Location:** `extension/src/context/`

**Responsibility:** Package the sanitized perception result into a structured `AgentRequest` suitable for cloud reasoning.

**Sub-modules:**
- `contextBuilder.ts` — Assemble `SanitizedContext` into an `AgentRequest`, selecting only task-relevant elements.
- `contextCompressor.ts` — Compress or summarize the context to reduce token usage for cloud AI (future).
- `contextValidator.ts` — Validate that the assembled context conforms to the `AgentRequest` schema before transmission.

**Output:** `AgentRequest` ready for cloud transmission (after passing Leak Guard).

---

### Layer 5 — Cloud Reasoning

**Location:** `server/` (FastAPI) + Cloud AI provider

**Responsibility:** Receive a sanitized `AgentRequest`, reason about the task, and return a structured `ActionPlan`.

**Key constraint:** The cloud receives **only** sanitized context. It plans actions using tags, not real values.

**Sub-modules:**
- `server/app/agent/agent.py` — Main cloud agent orchestrator.
- `server/app/agent/planner.py` — Action planning logic (LLM/VLM calls).
- `server/app/agent/provider.py` — Pluggable AI provider interface (OpenAI, Google, Anthropic, local).
- `server/app/api/routes.py` — REST endpoints for extension → server communication.

**Input:** `AgentRequest` (sanitized)  
**Output:** `AgentResponse` containing an `ActionPlan`

---

### Layer 6 — Local Action Dispatcher

**Location:** `extension/src/action/`

**Responsibility:** Receive the `ActionPlan` from the cloud, resolve semantic tags back to real DOM elements, validate each action, and execute browser events locally.

**Sub-modules:**
- `actionDispatcher.ts` — Top-level orchestrator. Iterates actions, dispatches each one.
- `actionValidator.ts` — Verify each action is safe, scoped to allowed elements, and conforms to schema.
- `elementRegistry.ts` — Maintain a live map of `ElementRegistryEntry` objects (tag → DOM element reference).
- `tagResolver.ts` — Resolve a `SemanticTag` or `TAG_XXX` string to a concrete DOM element via the registry.

**Privacy rule:** The `tagResolver` calls the local tag vault. The cloud-provided action plan is never allowed to reference raw values — it must use tags only. The dispatcher must reject any action that contains raw PII.

---

## 3. Data Flow

```
User issues task
      │
      ▼
Extension content script activates
      │
      ▼
[INGESTION]
  domParser         → structured DOM tree
  pageTextExtractor → raw visible text
  screenshotCapture → raw screenshot
  layoutExtractor   → bounding boxes / layout
      │
      ▼
[PERCEPTION]
  elementClassifier → element semantic roles
  ocrEngine         → text from images/receipts
  visualDetector    → sensitive visual regions detected
  perceptionPipeline → PerceptionResult
      │
      ▼
[PRIVACY / SANITIZATION]
  piiDetector       → SensitiveEntity[] (stays local)
  semanticTagger    → SemanticTag[] (vault mapping stays local)
  redactor          → SanitizedElement[]
  visualMasker      → masked screenshot regions
  leakGuard         → PASS / BLOCK
      │
      ▼
[CONTEXT TRANSFORMATION]
  contextBuilder    → AgentRequest (sanitized)
  contextCompressor → compressed (future)
  contextValidator  → schema validation
      │
      ▼
══════ PRIVACY BOUNDARY — nothing raw crosses here ══════
      │
      ▼
[CLOUD REASONING — FastAPI → LLM/VLM]
  receives sanitized context + task intent
  returns ActionPlan (tag-based)
      │
      ▼
══════ PRIVACY BOUNDARY ══════
      │
      ▼
[LOCAL ACTION DISPATCHER]
  tagResolver       → TAG_007 → real DOM element
  actionValidator   → safe? scoped? valid?
  actionDispatcher  → browser click / fill / scroll
      │
      ▼
Browser executes action
```

---

## 4. Extension Internal Messaging

**Location:** `extension/src/messaging/`

Chrome extensions communicate across contexts (background service worker, content scripts, popup) via message passing.

```
popup.ts ──────────────────────────► background.ts
content.ts ────────────────────────► background.ts
background.ts ─────────────────────► server (HTTP)
background.ts ─────────────────────► content.ts (action injection)
```

All messages are typed using `BrowserMessage` discriminated unions defined in `messaging/messageTypes.ts`.

---

## 5. Storage Architecture

**Location:** `extension/src/storage/`

- `localStore.ts` — General-purpose key/value store using Chrome Storage API. Stores user preferences, privacy policies, session metadata.
- `tagVault.ts` — Encrypted, session-scoped vault storing `SemanticTag → real value` mappings. **Never exposed outside the `storage/` module.**

---

## 6. Model Registry

**Location:** `extension/src/models/`

- `modelRegistry.ts` — Tracks available ONNX models, their load state, and device capabilities (WebGPU/WASM).
- `modelConfig.ts` — Static configuration for model paths, input shapes, quantization settings.

Models are loaded lazily. No models are downloaded in Phase 0/1.

---

## 7. Communication Security Notes

- The server-side API (`server/app/api/routes.py`) must only accept requests from the extension origin.
- CORS is restricted to `chrome-extension://*`.
- The extension must never store the cloud API key locally; it is only used server-side.
- All payloads must be validated against schemas on both sides.

---

## 8. Architectural Constraints (Non-negotiable)

| ID | Constraint |
|---|---|
| AC-01 | Raw DOM values never enter `AgentRequest` |
| AC-02 | Raw screenshots with PII never enter `AgentRequest` |
| AC-03 | TAG → real value mapping never serialized outside `storage/tagVault.ts` |
| AC-04 | `leakGuard` must gate every outbound transmission |
| AC-05 | Cloud API keys stored server-side only, never in extension |
| AC-06 | Action plans must use tags; raw values in action plans must be rejected |
| AC-07 | All perception runs locally (extension sandbox) |
| AC-08 | ONNX models run via WebGPU or WASM; no remote inference |
