import type { Player } from '../../src/shared/types.js';
import type { WsClient } from '../ws-client.js';
import type { Router } from '../router.js';
import type { GameSession } from '../session.js';

/**
 * Result view: podium, full rankings, and Play Again button.
 *
 * REQ-RS-01/02/03/04/05: Core result features.
 * REQ-RS-10: Staggered podium bounce entrance animation.
 * REQ-RS-11: Current player's name highlighted in rankings.
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

    // REQ-RS-10: Trigger staggered podium entrance after paint
    requestAnimationFrame(() => {
      const podium = this.el.querySelector<HTMLDivElement>('.podium-container');
      if (podium) {
        podium.classList.add('podium-animate');
      }
    });
  }

  private deactivate(): void {
    // Remove animation class so it re-triggers next time
    const podium = this.el.querySelector<HTMLDivElement>('.podium-container');
    if (podium) {
      podium.classList.remove('podium-animate');
    }
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  private render(sorted: Player[]): void {
    const top3 = sorted.slice(0, 3);
    const currentPlayerId = this.session.playerId;

    this.el.innerHTML = `
      ${this.renderPodium(top3)}
      <div class="card">
        <h2>Final Rankings</h2>
        <ul class="ranking-list" data-testid="quizzz-list-rankings">
          ${sorted.map((p, i) => this.renderRankingItem(p, i + 1, currentPlayerId)).join('')}
        </ul>
        <button
          class="btn btn-primary"
          id="result-playagain-btn"
          data-testid="quizzz-button-playagain"
        >Play Again</button>
      </div>
    `;

    const playAgainBtn = this.el.querySelector<HTMLButtonElement>('#result-playagain-btn');
    playAgainBtn?.addEventListener('click', () => {
      void this.handlePlayAgain();
    });
  }

  private renderPodium(top3: Player[]): string {
    if (top3.length === 0) return '';

    // Podium order: 3rd, 2nd, 1st (nth-child(1)=3rd, (2)=2nd, (3)=1st)
    // This matches the CSS stagger delays: 3rd→2nd→1st
    const positions: Array<{ barClass: string; label: string }> = [
      { barClass: 'p3', label: '3rd' },
      { barClass: 'p2', label: '2nd' },
      { barClass: 'p1', label: '1st' },
    ];

    // Build [3rd, 2nd, 1st] from sorted array (index 0=1st, 1=2nd, 2=3rd)
    const orderedPlayers = [top3[2], top3[1], top3[0]]; // [3rd, 2nd, 1st]

    const blocks = orderedPlayers
      .map((p, idx) => {
        if (!p) return '';
        const pos = positions[idx];
        if (!pos) return '';
        return `
          <div class="podium-block">
            <span class="podium-name">${this.escapeHtml(p.nickname)}</span>
            <div class="podium-bar ${pos.barClass}">${pos.label}</div>
            <span class="podium-score-tag">${p.score} pts</span>
          </div>
        `;
      })
      .join('');

    return `
      <div
        class="podium-container"
        data-testid="quizzz-container-podium"
      >${blocks}</div>
    `;
  }

  private renderRankingItem(player: Player, position: number, currentPlayerId: string): string {
    const posClass =
      position === 1 ? 'top1' : position === 2 ? 'top2' : position === 3 ? 'top3' : '';
    const posLabel =
      position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`;
    const nameClass = player.id === currentPlayerId ? 'ranking-nickname current-player' : 'ranking-nickname';

    return `
      <li class="ranking-item">
        <span class="ranking-position ${posClass}">${posLabel}</span>
        <span class="${nameClass}">${this.escapeHtml(player.nickname)}</span>
        <span class="ranking-score">${player.score} pts</span>
      </li>
    `;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  private async handlePlayAgain(): Promise<void> {
    const btn = this.el.querySelector<HTMLButtonElement>('#result-playagain-btn');
    if (btn) btn.disabled = true;

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
