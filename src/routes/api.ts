import { Router } from 'express';
import pino from 'pino';
import { createGame, joinGame, startGame } from '../game/engine.js';

const logger = pino({ name: 'api' });

export const apiRouter = Router();

// POST /api/games — create a new game lobby
apiRouter.post('/games', (_req, res) => {
  const gameId = createGame();
  res.json({ gameId });
});

// POST /api/games/:id/join — join an existing game
apiRouter.post('/games/:id/join', (req, res) => {
  const gameId = req.params.id;
  const { nickname } = req.body as { nickname?: unknown };

  if (typeof nickname !== 'string' || nickname.trim().length === 0) {
    res.status(400).json({ error: 'nickname is required' });
    return;
  }
  if (nickname.trim().length > 20) {
    res.status(400).json({ error: 'nickname must be 20 characters or less' });
    return;
  }

  try {
    const result = joinGame(gameId, nickname.trim());
    res.json({ gameId, ...result });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'NOT_FOUND') {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (code === 'BAD_STATE') {
      res.status(400).json({ error: 'Game already started' });
      return;
    }
    logger.error({ err }, 'Unexpected error joining game');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/:id/start — start the game (host only; auth not enforced here)
apiRouter.post('/games/:id/start', (req, res) => {
  const gameId = req.params.id;

  try {
    startGame(gameId);
    res.status(200).json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'NOT_FOUND') {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (code === 'BAD_STATE') {
      res.status(400).json({ error: 'Game already started' });
      return;
    }
    logger.error({ err }, 'Unexpected error starting game');
    res.status(500).json({ error: 'Internal server error' });
  }
});
