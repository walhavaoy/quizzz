/**
 * Shared TypeScript type definitions for quizzz.
 *
 * Used by both server (src/) and client (client/) code.
 * Client code should use `import type { ... } from '../src/shared/types'` to
 * avoid emitting unnecessary runtime references.
 */
// ---------------------------------------------------------------------------
// Game status
// ---------------------------------------------------------------------------
export var GameStatus;
(function (GameStatus) {
    GameStatus["Lobby"] = "lobby";
    GameStatus["Playing"] = "playing";
    GameStatus["Reveal"] = "reveal";
    GameStatus["Finished"] = "finished";
})(GameStatus || (GameStatus = {}));
