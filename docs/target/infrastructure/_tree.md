---
area: infrastructure
status: planned
created: 2026-05-07
---

# Infrastructure — Area Overview

> Docker containerization and Helm chart for Kubernetes deployment.

## Components

| Component  | Priority | Description                                     |
|-----------|----------|-------------------------------------------------|
| helm-chart| P1       | Helm chart with ingress at quizzz.tmpclaw.io     |
| docker    | P1       | Multi-stage Dockerfile for Node.js 22 app        |

## Key Decisions

- Single container running Express + WebSocket on port 8080.
- Helm chart exposes ingress at quizzz.tmpclaw.io.
- Shell access at shell.quizzz.tmpclaw.io for debugging.
- WebSocket connections require sticky sessions or single-replica deployment.
