import type { Player } from '../../src/shared/types.js';
import type { WsClient } from '../ws-client.js';
import type { Router } from '../router.js';
import type { GameSession } from '../session.js';

/**
 * Result view: podium, full rankings, and Play Again button.
 *
 * REQ-RS-01: Podium showing top 3 players (gold/silver/bronze blocks).
 * REQ-RS-02: Full ranked list of all players.
 * REQ-RS-03: Play Again button navigates back to lobby.
 * REQ-RS-04: Player scores displayed.
 * REQ-RS-05: Current player highlighted in rankings.
 * REQ-RS-11: Current player's name labelled "(you)" in rankings.
 */
export class ResultView {
  private el: HTMLElement;
  private wsClient: WsClient;
  private router: Router;
  private session: GameSession;

  constructor(
    el: HTMLElement,
    wsClient: WsClient,
    router: Router,
    session: GameSession,
  ) {
    this.el = el;
    this.wsClient = wsClient;
    this.router = router;
    this.session = session;

    router.register('/result', el, () => this.activate(), () => this.deactivate());
  }

  // ─── Router lifecycle ─────────────────────────────────────────────────────

  private activate(): void {
    const sorted = [...this.session.players].sort((a, b) => b.score - a.score);
    this.render(sorted);
  }

  private deactivate(): void {
    this.el.innerHTML = '';
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  private render(sorted: Player[]): void {
    const currentPlayerId = this.session.playerId;

    this.el.innerHTML = `
      <div class="container">
        <h1>Game Over!</h1>
        ${this.renderPodium(sorted)}
        <ol class="rankings" data-testid="quizzz-list-rankings">
          ${sorted.map((p, i) => this.renderRankRow(p, i + 1, currentPlayerId)).join('')}
        </ol>
        <button class="btn-again" data-testid="quizzz-button-play-again">Play Again</button>
      </div>
    `;

    const btn = this.el.querySelector<HTMLButtonElement>('[data-testid="quizzz-button-play-again"]');
    btn?.addEventListener('click', () => {
      if (btn) btn.disabled = true;
      void this.handlePlayAgain();
    });
  }

  private renderPodium(sorted: Player[]): string {
    const first = sorted[0];
    const second = sorted[1];
    const third = sorted[2];

    // Visual order: 2nd (left), 1st (centre/tallest), 3rd (right)
    return `
      <div class="podium" data-testid="quizzz-podium">
        ${this.renderPodiumBlock(second, 2)}
        ${this.renderPodiumBlock(first, 1)}
        ${this.renderPodiumBlock(third, 3)}
      </div>
    `;
  }

  private renderPodiumBlock(player: Player | undefined, place: 1 | 2 | 3): string {
    const cls = place === 1 ? 'p1' : place === 2 ? 'p2' : 'p3';
    if (!player) {
      return `<div class="podium-block ${cls}"></div>`;
    }
    return `
      <div class="podium-block ${cls}">
        <span class="rank">${place}</span>
        <span class="nick">${this.escapeHtml(player.nickname)}</span>
        <span class="pts">${player.score} pts</span>
      </div>
    `;
  }

  private renderRankRow(player: Player, position: number, currentPlayerId: string): string {
    const isSelf = player.id === currentPlayerId;
    const selfClass = isSelf ? ' self' : '';
    const selfLabel = isSelf ? ' (you)' : '';
    return `
      <li class="rank-row${selfClass}">
        <span class="rank-num">${position}</span>
        <span class="rank-nick">${this.escapeHtml(player.nickname)}${selfLabel}</span>
        <span class="rank-score">${player.score}</span>
      </li>
    `;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  private async handlePlayAgain(): Promise<void> {
    // Reset session
    this.session.gameId = '';
    this.session.playerId = '';
    this.session.isHost = false;
    this.session.players = [];

    // Disconnect WebSocket
    this.wsClient.disconnect();

    // Navigate back to lobby (clear gameId from URL)
    history.replaceState({ path: '/' }, '', '/');
    this.router.navigate('/');
  }

  // ─── Utility ──────────────────────────────────────────────────────────────

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
