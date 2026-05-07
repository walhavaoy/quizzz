// Lobby view stub — full implementation handled by separate task (REQ-LB-*)

export function showLobbyView(): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = '<div id="lobby-view"><p>Lobby loading\u2026</p></div>';
}
