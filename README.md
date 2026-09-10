# CloakSight

**On-device Visual Perception for Lightweight Browser Agents**

> SIH 26171 · Smart India Hackathon 2026  
> Theme: Smart Automation · Category: Software

---

## Problem Statement

Modern AI browser agents (LLM/VLM-powered tools that automate web tasks) require full access to browser content — DOM, screenshots, text — to understand and act on web pages.  
This creates a critical privacy gap:

> **Raw personal data (PII) flows unfiltered into cloud AI APIs.**

Fields such as employee names, Aadhaar numbers, bank accounts, PAN, salary, and medical data can be silently exposed to third-party AI services, often without the user's awareness.

---

## Motivation

CloakSight is a **local-first privacy firewall and perception layer** that sits between the browser and any cloud AI agent.

Key principles:

- **RAW PRIVATE DATA STAYS LOCAL.** The cloud AI never receives unredacted PII.
- **Task completion is preserved.** The cloud receives enough semantic context to plan and execute actions correctly.
- **Semantic tagging bridges the gap.** Real values are replaced by local tags (`TAG_001 → Rahul Sharma`). The cloud works with tags; the extension resolves them locally.
- **On-device perception.** DOM parsing, OCR, and visual detection run entirely within the browser extension via ONNX/WebGPU.

---

## Architecture Overview

```
USER
  ↓
BROWSER
  ↓
CLOAKSIGHT — LOCAL TRUSTED ZONE (extension)
  ├── Ingestion      : DOM · page text · screenshot
  ├── Perception     : OCR · visual detection · layout understanding
  ├── Privacy Layer  : PII detection · semantic redaction · visual masking
  ├── Context Builder: sanitized semantic context
  └── Leak Guard     : outbound PII scan before transmission
  ↓
══════════════════════════════
  PRIVACY BOUNDARY
══════════════════════════════
  ↓
CLOUD UNTRUSTED ZONE (FastAPI server → LLM/VLM)
  └── receives: sanitized context, semantic tags, task intent
  ↓
STRUCTURED ACTION PLAN (tags, not real values)
  ↓
CLOAKSIGHT — LOCAL ACTION DISPATCHER
  ├── TAG → real DOM element resolution
  ├── action validation
  └── browser event execution
  ↓
BROWSER
```

### Privacy Boundary

| Local Trusted Zone (Extension) | Cloud Untrusted Zone (Server + AI) |
|---|---|
| Raw DOM values | Sanitized semantic context |
| Raw page text | Non-sensitive page structure |
| Raw screenshots with PII | Semantic tags (`[TAG_001]`, `[PERSON_NAME]`) |
| OCR output | Task-relevant metadata |
| Detected PII entities | Structured action plans |
| TAG → real value mappings | — |
| Real user credentials | — |

**Target: Zero raw PII transmission through the CloakSight-controlled path.**

---

## Technology Stack

| Layer | Technology |
|---|---|
| Browser Extension | TypeScript · Chrome Extension · Manifest V3 |
| On-device ML | ONNX Runtime Web · WebGPU (primary) · WASM/CPU (fallback) |
| Backend | Python · FastAPI · Uvicorn |
| Frontend Tooling | Vite · npm |
| Testing (TS) | Vitest · Playwright |
| Testing (Python) | pytest |
| Package Mgmt | npm · uv/pip |

---

## Repository Structure

```
cloaksight/
├── extension/          Chrome extension (Manifest V3)
│   └── src/
│       ├── ingestion/  DOM + page + screenshot capture
│       ├── perception/ OCR + visual + layout (ONNX/WebGPU)
│       ├── privacy/    PII detection + redaction + leak guard
│       ├── context/    Sanitized context construction
│       ├── action/     Action dispatcher + TAG resolver
│       ├── storage/    Local vault + tag registry
│       ├── messaging/  Extension message bus
│       ├── models/     ONNX model registry
│       ├── types/      Shared TypeScript interfaces
│       ├── config/     Extension configuration
│       └── utils/      Logger + helpers
├── server/             FastAPI backend (cloud agent interface)
├── demo/               Fictional reimbursement portal (hackathon demo)
├── dashboard/          Developer privacy metrics dashboard
├── docs/               Architecture + threat model + API contract
├── scripts/            Build + dev tooling
└── tests/              E2E + fixtures
```

---

## Development Phases

| Phase | Description | Status |
|---|---|---|
| **Phase 0** | Architecture + repository foundation | ✅ Complete |
| **Phase 1** | Chrome extension skeleton + interfaces | ✅ Complete |
| Phase 2 | DOM ingestion + page perception | 🔜 Next |
| Phase 3 | Local PII detection + semantic redaction | ⬜ |
| Phase 4 | Screenshot + OCR + visual perception | ⬜ |
| Phase 5 | DOM + visual fusion | ⬜ |
| Phase 6 | Sanitized context generation + leak guard | ⬜ |
| Phase 7 | Cloud LLM/VLM reasoning integration | ⬜ |
| Phase 8 | TAG-based local action re-hydration | ⬜ |
| Phase 9 | Dashboard + privacy metrics | ⬜ |
| Phase 10 | Optimization (WebGPU, WASM, quantization) | ⬜ |
| Phase 11 | Hardening (prompt injection, confidence scoring) | ⬜ |

---

## Current Status

> **PHASE 0 + PHASE 1 COMPLETE**  
> Structure only — implementation intentionally not started.  
> All modules are scaffolded with interfaces and placeholder functions.  
> No real API keys, no real ML models, no real browser actions.

---

## Getting Started (Development)

```bash
# Install frontend dependencies
npm install

# Build extension (future)
npm run build:extension

# Start dev server
npm run dev

# Backend
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## Team

SIH 2026 · Team CloakSight

---

## License

MIT — see [LICENSE](./LICENSE)
