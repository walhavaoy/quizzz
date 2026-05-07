import { Router } from 'express';
import type { Request, Response } from 'express';
import pino from 'pino';
import { getPublicGameState } from '../game/engine.js';

const logger = pino({ name: 'quizzz:api' });

export const router = Router();

/**
 * GET /api/games/:id
 * Returns the public game state for the given game ID.
 * REQ-RA-10
 */
router.get('/games/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const state = getPublicGameState(id);

  if (!state) {
    logger.info({ gameId: id }, 'Game not found');
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  res.json(state);
});
