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
 * Returns true when accepted. Scoring and round advancement handled by REQ-GE tasks.
 */
export function submitAnswer(_game: GameState, player: Player, answerIndex: number): boolean {
  player.currentAnswer = answerIndex;
  return true;
}
