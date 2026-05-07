---
component: websocket-client
area: frontend
coverage: 100%
created: 2026-05-07
updated: 2026-05-07
---

# WebSocket Client — Implementation Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-WC-01   | done   | `connect(gameId, playerId)` builds `ws(s)://host/ws?gameId=…&playerId=…` and opens native WebSocket |
| REQ-WC-02   | done   | `onmessage` JSON-parses and validates `type` field; malformed messages logged + ignored |
| REQ-WC-03   | done   | `on(eventType, cb)` / `off(eventType, cb)`; multiple callbacks per event type via `Map<string, Set>` |
| REQ-WC-04   | done   | `onclose` logs code/reason and emits `status_change`; `onerror` logs the event |
| REQ-WC-05   | done   | Exponential backoff (1s→2s→4s→8s→10s cap), max 5 attempts; handlers preserved across reconnects |
| REQ-WC-10   | done   | `getStatus()` returns `ConnectionStatus`; `on('status_change', cb)` fires on every transition |

## Files

- `client/ws-client.ts` — `WsClient` class (main deliverable)
- `src/shared/types.ts` — `ServerMessage`, `ConnectionStatus`, `WsEventType`, and other shared types
- `tsconfig.client.json` — widened `rootDir: "."`, added `src/shared/**/*` to `include`

## Notes

- With `rootDir: "."`, compiled client files land at `public/js/client/*.js`. HTML `<script>` tags must reference `js/client/main.js` (not `js/main.js`).
- `disconnect()` closes with code 1000 (suppresses auto-reconnect). Callers should `off()` handlers they no longer need to avoid memory leaks.
- Browser console is used for logging (pino is server-only).
