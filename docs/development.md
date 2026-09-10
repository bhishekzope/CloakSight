# CloakSight — Development Guide

> Phase 0 · SIH 2026

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.0.0 | LTS recommended |
| npm | ≥ 9.0.0 | Bundled with Node |
| Python | ≥ 3.11 | For FastAPI server |
| Chrome | Latest stable | For extension development |
| Git | Any | Version control |

---

## Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-org/cloaksight.git
cd cloaksight

# Copy environment template
cp .env.example .env
# Edit .env with your values (never commit .env)

# Install Node dependencies
npm install

# Python virtual environment
cd server
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

---

## Project Structure at a Glance

```
cloaksight/
├── extension/     Chrome extension (TypeScript)
├── server/        FastAPI backend (Python)
├── demo/          Demonstration website
├── dashboard/     Developer debugging UI
├── docs/          Architecture documentation
├── scripts/       Build and dev scripts
└── tests/         E2E test suite
```

---

## Extension Development

### Loading the Extension in Chrome

1. Run `npm run build:extension` *(once implemented in Phase 2+)*
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `extension/dist/` directory

### TypeScript Compilation

```bash
# Type-check only (no emit)
npm run typecheck

# Watch mode
npx tsc --watch --noEmit
```

### Running Unit Tests

```bash
npm test
# or
npm run test:watch
```

### Running E2E Tests (Phase 11+)

```bash
npm run test:e2e
```

---

## Server Development

```bash
cd server
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Start development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Run Python tests
pytest tests/ -v
```

---

## Module Ownership (Recommended Split)

| Module | Location | Recommended Owner |
|---|---|---|
| Ingestion | `extension/src/ingestion/` | Member A |
| Perception (DOM) | `extension/src/perception/` | Member A |
| Perception (Visual/OCR) | `extension/src/perception/` | Member B |
| Privacy / PII | `extension/src/privacy/` | Member C |
| Context Builder | `extension/src/context/` | Member C |
| Action Dispatcher | `extension/src/action/` | Member D |
| Cloud Agent (server) | `server/app/agent/` | Member E |
| Dashboard | `dashboard/` | Member F |
| Demo Site | `demo/` | Any |
| Tests / QA | `tests/`, `extension/tests/` | All |

---

## Coding Conventions

### TypeScript

- **Strict mode** is enabled. All types must be explicit.
- Use `interface` for object shapes, `type` for unions/aliases.
- Use discriminated unions for message types and action types.
- Use `TODO(phase-N):` comments for unimplemented code.
- Placeholder functions must throw `new Error("Not implemented")`.
- Do **not** use `any`. Use `unknown` with type guards.
- Prefer `const` over `let`. Never use `var`.

### Python

- Use type hints everywhere.
- Use Pydantic models for all request/response schemas.
- Follow PEP 8.
- Use `TODO:` comments for unimplemented logic.
- Never log raw PII values.

### Privacy Rules

- Never `console.log` raw PII in extension code.
- Never serialize a `SensitiveEntity` into any outbound message.
- Never include tag vault contents in any log or debug output.
- The `SanitizedContext` must never contain fields named `rawValue`, `originalValue`, or equivalent.

---

## Adding a New Module

1. Create the TypeScript file in the appropriate `extension/src/<layer>/` directory.
2. Add corresponding types to `extension/src/types/`.
3. Export from the barrel file (`extension/src/types/index.ts`).
4. Add a placeholder test file in `extension/tests/<layer>/`.
5. Update `docs/architecture.md` if the module introduces a new architectural concept.

---

## Dependency Policy

### Allowed (Phase 0/1)
- TypeScript type definitions only (`@types/*`)
- Dev tooling (Vitest, Playwright, ESLint, Prettier, ts-node)
- Chrome Extension types (`@types/chrome`)

### Not yet allowed
- ONNX Runtime Web (Phase 4+)
- Transformers.js (Phase 4+)
- OpenCV.js (Phase 4+)
- Tesseract.js (Phase 4+)
- Any cloud SDK or LLM client library

### Never allowed in the extension
- Cloud API keys or secrets
- Any module that sends data directly to a cloud AI without passing through the Leak Guard

---

## Debugging

### Extension Debugging
- Background service worker: `chrome://extensions` → "Inspect views: Service Worker"
- Content script: DevTools on the target page → Sources → Content Scripts
- Popup: Right-click extension icon → Inspect

### Privacy Debugging (Phase 9+)
- Open the CloakSight dashboard (`npm run dev --workspace=dashboard`)
- View redaction logs, TAG mappings (local only), and context diffs

---

## Commit Message Convention

```
<type>(<scope>): <short description>

Types: feat | fix | docs | test | refactor | chore
Scopes: extension | server | dashboard | demo | docs | scripts

Examples:
  feat(extension): add DOM parser interface
  docs(architecture): update privacy boundary diagram
  chore(scripts): add build-extension scaffold
```
