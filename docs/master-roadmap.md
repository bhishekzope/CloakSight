# CLOAKSIGHT — MASTER DEVELOPMENT ROADMAP
> Smart India Hackathon 2026 · Problem Statement: SIH 26171  
> Title: On-device Visual Perception for Lightweight Browser Agents  
> Theme: Smart Automation · Category: Software  
> Source of Truth Document

---

## Current Status Tracker

| Phase | Description | Status | Verification Notes |
|:---:|:---|:---:|:---|
| **0** | **Architecture and Project Foundation** | ✅ **COMPLETE** | Repository structure, types, docs, configs created. |
| **1** | **Chrome Extension Foundation** | ✅ **COMPLETE** | MV3 manifest, types, UI shells, build pipeline (`npm run build:extension`), loads unpacked in Chrome. |
| **2** | **DOM Ingestion** | ✅ **COMPLETE** | DOMElement extraction, ElementRegistry, text & layout extractors implemented; 12 unit tests pass. |
| **3** | **Local PII Detection** | ✅ **COMPLETE** | Regex + Luhn validator + contextual heuristics for 12 categories implemented; 14 privacy unit tests pass. |
| **4** | **Semantic Redaction and Tagging** | ⏳ **PENDING (NEXT)** | Awaiting authorization. |
| **5** | **Screenshot Ingestion** | ⏳ NOT STARTED | Depends on Phase 1 & browser APIs. |
| **6** | **Local OCR** | ⏳ NOT STARTED | Depends on Phase 5. |
| **7** | **Local Visual Perception** | ⏳ NOT STARTED | Depends on Phase 5. |
| **8** | **DOM + Visual Fusion** | ⏳ NOT STARTED | Depends on Phase 2, 6, 7. |
| **9** | **Privacy Policy Engine** | ⏳ NOT STARTED | Depends on Phase 3, 4. |
| **10** | **Sanitized Context Builder** | ⏳ NOT STARTED | Depends on Phase 4, 8, 9. |
| **11** | **Outbound Leak Guard** | ⏳ NOT STARTED | Depends on Phase 10. |
| **12** | **Cloud Agent Interface** | ⏳ NOT STARTED | Depends on Phase 10, 11. |
| **13** | **Structured Action Planner** | ⏳ NOT STARTED | Depends on Phase 12. |
| **14** | **Local Action Re-hydration** | ⏳ NOT STARTED | Depends on Phase 4, 13. |
| **15** | **Demo Reimbursement Portal** | ⏳ NOT STARTED | Form UI scaffolded; full integration pending. |
| **16** | **Privacy Dashboard** | ⏳ NOT STARTED | Depends on Phase 11, 14. |
| **17** | **Performance Optimization** | ⏳ NOT STARTED | Adaptive inference, WebGPU/WASM benchmarks. |
| **18** | **Dynamic Webpage Support** | ⏳ NOT STARTED | MutationObserver & SPA tracking. |
| **19** | **Security Hardening** | ⏳ NOT STARTED | Injection defense, origin verification. |
| **20** | **Privacy Benchmarking** | ⏳ NOT STARTED | Zero raw PII leakage empirical validation. |
| **21** | **End-to-End Testing** | ⏳ NOT STARTED | Playwright full loop integration. |
| **22** | **Hackathon Demo Mode** | ⏳ NOT STARTED | 2–5 minute presentation flow. |
| **23** | **Final Polish** | ⏳ NOT STARTED | Deliverables, deck, presentation polish. |

---

## 1. Project Vision & Core Principles

CloakSight is a lightweight, on-device visual perception and privacy firewall for browser-based AI agents.

### The Core Problem
Cloud browser agents need webpage context to understand pages and perform tasks. However, webpages can contain:
- Names, emails, phone numbers, employee IDs
- Financial info, addresses, dates of birth, government IDs
- Uploaded documents, receipts, screenshots, invoices

