// Play view stub — full implementation handled by separate task (REQ-PL-*)

export function showPlayView(): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = '<div id="play-view"><p>Game loading\u2026</p></div>';
}
