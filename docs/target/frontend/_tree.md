---
area: frontend
status: planned
created: 2026-05-08
---

# Frontend — Area Overview

> Vanilla TypeScript single-page application with hash-based routing.

## Components

| Component | Priority | Description                                        |
|-----------|----------|----------------------------------------------------|
| home      | P0       | Category selection page with 3 category cards      |
| quiz      | P0       | Question display with 4 answer buttons             |
| result    | P0       | Final score, per-question breakdown, play again     |
| router    | P1       | Hash-based client-side SPA router                  |
| styles    | P1       | Bright, friendly CSS theme, mobile-responsive      |

## Notes

- No framework — vanilla TypeScript compiled to ES2020
- Hash-based routing (#/, #/quiz, #/result)
- All quiz state managed client-side in memory
- All interactive elements have data-testid attributes for Playwright
