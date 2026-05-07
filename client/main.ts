// Frontend entry point for quizzz SPA
import { WsClient } from './ws-client';
import { initRouter, registerRoute, navigate } from './router';
import { showLobbyView } from './views/lobby';
import { showPlayView } from './views/play';
import { showResultView } from './views/result';

const wsClient = new WsClient();

// Retrieve stored session context (set after join)
function getSession(): { gameId: string; playerId: string } | null {
  const gameId = sessionStorage.getItem('quizzz_game_id');
  const playerId = sessionStorage.getItem('quizzz_player_id');
  if (!gameId || !playerId) return null;
  return { gameId, playerId };
}

// Transition all players to play view when the game starts
wsClient.on('game_start', () => {
  navigate('/play');
});

// Transition all players to result view when the game ends
wsClient.on('game_over', (msg) => {
  showResultView(msg.players, wsClient);
});

// Register routes
registerRoute('/', () => {
  showLobbyView();
});

registerRoute('/play', () => {
  const session = getSession();
  if (!session) {
    navigate('/');
    return;
  }
  showPlayView();
});

registerRoute('/result', () => {
  // Result view is shown directly by the game_over handler above;
  // this route entry is a no-op placeholder for direct navigation.
});

// Connect WS if session already exists (e.g. page refresh mid-game)
const existingSession = getSession();
if (existingSession) {
  wsClient.connect(existingSession.gameId, existingSession.playerId);
}

initRouter();
