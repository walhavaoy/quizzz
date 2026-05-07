---
component: types
area: data
coverage: 100%
created: 2026-05-07
updated: 2026-05-07
---

# Types — Implementation Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-TY-01   | done   | `Question` interface in `src/shared/types.ts` |
| REQ-TY-02   | done   | `Player` interface in `src/shared/types.ts` |
| REQ-TY-03   | done   | `GameState` interface with `Map<string, Player>` in `src/shared/types.ts` |
| REQ-TY-04   | done   | `ServerMessage` and `ClientMessage` discriminated unions in `src/shared/types.ts` |
| REQ-TY-05   | done   | `CreateGameResponse`, `JoinGameRequest/Response`, `SubmitAnswerRequest/Response`, `ApiErrorResponse` in `src/shared/types.ts` |
| REQ-TY-06   | done   | `GameStatus` string enum (lobby/playing/reveal/finished) in `src/shared/types.ts` |
| REQ-TY-10   | done   | No `any` types; all fields explicitly typed |

## Notes

- `tsconfig.client.json` updated: `rootDir` changed to `"."` and `src/shared/**/*` added to `include`, enabling client code to `import type { ... } from '../src/shared/types'`. Client output paths shift to `public/js/client/` (no client code yet, so no breakage).
- `GameState.players` uses `Map<string, Player>` for server-side use. Wire messages use plain arrays for JSON serialization.
