# CloakSight — Development Phases

> SIH 2026 · Phase Roadmap  
> **Master Source of Truth:** See [master-roadmap.md](file:///d:/SIH/CloakSight/docs/master-roadmap.md) for the complete 23-phase reference architecture and status tracker.

---

## Phase Overview

```
Phase 0  ─ Architecture + Repository Foundation       ✅ COMPLETE
Phase 1  ─ Chrome Extension Skeleton + Interfaces     ✅ COMPLETE
Phase 2  ─ DOM Ingestion + Page Perception            🔜 Next
Phase 3  ─ Local PII Detection + Semantic Redaction
Phase 4  ─ Screenshot + OCR + Visual Perception
Phase 5  ─ DOM + Visual Fusion
Phase 6  ─ Sanitized Context Generation + Leak Guard
Phase 7  ─ Cloud LLM/VLM Reasoning
Phase 8  ─ TAG-based Local Action Re-hydration
Phase 9  ─ Dashboard + Privacy Metrics
Phase 10 ─ Optimization
Phase 11 ─ Hardening
```

---

## Phase 0 — Architecture + Repository Foundation ✅

**Goal:** Create a clean, scalable project structure that allows any team member to begin implementation without restructuring.

**Deliverables:**
- [ ] Repository structure
- [ ] Root configuration files (`package.json`, `tsconfig.json`, `vitest.config.ts`)
- [ ] `.gitignore`, `.env.example`
- [ ] `docs/architecture.md`
- [ ] `docs/development.md`
- [ ] `docs/privacy-model.md`
- [ ] `docs/threat-model.md`
- [ ] `docs/api-contract.md`
- [ ] `docs/phases.md` (this file)
- [ ] `README.md`
- [ ] `LICENSE`

**Success criteria:**
- Any developer can clone the repo and understand the architecture within 30 minutes.
- No implementation exists yet.

---

## Phase 1 — Chrome Extension Skeleton + Interfaces ✅

**Goal:** Establish all module boundaries, TypeScript interfaces, and Manifest V3 skeleton.

**Deliverables:**
- [ ] `extension/manifest.json` (Manifest V3, minimal permissions)
- [ ] `extension/src/background/background.ts` (placeholder)
- [ ] `extension/src/content/content.ts` (placeholder)
- [ ] `extension/src/popup/` (HTML + CSS + TS placeholders)
- [ ] All `extension/src/ingestion/` modules (interface only)
- [ ] All `extension/src/perception/` modules (interface only)
- [ ] All `extension/src/privacy/` modules (interface only)
- [ ] All `extension/src/context/` modules (interface only)
- [ ] All `extension/src/action/` modules (interface only)
- [ ] All `extension/src/storage/` modules (interface only)
- [ ] All `extension/src/messaging/` modules (types + bus)
- [ ] All `extension/src/models/` modules (config only)
- [ ] All `extension/src/types/` interfaces
- [ ] `extension/src/config/config.ts`
- [ ] `extension/src/utils/` utilities
- [ ] `extension/tests/` placeholder test files
- [ ] `server/` FastAPI skeleton
- [ ] `demo/` placeholder files

**Success criteria:**
- `npm run typecheck` passes.
- Extension can be loaded into Chrome without errors.
- All modules export clear interfaces.

---

## Phase 2 — DOM Ingestion + Page Perception

**Goal:** Implement real DOM walking, text extraction, and layout extraction.

**Key tasks:**
- Implement `domParser.ts` — walk live DOM, handle shadow DOM, handle hidden fields.
- Implement `pageTextExtractor.ts` — visible text extraction with element context.
- Implement `layoutExtractor.ts` — bounding boxes, visibility, z-index.
- Wire content script → background messaging for page snapshot.
- Unit tests for DOM parsing.

**Dependencies:** Phase 1 complete.

---

## Phase 3 — Local PII Detection + Semantic Redaction

**Goal:** Implement local PII detection and semantic tagging using pattern matching and a lightweight NER model.

**Key tasks:**
- Implement `piiDetector.ts` — regex + NER-based detection.
- Implement `semanticTagger.ts` — tag generation and lifecycle.
- Implement `redactor.ts` — text and element-level redaction.
- Implement `storage/tagVault.ts` — secure local tag-to-value mapping.
- Implement `privacyPolicy.ts` — per-domain policy loading.
- Unit tests for detection and redaction.

**Dependencies:** Phase 2.  
**ML models:** Lightweight NER model for Indian PII (PAN, Aadhaar, phone patterns) — ONNX format, WASM backend.

---

## Phase 4 — Screenshot + OCR + Visual Perception

**Goal:** Add visual perception — screenshot capture, OCR, and visual sensitivity detection.

**Key tasks:**
- Implement `screenshotCapture.ts` — Chrome API screenshot with consent.
- Implement `ocrEngine.ts` — ONNX-based on-device OCR.
- Implement `visualDetector.ts` — detect sensitive visual regions (receipts, ID cards).
- Implement `visualMasker.ts` — pixel masking of sensitive regions.
- Unit tests for OCR and visual detection.

**Dependencies:** Phase 3.  
**ML models:** OCR model (ONNX), visual sensitivity classifier (ONNX).  
**WebGPU:** Primary backend; WASM fallback.

---

## Phase 5 — DOM + Visual Fusion

**Goal:** Combine DOM perception with visual perception for a unified understanding.

**Key tasks:**
- Implement `perceptionPipeline.ts` — orchestrate DOM + OCR + visual into unified `PerceptionResult`.
- Implement `elementClassifier.ts` — classify elements using combined DOM + visual signals.
- Align DOM bounding boxes with visual regions.
- Handle discrepancies between DOM text and OCR text.

**Dependencies:** Phase 4.

---

## Phase 6 — Sanitized Context Generation + Leak Guard

**Goal:** Build the full sanitized context pipeline and implement the Leak Guard.

**Key tasks:**
- Implement `contextBuilder.ts` — assemble `AgentRequest` from `SanitizedContext`.
- Implement `contextCompressor.ts` — compress context to reduce tokens.
- Implement `contextValidator.ts` — schema validation before transmission.
- Implement `leakGuard.ts` — outbound PII scan (regex + entity check).
- Integration tests: ensure raw PII cannot enter outbound payload.

**Dependencies:** Phase 5.

---

## Phase 7 — Cloud LLM/VLM Reasoning

**Goal:** Connect to a cloud AI provider and receive structured action plans.

**Key tasks:**
- Implement `server/app/agent/provider.py` — pluggable provider interface.
- Implement `server/app/agent/planner.py` — LLM/VLM call and response parsing.
- Implement `server/app/api/routes.py` — REST API endpoint.
- Wire extension → server → LLM → server → extension.
- Validate action plans returned by cloud.

**Dependencies:** Phase 6.  
**API keys:** Added to server `.env` only.

---

## Phase 8 — TAG-based Local Action Re-hydration

**Goal:** Implement the full action dispatcher — resolving tags to DOM elements and executing browser actions.

**Key tasks:**
- Implement `elementRegistry.ts` — live DOM element registration.
- Implement `tagResolver.ts` — tag → DOM element lookup.
- Implement `actionValidator.ts` — safety validation of each action.
- Implement `actionDispatcher.ts` — execute click, fill, select, scroll, submit.
- Handle dynamic DOM changes during execution.
- Integration test: end-to-end task completion on demo site.

**Dependencies:** Phase 7.

---

## Phase 9 — Dashboard + Privacy Metrics

**Goal:** Build a developer dashboard showing privacy metrics, redaction stats, and perception debug info.

**Key tasks:**
- Implement dashboard UI (Vite + TypeScript).
- Show: context reduction ratio, PII types detected, redaction log, action plan visualization.
- Session replay (anonymized) for debugging.
- Privacy report export.

**Dependencies:** Phase 8.

---

## Phase 10 — Optimization

**Goal:** Optimize for performance, model size, and device compatibility.

**Key tasks:**
- WebGPU backend tuning.
- WASM fallback optimization.
- Model quantization (INT8/FP16).
- Adaptive perception (skip heavy perception if page is simple).
- Context compression (smart summarization).
- Latency benchmarking.

**Dependencies:** Phase 9.

---

## Phase 11 — Hardening

**Goal:** Production-quality hardening for security, robustness, and adversarial scenarios.

**Key tasks:**
- Prompt injection resistance (instruction separation, model-level guardrails).
- Dynamic webpage handling (MutationObserver, re-perception triggers).
- Confidence scoring for all detection outputs.
- Fine-grained privacy policy controls.
- Full test suite (unit + integration + E2E).
- Security audit: review against threat model.
- Hackathon demo polish.

**Dependencies:** Phase 10.

---

## Milestone Summary

| Phase | Target | Key Output |
|---|---|---|
| 0 | Architecture | Repository foundation |
| 1 | Skeleton | Typed interfaces, Manifest V3 |
| 2 | Ingestion | Live DOM snapshot |
| 3 | Privacy | PII detection + redaction |
| 4 | Vision | OCR + visual detection |
| 5 | Fusion | Unified perception |
| 6 | Context | Leak-guarded outbound payload |
| 7 | Cloud | End-to-end LLM integration |
| 8 | Actions | Full browser automation |
| 9 | Dashboard | Developer + privacy UI |
| 10 | Optimize | Performance + WebGPU |
| 11 | Harden | Production-ready |
