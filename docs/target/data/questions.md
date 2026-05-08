---
component: questions
area: data
priority: P0
status: planned
created: 2026-05-08
---

# Question Pool

> 30 hard-coded trivia questions stored as JSON, organized by category.

## Purpose

Static question data that the REST API serves. 10 questions per category, 3 categories total.

## Requirements

### Core
- REQ-QS-01: 30 total questions stored in a JSON file [priority: must]
- REQ-QS-02: 10 questions for "General Knowledge" (id: general-knowledge) [priority: must]
- REQ-QS-03: 10 questions for "Science" (id: science) [priority: must]
- REQ-QS-04: 10 questions for "Movies" (id: movies) [priority: must]
- REQ-QS-05: Each question has: question text, 4 options, correct_index (0-3) [priority: must]
- REQ-QS-06: Questions are factually correct and unambiguous [priority: must]

## Data Format

```json
{
  "general-knowledge": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correct_index": 2
    }
  ],
  "science": [...],
  "movies": [...]
}
```

## Acceptance Criteria

- JSON file parses without error
- Each category has exactly 10 questions
- Each question has exactly 4 options
- correct_index is 0, 1, 2, or 3 for every question

## Dependencies

None (leaf data file)
