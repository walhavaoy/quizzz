---
component: router
area: frontend
priority: P1
status: planned
created: 2026-05-07
---

# Client-Side Router

> Simple SPA view switching without page reloads.

## Purpose

Implement a lightweight client-side router that swaps visible views (lobby, play, result) based on the current route. Uses hash-based routing for simplicity.

## Requirements

### Core
- REQ-RT-01: Route `/` shows lobby view [priority: must]
- REQ-RT-02: Route `/play` shows play view [priority: must]
- REQ-RT-03: Route `/result` shows result view [priority: must]
- REQ-RT-04: Programmatic navigation (navigate function) for WebSocket-triggered transitions [priority: must]
- REQ-RT-05: Hide inactive views, show active view [priority: must]

### Extended
- REQ-RT-10: Browser back/forward button support [priority: could]

## Acceptance Criteria

- Loading `/` renders lobby view
- `navigate('/play')` hides lobby, shows play view
- `navigate('/result')` hides play, shows result view
- Only one view visible at any time

## Dependencies

None — leaf component.
