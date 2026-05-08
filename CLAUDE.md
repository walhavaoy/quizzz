# quiz-loop-1 — Project Instructions

## Overview
Single-player web-based trivia quiz game. Pick a category, answer 10 multiple-choice questions, see a final score, play again. No login required. Iteration 1 of an automated launcher test loop.

## Tech Stack
- **Runtime:** Node.js 22
- **Server:** Express (HTTP only, no WebSocket)
- **Language:** TypeScript (strict mode)
- **Frontend:** Vanilla TypeScript + plain CSS (no framework)
- **Port:** 8080
- **Deploy:** Helm chart on Kubernetes, ingress at quiz-loop-1.tmpclaw.io

## Directory Structure
```
quiz-loop-1/
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.client.json      # Separate TS config for frontend (target ES2020, DOM lib)
├── src/
│   ├── server.ts             # Express entry point
│   ├── routes/
│   │   └── api.ts            # REST route handlers (/api/categories, /api/quiz)
│   └── shared/
│       ├── types.ts           # Shared TypeScript interfaces
│       └── questions.json     # 30 hard-coded trivia questions (10 per category)
├── public/
│   ├── index.html            # Single HTML file (SPA shell)
│   ├── style.css             # Global styles (bright, friendly theme)
│   └── js/                   # Compiled frontend JS (build output)
├── client/
│   ├── main.ts               # Frontend entry point
│   ├── router.ts             # Hash-based SPA router
│   └── views/
│       ├── home.ts           # Home view — category selection
│       ├── quiz.ts           # Quiz view — question + answer buttons
│       └── result.ts         # Result view — score + breakdown
├── chart/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── ingress.yaml
├── Dockerfile
├── .dockerignore
└── docs/                     # Architecture documentation
    ├── target/               # Target specs per component
    └── implemented/          # Implementation tracking
```

## Build & Run Commands
```bash
# Install dependencies
npm install

# Build server (TypeScript -> JS)
npx tsc

# Build client (TypeScript -> JS, output to public/js/)
npx tsc -p tsconfig.client.json

# Run dev server
npx ts-node src/server.ts
# or after build:
node dist/server.js

# Run all builds
npm run build

# Start production
npm start
```

## API Endpoints
```
GET  /healthz              → {"status":"ok"}
GET  /readyz               → {"status":"ok"}
GET  /api/categories       → [{id, name, description}, ...] (3 entries)
GET  /api/quiz?category=id → [{question, options[4], correct_index}, ...] (10 entries)
```

## Code Conventions

### Naming
- Files: kebab-case (`quiz-view.ts`, `hash-router.ts`)
- Types/Interfaces: PascalCase (`Category`, `Question`, `QuizState`)
- Functions/variables: camelCase (`fetchCategories`, `currentIndex`)
- Constants: UPPER_SNAKE_CASE (`TOTAL_QUESTIONS`, `AUTO_ADVANCE_MS`)
- Test IDs: `data-testid="quiz-{element}-{identifier}"` (e.g., `quiz-category-science`, `quiz-answer-0`)

### TypeScript
- Strict mode enabled
- No `any` types — use proper interfaces
- Shared types in `src/shared/types.ts`

### CSS
- Bright, friendly theme (light background, not dark)
- Correct answer: green (#22c55e)
- Incorrect answer: red (#ef4444)
- Mobile-first, responsive down to 360px
- No CSS framework — plain CSS with custom properties

### Architecture Decisions
- Single-player, stateless server — all quiz state lives client-side
- No WebSocket — pure REST API + static frontend
- 3 categories: General Knowledge, Science, Movies
- 10 questions per category, 30 total in hard-coded JSON
- Scoring: +1 per correct answer, max 10
- Auto-advance after 1.5 seconds on answer selection
- Hash-based routing (#/, #/quiz, #/result)

### Testing
- All interactive UI elements must have `data-testid` attributes
- Format: `quiz-{element}-{identifier}`
- Required test IDs:
  - `quiz-category-general-knowledge`, `quiz-category-science`, `quiz-category-movies`
  - `quiz-answer-0` through `quiz-answer-3`
  - `quiz-progress`
  - `quiz-score` (text matches `^\d+ ?/ ?10$`)
  - `quiz-btn-play-again`
- Testable with Playwright
