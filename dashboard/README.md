# CloakSight — On-Device Privacy Firewall for Browser Agents

> **CloakSight Engine** · **On-Device Visual Perception & Privacy Security Suite**  
> **Architecture:** Zero-Leakage Edge Firewall for Autonomous Web Agents  

---

## 1. Project Goal

**CloakSight** is an on-device privacy firewall for autonomous browser agents. It intercepts browser agent workflows locally:
1. Inspects webpage structure and visual regions on-device in volatile client memory.
2. Detects sensitive personal identifiable information (PII) using local regex, context analysis, and OCR heuristics.
3. Vaults raw secrets in volatile RAM with TTL and replaces them with opaque semantic tags (`TAG_001`..`TAG_006`).
4. Performs pre-flight airgap inspection (**Outbound LeakGuard**) with fail-closed defense.
5. Passes sanitized structural context and opaque canvas-masked visual screenshots to AI models.
6. Executes approved action plans locally with local value re-hydration and human-in-the-loop safety gates.

This dashboard provides a comprehensive visual demonstration of the zero-data-leakage architecture.

---

## 2. Technology Stack

- **Framework:** React 18 + TypeScript 5.5
- **Bundler / Dev Server:** Vite 5.2
- **Styling:** Tailwind CSS 3.4 (Cybersecurity Dark Navy theme, glassmorphism, responsive layout)
- **Icons:** Lucide React
- **Animations:** Framer Motion & CSS keyframe scanners
- **Analytics Charts:** Recharts 2.12
- **State Management:** Centralized React Context (`DemoContext`) with zero persistence to `localStorage`

---

## 3. Quick Start & Setup Instructions

### Option A: From Repository Root
```bash
# Start development server
npm run dashboard:dev

# Build production bundle
npm run dashboard:build
```

### Option B: From `dashboard/` Directory
```bash
cd dashboard

# Install dependencies (already installed)
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build
```

The prototype will be live at: **`http://localhost:5173/`**

---

## 4. Key Interactive Demonstration Features

### A. Overview & Pipeline (`/overview`)
- Concise architectural explanation of CloakSight.
- 6-stage interactive visual pipeline cards.
- **Local Trusted Zone vs. External AI Zone** side-by-side comparison.
- Real-time demo counters (detected entities, vaulted tags, LeakGuard status, planned actions).
- **"Run CloakSight Demo"** CTA button and **"Simulate PII Leak"** quick trigger.

### B. Live Perception (`/perception`)
- Realistic fictional enterprise reimbursement portal form:
  - Employee info: Name, Employee ID, Email, Phone.
  - Banking details: Account Number, IFSC Code.
  - Travel info: Expense Category dropdown, Date, Amount, Description.
  - Attached receipt document (Hotel Grand Palace, Jalgaon, INR 4,500).
- **"⚡ Autofill Employee Profile"** and **"🏨 Populate Hotel Claim"** buttons.
- Real-time perception telemetry panel with detection method badges (`Pattern`, `DOM Context`, `OCR Simulation`, `Visual Region`).
- Interactive toggle for **Field Bounding Overlays**.

### C. Visual Redaction (`/redaction`)
- Demonstrates on-device canvas-level visual masking for Multimodal Vision-Language Models.
- Interactive Image Redaction Studio featuring **Expense Receipts** and **Employee Security Badges**.
- Side-by-side comparison, interactive before/after split slider, and active coordinate region inspector.
- Solid opaque rectangles physically covering sensitive coordinates with high-contrast semantic labels (`[PHOTO_AVATAR]`, `[PERSON_NAME]`, `[TAX_ID]`, `[TOTAL_AMOUNT]`).

### D. Privacy Firewall (`/firewall`)
- **Sanitized JSON Payload Viewer:** Syntax-highlighted view of the exact context crossing the trust boundary.
- **Outbound LeakGuard Inspector:** Multi-layer verification breakdown:
  - *Layer 1: Vault Secret Cross-Reference*
  - *Layer 2A: Email Pattern Scan*
  - *Layer 2B: Phone Pattern Scan*
  - *Layer 2C: Financial Account Scan*
- **"Simulate PII Leak"** button: Injects a raw email secret, causing LeakGuard to immediately switch to **BLOCKED** and halt simulated AI execution.
- **"Restore Safe Payload"** button: Re-sanitizes and restores the cleared state.
- **In-Memory Semantic Tag Vault Table:** Transparent mapping of opaque tags to original form fields.

### E. Agent Execution (`/agent`)
- User Directive: *"Submit the hotel reimbursement for the selected trip."*
- Structured 5-step action plan with risk classifications (`safe`, `sensitive`, `dangerous`).
- **Human-in-the-Loop Safety Gate:** Confirmation modal before executing the dangerous final submit step.
- Real-time synchronization: Executing action steps visibly populates the form in real time.

### F. Audit & Metrics (`/audit`)
- Chronological event timeline ledger logging every pipeline transition.
- Recharts analytics:
  - **Token Compression:** ~2,450 raw tokens ➔ ~320 sanitized tokens (~87% compression).
  - **PII Category Distribution:** Breakdown across 6 supported categories.
- Session counters (detected, redacted, LeakGuard checks passed/blocked, actions completed).

### G. End-to-End Orchestrator (Global Bottom Bar)
- Automated 11-stage demo runner advancing through:
  1. Init ➔ 2. Inspect ➔ 3. Detect ➔ 4. Tag ➔ 5. Sanitize ➔ 6. LeakGuard ➔ 7. Dispatch Context ➔ 8. Plan ➔ 9. Safety Gate ➔ 10. Execute ➔ 11. Final Audit.
- Play, Pause, Step Next, Reset controls, and speed multiplier (0.5x, 1x, 2x).
- **Fail-Closed Gate:** Automatically pauses and blocks execution if a simulated PII leak is active.

---

## 5. Honest List of Implemented vs. Simulated Functionality

| Feature | Status | Implementation Details |
|---|---|---|
| **User Interface & Layout** | ✅ **Implemented** | Full responsive SaaS dashboard, dark navy theme, glassmorphism, Framer Motion transitions. |
| **State Management** | ✅ **Implemented** | Central React Context (`DemoContext`) managing form state, vault items, and orchestrator state. |
| **In-Memory Vaulting** | ✅ **Implemented** | Ephemeral memory map with zero writes to localStorage, sessionStorage, or cookies. |
| **Outbound LeakGuard** | ✅ **Implemented** | Deterministic 2-layer inspection validating outgoing strings against in-memory secrets and regexes. |
| **Visual Canvas Redaction** | ✅ **Implemented** | 3-way toggle demonstrating opaque rectangle pixel masking with semantic labels. |
| **Safety Gating** | ✅ **Implemented** | Modal dialog enforcing explicit human confirmation before the dangerous submit action. |
| **Recharts Analytics** | ✅ **Implemented** | Dynamic token compression bar chart and PII category pie chart. |
| **Live Network Requests** | ⚡ *Simulated* | Frontend-only. No live HTTP calls to external servers or AI endpoints; operates on deterministic demo data. |
| **AI Model Reasoning** | ⚡ *Simulated* | Action plan is generated deterministically rather than querying cloud LLM APIs. |
| **Native Extension Ingestion** | ⚡ *Simulated* | Operates on simulated DOM state rather than calling native Chrome extension `chrome.tabs` APIs. |
| **Real Benchmark Data** | ⚡ *Simulated* | Displayed numbers represent current demo-session counts, not third-party certified benchmarks. |
