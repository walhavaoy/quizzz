---
component: game-engine
area: backend
priority: P0
status: planned
created: 2026-05-07
---

# Game Engine

> In-memory game state machine with timer and scoring logic.

## Purpose

Manage the lifecycle of a quiz game: lobby phase, question rounds (5 total), answer collection, scoring, and final results. All state is held in memory. The engine emits events consumed by the WebSocket handler.

## Requirements

### Core
- REQ-GE-01: Maintain game state machine: lobby -> playing (5 rounds) -> finished [priority: must]
- REQ-GE-02: Track players with nickname, ID, score, and current answer [priority: must]
- REQ-GE-03: Select 5 random questions from the 20-question pool per game [priority: must]
- REQ-GE-04: Run 15-second server-authoritative countdown per question [priority: must]
- REQ-GE-05: Lock answers after timer expires or all players have answered [priority: must]
- REQ-GE-06: Score +10 for correct answer, +0 for wrong/timeout [priority: must]
- REQ-GE-07: After answer lock, show results for 5 seconds, then advance [priority: must]
- REQ-GE-08: After 5 rounds, compute final rankings [priority: must]
- REQ-GE-09: First player to join is the host (can start the game) [priority: must]
- REQ-GE-10: Reset game state on "play again" [priority: must]

### Extended
- REQ-GE-20: Speed bonus — faster correct answers score more [priority: could]
- REQ-GE-21: Handle player disconnect mid-game gracefully [priority: should]

## Acceptance Criteria

- Game transitions through all states: lobby -> round 1..5 -> finished
- Timer counts 15 -> 0; answers locked at 0
- Correct answers earn 10 points
- 5-second reveal phase between rounds
- Final rankings correctly sorted by score
- Play Again resets all scores and returns to lobby state

## Dependencies

- `data/questions` component (question pool)
- `data/types` component (game state types)
