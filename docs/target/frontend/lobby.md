---
component: lobby
area: frontend
priority: P0
status: planned
created: 2026-05-07
---

# Lobby Page

> Landing page where players enter a nickname and wait for the host to start.

## Purpose

Render the lobby view at `/` with a nickname input, a live-updating player list, and a Start button visible only to the host (first joiner).

## Requirements

### Core
- REQ-LB-01: Nickname text input with submit button [priority: must]
- REQ-LB-02: After joining, show live list of currently joined players [priority: must]
- REQ-LB-03: Player list updates in <1s via WebSocket [priority: must]
- REQ-LB-04: Start Game button visible only to the host (first joiner) [priority: must]
- REQ-LB-05: Start button calls backend to begin the game [priority: must]
- REQ-LB-06: All players transition to /play when game starts [priority: must]
- REQ-LB-07: data-testid attributes on all interactive elements [priority: must]

### Extended
- REQ-LB-10: Show player count badge [priority: could]
- REQ-LB-11: Nickname validation (non-empty, max 20 chars) [priority: should]

## Acceptance Criteria

- Nickname input: `data-testid="quizzz-input-nickname"`
- Join button: `data-testid="quizzz-button-join"`
- Player list container: `data-testid="quizzz-list-players"`
- Start button: `data-testid="quizzz-button-start"`
- Player appears in list within 1 second of joining
- Start button hidden for non-host players
- All browsers navigate to /play on game start

## Dependencies

- `frontend/websocket-client` component
- `frontend/router` component
- `backend/rest-api` component (POST /api/games, POST /api/games/:id/join)
