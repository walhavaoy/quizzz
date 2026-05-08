---
component: router
area: frontend
priority: P1
status: planned
created: 2026-05-08
---

# Hash Router

> Hash-based client-side SPA router for navigating between views.

## Purpose

Manages view transitions using URL hash fragments. Three routes: home (#/ or #), quiz (#/quiz), result (#/result).

## Requirements

### Core
- REQ-RT-01: Hash-based routing with #/, #/quiz, #/result [priority: must]
- REQ-RT-02: Show only the active view, hide others [priority: must]
- REQ-RT-03: navigate() function for programmatic route changes [priority: must]
- REQ-RT-04: Listen to hashchange event for browser back/forward [priority: must]

### Extended
- REQ-RT-10: View transition animations [priority: could]

## Routes

| Hash      | View   | Description            |
|-----------|--------|------------------------|
| `#/`      | home   | Category selection     |
| `#/quiz`  | quiz   | Active quiz question   |
| `#/result`| result | Score and breakdown    |

## Acceptance Criteria

- Navigating between views shows correct content
- Browser back/forward works with hash routes
- Only one view is visible at a time

## Dependencies

None (standalone utility)
