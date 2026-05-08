---
component: quiz
area: frontend
priority: P0
status: planned
created: 2026-05-08
---

# Quiz Page

> Displays one question at a time with 4 answer buttons, progress tracking, and answer feedback.

## Purpose

Core gameplay view. Shows questions sequentially, highlights correct/chosen answers after selection, auto-advances after 1.5 seconds.

## Requirements

### Core
- REQ-QZ-01: Show one question at a time with question text [priority: must]
- REQ-QZ-02: Display 4 answer buttons with data-testid="quiz-answer-0" through "quiz-answer-3" [priority: must]
- REQ-QZ-03: Progress indicator with data-testid="quiz-progress", text "Question N of 10" [priority: must]
- REQ-QZ-04: After clicking an answer, visually highlight the chosen and correct options [priority: must]
- REQ-QZ-05: Auto-advance to next question after 1.5 seconds [priority: must]
- REQ-QZ-06: After 10th question, navigate to result page [priority: must]
- REQ-QZ-07: Track score: +1 for correct answer [priority: must]

### Extended
- REQ-QZ-10: Disable answer buttons after selection to prevent double-click [priority: should]
- REQ-QZ-11: Smooth transition animation between questions [priority: should]

## data-testid Attributes

- `quiz-answer-0` through `quiz-answer-3` — Answer buttons
- `quiz-progress` — Progress text ("Question N of 10")

## Acceptance Criteria

- Quiz view shows progress text and 4 answer buttons with stable test ids
- Clicking an answer highlights correct/chosen options
- After 10 answers, navigates to result page
- Score is correctly tracked (correct = +1)

## Dependencies

- frontend/router (navigation to result)
- data/types (Question interface, QuizState)
