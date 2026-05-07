import pino from 'pino';
import type { GameState, GameStatus, Player, Question } from '../shared/types';
import questionsData from '../shared/questions.json';

const logger = pino({ name: 'quizzz:engine' });

const ALL_QUESTIONS = questionsData as Question[];
const QUESTIONS_PER_GAME = 5;

function pickQuestions(): Question[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_GAME);
}

export class GameEngine {
  private state: GameState;

  constructor(gameId: string) {
    this.state = {
      id: gameId,
      status: 'lobby' as GameStatus,
      players: [],
      currentRound: 0,
      questions: [],
    };
    logger.info({ gameId }, 'GameEngine created');
  }

  getState(): GameState {
    return this.state;
  }

  addPlayer(player: Player): void {
    if (!this.state.players.find((p) => p.id === player.id)) {
      this.state.players.push(player);
      logger.info({ playerId: player.id, nickname: player.nickname }, 'Player added');
    }
  }

  removePlayer(playerId: string): void {
    this.state.players = this.state.players.filter((p) => p.id !== playerId);
    logger.info({ playerId }, 'Player removed');
  }

  startGame(): Question[] {
    this.state.questions = pickQuestions();
    this.state.status = 'playing';
    this.state.currentRound = 0;
    logger.info({ gameId: this.state.id }, 'Game started');
    return this.state.questions;
  }

  /**
   * REQ-RS-04: Reset all player scores to zero and return state to lobby.
   * Preserves the player list so the same players can play again.
   */
  resetGame(): GameState {
    for (const player of this.state.players) {
      player.score = 0;
      player.currentAnswer = undefined;
    }
    this.state.status = 'lobby';
    this.state.currentRound = 0;
    this.state.questions = [];
    logger.info({ gameId: this.state.id }, 'Game reset — scores zeroed, status back to lobby');
    return this.state;
  }

  recordAnswer(playerId: string, optionIndex: number): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (player) {
      player.currentAnswer = optionIndex;
    }
  }

  scoreRound(): void {
    const question = this.state.questions[this.state.currentRound];
    if (!question) return;
    for (const player of this.state.players) {
      if (player.currentAnswer === question.correctIndex) {
        player.score += 10;
      }
      player.currentAnswer = undefined;
    }
  }

  nextRound(): boolean {
    this.state.currentRound += 1;
    if (this.state.currentRound >= this.state.questions.length) {
      this.state.status = 'finished';
      return false;
    }
    return true;
  }

  currentQuestion(): Question | undefined {
    return this.state.questions[this.state.currentRound];
  }
}

// In-memory game registry — one engine per active game
const games = new Map<string, GameEngine>();

export function getOrCreateEngine(gameId: string): GameEngine {
  let engine = games.get(gameId);
  if (!engine) {
    engine = new GameEngine(gameId);
    games.set(gameId, engine);
  }
  return engine;
}

export function deleteEngine(gameId: string): void {
  games.delete(gameId);
}
