# quizzz — Project Instructions

## Overview
Multiplayer trivia quiz game web app. Players join a lobby with a nickname, the host starts a round, all players see the same question and answer in real time, and a scoreboard ranks players at the end. No login required.

## Tech Stack
- **Runtime:** Node.js 22
- **Server:** Express + ws (WebSocket)
- **Language:** TypeScript (strict mode)
- **Frontend:** Vanilla TypeScript + plain CSS (no framework)
- **Port:** 8080
- **Deploy:** Helm chart on Kubernetes, ingress at quizzz.tmpclaw.io

## Directory Structure
```
quizzz/
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.client.json      # Separate TS config for frontend (target ES2020, DOM lib)
├── src/
│   ├── server.ts             # Express + WS entry point
│   ├── routes/
│   │   └── api.ts            # REST route handlers
│   ├── game/
│   │   └── engine.ts         # Game state machine, timer, scoring
│   ├── ws/
│   │   └── handler.ts        # WebSocket connection + broadcast logic
│   └── shared/
│       ├── types.ts           # Shared TypeScript interfaces
│       └── questions.json     # 20 hard-coded trivia questions
├── public/
│   ├── index.html            # Single HTML file (SPA shell)
│   ├── style.css             # Global styles
│   └── js/                   # Compiled frontend JS (build output)
├── client/
│   ├── main.ts               # Frontend entry point
│   ├── router.ts             # SPA view router
│   ├── ws-client.ts          # WebSocket client wrapper
│   ├── views/
│   │   ├── lobby.ts          # Lobby view logic
│   │   ├── play.ts           # Play view logic
│   │   └── result.ts         # Result view logic
│   └── tsconfig.json         # Client TS config
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

## Code Conventions

### Naming
- Files: kebab-case (`game-engine.ts`, `ws-client.ts`)
- Types/Interfaces: PascalCase (`GameState`, `Player`, `WsMessage`)
- Functions/variables: camelCase (`createGame`, `playerId`)
- Constants: UPPER_SNAKE_CASE (`MAX_PLAYERS`, `QUESTION_TIME_MS`)
- Test IDs: `data-testid="quizzz-{element}-{identifier}"` (e.g., `quizzz-button-join`, `quizzz-input-nickname`)

### TypeScript
- Strict mode enabled
- No `any` types — use proper interfaces
- Shared types in `src/shared/types.ts`
- Discriminated unions for WebSocket messages (type field as discriminant)

### CSS
- Dark theme: background ~#1a1a2e
- Purple accent: ~#7c3aed
- Teal accent: ~#14b8a6
- Yellow accent: ~#facc15
- Mobile-first, responsive down to 360px
- No CSS framework — plain CSS with custom properties

### Architecture Decisions
- All game state is in-memory (no database). Single-process model.
- Timer is server-authoritative (server counts down, pushes ticks to clients).
- REST API for discrete actions (create, join, answer); WebSocket for state push.
- 5 questions per game, randomly selected from pool of 20.
- First joiner = host (only they see the Start button).
- Scoring: +10 for correct, +0 for wrong/timeout.
- 15-second answer window, 5-second reveal window between rounds.

### Testing
- All interactive UI elements must have `data-testid` attributes
- Format: `quizzz-{element}-{identifier}`
- Testable with Playwright
