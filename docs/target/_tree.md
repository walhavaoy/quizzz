---
project: quiz-loop-1
status: planned
created: 2026-05-08
---

# quiz-loop-1 — Target Architecture Tree

> Single-player web-based trivia quiz game with category selection, 10-question rounds, and score tracking.

## Areas & Components

| Area           | Component    | Priority | Description                                         |
|----------------|-------------|----------|-----------------------------------------------------|
| backend        | server      | P0       | Express HTTP server, health/ready endpoints          |
| backend        | rest-api    | P0       | REST endpoints for categories and quiz questions     |
| data           | questions   | P0       | 30 hard-coded trivia questions (10 per category)     |
| data           | types       | P0       | Shared TypeScript type definitions                   |
| frontend       | home        | P0       | Home page — category selection cards                 |
| frontend       | quiz        | P0       | Quiz page — question display, answer buttons         |
| frontend       | result      | P0       | Result page — score, breakdown, play again           |
| frontend       | router      | P1       | Hash-based client-side SPA router                    |
| frontend       | styles      | P1       | Global CSS — bright, friendly, mobile-responsive     |
| infrastructure | docker      | P1       | Dockerfile and container build                       |
| infrastructure | helm-chart  | P1       | Helm chart for Kubernetes deployment                 |

## Priority Legend

- **P0** — Critical path; app doesn't work without it
- **P1** — High priority; needed for deployment and polish
- **P2** — Medium; nice-to-have improvements
- **P3** — Low; future enhancements
