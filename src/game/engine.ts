import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import pino from 'pino';
import type { GameState, GameStatus, Player, Question, GameStateSummary } from '../shared/types';
import questionsData from '../shared/questions.json';

const logger = pino({ name: 'game-engine' });

// ─── Constants ───────────────────────────────────────────────────────────────

const QUESTIONS_PER_GAME = 5;
const QUESTION_TIME_MS = 15_000; // 15-second answer window
const REVEAL_TIME_MS = 5_000;    // 5-second reveal window between rounds
const CORRECT_SCORE = 10;

// ─── Internal game record ─────────────────────────────────────────────────────

interface ActiveGame {
  state: GameState;
  /** NodeJS timer for the countdown tick interval */
  tickTimer: ReturnType<typeof setInterval> | null;
  /** NodeJS timer for the reveal phase timeout */
  revealTimer: ReturnType<typeof setTimeout> | null;
  /** Remaining seconds on the current question countdown */
  timerRemaining: number;
  /** correctIndex of the current question, set during reveal phase */
  revealCorrectIndex: number | null;
}

// ─── Engine event signatures ──────────────────────────────────────────────────

export interface EngineEvents {
  player_joined: (gameId: string, player: Player, players: Player[]) => void;
  game_started: (gameId: string, questionCount: number) => void;
  question: (gameId: string, round: number, question: Question, totalRounds: number) => void;
  timer_tick: (gameId: string, remaining: number) => void;
  round_result: (gameId: string, correctIndex: number, players: Player[]) => void;
  game_over: (gameId: string, players: Player[]) => void;
  // REQ-GE-21 disconnect events
  player_left: (gameId: string, playerId: string, players: Player[]) => void;
  player_disconnected: (gameId: string, playerId: string, players: Player[]) => void;
  host_changed: (gameId: string, newHostId: string) => void;
  game_destroyed: (gameId: string) => void;
}

// ─── Disconnect result ────────────────────────────────────────────────────────

export type DisconnectResult =
  | { kind: 'lobby_removed'; newHostId: string | null }
  | { kind: 'game_disconnected' }
  | { kind: 'game_destroyed' }
  | { kind: 'not_found' };

export type ReconnectResult =
  | { kind: 'reconnected'; summary: GameStateSummary }
  | { kind: 'not_found' }
  | { kind: 'game_over' };

// ─── GameEngine ───────────────────────────────────────────────────────────────

export class GameEngine extends EventEmitter {
  private games = new Map<string, ActiveGame>();

  // ─── Public: game lifecycle ─────────────────────────────────────────────

  /**
   * REQ-GE-01/09: Create a new game and return its ID.
   */
  createGame(): string {
    const gameId = randomUUID();
    this.games.set(gameId, {
      state: {
        id: gameId,
        status: 'lobby',
        players: [],
        currentRound: 0,
        questions: [],
        hostId: '',
      },
      tickTimer: null,
      revealTimer: null,
      timerRemaining: 0,
      revealCorrectIndex: null,
    });
    logger.info({ gameId }, 'Game created');
    return gameId;
  }

  /**
   * REQ-GE-02/09: Add a player to the lobby.
   * Returns null if the game is not found or not in lobby state.
   */
  joinGame(gameId: string, nickname: string): { playerId: string; players: Player[] } | null {
    const ag = this.games.get(gameId);
    if (!ag || ag.state.status !== 'lobby') return null;

    const player: Player = {
      id: randomUUID(),
      nickname,
      score: 0,
    };

    ag.state.players.push(player);

    // REQ-GE-09: First joiner is the host
    if (ag.state.players.length === 1) {
      ag.state.hostId = player.id;
    }

    logger.info({ gameId, playerId: player.id, nickname }, 'Player joined');
    this.emit('player_joined', gameId, player, [...ag.state.players]);

    return { playerId: player.id, players: [...ag.state.players] };
  }

  /**
   * REQ-GE-01/03: Start the game (host only). Selects 5 random questions.
   * Returns false if conditions are not met.
   */
  startGame(gameId: string, requesterId: string): boolean {
    const ag = this.games.get(gameId);
    if (!ag || ag.state.status !== 'lobby') return false;
    if (ag.state.hostId !== requesterId) return false;
    if (ag.state.players.length === 0) return false;

    // REQ-GE-03: Pick 5 random questions from the pool
    const pool = questionsData as Question[];
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    ag.state.questions = shuffled.slice(0, QUESTIONS_PER_GAME);
    ag.state.status = 'playing';
    ag.state.currentRound = 0;

    logger.info({ gameId }, 'Game started');
    this.emit('game_started', gameId, QUESTIONS_PER_GAME);

    this.advanceToNextRound(gameId);
    return true;
  }

