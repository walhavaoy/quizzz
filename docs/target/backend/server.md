---
component: server
area: backend
priority: P0
status: planned
created: 2026-05-07
---

# Server

> Express application entry point with static file serving and WebSocket upgrade.

## Purpose

Bootstrap the Express server on port 8080, serve static frontend assets from `public/`, mount REST API routes, and upgrade HTTP connections to WebSocket for real-time game communication.

## Requirements

### Core
- REQ-SV-01: Create Express app listening on port 8080 [priority: must]
- REQ-SV-02: Serve static files from `public/` directory [priority: must]
- REQ-SV-03: Upgrade HTTP server to support WebSocket via `ws` library [priority: must]
- REQ-SV-04: Mount REST API routes under `/api/` prefix [priority: must]
- REQ-SV-05: Handle graceful shutdown on SIGTERM/SIGINT [priority: should]

### Extended
- REQ-SV-10: Request logging middleware for debugging [priority: should]
- REQ-SV-11: CORS headers for development convenience [priority: could]

## Acceptance Criteria

- Server starts and responds to HTTP requests on port 8080
- Static files (HTML, CSS, JS) served from public/
- WebSocket upgrade succeeds on connection attempt
- API routes respond with proper JSON content type

## Dependencies

- express (npm)
- ws (npm)
- `rest-api` component (route handlers)
- `websocket` component (WS connection handler)
