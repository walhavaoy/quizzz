---
area: backend
status: planned
created: 2026-05-08
---

# Backend — Area Overview

> Express HTTP server serving REST API endpoints and static frontend files.

## Components

| Component | Priority | Description                                      |
|-----------|----------|--------------------------------------------------|
| server    | P0       | Express entry point, health/ready checks, static serving |
| rest-api  | P0       | GET /api/categories and GET /api/quiz endpoints  |

## Notes

- No WebSocket needed — this is a single-player, stateless quiz
- All quiz state lives client-side; server just serves questions
- Health and readiness probes at /healthz and /readyz
