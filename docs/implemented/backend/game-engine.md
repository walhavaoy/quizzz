---
component: game-engine
area: backend
coverage: 95%
created: 2026-05-07
updated: 2026-05-07
---

# Game Engine — Implementation Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-GE-01   | ✅     | lobby→playing→finished state machine in `engine.ts` |
| REQ-GE-02   | ✅     | Player tracking with id, nickname, score, currentAnswer |
| REQ-GE-03   | ✅     | 5 random questions selected from 20-question pool |
| REQ-GE-04   | ✅     | 15-second server-authoritative `setInterval` countdown |
| REQ-GE-05   | ✅     | Early lock when all active (connected) players answered |
| REQ-GE-06   | ✅     | +10 for correct answer, +0 for wrong/timeout |
| REQ-GE-07   | ✅     | 5-second reveal phase via `setTimeout` between rounds |
| REQ-GE-08   | ✅     | Final rankings sorted by score in `game_over` event |
| REQ-GE-09   | ✅     | First joiner becomes host (`hostId` tracked on GameState) |
| REQ-GE-10   |        | Play Again / reset not yet implemented |
| REQ-GE-21   | ✅     | Lobby disconnect: remove player, promote host if needed, destroy if empty. Mid-game disconnect: mark `disconnected=true`, treat as timeout, check early lock. All-disconnect: destroy game and clear timers. Reconnect: restore player, send `state_sync`. |
