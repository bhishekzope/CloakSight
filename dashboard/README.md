# CloakSight — Developer Dashboard

A web-based debugging and privacy metrics dashboard for CloakSight.

## Overview

The dashboard provides:
- Real-time privacy metrics (entities redacted, redaction ratio, context size)
- Perception debug view (DOM tree, visual regions, element classifications)
- Action plan visualization (tag → element mapping, execution log)
- Session replay (anonymized — no raw PII shown)
- Privacy policy configuration

## Status

**Phase 0–1: Structure only. Not implemented.**  
TODO(phase-9): Implement full dashboard.

## Tech Stack (planned)

- Vite + TypeScript
- Vanilla CSS (or lightweight UI library)
- Chrome Extension DevTools panel API (Phase 9+)

## Development

```bash
# TODO(phase-9): Set up Vite project
npm install
npm run dev
```
