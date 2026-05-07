import { randomUUID } from 'crypto';
import pino from 'pino';
import { GameState, GameStatus, Player, Question } from '../shared/types';
import rawQuestions from '../shared/questions.json';

const logger = pino({ name: 'game-engine' });

// Convert numeric IDs from JSON to strings to match the Question interface
const questionPool: Question[] = rawQuestions.map((q) => ({
  id: String(q.id),
  text: q.text,
  options: q.options,
  correctIndex: q.correctIndex,
}));

const QUESTIONS_PER_GAME = 5;
const QUESTION_TIME_MS = 15_000;
const REVEAL_TIME_MS = 5_000;
const TICK_INTERVAL_MS = 1_000;
const SCORE_CORRECT = 10;

// ---------------------------------------------------------------------------
// Engine event callbacks
// ---------------------------------------------------------------------------

export interface EngineCallbacks {
  onQuestion(
    gameId: string,
    round: number,
    totalRounds: number,
    text: string,
    options: string[],
    timeLimit: number,
  ): void;
  onTimerTick(gameId: string, remaining: number): void;
  onRoundResult(
    gameId: string,
    correctIndex: number,
    scores: Array<{
      playerId: string;
      nickname: string;
      score: number;
      delta: number;
      answered: number | null;
    }>,
  ): void;
  onGameOver(
    gameId: string,
    rankings: Array<{
      playerId: string;
      nickname: string;
      score: number;
      rank: number;
    }>,
  ): void;
}

let callbacks: EngineCallbacks | null = null;

export function registerCallbacks(cb: EngineCallbacks): void {
  callbacks = cb;
}

// ---------------------------------------------------------------------------
// Timer tracking (side map — keeps GameState interface clean for client use)
// ---------------------------------------------------------------------------

interface ActiveTimer {
  interval: NodeJS.Timeout;
  revealTimeout?: NodeJS.Timeout;
}

const activeTimers = new Map<string, ActiveTimer>();

export function clearAllTimers(): void {
  for (const [gameId, timer] of activeTimers) {
    clearInterval(timer.interval);
    if (timer.revealTimeout) clearTimeout(timer.revealTimeout);
    activeTimers.delete(gameId);
    logger.info({ gameId }, 'Timer cleared');
  }
}

// ---------------------------------------------------------------------------
// Game CRUD
// ---------------------------------------------------------------------------

export const games = new Map<string, GameState>();

