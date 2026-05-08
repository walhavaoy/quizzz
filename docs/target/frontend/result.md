---
component: result
area: frontend
priority: P0
status: planned
created: 2026-05-08
---

# Result Page

> Final score display with per-question breakdown and play again button.

## Purpose

Shows the player's final score, a breakdown of each question (correct/incorrect), and a button to restart.

## Requirements

### Core
- REQ-RS-01: Display final score with data-testid="quiz-score", text matching `^\d+ ?/ ?10$` [priority: must]
- REQ-RS-02: Show per-question breakdown indicating correct/incorrect for each question [priority: must]
- REQ-RS-03: Play Again button with data-testid="quiz-btn-play-again" [priority: must]
- REQ-RS-04: Play Again resets all quiz state and navigates to home page [priority: must]

## data-testid Attributes

- `quiz-score` — Final score element (text: "X / 10")
- `quiz-btn-play-again` — Play Again button

## Acceptance Criteria

- Result page shows score matching `^\d+ ?/ ?10$`
- Per-question breakdown shows correct/incorrect for all 10 questions
- Play Again button resets state and returns to home page
- Home page is fully functional after reset (can start new quiz)

## Dependencies

- frontend/router (navigation to home)
- data/types (QuizState for reading results)