  /**
   * REQ-GE-06: Record a player's answer for the current round.
   * Returns false if the answer is rejected.
   */
  submitAnswer(gameId: string, playerId: string, optionIndex: number): boolean {
    const ag = this.games.get(gameId);
    if (!ag || ag.state.status !== 'playing') return false;

    const player = ag.state.players.find((p) => p.id === playerId);
    if (!player || player.disconnected) return false;
    if (player.currentAnswer !== undefined) return false; // already answered

    player.currentAnswer = optionIndex;

    // REQ-GE-05: Early lock if all active players have answered
    this.checkEarlyLock(gameId, ag);

    return true;
  }

  // ─── REQ-GE-21: Disconnect / reconnect ─────────────────────────────────

  /**
   * Called when a player's WebSocket closes.
   * Behaviour differs depending on game phase.
   */
  disconnectPlayer(gameId: string, playerId: string): DisconnectResult {
    const ag = this.games.get(gameId);
    if (!ag) return { kind: 'not_found' };

    const { state } = ag;
    const playerIndex = state.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return { kind: 'not_found' };

    if (state.status === 'lobby') {
      return this.handleLobbyDisconnect(gameId, ag, playerIndex);
    }

    if (state.status === 'playing' || state.status === 'reveal') {
      return this.handleMidGameDisconnect(gameId, ag, playerId);
    }

    // Already finished — no-op
    return { kind: 'not_found' };
  }

  /**
   * Called when a player reconnects with a known playerId.
   * Restores their connection and returns current game state.
   */
  reconnectPlayer(gameId: string, playerId: string): ReconnectResult {
    const ag = this.games.get(gameId);
    if (!ag) return { kind: 'not_found' };

    const player = ag.state.players.find((p) => p.id === playerId);
    if (!player) return { kind: 'not_found' };

    if (ag.state.status === 'finished') {
      return { kind: 'game_over' };
    }

    player.disconnected = false;

    const currentQuestion =
      ag.state.status !== 'lobby' && ag.state.currentRound > 0
        ? this.safeQuestion(ag)
        : null;

    const summary: GameStateSummary = {
      status: ag.state.status,
      currentRound: ag.state.currentRound,
      totalRounds: QUESTIONS_PER_GAME,
      question: currentQuestion,
      timerRemaining: ag.state.status === 'playing' ? ag.timerRemaining : null,
      correctIndex: ag.revealCorrectIndex,
      players: [...ag.state.players],
      hostId: ag.state.hostId,
    };

    logger.info({ gameId, playerId }, 'Player reconnected');
    return { kind: 'reconnected', summary };
  }