export function createGame(): string {
  const id = randomUUID();

  // Fisher-Yates shuffle, take first QUESTIONS_PER_GAME
  const shuffled = [...questionPool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const questions = shuffled.slice(0, QUESTIONS_PER_GAME);

  const game: GameState = {
    id,
    status: GameStatus.Lobby,
    players: new Map(),
    currentRound: 0,
    questions,
  };

  games.set(id, game);
  logger.info({ gameId: id }, 'Game created');
  return id;
}

export function getGame(id: string): GameState | undefined {
  return games.get(id);
}

export function isNicknameTaken(game: GameState, nickname: string): boolean {
  const lower = nickname.toLowerCase();
  for (const player of game.players.values()) {
    if (player.nickname.toLowerCase() === lower) return true;
  }
  return false;
}

export function addPlayer(game: GameState, nickname: string): Player {
  const player: Player = {
    id: randomUUID(),
    nickname,
    score: 0,
    currentAnswer: null,
  };
  game.players.set(player.id, player);
  logger.info({ gameId: game.id, playerId: player.id, nickname }, 'Player joined');
  return player;
}

export function getPlayer(game: GameState, playerId: string): Player | undefined {
  return game.players.get(playerId);
}

/**
 * Records a player's answer for the current round.
 * Returns true when accepted.
 */
export function submitAnswer(_game: GameState, player: Player, answerIndex: number): boolean {
  player.currentAnswer = answerIndex;
  return true;
}

// ---------------------------------------------------------------------------
// Game flow: start → rounds → finish
// ---------------------------------------------------------------------------

export function startGame(gameId: string): boolean {
  const game = games.get(gameId);
  if (!game) {
    logger.warn({ gameId }, 'startGame: game not found');
    return false;
  }
  if (game.status !== GameStatus.Lobby) {
    logger.warn({ gameId, status: game.status }, 'startGame: game not in lobby');
    return false;
  }
  if (game.players.size === 0) {
    logger.warn({ gameId }, 'startGame: no players');
    return false;
  }

  game.status = GameStatus.Playing;
  game.currentRound = 0;
  logger.info({ gameId }, 'Game started');
  startRound(game);
  return true;
}

function startRound(game: GameState): void {
  game.currentRound += 1;

  // Reset all players' answers for the new round
  for (const player of game.players.values()) {
    player.currentAnswer = null;
  }

  const question = game.questions[game.currentRound - 1];
  const timeLimit = QUESTION_TIME_MS / 1000;

  logger.info(
    { gameId: game.id, round: game.currentRound, totalRounds: QUESTIONS_PER_GAME },
    'Round started',
  );

  // Fire question event (correctIndex intentionally omitted)
  if (callbacks) {
    callbacks.onQuestion(
      game.id,
      game.currentRound,
      QUESTIONS_PER_GAME,
      question.text,
      question.options,
      timeLimit,
    );
  }

  // Server-authoritative countdown timer
  let remaining = timeLimit;
  const interval = setInterval(() => {
    remaining -= 1;
    if (callbacks) {
      callbacks.onTimerTick(game.id, remaining);
    }
    if (remaining <= 0) {
      clearInterval(interval);
      endRound(game);
    }
  }, TICK_INTERVAL_MS);

  // Store timer handle for cleanup
  const existing = activeTimers.get(game.id);
  if (existing) {
    clearInterval(existing.interval);
    if (existing.revealTimeout) clearTimeout(existing.revealTimeout);
  }
  activeTimers.set(game.id, { interval });
}

function endRound(game: GameState): void {
  game.status = GameStatus.Reveal;

  const question = game.questions[game.currentRound - 1];
  const correctIdx = question.correctIndex;

  // Score each player
  const scores: Array<{
    playerId: string;
    nickname: string;
    score: number;
    delta: number;
    answered: number | null;
  }> = [];

  for (const player of game.players.values()) {
    const delta = player.currentAnswer === correctIdx ? SCORE_CORRECT : 0;
    player.score += delta;
    scores.push({
      playerId: player.id,
      nickname: player.nickname,
      score: player.score,
      delta,
      answered: player.currentAnswer,
    });
  }

  logger.info({ gameId: game.id, round: game.currentRound, correctIdx }, 'Round ended');

  if (callbacks) {
    callbacks.onRoundResult(game.id, correctIdx, scores);
  }

  // After reveal window, advance to next round or finish
  const revealTimeout = setTimeout(() => {
    if (game.currentRound >= QUESTIONS_PER_GAME) {
      finishGame(game);
    } else {
      game.status = GameStatus.Playing;
      startRound(game);
    }
  }, REVEAL_TIME_MS);

  // Track reveal timeout for cleanup
  const timer = activeTimers.get(game.id);
  if (timer) {
    timer.revealTimeout = revealTimeout;
  }
}

function finishGame(game: GameState): void {
  game.status = GameStatus.Finished;

  // Sort players by score descending
  const sorted = [...game.players.values()].sort((a, b) => b.score - a.score);

  // Build rankings with tie-aware ranks
  const rankings: Array<{
    playerId: string;
    nickname: string;
    score: number;
    rank: number;
  }> = [];

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    // If not first and score differs from previous, rank = position + 1
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      currentRank = i + 1;
    }
    rankings.push({
      playerId: sorted[i].id,
      nickname: sorted[i].nickname,
      score: sorted[i].score,
      rank: currentRank,
    });
  }

  logger.info({ gameId: game.id, rankings }, 'Game finished');

  if (callbacks) {
    callbacks.onGameOver(game.id, rankings);
  }

  // Clean up timer tracking
  const timer = activeTimers.get(game.id);
  if (timer) {
    clearInterval(timer.interval);
    if (timer.revealTimeout) clearTimeout(timer.revealTimeout);
    activeTimers.delete(game.id);
  }
}
