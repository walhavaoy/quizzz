---
area: infrastructure
status: planned
created: 2026-05-08
---

# Infrastructure — Area Overview

> Docker container and Helm chart for Kubernetes deployment.

## Components

| Component  | Priority | Description                                        |
|------------|----------|----------------------------------------------------|
| docker     | P1       | Multi-stage Dockerfile, non-root user              |
| helm-chart | P1       | Helm chart deployed at quiz-loop-1.tmpclaw.io      |

## Notes

- Standard tmpclaw Helm chart pattern
- Ingress at quiz-loop-1.tmpclaw.io
- Health probes at /healthz and /readyz
- No WebSocket annotations needed (pure HTTP)
