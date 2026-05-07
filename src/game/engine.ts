import { randomUUID } from 'crypto';
import pino from 'pino';
import { GameState, GameStatus, Player, Question, EngineError } from '../shared/types.js';
import questionsPool from '../shared/questions.json';

const logger = pino({ name: 'quizzz:engine' });

const QUESTIONS_PER_GAME = 5;

// Cast imported JSON to typed array
const allQuestions: Question[] = questionsPool as unknown as Question[];

const games = new Map<string, GameState>();

function generateGameId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(): string {
  let id = generateGameId();
  // Avoid collisions
  while (games.has(id)) {
    id = generateGameId();
  }
  const state: GameState = {
    id,
    status: GameStatus.Lobby,
    players: new Map<string, Player>(),
    hostId: '',
    currentRound: 0,
    questions: [],
  };
  games.set(id, state);
  logger.info({ gameId: id }, 'Game created');
  return id;
}

export function getGame(gameId: string): GameState | undefined {
  return games.get(gameId);
}

export function joinGame(gameId: string, nickname: string): string {
  const game = games.get(gameId);
  if (!game) {
    throw new EngineError('NOT_FOUND', `Game ${gameId} not found`);
  }
  if (game.status !== GameStatus.Lobby) {
    throw new EngineError('BAD_INPUT', 'Cannot join a game that has already started');
  }
  const trimmed = nickname.trim();
  if (!trimmed) {
    throw new EngineError('BAD_INPUT', 'Nickname must not be empty');
  }
  // Check for duplicate nickname
  for (const player of game.players.values()) {
    if (player.nickname.toLowerCase() === trimmed.toLowerCase()) {
      throw new EngineError('BAD_INPUT', 'Nickname already taken in this game');
    }
  }
  const playerId = randomUUID();
  const player: Player = {
    id: playerId,
    nickname: trimmed,
    score: 0,
    currentAnswer: null,
  };
  game.players.set(playerId, player);
  // First joiner becomes host
  if (game.hostId === '') {
    game.hostId = playerId;
  }
  logger.info({ gameId, playerId, nickname: trimmed }, 'Player joined');
  return playerId;
}

export function startGame(gameId: string, playerId: string): void {
  const game = games.get(gameId);
  if (!game) {
    throw new EngineError('NOT_FOUND', `Game ${gameId} not found`);
  }
  if (game.hostId !== playerId) {
    throw new EngineError('FORBIDDEN', 'Only the host can start the game');
  }
  if (game.status !== GameStatus.Lobby) {
    throw new EngineError('BAD_INPUT', 'Game has already started');
  }
  if (game.players.size === 0) {
    throw new EngineError('BAD_INPUT', 'Cannot start a game with no players');
  }
  if (allQuestions.length === 0) {
    throw new EngineError('BAD_INPUT', 'No questions available');
  }
  // Select QUESTIONS_PER_GAME random questions using Fisher-Yates shuffle
  game.questions = shuffle(allQuestions).slice(0, QUESTIONS_PER_GAME);
  game.status = GameStatus.Playing;
  game.currentRound = 0;
  logger.info({ gameId, players: game.players.size }, 'Game started');
}

export function submitAnswer(
  gameId: string,
  playerId: string,
  answerIndex: number,
): boolean {
  const game = games.get(gameId);
  if (!game) {
    throw new EngineError('NOT_FOUND', `Game ${gameId} not found`);
  }
  if (game.status !== GameStatus.Playing) {
    throw new EngineError('BAD_INPUT', 'Game is not in a playing state');
  }
  const player = game.players.get(playerId);
  if (!player) {
    throw new EngineError('NOT_FOUND', `Player ${playerId} not found`);
  }
  if (player.currentAnswer !== null) {
    // Duplicate answer — return accepted: false without throwing
    return false;
  }
  const question = game.questions[game.currentRound];
  if (!question) {
    throw new EngineError('BAD_INPUT', 'No active question');
  }
  if (answerIndex < 0 || answerIndex >= question.options.length) {
    throw new EngineError('BAD_INPUT', `Answer index must be 0–${question.options.length - 1}`);
  }
  player.currentAnswer = answerIndex;
  if (answerIndex === question.correctIndex) {
    player.score += 10;
  }
  return true;
}
