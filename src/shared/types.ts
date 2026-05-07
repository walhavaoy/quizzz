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

export enum GameStatus {
  Lobby = 'lobby',
  Playing = 'playing',
  Reveal = 'reveal',
  Finished = 'finished',
}

/** String literal union for game status — matches GameStatus enum values. Used in GameState. */
export type GameStatusStr = 'lobby' | 'playing' | 'reveal' | 'finished';

// ---------------------------------------------------------------------------
// Core data shapes
// ---------------------------------------------------------------------------

export interface Question {
  id: number;
  text: string;
  options: string[];
  /** Only present on the server; not sent to clients in 'question' messages */
  correctIndex?: number;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  currentAnswer?: number;
  /** Set when the player's WebSocket disconnects during an active game */
  disconnected?: boolean;
}

/**
 * In-memory game state (server-side).
 */
export interface GameState {
  id: string;
  status: GameStatusStr;
  players: Player[];
  currentRound: number;
  questions: Question[];
  /** Player ID of the current host (first joiner; reassigned on host disconnect) */
  hostId: string;
}

// ---------------------------------------------------------------------------
// WebSocket server → client messages
// ---------------------------------------------------------------------------

export type ServerMessage =
  | { type: 'player_joined'; player: Player; players: Player[] }
  | { type: 'game_start'; questionCount: number }
  | { type: 'question'; round: number; question: Question; totalRounds: number }
  | { type: 'timer_tick'; remaining: number }
  | { type: 'round_result'; correctIndex: number; players: Player[] }
  | { type: 'game_over'; players: Player[] }
  | { type: 'player_left'; playerId: string; players: Player[] }
  /** Broadcast when a player disconnects during playing/reveal phase (stays in scoreboard) */
  | { type: 'player_disconnected'; playerId: string; players: Player[] }
  /** Broadcast when the host leaves and a new host is promoted */
  | { type: 'host_changed'; newHostId: string }
  /** Sent to a reconnecting client to restore current game state */
  | { type: 'state_sync'; game: GameStateSummary };

/**
 * Sent to a reconnecting player to bring them up to date.
 * correctIndex is present only during reveal phase.
 */
export interface GameStateSummary {
  status: GameStatusStr;
  currentRound: number;
  totalRounds: number;
  question: Question | null;
  timerRemaining: number | null;
  correctIndex: number | null;
  players: Player[];
  hostId: string;
}

// ---------------------------------------------------------------------------
// WebSocket client → server messages
// ---------------------------------------------------------------------------

export type ClientMessage =
  | { type: 'answer'; optionIndex: number }
  | { type: 'start_game' }
  /** Sent on reconnect to re-bind a known playerId to the new socket */
  | { type: 'reconnect'; gameId: string; playerId: string };

// ---------------------------------------------------------------------------
// Connection status (client-only)
// ---------------------------------------------------------------------------

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export type WsEventType = ServerMessage['type'] | 'status_change';
// Narrowed event type for messages that carry player/game updates
export type GameEventType = Exclude<WsEventType, 'status_change'>;

// ---------------------------------------------------------------------------
// REST API request / response types
// ---------------------------------------------------------------------------

export interface CreateGameResponse {
  gameId: string;
}

export interface JoinGameRequest {
  nickname: string;
}

export interface JoinGameResponse {
  playerId: string;
}

export interface SubmitAnswerRequest {
  playerId: string;
  answerIndex: number;
}

export interface SubmitAnswerResponse {
  accepted: boolean;
}

export interface ApiErrorResponse {
  error: string;
}
