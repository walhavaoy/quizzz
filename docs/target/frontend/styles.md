---
component: styles
area: frontend
priority: P1
status: planned
created: 2026-05-08
---

# Styles

> Bright, friendly CSS theme with mobile-responsive layout.

## Purpose

Global CSS providing the visual identity. Bright and friendly (not dark theme). Responsive down to 360px.

## Requirements

### Core
- REQ-ST-01: Bright, friendly color palette [priority: must]
- REQ-ST-02: Mobile-responsive layout, minimum 360px width [priority: must]
- REQ-ST-03: No CSS framework — plain CSS with custom properties [priority: must]
- REQ-ST-04: Category cards with hover effects [priority: must]
- REQ-ST-05: Answer button states: default, selected-correct, selected-wrong, revealed-correct [priority: must]

### Extended
- REQ-ST-10: Smooth view transitions [priority: should]
- REQ-ST-11: Score display styling with emphasis [priority: should]

## Color Palette (suggested)

- Background: light/white (#f8f9fa or similar)
- Primary accent: vibrant blue or purple
- Correct: green (#22c55e)
- Incorrect: red (#ef4444)
- Cards: white with subtle shadow

## Acceptance Criteria

- App renders correctly at 360px viewport width
- Answer buttons show clear visual feedback for correct/incorrect
- No horizontal scrolling on mobile

## Dependencies

None (standalone CSS)