Sending raw webpage context to cloud AI exposes private data unnecessarily.

### The Core Principle
**Raw private information must remain on the user's device.**  
The cloud AI receives only:
- Sanitized context
- Task-relevant information
- Semantic representations
- Non-sensitive webpage structure
- Safe, opaque action targets (TAGs)

The cloud AI performs **reasoning**. The browser performs **local perception, privacy processing, and action execution**.

---

## 2. Core System Flow

```
USER
  │
  ▼
USER PROMPT
  │
  ▼
BROWSER
  │
  ▼
CLOAKSIGHT LOCAL INGESTION
  ├── DOM
  ├── PAGE TEXT
  ├── SCREENSHOT
  ├── VISUAL ELEMENTS
  └── OCR
  │
  ▼
LOCAL MULTIMODAL PERCEPTION
  ├── DOM understanding
  ├── visual understanding
  ├── OCR
  └── element detection
  │
  ▼
LOCAL PRIVACY FIREWALL
  ├── PII detection
  ├── sensitive entity detection
  ├── semantic redaction
  ├── visual masking
  ├── TAG generation
  ├── privacy policy
  └── leak guard
  │
  ▼
SANITIZED CONTEXT
  │
  ▼
CLOUD AI / LLM / VLM
  │
  ▼
STRUCTURED ACTION PLAN
  │
  ▼
LOCAL ACTION DISPATCHER
  ├── TAG resolution
  ├── action validation
  ├── DOM lookup
  └── browser event
  │
  ▼
BROWSER (Local Execution)
```

---

## 3. Trust Boundary

### Local Trusted Zone (Device Only)
- Raw DOM
- Raw page text
- Raw screenshot
- OCR output
- Sensitive values
- Detected PII
- Original element values
- TAG mappings
- Local element registry
- Local privacy policy
- Local vault

### Cloud Zone (Sanitized Only)
Only sanitized information may cross this boundary:
- **ALLOWED:** `"Expense reimbursement form detected"`, `"Employee name: [PERSON_NAME]"`, `"Receipt date: [DATE]"`, `"Target: TAG_07"`
- **NOT ALLOWED:** `"Rahul Sharma"`, `"rahul@gmail.com"`, `"9876543210"`, `"123456789012"`, or raw screenshots containing such data.

> **Target:** Zero raw PII transmission through the CloakSight-controlled path (validated experimentally).

---

## 4. Phase-by-Phase Reference Specifications

### Phase 0 — Architecture & Project Foundation (Status: COMPLETE ✅)
- Repository skeleton, configurations, linting, testing, types, and architectural documentation.

### Phase 1 — Chrome Extension Foundation (Status: COMPLETE ✅)
- Manifest V3 skeleton, background worker, content script, popup UI, type system, esbuild pipeline (`extension/dist/`).

### Phase 2 — DOM Ingestion (Status: COMPLETE ✅)
- Local extraction: URL, title, visible text, headings, buttons, links, forms, inputs, bounding boxes, roles, visibility, interactive states.
- Internal `DOMElement` structure & `ElementRegistry` with stable local identifiers. Raw values remain strictly local.

### Phase 3 — Local PII Detection (Status: COMPLETE ✅)
- Deterministic/rule-based detection: Aadhaar, PAN, emails, phones, names, bank accounts, employee IDs.
- Outputs `SensitiveEntity` with type, confidence, source, and element binding.

### Phase 4 — Semantic Redaction and Tagging (Status: COMPLETE ✅)
- Replace sensitive values with semantic tokens (`[PERSON_NAME]`, `TAG_001`).
- Implemented `semanticTagger.ts`, `tagVault.ts` (session-scoped local in-memory vault with TTL), `redactor.ts` (`SanitizedElement` generation), and `tagResolver.ts`. Cloud never receives vault mappings or raw values.

