import { Router, Request, Response } from 'express';
import { createGame, getGame, joinGame, submitAnswer, GameError } from '../game/engine';
import type {
  CreateGameResponse,
  JoinRequest,
  JoinResponse,
  AnswerRequest,
  AnswerResponse,
  ErrorResponse,
  Question,
} from '../shared/types';
import questionsPool from '../shared/questions.json';

export const router = Router();

// NOTE: correctIndex is exposed here. A future enhancement could strip it to
// prevent clients from trivially cheating, but the spec requests the full pool.
const pool = questionsPool as Question[];

// GET /api/questions — return the full trivia question pool
router.get('/questions', (_req: Request, res: Response) => {
  res.json(pool);
});

// POST /api/games — create a new game
router.post('/games', (_req: Request, res: Response<CreateGameResponse>) => {
  const gameId = createGame();
  res.status(201).json({ gameId });
});

// GET /api/games/:id — return current game state (for reconnection)
router.get('/games/:id', (req: Request, res: Response) => {
  const game = getGame(req.params['id'] ?? '');
  if (!game) {
    const body: ErrorResponse = { error: 'Game not found' };
    res.status(404).json(body);
    return;
  }
  res.json(game);
});

// POST /api/games/:id/join — join a game with a nickname
router.post('/games/:id/join', (req: Request, res: Response<JoinResponse | ErrorResponse>) => {
  const body = req.body as Partial<JoinRequest>;
  const nickname = body.nickname;

  if (typeof nickname !== 'string' || nickname.trim() === '') {
    res.status(400).json({ error: 'nickname must be a non-empty string' });
    return;
  }

  try {
    const result = joinGame(req.params['id'] ?? '', nickname.trim());
    res.json(result);
  } catch (err) {
    if (err instanceof GameError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /api/games/:id/answer — submit an answer
router.post('/games/:id/answer', (req: Request, res: Response<AnswerResponse | ErrorResponse>) => {
  const body = req.body as Partial<AnswerRequest>;
  const { playerId, answerIndex } = body;

  if (typeof playerId !== 'string' || playerId.trim() === '') {
    res.status(400).json({ error: 'playerId must be a non-empty string' });
    return;
  }
  if (
    typeof answerIndex !== 'number' ||
    !Number.isInteger(answerIndex) ||
    answerIndex < 0 ||
    answerIndex > 3
  ) {
    res.status(400).json({ error: 'answerIndex must be an integer between 0 and 3' });
    return;
  }

  try {
    const accepted = submitAnswer(req.params['id'] ?? '', playerId.trim(), answerIndex);
    res.json({ accepted });
  } catch (err) {
    if (err instanceof GameError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
