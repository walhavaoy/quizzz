---
component: rest-api
area: backend
priority: P0
status: planned
created: 2026-05-08
---

# REST API

> REST endpoints for fetching quiz categories and questions.

## Purpose

Stateless API that returns category metadata and randomized question sets. No authentication, no session state.

## Requirements

### Core
- REQ-API-01: GET /api/categories returns array of 3 categories, each with id, name, description [priority: must]
- REQ-API-02: GET /api/quiz?category=<id> returns array of exactly 10 questions [priority: must]
- REQ-API-03: Each question object has: question (string), options (array of 4 strings), correct_index (number 0-3) [priority: must]
- REQ-API-04: Category IDs are slugs: general-knowledge, science, movies [priority: must]
- REQ-API-05: Return 400 if category query param is missing or invalid [priority: must]

### Extended
- REQ-API-10: Questions returned in randomized order per request [priority: should]

## Endpoints

### GET /api/categories
Response: `[{id: string, name: string, description: string}, ...]`

Example:
```json
[
  {"id": "general-knowledge", "name": "General Knowledge", "description": "Test your general knowledge"},
  {"id": "science", "name": "Science", "description": "Physics, chemistry, biology and more"},
  {"id": "movies", "name": "Movies", "description": "Film trivia for movie buffs"}
]
```

### GET /api/quiz?category=<id>
Response: `[{question: string, options: string[], correct_index: number}, ...]`

Returns exactly 10 questions for the given category. If the pool has exactly 10 per category, all are returned (shuffled).

## Acceptance Criteria

- GET /api/categories returns exactly 3 categories
- GET /api/quiz?category=general-knowledge returns exactly 10 questions
- Each question has options array of length 4
- Each question has numeric correct_index between 0 and 3
- Missing/invalid category returns 400

## Dependencies

- data/questions (question pool JSON)
- data/types (shared interfaces)