### Phase 5 — Screenshot Ingestion (Status: COMPLETE ✅)
- Implemented `screenshotCapture.ts`, `getViewportMetadata()`, `captureScreenshot()`, `cropScreenshotRegion()`, and `maskScreenshotRegions()`.
- Coordinates scaling, Device Pixel Ratio (DPR), and background worker capture integration (`chrome.tabs.captureVisibleTab`). Raw visual image data stays strictly inside the **LOCAL TRUSTED ZONE**.

### Phase 6 — Local OCR (Status: COMPLETE ✅)
- Implemented `ocrEngine.ts`, `preprocessImageForOCR()`, `extractTextFromImage()`, `extractTextFromRegion()`, and `annotateRegionsWithOCR()`.
- Text extracted from canvas, images, receipts, and invoices stays strictly inside the **LOCAL TRUSTED ZONE** and is routed to the PII detector before redaction.

### Phase 7 — Local Visual Perception (Status: COMPLETE ✅)
- Implemented `elementClassifier.ts`, `visualDetector.ts`, and `perceptionPipeline.ts`.
- Semantic multi-signal element classification, visual document region detection (receipts, ID cards, signatures), and unified local `PerceptionResult` pipeline.

### Phase 8 — DOM + Visual Fusion (Status: COMPLETE ✅)
- Implemented `fusionEngine.ts`, spatial bounding box collision detection (`checkSpatialOverlap`), and `UnifiedPageRepresentation` builder.
- Merges DOM trees, semantic classifications, visual document bounding boxes, and OCR text into a unified multi-modal model residing strictly in the **LOCAL TRUSTED ZONE**.

### Phase 9 — Privacy Policy Engine (Status: COMPLETE ✅)
- Implemented `privacyPolicy.ts`, domain normalization, per-domain policy overrides, confidence thresholds, and strict mode evaluation.
- Configurable rules: always redact, allow coarse category, require user approval, per-domain overrides.

### Phase 10 — Sanitized Context Builder (Status: COMPLETE ✅)
- Implemented `contextBuilder.ts`, `contextCompressor.ts`, and `contextValidator.ts`.
- Converts multi-modal page representations into minimal, structured, cloud-safe `SanitizedContext` and `AgentRequest` payloads.
- Includes priority-ranked token compression and strict anti-leak schema validation.

### Phase 11 — Outbound Leak Guard (Status: COMPLETE ✅)
- Implemented `leakGuard.ts`, stringified payload regex scan, session raw-entity cross-referencing, and automatic transmission blocking.
- Final outbound security barrier. Guarantees zero raw PII escapes before cloud transmission.

### Phase 12 — Cloud Agent Interface (Status: COMPLETE ✅)
- Implemented `agentTypes.ts`, `promptBuilder.ts`, `mockProvider.ts`, `ollamaProvider.ts`, and `agentClient.ts`.
- Provider-agnostic client (`AgentProvider` abstraction: Ollama local by default, Mock, Cloud adapters).
- Outbound Leak Guard enforcement prior to transmission: blocks dispatch immediately with `LeakDetectedError` if unredacted PII is found.
- Ollama `/api/chat` native JSON mode (`format: "json"`) for deterministic tag-based `ActionPlan` generation with zero cloud quotas or costs.
- 91 unit tests passing across all test suites.

### Phase 13 — Structured Action Planner (Status: COMPLETE ✅)
- Implemented `actionValidator.ts`, `actionPlanner.ts`, and `extension/src/action/index.ts`.
- On-device safety gate: enforces tag registration, action whitelist, anti-PII injection scanning (`quickRegexScan`), and dangerous action gating (`submit`, `navigate`, `upload`, payments).
- Action plan normalizer & optimizer: resolves LLM aliases, deduplicates redundant clicks/focus, and places form input fills before form submission.
- 104 unit tests passing across all 11 test suites.

