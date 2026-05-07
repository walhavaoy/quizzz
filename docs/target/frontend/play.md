---
component: play
area: frontend
priority: P0
status: planned
created: 2026-05-07
---

# Play Page

> Question display with multiple-choice answers and countdown timer.

## Purpose

Render the active quiz view at `/play` showing the current question, 4 answer buttons, a 15-second countdown timer, and the result reveal phase.

## Requirements

### Core
- REQ-PL-01: Display current question text [priority: must]
- REQ-PL-02: Display 4 multiple-choice answer buttons [priority: must]
- REQ-PL-03: Show 15-second countdown timer that visually counts down [priority: must]
- REQ-PL-04: Lock answer selection after timer expires [priority: must]
- REQ-PL-05: Lock answer selection after player submits an answer [priority: must]
- REQ-PL-06: Highlight selected answer visually [priority: must]
- REQ-PL-07: After all answers or timeout, reveal correct answer for 5s [priority: must]
- REQ-PL-08: Show per-player result (correct/wrong + score) during reveal [priority: must]
- REQ-PL-09: Show round number (e.g., "Question 3 of 5") [priority: must]
- REQ-PL-10: data-testid attributes on all interactive elements [priority: must]

### Extended
- REQ-PL-20: Answer button color feedback (green=correct, red=wrong) during reveal [priority: should]
- REQ-PL-21: Animated timer bar or circle [priority: should]

## Acceptance Criteria

- Question text: `data-testid="quizzz-text-question"`
- Answer buttons: `data-testid="quizzz-button-answer-{0-3}"`
- Timer display: `data-testid="quizzz-timer-countdown"`
- Round indicator: `data-testid="quizzz-text-round"`
- Timer counts from 15 to 0 visibly
- Answers are not clickable after lock
- Correct answer highlighted in green during reveal
- Score breakdown visible during 5s reveal

## Dependencies

- `frontend/websocket-client` component (timer ticks, question data, round results)
- `frontend/router` component
- `backend/rest-api` component (POST /api/games/:id/answer)
