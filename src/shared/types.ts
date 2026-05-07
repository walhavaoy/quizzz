// Shared TypeScript types for quizzz — used by both server and client

export type GameStatus = 'lobby' | 'playing' | 'reveal' | 'finished';

export interface Player {
  id: string;
  nickname: string;
  score: number;
  currentAnswer: number | null;
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
  hostId: string;
  currentRound: number;
  questions: Question[];
  timeRemaining: number;
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

export interface JoinRequest {
  nickname: string;
}

export interface JoinResponse {
  playerId: string;
  isHost: boolean;
}

export interface AnswerRequest {
  playerId: string;
  answerIndex: number;
}

export interface AnswerResponse {
  accepted: boolean;
}

export interface ErrorResponse {
  error: string;
}

// Legacy aliases kept for compatibility with future WS handler code
export type JoinGameRequest = JoinRequest;

export interface JoinGameResponse {
  playerId: string;
  gameId: string;
  players: Player[];
}

// ─── WebSocket message types (discriminated union) ───────────────────────────

export type WsServerMessage =
  | { type: 'game_state'; payload: GameState }
  | { type: 'tick'; payload: { timeRemaining: number } }
  | { type: 'question'; payload: { question: Question; round: number } }
  | { type: 'reveal'; payload: { correctIndex: number; scores: Array<{ playerId: string; score: number }> } }
  | { type: 'finished'; payload: { rankings: Array<{ playerId: string; nickname: string; score: number }> } }
  | { type: 'error'; payload: { message: string } };

export type WsClientMessage =
  | { type: 'join'; payload: { gameId: string; playerId: string } }
  | { type: 'start'; payload: { gameId: string; playerId: string } }
  | { type: 'answer'; payload: { gameId: string; playerId: string; answerIndex: number } }
  | { type: 'play_again'; payload: { gameId: string; playerId: string } };
