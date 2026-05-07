---
component: helm-chart
area: infrastructure
priority: P1
status: planned
created: 2026-05-07
---

# Helm Chart

> Kubernetes deployment chart with ingress configuration.

## Purpose

Package the quizzz application as a Helm chart for deployment to Kubernetes, with ingress rules for the application domain and shell access domain.

## Requirements

### Core
- REQ-HC-01: Helm chart in `chart/` directory [priority: must]
- REQ-HC-02: Deployment resource for the quizzz container [priority: must]
- REQ-HC-03: Service resource exposing port 8080 [priority: must]
- REQ-HC-04: Ingress resource routing quizzz.tmpclaw.io to the service [priority: must]
- REQ-HC-05: Ingress supports WebSocket upgrade headers [priority: must]
- REQ-HC-06: Shell access ingress at shell.quizzz.tmpclaw.io [priority: must]
- REQ-HC-07: Configurable image tag via values.yaml [priority: must]
- REQ-HC-08: Resource limits and requests defined [priority: should]

### Extended
- REQ-HC-10: Health check probes (liveness, readiness) [priority: should]
- REQ-HC-11: Horizontal pod autoscaler template [priority: could]

## Acceptance Criteria

- `helm template` renders valid Kubernetes manifests
- Ingress routes quizzz.tmpclaw.io to the service on port 8080
- WebSocket connections work through the ingress
- Shell access available at shell.quizzz.tmpclaw.io

## Dependencies

- `infrastructure/docker` component (container image)
