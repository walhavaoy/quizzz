---
component: server
area: backend
priority: P0
status: planned
created: 2026-05-08
---

# Server

> Express HTTP server entry point with health checks and static file serving.

## Purpose

Minimal Express server that serves the REST API, static frontend files, and exposes health/readiness probes for Kubernetes.

## Requirements

### Core
- REQ-SV-01: Listen on port 8080 (configurable via PORT env var) [priority: must]
- REQ-SV-02: GET /healthz returns 200 with `{"status":"ok"}` [priority: must]
- REQ-SV-03: GET /readyz returns 200 with `{"status":"ok"}` [priority: must]
- REQ-SV-04: Serve static files from public/ directory [priority: must]
- REQ-SV-05: Mount REST API router at /api prefix [priority: must]
- REQ-SV-06: Run as non-root user in container [priority: must]

### Extended
- REQ-SV-10: Request logging with pino [priority: should]
- REQ-SV-11: Graceful shutdown on SIGTERM/SIGINT [priority: should]

## Acceptance Criteria

- `GET /healthz` returns 200 with `{"status":"ok"}`
- `GET /readyz` returns 200 with `{"status":"ok"}`
- Server starts on port 8080 by default
- Static files from public/ are served at root path

## Dependencies

- Express 4.x
- pino (logging)
- data/types (shared interfaces)
