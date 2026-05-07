// Shared TypeScript types for quizzz — used by both server and client

export type GameStatus = 'lobby' | 'playing' | 'reveal' | 'finished';

export interface Player {
  id: string;
  nickname: string;
  score: number;
  currentAnswer?: number;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  /** Only present on the server; not sent to clients in 'question' messages */
  correctIndex?: number;
}

export interface GameState {
  id: string;
  status: GameStatus;
  players: Player[];
  currentRound: number;
  questions: Question[];
}

// ─── Server → Client WebSocket messages ─────────────────────────────────────

export type ServerMessage =
  | { type: 'player_joined'; player: Player; players: Player[] }
  | { type: 'game_start'; questionCount: number }
  | { type: 'question'; round: number; question: Question; totalRounds: number }
  | { type: 'timer_tick'; remaining: number }
  | { type: 'round_result'; correctIndex: number; players: Player[] }
  | { type: 'game_over'; players: Player[] }
  | { type: 'player_left'; playerId: string; players: Player[] };

// ─── Client → Server WebSocket messages ─────────────────────────────────────

export type ClientMessage =
  | { type: 'answer'; optionIndex: number }
  | { type: 'start_game' };

// ─── Connection status (client-only) ────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export type WsEventType = ServerMessage['type'] | 'status_change';

// ─── API request/response types ─────────────────────────────────────────────

export interface CreateGameResponse {
  gameId: string;
}

export interface JoinGameRequest {
  nickname: string;
}

export interface JoinGameResponse {
  playerId: string;
  gameId: string;
  players: Player[];
}

export interface AnswerRequest {
  optionIndex: number;
}
