---
component: types
area: data
priority: P0
status: planned
created: 2026-05-07
---

# Types

> Shared TypeScript type definitions for the entire application.

## Purpose

Define TypeScript interfaces and types used across backend and frontend: question shape, game state, player state, WebSocket message envelopes, and API request/response types.

## Requirements

### Core
- REQ-TY-01: Question interface (id, text, options, correctIndex) [priority: must]
- REQ-TY-02: Player interface (id, nickname, score, currentAnswer) [priority: must]
- REQ-TY-03: GameState interface (id, status, players, currentRound, questions) [priority: must]
- REQ-TY-04: WebSocket message types — discriminated union by event type [priority: must]
- REQ-TY-05: API request/response types for all REST endpoints [priority: must]
- REQ-TY-06: Game status enum: lobby, playing, reveal, finished [priority: must]

### Extended
- REQ-TY-10: Strict typing — no `any` types [priority: should]

## Acceptance Criteria

- All types compile without errors
- Types are importable from both backend and frontend code
- WebSocket messages are fully typed with discriminated unions

## Dependencies

None — leaf component.