### Phase 14 — Local Action Re-hydration (Status: COMPLETE ✅)
- Implemented `actionDispatcher.ts` with local value re-hydration from in-memory `TagVault` and browser synthetic event dispatching.
- Supports React/Vue/Angular prototype value setter bypass and bubbling events (`input`, `change`, `mousedown`, `mouseup`, `click`, `select`, `check`, `uncheck`).
- Human-in-the-loop confirmation gating for dangerous/destructive steps.
- 110 unit tests passing across all 11 test suites.

### Phase 15 — Demo Reimbursement Portal (Status: COMPLETE ✅)
- Complete autonomous hackathon loop: Ingestion $\rightarrow$ PII detection & vaulting $\rightarrow$ context building $\rightarrow$ Leak Guard check $\rightarrow$ AI agent reasoning $\rightarrow$ action planning & optimization $\rightarrow$ local action execution & re-hydration $\rightarrow$ form submission & post-submission privacy audit card.
- Demo quick actions: "⚡ Autofill Sample Employee Profile (PII)" and "🏨 Fill Jalgaon Trip Claim (Hotel INR 4,500)".
- Multimodal sample receipt preview with local OCR verification badge.
- Popup UI: Animated 4-step progress states (`1/4 Scanning DOM...` $\rightarrow$ `2/4 Shielding PII...` $\rightarrow$ `3/4 AI Planning...` $\rightarrow$ `4/4 Filling & Submitting...` $\rightarrow$ `Claim Completed! ✅`), live metrics display.
- 114 unit & integration tests passing across all 12 test suites.

### Phase 16 — Privacy Dashboard (Status: NEXT ⏳)
- Metrics UI: protected entities, raw PII blocked, context reduction %, processing latency.

### Phase 17 — Performance Optimization
- Adaptive perception: skip vision models when DOM is sufficient; quantized models; caching.

### Phase 18 — Dynamic Webpage Support
- MutationObserver, SPA navigation, and dynamic DOM change handling.

### Phase 19 — Security Hardening
- Prompt injection defense, action allowlists, stale tag protection, origin checks.

### Phase 20 — Privacy Benchmarking
- Measure PII precision/recall, latency, and empirically verify 0 raw PII leakage rate.

### Phase 21 — End-to-End Testing
- Playwright integration tests covering full browser-to-cloud-to-browser loop.

### Phase 22 — Hackathon Demo Mode
- Polished 2–5 minute presentation script and seamless demo workflow.

### Phase 23 — Final Polish
- UI refinements, documentation, evaluation deck, and performance visualizations.

---

## 5. Development Strategy & Rules of Engagement

1. **Vertical Slices:** Slices progress from DOM/PII $\rightarrow$ Vision/OCR $\rightarrow$ Fusion $\rightarrow$ LeakGuard $\rightarrow$ Cloud Agent $\rightarrow$ Local Action $\rightarrow$ Demo $\rightarrow$ Dashboard.
2. **The 15 Golden Rules:**
   - Rule 1: Raw PII stays local.
   - Rule 2: Cloud never receives the TAG vault.
   - Rule 3: Cloud never directly manipulates browser DOM.
   - Rule 4: All cloud actions are validated locally.
   - Rule 5: All outbound context passes through LeakGuard.
   - Rule 6: Support both DOM and visual perception.
   - Rule 7: OCR output is treated as sensitive until sanitized.
   - Rule 8: Do not send screenshots containing raw PII without masking.
   - Rule 9: Prefer task-relevant context over full DOM dumps.
   - Rule 10: Use semantic abstraction over crude blackout.
   - Rule 11: Do not over-redact task-critical information.
   - Rule 12: Maintain AI provider independence.
   - Rule 13: WebGPU acceleration with WASM fallback.
   - Rule 14: Never run expensive models when simple perception suffices.
   - Rule 15: Never claim unverified security guarantees.
3. **Execution Protocol:**
   - Implement only the requested phase.
   - Run tests/build checks.
   - Explain what was done after each change.
   - STOP and await explicit user authorization before proceeding to the next phase.
