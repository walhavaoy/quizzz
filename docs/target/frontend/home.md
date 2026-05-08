---
component: home
area: frontend
priority: P0
status: planned
created: 2026-05-08
---

# Home Page

> Category selection landing page with 3 clickable category cards.

## Purpose

Entry point of the app. Displays 3 trivia categories fetched from the API. Clicking a card starts a quiz for that category.

## Requirements

### Core
- REQ-HM-01: Fetch categories from GET /api/categories on page load [priority: must]
- REQ-HM-02: Render 3 category cards with name and description [priority: must]
- REQ-HM-03: Each card has data-testid="quiz-category-{slug}" [priority: must]
- REQ-HM-04: Clicking a card fetches questions and navigates to quiz view [priority: must]
- REQ-HM-05: Category slugs: general-knowledge, science, movies [priority: must]

## data-testid Attributes

- `quiz-category-general-knowledge` — General Knowledge card
- `quiz-category-science` — Science card
- `quiz-category-movies` — Movies card

## Acceptance Criteria

- Home page renders 3 elements matching `[data-testid^="quiz-category-"]`
- Clicking a category card navigates to quiz view and shows first question
- Categories are fetched from the API (not hard-coded in frontend)

## Dependencies

- backend/rest-api (GET /api/categories, GET /api/quiz)
- frontend/router (navigation)
- data/types (Category interface)
