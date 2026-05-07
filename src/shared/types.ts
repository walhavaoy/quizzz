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

// ---------------------------------------------------------------------------
// Core data shapes
// ---------------------------------------------------------------------------

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  currentAnswer: number | null;
}

/**
 * In-memory game state (server-side).
 * `players` uses Map for O(1) lookup; wire messages use plain arrays.
 */
export interface GameState {
  id: string;
  status: GameStatus;
  players: Map<string, Player>;
  currentRound: number;
  questions: Question[];
}

// ---------------------------------------------------------------------------
// WebSocket server → client messages
// ---------------------------------------------------------------------------

export interface PlayerJoinedMessage {
  type: 'player_joined';
  playerId: string;
  nickname: string;
  players: Array<{ id: string; nickname: string; score: number }>;
}

export interface GameStartMessage {
  type: 'game_start';
}

/** correctIndex is intentionally omitted to prevent cheating. */
export interface QuestionMessage {
  type: 'question';
  round: number;
  totalRounds: number;
  text: string;
  options: string[];
  timeLimit: number;
}

export interface TimerTickMessage {
  type: 'timer_tick';
  remaining: number;
}

export interface RoundResultMessage {
  type: 'round_result';
  correctIndex: number;
  scores: Array<{
    playerId: string;
    nickname: string;
    score: number;
    delta: number;
    answered: number | null;
  }>;
}

export interface GameOverMessage {
  type: 'game_over';
  rankings: Array<{
    playerId: string;
    nickname: string;
    score: number;
    rank: number;
  }>;
}

export interface PlayerLeftMessage {
  type: 'player_left';
  playerId: string;
  nickname: string;
}

export type ServerMessage =
  | PlayerJoinedMessage
  | GameStartMessage
  | QuestionMessage
  | TimerTickMessage
  | RoundResultMessage
  | GameOverMessage
  | PlayerLeftMessage;

// ---------------------------------------------------------------------------
// WebSocket client → server messages
// ---------------------------------------------------------------------------

export interface StartGameMessage {
  type: 'start_game';
}

export interface PingMessage {
  type: 'ping';
}

export type ClientMessage = StartGameMessage | PingMessage;

// ---------------------------------------------------------------------------
// Connection status (client-only)
// ---------------------------------------------------------------------------

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export type WsEventType = ServerMessage['type'] | 'status_change';

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
