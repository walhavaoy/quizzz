import { WsClient } from './ws-client.js';
import { Router } from './router.js';
import { LobbyView } from './views/lobby.js';
import { PlayView } from './views/play.js';
import { ResultView } from './views/result.js';
import type { GameSession } from './session.js';

const wsClient = new WsClient();
const router = new Router();

/** Shared mutable game session state. Views read/write this object. */
const session: GameSession = {
  gameId: '',
  playerId: '',
  isHost: false,
  players: [],
};

// Update the persistent connection dot on status changes
const dot = document.getElementById('connection-dot');
wsClient.on('status_change', ({ status }) => {
  if (!dot) return;
  dot.className = `connection-dot ${status === 'connected' ? 'connected' : 'disconnected'}`;
});

// Mount views — each registers itself with the router in its constructor
const lobbyEl = document.getElementById('view-lobby') as HTMLElement;
const playEl = document.getElementById('view-play') as HTMLElement;
const resultEl = document.getElementById('view-result') as HTMLElement;

new LobbyView(lobbyEl, wsClient, router, session);
new PlayView(playEl, wsClient, router, session);
new ResultView(resultEl, wsClient, router, session);

// Start the router after all views are registered
router.init();
