---
component: styles
area: frontend
priority: P1
status: planned
created: 2026-05-07
---

# Styles

> Global CSS with a bright playful dark theme.

## Purpose

Define the visual design system: color palette, typography, layout utilities, and component styles. Playful aesthetic with purple/teal/yellow accents on a dark background.

## Requirements

### Core
- REQ-ST-01: Dark background theme (#1a1a2e or similar dark base) [priority: must]
- REQ-ST-02: Purple primary accent (#7c3aed or similar) [priority: must]
- REQ-ST-03: Teal secondary accent (#14b8a6 or similar) [priority: must]
- REQ-ST-04: Yellow highlight accent (#facc15 or similar) [priority: must]
- REQ-ST-05: Mobile-responsive layout, works at 360px width [priority: must]
- REQ-ST-06: Readable typography with good contrast on dark bg [priority: must]
- REQ-ST-07: Button styles for primary actions and answer choices [priority: must]
- REQ-ST-08: Timer visual styling (prominent countdown) [priority: must]
- REQ-ST-09: Podium styling for top-3 display [priority: must]

### Extended
- REQ-ST-10: Subtle animations for transitions and feedback [priority: should]
- REQ-ST-11: Loading/waiting state indicators [priority: could]

## Acceptance Criteria

- All pages render correctly at 360px viewport width
- Color palette matches spec (purple/teal/yellow on dark)
- Text has sufficient contrast ratio (WCAG AA)
- Buttons are large enough for touch targets (min 44px)

## Dependencies

None — leaf component.
