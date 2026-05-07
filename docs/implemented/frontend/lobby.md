---
component: lobby
area: frontend
coverage: 100%
created: 2026-05-07
updated: 2026-05-07
---

# Lobby Page — Implementation Status

| Requirement | Status      | Notes |
|-------------|-------------|-------|
| REQ-LB-01   | implemented | Nickname input + Join button; POST /api/games + /api/games/:id/join |
| REQ-LB-02   | implemented | Player list rendered after join, using data from REST response |
| REQ-LB-03   | implemented | `player_joined` WS event triggers renderPlayers() in <1s |
| REQ-LB-04   | implemented | Start button hidden for non-host; `isHost` from JoinGameResponse |
| REQ-LB-05   | implemented | Start button calls POST /api/games/:id/start |
| REQ-LB-06   | implemented | `game_start` WS event triggers navigate('/play') |
| REQ-LB-07   | implemented | data-testid on all interactive elements |
| REQ-LB-10   | implemented | Player count badge (#lobby-player-count) updated on each render |
| REQ-LB-11   | implemented | Validates non-empty and max 20 chars; inline error message |

## Files

- `client/views/lobby.ts` — lobby view logic
- `client/router.ts` — hash-based SPA router (navigate, initRouter)
- `client/main.ts` — entry point (DOMContentLoaded)
- `client/ws-client.ts` — WebSocket client wrapper
- `src/shared/types.ts` — shared types including JoinGameResponse (isHost added)
- `public/index.html` — SPA shell with view containers
- `public/style.css` — dark theme CSS
