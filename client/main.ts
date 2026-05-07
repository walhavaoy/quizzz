import { initRouter } from './router';
import { initLobby } from './views/lobby';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initLobby();
});
