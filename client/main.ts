import { initRouter } from './router.js';
import { initLobby } from './views/lobby.js';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initLobby();
});
