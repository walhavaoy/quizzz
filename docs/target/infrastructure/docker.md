---
component: docker
area: infrastructure
priority: P1
status: planned
created: 2026-05-08
---

# Dockerfile

> Multi-stage Docker build for the quiz-loop-1 application.

## Purpose

Build and package the application into a minimal container image running as non-root.

## Requirements

### Core
- REQ-DK-01: Multi-stage build (build + runtime) [priority: must]
- REQ-DK-02: Base image: node:22-slim [priority: must]
- REQ-DK-03: Install production dependencies only in runtime stage [priority: must]
- REQ-DK-04: Copy compiled server (dist/) and static assets (public/) [priority: must]
- REQ-DK-05: Run as non-root user [priority: must]
- REQ-DK-06: Expose port 8080 [priority: must]

### Extended
- REQ-DK-10: Layer caching — copy package*.json before source [priority: should]

## Acceptance Criteria

- `docker build` succeeds
- Container starts and responds to /healthz
- Process runs as non-root user

## Dependencies

- package.json (dependency manifest)
- tsconfig.json, tsconfig.client.json (TypeScript compilation)
