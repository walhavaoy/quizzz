---
component: questions
area: data
priority: P0
status: implemented
created: 2026-05-07
---

# Questions

> Hard-coded pool of 20 general knowledge trivia questions.

## Purpose

Provide a static JSON file with 20 trivia questions used by the game engine. Each game randomly selects 5 questions from this pool.

## Requirements

### Core
- REQ-QS-01: 20 questions in a JSON file at `src/shared/questions.json` [priority: must]
- REQ-QS-02: Each question has: id, text, 4 options array, correctIndex (0-3) [priority: must]
- REQ-QS-03: Questions are general knowledge, suitable for a wide audience [priority: must]
- REQ-QS-04: All correct answers are verified and accurate [priority: must]

### Extended
- REQ-QS-10: Questions span diverse categories (science, history, geography, etc.) [priority: should]

## Acceptance Criteria

- JSON file parses without error
- Contains exactly 20 question objects
- Each question has 4 non-empty options
- correctIndex is 0, 1, 2, or 3 for each question
- No duplicate questions

## Dependencies

None — leaf component.
