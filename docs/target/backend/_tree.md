---
area: backend
status: planned
created: 2026-05-07
---

# Backend — Area Overview

> Node.js + Express server with WebSocket support, REST API, and in-memory game engine.

## Components

| Component    | Priority | Description                                          |
|-------------|----------|------------------------------------------------------|
| server      | P0       | Express app bootstrap, static file serving, port 8080 |
| rest-api    | P0       | REST endpoints: questions, game CRUD, join, answer    |
| websocket   | P0       | WebSocket upgrade and event broadcasting              |
| game-engine | P0       | Game state machine, timer logic, scoring              |

## Key Decisions

- All game state is in-memory (no database). Single-process model.
- WebSocket uses the `ws` library, upgraded from the Express HTTP server.
- REST API is used for discrete actions (create game, join, answer); WebSocket pushes state changes.
- Timer is server-authoritative (15s countdown managed server-side).
