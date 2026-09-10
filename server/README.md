# CloakSight — FastAPI Server

On-device-to-cloud agent bridge for the CloakSight browser extension.

## Overview

This server sits between the CloakSight Chrome extension and the cloud AI provider (LLM/VLM). It:
1. Receives sanitized context from the extension (no raw PII).
2. Calls the configured cloud AI provider.
3. Returns a structured action plan (tag-based, no raw values).

## Privacy Guarantee

**The server must never receive raw PII.**  
If the extension's Leak Guard is functioning correctly, all incoming requests contain only semantic tags and sanitized context.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

cp ../.env.example .env
# Edit .env: set AGENT_PROVIDER, AGENT_MODEL, AGENT_API_KEY

uvicorn app.main:app --reload
```

## Status

**Phase 0–1: Structure only. Not implemented.**

## Endpoints

- `GET /api/v1/health` — Health check
- `POST /api/v1/agent/plan` — Submit context, receive action plan
- `GET /api/v1/agent/providers` — List available providers
