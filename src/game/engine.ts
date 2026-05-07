import { randomUUID } from 'crypto';
import pino from 'pino';
import type { GameState, Player } from '../shared/types.js';
import { GameStatus } from '../shared/types.js';

const logger = pino({ name: 'game-engine' });

const games = new Map<string, GameState>();

export function createGame(): string {
  const id = randomUUID();
  const state: GameState = {
    id,
    status: GameStatus.Lobby,
    players: new Map<string, Player>(),
    currentRound: 0,
    questions: [],
  };
  games.set(id, state);
  logger.info({ gameId: id }, 'Game created');
  return id;
}

export interface JoinResult {
  playerId: string;
  isHost: boolean;
  hostId: string;
  players: Array<{ id: string; nickname: string; score: number }>;
}

export function joinGame(gameId: string, nickname: string): JoinResult {
  const game = games.get(gameId);
  if (!game) {
    throw Object.assign(new Error('Game not found'), { code: 'NOT_FOUND' });
  }
  if (game.status !== GameStatus.Lobby) {
    throw Object.assign(new Error('Game already started'), { code: 'BAD_STATE' });
  }

  const playerId = randomUUID();
  const isHost = game.players.size === 0;
  const player: Player = { id: playerId, nickname, score: 0, currentAnswer: null };
  game.players.set(playerId, player);

  const hostId = getHostId(game);
  const players = Array.from(game.players.values()).map((p) => ({
    id: p.id,
    nickname: p.nickname,
    score: p.score,
  }));

  logger.info({ gameId, playerId, nickname, isHost }, 'Player joined');
  return { playerId, isHost, hostId, players };
}

export function startGame(gameId: string): void {
  const game = games.get(gameId);
  if (!game) {
    throw Object.assign(new Error('Game not found'), { code: 'NOT_FOUND' });
  }
  if (game.status !== GameStatus.Lobby) {
    throw Object.assign(new Error('Game already started'), { code: 'BAD_STATE' });
  }
  game.status = GameStatus.Playing;
  logger.info({ gameId }, 'Game started');
}

export function getGame(gameId: string): GameState | undefined {
  return games.get(gameId);
}

function getHostId(game: GameState): string {
  const firstPlayer = game.players.values().next().value;
  if (!firstPlayer) {
    throw new Error('No players in game');
  }
  return firstPlayer.id;
}
