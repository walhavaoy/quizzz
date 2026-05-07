---
component: rest-api
area: backend
priority: P0
status: planned
created: 2026-05-07
---

# REST API

> Express route handlers for game lifecycle and question retrieval.

## Purpose

Provide REST endpoints for creating games, joining games, submitting answers, and retrieving questions. These endpoints handle discrete player actions while WebSocket handles state push.

## Requirements

### Core
- REQ-RA-01: GET /api/questions — return the pool of trivia questions [priority: must]
- REQ-RA-02: POST /api/games — create a new game, return game ID [priority: must]
- REQ-RA-03: POST /api/games/:id/join — join a game with a nickname, return player ID [priority: must]
- REQ-RA-04: POST /api/games/:id/answer — submit an answer for the current question [priority: must]
- REQ-RA-05: Validate all inputs (nickname non-empty, game exists, answer in range) [priority: must]
- REQ-RA-06: Return appropriate HTTP status codes (400, 404, 409) for error cases [priority: must]

### Extended
- REQ-RA-10: GET /api/games/:id — return current game state for reconnection [priority: should]

## Acceptance Criteria

- POST /api/games returns `{ gameId: string }`
- POST /api/games/:id/join with `{ nickname }` returns `{ playerId: string }`
- POST /api/games/:id/answer with `{ playerId, answerIndex }` returns `{ accepted: boolean }`
- GET /api/questions returns array of question objects
- Invalid inputs return 400 with error message
- Non-existent game returns 404

## Dependencies

- `game-engine` component (game state operations)
- `data/questions` component (question pool)
- `data/types` component (request/response types)
