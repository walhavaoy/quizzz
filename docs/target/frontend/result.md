---
component: result
area: frontend
priority: P0
status: planned
created: 2026-05-07
---

# Result Page

> Final scoreboard with podium and rankings.

## Purpose

Render the end-of-game view at `/result` showing a top-3 podium, full ranked player list, and a Play Again button that returns all players to the lobby.

## Requirements

### Core
- REQ-RS-01: Display podium for top 3 players (1st, 2nd, 3rd) [priority: must]
- REQ-RS-02: Display full ranked list of all players with scores [priority: must]
- REQ-RS-03: Play Again button returns all players to lobby [priority: must]
- REQ-RS-04: Play Again resets all scores [priority: must]
- REQ-RS-05: data-testid attributes on all interactive elements [priority: must]

### Extended
- REQ-RS-10: Podium animation on load [priority: could]
- REQ-RS-11: Highlight current player's position [priority: should]

## Acceptance Criteria

- Podium container: `data-testid="quizzz-container-podium"`
- Ranking list: `data-testid="quizzz-list-rankings"`
- Play Again button: `data-testid="quizzz-button-playagain"`
- Top 3 players shown in podium style
- Full list sorted by score descending
- Play Again transitions all connected players back to /

## Dependencies

- `frontend/websocket-client` component (game_over event with rankings)
- `frontend/router` component
