import { randomUUID } from 'crypto';
import type { GameState, GameStatus, Player, Question } from '../shared/types';
import questionsPool from '../shared/questions.json';

const QUESTIONS_PER_GAME = 5;

// In-memory game store
const games = new Map<string, GameState>();

// Typed question pool
const pool = questionsPool as Question[];

// Custom error for mapping to HTTP status codes in route handlers
export class GameError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'GameError';
  }
}

function selectQuestions(): Question[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_GAME);
}

export function createGame(): string {
  const id = randomUUID();
  const game: GameState = {
    id,
    status: 'lobby' as GameStatus,
    players: [],
    hostId: '',
    currentRound: 0,
    questions: selectQuestions(),
    timeRemaining: 0,
  };
  games.set(id, game);
  return id;
}

export function getGame(gameId: string): GameState | undefined {
  return games.get(gameId);
}

export function joinGame(
  gameId: string,
  nickname: string,
): { playerId: string; isHost: boolean } {
  const game = games.get(gameId);
  if (!game) {
    throw new GameError('Game not found', 404);
  }
  if (game.status !== 'lobby') {
    throw new GameError('Game has already started', 409);
  }

  // Case-insensitive duplicate nickname check
  const duplicate = game.players.some(
    (p) => p.nickname.toLowerCase() === nickname.toLowerCase(),
  );
  if (duplicate) {
    throw new GameError('Nickname already taken', 409);
  }

  const playerId = randomUUID();
  const isHost = game.players.length === 0;

  const player: Player = {
    id: playerId,
    nickname,
    score: 0,
    currentAnswer: null,
  };

  game.players.push(player);

  if (isHost) {
    game.hostId = playerId;
  }

  return { playerId, isHost };
}

export function submitAnswer(
  gameId: string,
  playerId: string,
  answerIndex: number,
): boolean {
  const game = games.get(gameId);
  if (!game) {
    throw new GameError('Game not found', 404);
  }
  if (game.status !== 'playing') {
    throw new GameError('Game is not accepting answers', 400);
  }

  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    throw new GameError('Player not found', 404);
  }

  // Already answered — idempotent rejection
  if (player.currentAnswer !== null) {
    return false;
  }

  player.currentAnswer = answerIndex;

  // Score: +10 for correct answer
  const currentQuestion = game.questions[game.currentRound];
  if (currentQuestion && answerIndex === currentQuestion.correctIndex) {
    player.score += 10;
  }

  return true;
}
