# CloakSight — API Contract

> This document defines the communication contract between the browser extension and the FastAPI server.
> **Status: Interface definition only. Not implemented.**

---

## 1. Overview

The extension communicates with the local FastAPI server over HTTP (or HTTPS in production).

**Base URL:** `http://127.0.0.1:8000` (development)

**Authentication:** Not implemented in Phase 0. Plan: extension-generated session token in Phase 7.

**Privacy guarantee:** The request body must never contain raw PII. This is enforced by the Leak Guard before the request is made.

---

## 2. Endpoints

### POST `/api/v1/agent/plan`

**Purpose:** Submit a sanitized context and task intent. Receive a structured action plan.

**Request body:** `AgentRequest`

```json
{
  "session_id": "cs_session_abc123",
  "task": "Submit my hotel reimbursement for this trip.",
  "sanitized_context": {
    "page_url": "https://internal.company.com/reimbursement",
    "page_title": "Travel Reimbursement Portal",
    "elements": [
      {
        "tag_id": "TAG_001",
        "semantic_label": "PERSON_NAME",
        "element_type": "input",
        "element_role": "employee_name_field",
        "is_sensitive": true,
        "position": { "x": 120, "y": 240, "width": 300, "height": 40 }
      },
      {
        "tag_id": "TAG_002",
        "semantic_label": "EMPLOYEE_ID",
        "element_type": "input",
        "element_role": "employee_id_field",
        "is_sensitive": true,
        "position": { "x": 120, "y": 300, "width": 300, "height": 40 }
      },
      {
        "tag_id": "TAG_003",
        "semantic_label": "EXPENSE_CATEGORY",
        "element_type": "select",
        "element_role": "category_dropdown",
        "is_sensitive": false,
        "current_value": "Hotel",
        "position": { "x": 120, "y": 360, "width": 300, "height": 40 }
      }
    ],
    "available_actions": ["click", "fill", "select", "upload", "scroll", "submit"],
    "metadata": {
      "element_count": 10,
      "sensitive_element_count": 5,
      "redaction_ratio": 0.5,
      "perception_confidence": 0.92
    }
  }
}
```

**Response body:** `AgentResponse`

```json
{
  "session_id": "cs_session_abc123",
  "status": "success",
  "action_plan": {
    "plan_id": "plan_xyz789",
    "actions": [
      {
        "action_id": "act_001",
        "type": "fill",
        "target": "TAG_001",
        "description": "Fill in the employee name field"
      },
      {
        "action_id": "act_002",
        "type": "fill",
        "target": "TAG_002",
        "description": "Fill in the employee ID field"
      },
      {
        "action_id": "act_003",
        "type": "select",
        "target": "TAG_003",
        "value": "Hotel",
        "description": "Select Hotel from expense category"
      },
      {
        "action_id": "act_004",
        "type": "click",
        "target": "TAG_010",
        "description": "Click the submit button"
      }
    ],
    "reasoning_summary": "Identified 4 actions to complete the hotel reimbursement submission.",
    "confidence": 0.91
  }
}
```

**Security notes:**
- Request must not contain raw PII fields.
- Response `value` fields in actions must be non-sensitive (e.g., "Hotel", not "Rahul Sharma").
- The extension must reject any action where `target` is not a registered tag ID.

---

### GET `/api/v1/health`

**Purpose:** Health check endpoint for extension connectivity test.

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "agent_provider": "not_configured"
}
```

---

### GET `/api/v1/agent/providers`

**Purpose:** List available AI providers and their configuration status.

**Response:**
```json
{
  "providers": [
    {
      "id": "openai",
      "configured": false,
      "model": null
    },
    {
      "id": "google",
      "configured": false,
      "model": null
    }
  ]
}
```

---

## 3. Error Responses

All errors follow a standard envelope:

```json
{
  "error": {
    "code": "LEAK_GUARD_BLOCKED",
    "message": "Transmission blocked: potential PII detected in context.",
    "details": {}
  }
}
```

**Error codes:**

| Code | HTTP Status | Description |
|---|---|---|
| `LEAK_GUARD_BLOCKED` | 403 | Context failed leak guard check |
| `INVALID_CONTEXT` | 422 | Context schema validation failed |
| `AGENT_ERROR` | 502 | Cloud AI provider returned an error |
| `PROVIDER_NOT_CONFIGURED` | 503 | No AI provider configured |
| `SESSION_INVALID` | 401 | Session ID not recognized |

---

## 4. Data Flow Guarantees

**Extension → Server:**
- Payload must pass `leakGuard.ts` before being sent.
- Only `SanitizedContext` objects may appear in the body.
- Raw values, real names, real account numbers must never appear.

**Server → Extension:**
- Action targets must be tag IDs (e.g., `TAG_001`), not raw element selectors.
- Action values must be non-sensitive strings (task-relevant only).
- The server must never return a mapping from tag to real value.

---

## 5. Future Extensions (Not for Phase 0)

- WebSocket transport for streaming action plans.
- Session-based encryption of payloads.
- Extension authentication via challenge/response.
- Partial context streaming for large pages.
