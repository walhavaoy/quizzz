---
area: data
status: planned
created: 2026-05-07
---

# Data — Area Overview

> Shared types and static question data.

## Components

| Component | Priority | Description                                    |
|-----------|----------|------------------------------------------------|
| questions | P0       | 20 hard-coded general knowledge trivia questions|
| types     | P0       | Shared TypeScript interfaces and types          |

## Key Decisions

- Questions stored as a JSON file in the repo (no database).
- Types are shared between backend and frontend via a common types file.
- Each question has: id, text, 4 options, correct answer index.
