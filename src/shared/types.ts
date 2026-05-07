// Shared TypeScript types for the quizzz application (backend + frontend)

export type GameStatus = 'lobby' | 'playing' | 'reveal' | 'finished';

export interface Question {
  id: number;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  currentAnswer: number | null;
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

// --- API request types ---

export interface JoinRequest {
  nickname: string;
}

export interface AnswerRequest {
  playerId: string;
  answerIndex: number;
}

// --- API response types ---

export interface CreateGameResponse {
  gameId: string;
}

export interface JoinResponse {
  playerId: string;
  isHost: boolean;
}

export interface AnswerResponse {
  accepted: boolean;
}

export interface ErrorResponse {
  error: string;
}

// --- WebSocket message types (discriminated union) ---

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
