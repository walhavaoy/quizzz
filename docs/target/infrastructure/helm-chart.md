---
component: helm-chart
area: infrastructure
priority: P1
status: planned
created: 2026-05-08
---

# Helm Chart

> Kubernetes Helm chart for deploying quiz-loop-1 at quiz-loop-1.tmpclaw.io.

## Purpose

Standard tmpclaw Helm chart providing Deployment, Service, and Ingress resources.

## Requirements

### Core
- REQ-HC-01: Deployment with configurable replicas and image [priority: must]
- REQ-HC-02: Service (ClusterIP) exposing port 8080 [priority: must]
- REQ-HC-03: Ingress at quiz-loop-1.tmpclaw.io [priority: must]
- REQ-HC-04: Liveness probe at /healthz [priority: must]
- REQ-HC-05: Readiness probe at /readyz [priority: must]

### Extended
- REQ-HC-10: Chart.yaml with proper metadata [priority: should]

## Key Configuration

- Chart name: quiz-loop-1
- App version: 0.1.0
- Ingress host: quiz-loop-1.tmpclaw.io
- Probes: /healthz (liveness), /readyz (readiness)
- No WebSocket annotations needed

## Acceptance Criteria

- `helm template` renders valid YAML
- Ingress routes traffic to quiz-loop-1.tmpclaw.io
- Probes point to correct health endpoints

## Dependencies

- backend/server (health endpoints must exist)
