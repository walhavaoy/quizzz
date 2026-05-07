---
project: quizzz
status: planned
created: 2026-05-07
---

# quizzz — Target Architecture Tree

> Multiplayer trivia quiz game web app with real-time WebSocket communication.

## Areas & Components

| Area           | Component         | Priority | Description                                      |
|----------------|-------------------|----------|--------------------------------------------------|
| backend        | server            | P0       | Express + WebSocket server, app entry point       |
| backend        | rest-api          | P0       | REST endpoints for games and questions             |
| backend        | websocket         | P0       | WebSocket handler for real-time game events        |
| backend        | game-engine       | P0       | In-memory game state machine and scoring logic     |
| data           | questions         | P0       | Hard-coded trivia question pool (JSON)             |
| data           | types             | P0       | Shared TypeScript type definitions                 |
| frontend       | lobby             | P0       | Lobby page — nickname input, player list, start    |
| frontend       | play              | P0       | Question page — question display, timer, answers   |
| frontend       | result            | P0       | Final scoreboard — podium and rankings             |
| frontend       | router            | P1       | Client-side SPA routing (hash or history API)      |
| frontend       | websocket-client  | P0       | WebSocket client wrapper for live updates          |
| frontend       | styles            | P1       | Global CSS — playful dark theme                    |
| infrastructure | helm-chart        | P1       | Helm chart for Kubernetes deployment               |
| infrastructure | docker            | P1       | Dockerfile and container build                     |

## Priority Legend

- **P0** — Critical path; game doesn't work without it
- **P1** — High priority; needed for deployment and polish
- **P2** — Medium; nice-to-have improvements
- **P3** — Low; future enhancements
