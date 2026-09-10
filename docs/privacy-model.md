# CloakSight — Privacy Model

> Defines the privacy guarantee, trust boundaries, and data handling rules.

---

## 1. Core Privacy Principle

> **RAW PRIVATE DATA MUST STAY LOCAL.**

The cloud AI agent should receive only sanitized, task-relevant semantic context — enough information to understand the page and plan correct actions, but never the actual sensitive values.

---

## 2. Trust Zones

### LOCAL TRUSTED ZONE (Chrome Extension)

The extension runs in the browser's sandboxed extension environment. This zone is considered trusted because:

- It runs on the user's device.
- It cannot be accessed by the cloud AI.
- Chrome extension sandboxing isolates it from the webpage.
- The user explicitly installs and authorizes it.

**Data that MUST remain in the local trusted zone:**

| Data Type | Examples |
|---|---|
| Raw DOM text values | `Rahul Sharma`, `rahul@company.com` |
| Raw page screenshots | Any screenshot containing PII |
| Raw OCR output | Text extracted from receipts, IDs |
| Detected PII entities | `SensitiveEntity` objects |
| Real user credentials | Passwords, tokens |
| TAG → real value mappings | `TAG_001 → "Rahul Sharma"` |
| Tag vault contents | All `tagVault` entries |
| PAN / Aadhaar / Bank details | Any regulatory-protected data |

### CLOUD UNTRUSTED ZONE (FastAPI Server + LLM/VLM)

The cloud zone is considered **untrusted** — not because it is adversarial, but because:

- It is outside the user's device.
- Data sent to it may be logged by third-party AI providers.
- Regulatory requirements (DPDP Act, GDPR) may restrict cross-border PII transfer.
- The user should not need to trust the cloud AI with their raw personal data.

**Data ALLOWED in the cloud zone:**

| Data Type | Examples |
|---|---|
| Sanitized page structure | Element types, roles, positions |
| Semantic tags | `[TAG_001]`, `[PERSON_NAME]`, `[EMAIL_FIELD]` |
| Task intent | "Submit the reimbursement form" |
| Non-sensitive field values | Travel category: "Hotel", Amount: "5000" |
| Element layout metadata | "Input field at position (x, y), role: submit" |
| Structured action plans | `{type: "fill", target: "TAG_008", value: "Hotel"}` |

---

## 3. Semantic Tagging Model

Semantic tagging is the mechanism by which CloakSight replaces real values with opaque local identifiers.

### Tag Generation

```
Real value: "Rahul Sharma"
         │
         ▼
piiDetector detects: PIIType = "PERSON_NAME"
         │
         ▼
semanticTagger generates:
  tag_id: "TAG_001"
  semantic_label: "[PERSON_NAME]"
  original_value: "Rahul Sharma"  ← STAYS LOCAL
         │
         ▼
Outbound context sees: "[PERSON_NAME]" or "TAG_001"
         │
         ▼
elementRegistry maps: TAG_001 → real DOM <input> element
```

### Tag Lifecycle

1. **Creation** — At the start of each perception session, tags are generated fresh.
2. **Storage** — Stored in `storage/tagVault.ts` (session-scoped, in-memory or encrypted local).
3. **Usage** — The cloud action plan references tags by ID.
4. **Resolution** — `action/tagResolver.ts` looks up the DOM element for each tag.
5. **Expiry** — Tags expire at session end or when the page navigates away.

### Tag Scope

Tags are **page-session-scoped**. They must not persist across navigations without explicit user consent. This prevents tag replay attacks.

---

## 4. Visual Privacy

For screenshot-based perception (Phase 4+):

- Screenshots are captured locally.
- Visual PII detection runs locally (ONNX/WebGPU).
- Detected sensitive regions (faces, ID cards, bank statements, receipts) are masked with pixel-level overlays before any image data is considered for cloud transmission.
- **Masked screenshots may be transmitted** (e.g., for layout understanding), but only after the visual masking step passes.
- Raw unmasked screenshots must never be transmitted.

---

## 5. Leak Guard

The Leak Guard is the **final outbound gate** — the last line of defense before any data leaves the local zone.

**Position in pipeline:**
```
sanitized context → LEAK GUARD → (PASS) → cloud
                              → (BLOCK) → user notified
```

**What the Leak Guard checks:**

1. Does the payload contain patterns matching known PII formats? (Regex scan)
2. Does the payload contain any `SensitiveEntity` from the current session?
3. Does the payload contain any TAG vault entry values?
4. Is the context reduction percentage above the minimum threshold?

**Blocking:**
If the Leak Guard detects potential PII, it must block transmission and report to the user. The block must not be bypassed automatically.

**Target:** Zero raw PII transmission through the CloakSight-controlled path.

*(This is a target, not a guarantee. The system provides defense-in-depth. Leak Guard is one layer.)*

---

## 6. Privacy Policy Engine

**Location:** `extension/src/privacy/privacyPolicy.ts`

The privacy policy engine allows per-domain and per-user customization of:

- Which PII types trigger redaction.
- Which fields are always redacted regardless of detection confidence.
- Which domains receive additional scrutiny.
- Minimum confidence thresholds for PII detection.

**Default policy:** Redact all known PII types with confidence above threshold.

---

## 7. Regulatory Context

CloakSight is designed with awareness of:

| Regulation | Relevance |
|---|---|
| India DPDP Act 2023 | Governs personal data processing in India |
| GDPR | Applicable if EU users are involved |
| PCI DSS | Relevant for credit card / bank data handling |
| RBI Guidelines | Relevant for Indian financial data |

CloakSight does not claim compliance certification. It is designed to make compliance easier by minimizing PII exposure to cloud services.

---

## 8. Non-Goals (What CloakSight Does NOT Guarantee)

- CloakSight does **not** guarantee zero data leakage from the OS, network, or browser itself.
- CloakSight does **not** protect against a compromised browser.
- CloakSight does **not** protect against a malicious website that exfiltrates data directly (outside the extension path).
- CloakSight does **not** audit cloud AI provider data retention policies.
- CloakSight does **not** encrypt data at rest in the browser (beyond Chrome's built-in extension storage encryption).
