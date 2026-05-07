---
component: rest-api
area: backend
coverage: 100%
created: 2026-05-07
---

# REST API — Implementation Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-RA-01   | done   | GET /api/questions returns full question pool |
| REQ-RA-02   | done   | POST /api/games creates game, returns gameId (201) |
| REQ-RA-03   | done   | POST /api/games/:id/join returns playerId + isHost |
| REQ-RA-04   | done   | POST /api/games/:id/answer returns accepted boolean |
| REQ-RA-05   | done   | Nickname non-empty, answerIndex 0-3, game must exist |
| REQ-RA-06   | done   | Returns 400, 404, 409 with { error } body |
