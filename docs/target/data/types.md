---
component: types
area: data
priority: P0
status: planned
created: 2026-05-08
---

# Shared Types

> TypeScript interfaces shared between server and client code.

## Purpose

Single source of truth for data shapes used across API responses and frontend state.

## Requirements

### Core
- REQ-TY-01: Category interface with id, name, description [priority: must]
- REQ-TY-02: Question interface with question, options (string[4]), correct_index [priority: must]
- REQ-TY-03: QuizState interface for client-side state management [priority: must]
- REQ-TY-04: No `any` types — strict TypeScript mode [priority: must]

## Key Interfaces

```typescript
interface Category {
  id: string;
  name: string;
  description: string;
}

interface Question {
  question: string;
  options: string[];
  correct_index: number;
}

interface QuizState {
  category: string;
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  score: number;
}
```

## Acceptance Criteria

- All interfaces compile under strict TypeScript
- Types are importable by both server and client code

## Dependencies

None (leaf type definitions)