  // ─── Public: game queries ───────────────────────────────────────────────

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId)?.state;
  }

  gameExists(gameId: string): boolean {
    return this.games.has(gameId);
  }

  getPlayers(gameId: string): Player[] {
    return this.games.get(gameId)?.state.players ?? [];
  }

  isHost(gameId: string, playerId: string): boolean {
    const ag = this.games.get(gameId);
    return ag?.state.hostId === playerId;
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private handleLobbyDisconnect(
    gameId: string,
    ag: ActiveGame,
    playerIndex: number,
  ): DisconnectResult {
    const removed = ag.state.players[playerIndex];
    ag.state.players.splice(playerIndex, 1);

    logger.info({ gameId, playerId: removed.id }, 'Player left lobby');

    if (ag.state.players.length === 0) {
      this.destroyGame(gameId);
      return { kind: 'game_destroyed' };
    }

    let newHostId: string | null = null;

    // Promote next player if host left
    if (ag.state.hostId === removed.id) {
      ag.state.hostId = ag.state.players[0].id;
      newHostId = ag.state.hostId;
      logger.info({ gameId, newHostId }, 'Host reassigned');
      this.emit('host_changed', gameId, newHostId);
    }

    this.emit('player_left', gameId, removed.id, [...ag.state.players]);
    return { kind: 'lobby_removed', newHostId };
  }

  private handleMidGameDisconnect(
    gameId: string,
    ag: ActiveGame,
    playerId: string,
  ): DisconnectResult {
    const player = ag.state.players.find((p) => p.id === playerId);
    if (!player) return { kind: 'not_found' };

    player.disconnected = true;
    // Treat as timeout — clear any pending answer, no score awarded
    delete player.currentAnswer;

    logger.info({ gameId, playerId }, 'Player disconnected mid-game');
    this.emit('player_disconnected', gameId, playerId, [...ag.state.players]);

    // Check if we can advance early (all remaining active players answered)
    this.checkEarlyLock(gameId, ag);

    // If everyone disconnected, clean up
    const activeCount = ag.state.players.filter((p) => !p.disconnected).length;
    if (activeCount === 0) {
      logger.info({ gameId }, 'All players disconnected — ending game');
      this.destroyGame(gameId);
      return { kind: 'game_destroyed' };
    }

    return { kind: 'game_disconnected' };
  }

  /**
   * REQ-GE-05: Check if all connected players have answered; if so, end the round early.
   */
  private checkEarlyLock(gameId: string, ag: ActiveGame): void {
    if (ag.state.status !== 'playing') return;

    const active = ag.state.players.filter((p) => !p.disconnected);
    if (active.length === 0) return; // handled separately in all-disconnect path

    const allAnswered = active.every((p) => p.currentAnswer !== undefined);
    if (allAnswered) {
      this.lockRound(gameId, ag);
    }
  }

  /**
   * Advance to the next question round.
   */
  private advanceToNextRound(gameId: string): void {
    const ag = this.games.get(gameId);
    if (!ag) return;

    ag.state.currentRound += 1;
    ag.state.status = 'playing';
    ag.revealCorrectIndex = null;

    // Clear any leftover answers from previous round
    for (const p of ag.state.players) {
      delete p.currentAnswer;
    }

    const question = this.safeQuestion(ag);
    if (!question) {
      // Should not happen, but guard anyway
      logger.error({ gameId }, 'No question found for round');
      return;
    }

    logger.info({ gameId, round: ag.state.currentRound }, 'Starting round');

    // Strip correct answer before emitting to clients
    const clientQuestion: Question = {
      id: question.id,
      text: question.text,
      options: question.options,
    };
    this.emit('question', gameId, ag.state.currentRound, clientQuestion, QUESTIONS_PER_GAME);

    // REQ-GE-04: Start 15-second countdown
    ag.timerRemaining = QUESTION_TIME_MS / 1000;
    ag.tickTimer = setInterval(() => {
      // Guard: game may have been destroyed while timer was running
      const live = this.games.get(gameId);
      if (!live || live.state.status !== 'playing') {
        if (ag.tickTimer) clearInterval(ag.tickTimer);
        ag.tickTimer = null;
        return;
      }

      live.timerRemaining -= 1;
      this.emit('timer_tick', gameId, live.timerRemaining);

      if (live.timerRemaining <= 0) {
        if (ag.tickTimer) clearInterval(ag.tickTimer);
        ag.tickTimer = null;
        this.lockRound(gameId, live);
      }
    }, 1_000);
  }

  /**
   * REQ-GE-05/06/07: End the answer phase, score, then enter 5-second reveal.
   */
  private lockRound(gameId: string, ag: ActiveGame): void {
    if (ag.state.status !== 'playing') return; // guard against double-lock

    // Stop tick timer
    if (ag.tickTimer) {
      clearInterval(ag.tickTimer);
      ag.tickTimer = null;
    }

    ag.state.status = 'reveal';

    const question = this.safeQuestion(ag);
    if (!question || question.correctIndex === undefined) {
      logger.error({ gameId }, 'Cannot score: missing correctIndex');
      return;
    }

    const correctIndex = question.correctIndex;
    ag.revealCorrectIndex = correctIndex;

    // REQ-GE-06: Apply scoring
    for (const player of ag.state.players) {
      if (!player.disconnected && player.currentAnswer === correctIndex) {
        player.score += CORRECT_SCORE;
      }
    }

    logger.info({ gameId, round: ag.state.currentRound, correctIndex }, 'Round locked');
    this.emit('round_result', gameId, correctIndex, [...ag.state.players]);

    // REQ-GE-07: 5-second reveal, then advance or finish
    ag.revealTimer = setTimeout(() => {
      ag.revealTimer = null;
      const live = this.games.get(gameId);
      if (!live) return; // game destroyed during reveal

      if (live.state.currentRound >= QUESTIONS_PER_GAME) {
        this.finishGame(gameId, live);
      } else {
        this.advanceToNextRound(gameId);
      }
    }, REVEAL_TIME_MS);
  }

  /**
   * REQ-GE-08: Transition to finished, emit game_over with sorted rankings.
   */
  private finishGame(gameId: string, ag: ActiveGame): void {
    ag.state.status = 'finished';

    const ranked = [...ag.state.players].sort((a, b) => b.score - a.score);

    logger.info({ gameId }, 'Game finished');
    this.emit('game_over', gameId, ranked);
  }

  /**
   * REQ-GE-21: Clear all timers and remove the game from the map.
   */
  private destroyGame(gameId: string): void {
    const ag = this.games.get(gameId);
    if (!ag) return;

    if (ag.tickTimer) {
      clearInterval(ag.tickTimer);
      ag.tickTimer = null;
    }
    if (ag.revealTimer) {
      clearTimeout(ag.revealTimer);
      ag.revealTimer = null;
    }

    ag.state.status = 'finished';
    this.games.delete(gameId);

    logger.info({ gameId }, 'Game destroyed');
    this.emit('game_destroyed', gameId);
  }

  /** Return the question for the current round (1-indexed). */
  private safeQuestion(ag: ActiveGame): Question | null {
    const idx = ag.state.currentRound - 1;
    return ag.state.questions[idx] ?? null;
  }
}

// Singleton instance used by routes and WS handler
export const engine = new GameEngine();
