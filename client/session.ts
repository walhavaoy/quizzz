import type { Player } from '../src/shared/types.js';

/** Client-side game session state shared across views. */
export interface GameSession {
  gameId: string;
  playerId: string;
  isHost: boolean;
  players: Player[];
}
