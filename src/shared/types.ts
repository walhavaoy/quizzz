export type GameStatus = 'lobby' | 'playing' | 'reveal' | 'finished';

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
  currentAnswer: number | null;
}

export interface GameState {
  id: string;
  status: GameStatus;
  players: Map<string, Player>;
  hostId: string;
  currentRound: number;
  questions: Question[];
}

// API request/response types
export interface CreateGameResponse {
  gameId: string;
}

export interface JoinGameRequest {
  nickname: string;
}

export interface JoinGameResponse {
  playerId: string;
}

export interface StartGameRequest {
  playerId: string;
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

// Engine error codes
export type EngineErrorCode = 'NOT_FOUND' | 'BAD_INPUT' | 'FORBIDDEN';

export class EngineError extends Error {
  constructor(
    public readonly code: EngineErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'EngineError';
  }
}
