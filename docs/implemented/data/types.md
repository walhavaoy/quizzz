---
component: types
area: data
coverage: 100%
created: 2026-05-07
---

# Types — Implementation Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-TY-01   | done   | Question interface (id, text, options, correctIndex) |
| REQ-TY-02   | done   | Player interface (id, nickname, score, currentAnswer) |
| REQ-TY-03   | done   | GameState interface (id, status, players, hostId, currentRound, questions, timeRemaining) |
| REQ-TY-04   | done   | WsServerMessage and WsClientMessage discriminated unions |
| REQ-TY-05   | done   | JoinRequest, AnswerRequest, CreateGameResponse, JoinResponse, AnswerResponse, ErrorResponse |
| REQ-TY-06   | done   | GameStatus type: 'lobby' | 'playing' | 'reveal' | 'finished' |
