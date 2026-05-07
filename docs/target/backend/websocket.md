---
component: websocket
area: backend
priority: P0
status: planned
created: 2026-05-07
---

# WebSocket Handler

> Real-time event broadcasting for game state changes.

## Purpose

Manage WebSocket connections, associate them with game/player IDs, and broadcast game events (player joined, game started, question revealed, timer tick, round result, game over) to all players in a game.

## Requirements

### Core
- REQ-WS-01: Accept WebSocket connections with game ID and player ID parameters [priority: must]
- REQ-WS-02: Broadcast "player_joined" when a player joins the lobby [priority: must]
- REQ-WS-03: Broadcast "game_start" to transition all players to /play [priority: must]
- REQ-WS-04: Broadcast "question" with current question data at round start [priority: must]
- REQ-WS-05: Broadcast "timer_tick" every second during countdown [priority: must]
- REQ-WS-06: Broadcast "round_result" with correct answer and per-player scores [priority: must]
- REQ-WS-07: Broadcast "game_over" with final rankings after 5 questions [priority: must]
- REQ-WS-08: Clean up connections on disconnect [priority: must]

### Extended
- REQ-WS-10: Send "player_left" when a player disconnects mid-game [priority: should]
- REQ-WS-11: Heartbeat/ping to detect stale connections [priority: should]

## Acceptance Criteria

- Player list updates in <1s after a new player joins (WebSocket push)
- All connected players receive game_start simultaneously
- Timer ticks arrive every ~1 second
- Round results show correct answer + each player's score delta
- Game over message includes full ranking

## Dependencies

- `ws` (npm)
- `game-engine` component (subscribes to state changes)
- `data/types` component (event message types)
