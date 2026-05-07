import { Router, Request, Response } from 'express';
import pino from 'pino';
import {
  CreateGameResponse,
  JoinGameRequest,
  JoinGameResponse,
  StartGameRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  ApiErrorResponse,
  EngineError,
} from '../shared/types.js';
import {
  createGame,
  joinGame,
  startGame,
  submitAnswer,
} from '../game/engine.js';

const logger = pino({ name: 'quizzz:api' });

const router = Router();

function handleEngineError(err: unknown, res: Response): void {
  if (err instanceof EngineError) {
    logger.error({ err, code: err.code }, 'Engine error');
    switch (err.code) {
      case 'NOT_FOUND':
        res.status(404).json({ error: err.message } satisfies ApiErrorResponse);
        break;
      case 'BAD_INPUT':
        res.status(400).json({ error: err.message } satisfies ApiErrorResponse);
        break;
      case 'FORBIDDEN':
        res.status(403).json({ error: err.message } satisfies ApiErrorResponse);
        break;
      default:
        res.status(500).json({ error: 'Internal server error' } satisfies ApiErrorResponse);
    }
  } else {
    logger.error({ err }, 'Unexpected error');
    res.status(500).json({ error: 'Internal server error' } satisfies ApiErrorResponse);
  }
}

// POST /api/games — create a new game
router.post('/games', (_req: Request, res: Response) => {
  const gameId = createGame();
  logger.info({ gameId }, 'Game created via API');
  res.status(201).json({ gameId } satisfies CreateGameResponse);
});

// POST /api/games/:id/join — join a game with a nickname
router.post('/games/:id/join', (req: Request, res: Response) => {
  const body = req.body as Partial<JoinGameRequest>;
  if (typeof body.nickname !== 'string' || body.nickname.trim() === '') {
    res.status(400).json({ error: 'nickname is required and must be a non-empty string' } satisfies ApiErrorResponse);
    return;
  }
  try {
    const playerId = joinGame(req.params.id, body.nickname);
    logger.info({ gameId: req.params.id, playerId }, 'Player joined via API');
    res.status(201).json({ playerId } satisfies JoinGameResponse);
  } catch (err) {
    handleEngineError(err, res);
  }
});

// POST /api/games/:id/start — start the game (host only)
router.post('/games/:id/start', (req: Request, res: Response) => {
  const body = req.body as Partial<StartGameRequest>;
  if (typeof body.playerId !== 'string' || body.playerId.trim() === '') {
    res.status(400).json({ error: 'playerId is required' } satisfies ApiErrorResponse);
    return;
  }
  try {
    startGame(req.params.id, body.playerId);
    logger.info({ gameId: req.params.id }, 'Game started via API');
    res.status(200).json({ started: true });
  } catch (err) {
    handleEngineError(err, res);
  }
});

// POST /api/games/:id/answer — submit an answer
router.post('/games/:id/answer', (req: Request, res: Response) => {
  const body = req.body as Partial<SubmitAnswerRequest>;
  if (typeof body.playerId !== 'string' || body.playerId.trim() === '') {
    res.status(400).json({ error: 'playerId is required' } satisfies ApiErrorResponse);
    return;
  }
  if (!Number.isFinite(body.answerIndex)) {
    res.status(400).json({ error: 'answerIndex is required and must be a finite number' } satisfies ApiErrorResponse);
    return;
  }
  try {
    const accepted = submitAnswer(req.params.id, body.playerId, body.answerIndex as number);
    res.status(200).json({ accepted } satisfies SubmitAnswerResponse);
  } catch (err) {
    handleEngineError(err, res);
  }
});

export default router;
