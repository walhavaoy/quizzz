/**
 * Shared TypeScript type definitions for quizzz.
 *
 * Used by both server (src/) and client (client/) code.
 */

// ---------------------------------------------------------------------------
// Game status
// ---------------------------------------------------------------------------

export type GameStatus = 'lobby' | 'playing' | 'reveal' | 'finished';

// ---------------------------------------------------------------------------
// Core data shapes
// ---------------------------------------------------------------------------

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  currentAnswer: number | undefined;
}

export interface GameState {
  id: string;
  status: GameStatus;
  players: Player[];
  currentRound: number;
  questions: Question[];
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
  | { type: 'back_to_lobby' };

// ---------------------------------------------------------------------------
// WebSocket client → server messages
// ---------------------------------------------------------------------------

export type ClientMessage =
  | { type: 'answer'; optionIndex: number }
  | { type: 'start_game' }
  | { type: 'play_again' };

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
