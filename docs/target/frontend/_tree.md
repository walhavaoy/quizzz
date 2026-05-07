---
area: frontend
status: planned
created: 2026-05-07
---

# Frontend — Area Overview

> Vanilla TypeScript SPA with CSS, served as static assets from public/.

## Components

| Component        | Priority | Description                                    |
|-----------------|----------|------------------------------------------------|
| lobby           | P0       | Nickname entry, live player list, start button  |
| play            | P0       | Question display, 4-choice answers, 15s timer   |
| result          | P0       | Podium top-3 + full ranked list, play again     |
| router          | P1       | SPA view switching by route (/, /play, /result) |
| websocket-client| P0       | WebSocket wrapper for receiving game events      |
| styles          | P1       | Global CSS with playful dark theme palette       |

## Key Decisions

- No framework — vanilla TypeScript compiled to JS, served from public/.
- Single HTML file with views toggled by a simple client-side router.
- All interactive elements have `data-testid="quizzz-{element}-{identifier}"` attributes.
- Mobile-responsive layout (360px minimum width).
