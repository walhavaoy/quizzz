import { Router, Request, Response } from 'express';
import {
  CreateGameResponse,
  JoinGameRequest,
  JoinGameResponse,
  StartGameRequest,
  AnswerRequest,
  AnswerResponse,
  ErrorResponse,
  EngineError,
} from '../shared/types.js';
import {
  createGame,
  joinGame,
  startGame,
  submitAnswer,
} from '../game/engine.js';

const router = Router();

function handleEngineError(err: unknown, res: Response): void {
  if (err instanceof EngineError) {
    switch (err.code) {
      case 'NOT_FOUND':
        res.status(404).json({ error: err.message } satisfies ErrorResponse);
        break;
      case 'BAD_INPUT':
        res.status(400).json({ error: err.message } satisfies ErrorResponse);
        break;
      case 'FORBIDDEN':
        res.status(403).json({ error: err.message } satisfies ErrorResponse);
        break;
      default:
        res.status(500).json({ error: 'Internal server error' } satisfies ErrorResponse);
    }
  } else {
    res.status(500).json({ error: 'Internal server error' } satisfies ErrorResponse);
  }
}

// POST /api/games — create a new game
router.post('/games', (_req: Request, res: Response) => {
  const gameId = createGame();
  res.status(201).json({ gameId } satisfies CreateGameResponse);
});

// POST /api/games/:id/join — join a game with a nickname
router.post('/games/:id/join', (req: Request, res: Response) => {
  const body = req.body as Partial<JoinGameRequest>;
  if (typeof body.nickname !== 'string' || body.nickname.trim() === '') {
    res.status(400).json({ error: 'nickname is required and must be a non-empty string' } satisfies ErrorResponse);
    return;
  }
  try {
    const playerId = joinGame(req.params.id, body.nickname);
    res.status(201).json({ playerId } satisfies JoinGameResponse);
  } catch (err) {
    handleEngineError(err, res);
  }
});

// POST /api/games/:id/start — start the game (host only)
router.post('/games/:id/start', (req: Request, res: Response) => {
  const body = req.body as Partial<StartGameRequest>;
  if (typeof body.playerId !== 'string' || body.playerId.trim() === '') {
    res.status(400).json({ error: 'playerId is required' } satisfies ErrorResponse);
    return;
  }
  try {
    startGame(req.params.id, body.playerId);
    res.status(200).json({ started: true });
  } catch (err) {
    handleEngineError(err, res);
  }
});

// POST /api/games/:id/answer — submit an answer
router.post('/games/:id/answer', (req: Request, res: Response) => {
  const body = req.body as Partial<AnswerRequest>;
  if (typeof body.playerId !== 'string' || body.playerId.trim() === '') {
    res.status(400).json({ error: 'playerId is required' } satisfies ErrorResponse);
    return;
  }
  if (typeof body.answerIndex !== 'number') {
    res.status(400).json({ error: 'answerIndex is required and must be a number' } satisfies ErrorResponse);
    return;
  }
  try {
    const accepted = submitAnswer(req.params.id, body.playerId, body.answerIndex);
    res.status(200).json({ accepted } satisfies AnswerResponse);
  } catch (err) {
    handleEngineError(err, res);
  }
});

export default router;
