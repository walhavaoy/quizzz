import { Router, Request, Response } from 'express';
import pino from 'pino';
import { GameStatus } from '../shared/types';
import type {
  CreateGameResponse,
  JoinGameResponse,
  SubmitAnswerResponse,
  ApiErrorResponse,
} from '../shared/types';
import {
  createGame,
  getGame,
  isNicknameTaken,
  addPlayer,
  getPlayer,
  submitAnswer,
} from '../game/engine';

const logger = pino({ name: 'api' });
const router = Router();

// POST /games — create a new game lobby
router.post('/games', (_req: Request, res: Response<CreateGameResponse>) => {
  const gameId = createGame();
  res.status(201).json({ gameId });
});

// POST /games/:id/join — join an existing lobby
router.post(
  '/games/:id/join',
  (req: Request, res: Response<JoinGameResponse | ApiErrorResponse>) => {
    const { nickname } = req.body as { nickname: unknown };

    if (typeof nickname !== 'string' || nickname.trim().length === 0) {
      res.status(400).json({ error: 'Nickname is required' });
      return;
    }

    const trimmed = nickname.trim();
    const game = getGame(req.params.id);

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    if (game.status !== GameStatus.Lobby) {
      res.status(409).json({ error: 'Game already started' });
      return;
    }

    if (isNicknameTaken(game, trimmed)) {
      res.status(409).json({ error: 'Nickname already taken' });
      return;
    }

    const player = addPlayer(game, trimmed);
    logger.info({ gameId: game.id, playerId: player.id }, 'Player joined via REST');
    res.status(200).json({ playerId: player.id });
  },
);

// POST /games/:id/answer — submit an answer for the current round
router.post(
  '/games/:id/answer',
  (req: Request, res: Response<SubmitAnswerResponse | ApiErrorResponse>) => {
    const game = getGame(req.params.id);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const { playerId, answerIndex } = req.body as { playerId: unknown; answerIndex: unknown };

    if (typeof playerId !== 'string' || playerId.trim().length === 0) {
      res.status(400).json({ error: 'Player ID is required' });
      return;
    }

    if (
      typeof answerIndex !== 'number' ||
      !Number.isInteger(answerIndex) ||
      answerIndex < 0 ||
      answerIndex > 3
    ) {
      res.status(400).json({ error: 'Answer index must be 0–3' });
      return;
    }

    const player = getPlayer(game, playerId);
    if (!player) {
      res.status(404).json({ error: 'Player not found in this game' });
      return;
    }

    if (game.status !== GameStatus.Playing) {
      res.status(409).json({ error: 'Game is not in playing state' });
      return;
    }

    if (player.currentAnswer !== null) {
      res.status(409).json({ error: 'Already answered this round' });
      return;
    }

    submitAnswer(game, player, answerIndex);
    res.status(200).json({ accepted: true });
  },
);

export default router;
