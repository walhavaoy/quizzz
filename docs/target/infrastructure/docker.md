---
component: docker
area: infrastructure
priority: P1
status: planned
created: 2026-05-07
---

# Docker

> Multi-stage Dockerfile for building and running the quizzz application.

## Purpose

Containerize the Node.js application with a multi-stage build: compile TypeScript in a build stage, copy compiled JS and static assets to a slim production image.

## Requirements

### Core
- REQ-DK-01: Multi-stage Dockerfile (build + runtime) [priority: must]
- REQ-DK-02: Build stage compiles TypeScript to JavaScript [priority: must]
- REQ-DK-03: Runtime stage uses Node.js 22 slim base image [priority: must]
- REQ-DK-04: Copy compiled server code and public/ assets to runtime [priority: must]
- REQ-DK-05: Expose port 8080 [priority: must]
- REQ-DK-06: Non-root user in runtime image [priority: should]
- REQ-DK-07: .dockerignore to exclude node_modules, .git, docs [priority: must]

### Extended
- REQ-DK-10: Layer caching optimization (copy package*.json first) [priority: should]

## Acceptance Criteria

- `docker build` completes successfully
- Container starts and serves on port 8080
- Image size under 200MB
- Application responds to HTTP and WebSocket requests

## Dependencies

- `backend/server` component (application code)
- `frontend/styles` component (static assets in public/)
