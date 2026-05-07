---
component: helm-chart
area: infrastructure
coverage: 0%
created: 2026-05-07
---

# Helm Chart — Implementation Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-HC-01   |        |       |
| REQ-HC-02   |        |       |
| REQ-HC-03   |        |       |
| REQ-HC-04   |        |       |
| REQ-HC-05   | ✅ Done | WebSocket upgrade annotations added to `chart/values.yaml`: `proxy-read-timeout`, `proxy-send-timeout`, and `websocket-services` |
| REQ-HC-06   | ✅ Done | Ingress template created at `chart/templates/ingress.yaml`; multi-host support via `ingress.hosts[]` array; shell host (`shell.quizzz.tmpclaw.io`) added to `values.yaml` |
| REQ-HC-07   |        |       |
| REQ-HC-08   |        |       |
| REQ-HC-10   | ✅ Done | `/healthz` endpoint added to server; `chart/values.yaml` with configurable liveness/readiness probes (defaults: 10s/5s initial delay, 15s/10s period, 3 failure threshold); `chart/templates/deployment.yaml` with conditional probe templates |
| REQ-HC-11   | ✅ Done | `chart/templates/hpa.yaml` with `autoscaling/v2`; disabled by default (in-memory state caveat documented) |
