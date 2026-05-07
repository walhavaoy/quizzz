import crypto from 'crypto';
import pino from 'pino';
import questionsData from '../shared/questions.json';
import { GameStatus } from '../shared/types.js';
import type {
  GameState,
  Player,
  Question,
  PublicGameState,
  PublicPlayer,
  PublicQuestion,
} from '../shared/types.js';

const logger = pino({ name: 'quizzz:engine' });

const QUESTIONS_PER_GAME = 5;
const ALL_QUESTIONS = questionsData as unknown as Question[];

/** Server-side game state extends the shared GameState with internal fields */
interface ServerGameState extends GameState {
  hostPlayerId: string;
  phaseStartedAt: number;
}

const games = new Map<string, ServerGameState>();

function pickQuestions(count: number): Question[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function createGame(): ServerGameState {
  const id = crypto.randomUUID();
  const game: ServerGameState = {
    id,
    status: GameStatus.Lobby,
    players: new Map<string, Player>(),
    currentRound: 0,
    questions: pickQuestions(QUESTIONS_PER_GAME),
    hostPlayerId: '',
    phaseStartedAt: Date.now(),
  };
  games.set(id, game);
  logger.info({ gameId: id }, 'Game created');
  return game;
}

export function getGame(gameId: string): ServerGameState | undefined {
  return games.get(gameId);
}

export function joinGame(
  gameId: string,
  playerId: string,
  nickname: string,
): Player {
  const game = games.get(gameId);
  if (!game) throw new Error(`Game not found: ${gameId}`);
  if (game.status !== GameStatus.Lobby) throw new Error('Game already started');

  const player: Player = { id: playerId, nickname, score: 0, currentAnswer: null };
  game.players.set(playerId, player);

  if (game.players.size === 1) {
    game.hostPlayerId = playerId;
  }

  logger.info({ gameId, playerId, nickname }, 'Player joined');
  return player;
}

export function startGame(gameId: string, requestingPlayerId: string): void {
  const game = games.get(gameId);
  if (!game) throw new Error(`Game not found: ${gameId}`);
  if (game.hostPlayerId !== requestingPlayerId) throw new Error('Only the host can start the game');
  if (game.status !== GameStatus.Lobby) throw new Error('Game already started');

  game.status = GameStatus.Playing;
  game.currentRound = 1;
  game.phaseStartedAt = Date.now();
  logger.info({ gameId }, 'Game started');
}

export function submitAnswer(
  gameId: string,
  playerId: string,
  optionIndex: number,
): { correct: boolean; score: number } {
  const game = games.get(gameId);
  if (!game) throw new Error(`Game not found: ${gameId}`);
  if (game.status !== GameStatus.Playing) throw new Error('Game is not in playing phase');

  const player = game.players.get(playerId);
  if (!player) throw new Error(`Player not found: ${playerId}`);

  const question = game.questions[game.currentRound - 1];
  if (!question) throw new Error('No current question');

  player.currentAnswer = optionIndex;

  const correct = question.correctIndex === optionIndex;
  if (correct) {
    player.score += 10;
  }

  logger.info({ gameId, playerId, optionIndex, correct }, 'Answer submitted');
  return { correct, score: player.score };
}

export function getPublicGameState(gameId: string): PublicGameState | null {
  const game = games.get(gameId);
  if (!game) return null;

  const players: PublicPlayer[] = Array.from(game.players.values()).map((p) => ({
    id: p.id,
    nickname: p.nickname,
    score: p.score,
  }));

  let question: PublicQuestion | null = null;
  let correctAnswerIndex: number | null = null;

  if (game.status === GameStatus.Playing || game.status === GameStatus.Reveal) {
    const q = game.questions[game.currentRound - 1];
    if (q) {
      question = { text: q.text, options: q.options };
      // Only reveal correctIndex during the 'reveal' phase
      if (game.status === GameStatus.Reveal) {
        correctAnswerIndex = q.correctIndex;
      }
    }
  }

  return {
    id: game.id,
    status: game.status,
    players,
    currentRound: game.currentRound,
    totalRounds: game.questions.length,
    question,
    correctAnswerIndex,
  };
}
