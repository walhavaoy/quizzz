import type { Player } from '../../src/shared/types.js';
import type { WsClient } from '../ws-client.js';
import type { Router } from '../router.js';
import type { GameSession } from '../session.js';

type LobbyPhase = 'join-form' | 'waiting';

/**
 * Lobby view: nickname entry, live player list, and host start control.
 *
 * REQ-LB-01/02/03/04/05/06/07: Core lobby features.
 * REQ-ST-11: Waiting indicator for non-host players after joining.
 */
export class LobbyView {
  private el: HTMLElement;
  private wsClient: WsClient;
  private router: Router;
  private session: GameSession;
  private phase: LobbyPhase = 'join-form';
  private players: Array<{ id: string; nickname: string; score: number }> = [];
  private isActive = false;

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

    router.register('/', el, () => this.activate(), () => this.deactivate());
    this.renderJoinForm();
    this.attachWsHandlers();
  }

  // ─── Router lifecycle ─────────────────────────────────────────────────────

  private activate(): void {
    this.isActive = true;
  }

  private deactivate(): void {
    this.isActive = false;
  }

  // ─── WebSocket handlers ───────────────────────────────────────────────────

  private attachWsHandlers(): void {
    this.wsClient.on('player_joined', (msg) => {
      this.players = msg.players;
      if (this.phase === 'waiting') {
        this.renderPlayerList();
      }
    });

    this.wsClient.on('player_left', (msg) => {
      this.players = this.players.filter((p) => p.id !== msg.playerId);
      if (this.phase === 'waiting') {
        this.renderPlayerList();
      }
    });

    this.wsClient.on('game_start', () => {
      this.router.navigate('/play');
    });
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  private renderJoinForm(): void {
    this.phase = 'join-form';
    this.el.innerHTML = `
      <div class="lobby-hero">
        <h1>quizzz</h1>
        <p>Multiplayer trivia — first to join is host</p>
      </div>
      <div class="card">
        <input
          class="form-input"
          type="text"
          id="lobby-nickname"
          placeholder="Enter nickname (max 20 chars)"
          maxlength="20"
          autocomplete="off"
          data-testid="quizzz-input-nickname"
        />
        <button
          class="btn btn-primary"
          id="lobby-join-btn"
          data-testid="quizzz-button-join"
        >Join Game</button>
        <div id="lobby-join-error" class="text-dim" style="font-size:0.85rem;margin-top:0.5rem;min-height:1.2rem;"></div>
      </div>
    `;

    const input = this.el.querySelector<HTMLInputElement>('#lobby-nickname');
    const btn = this.el.querySelector<HTMLButtonElement>('#lobby-join-btn');

    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') btn?.click();
    });

    btn?.addEventListener('click', () => {
      void this.handleJoin();
    });
  }

  private renderWaitingRoom(): void {
    this.phase = 'waiting';
    const isHost = this.session.isHost;

    this.el.innerHTML = `
      <div class="lobby-hero">
        <h1>quizzz</h1>
        <p>Share this URL for others to join</p>
      </div>
      <div class="card">
        <h2>Players</h2>
        <p class="lobby-player-count" id="lobby-count"></p>
        <ul class="player-list" id="lobby-players" data-testid="quizzz-list-players"></ul>

        ${isHost
          ? `<button
               class="btn btn-primary"
               id="lobby-start-btn"
               data-testid="quizzz-button-start"
             >Start Game</button>`
          : `<div id="lobby-waiting-indicator">
               <div class="waiting-dots" data-testid="quizzz-indicator-waiting">
                 <span></span><span></span><span></span>
               </div>
               <p class="waiting-label">Waiting for host to start...</p>
             </div>`
        }
      </div>
    `;

    this.renderPlayerList();

    if (isHost) {
      const startBtn = this.el.querySelector<HTMLButtonElement>('#lobby-start-btn');
      startBtn?.addEventListener('click', () => {
        this.handleStart();
      });
    }
  }

  private renderPlayerList(): void {
    const list = this.el.querySelector<HTMLUListElement>('#lobby-players');
    const count = this.el.querySelector<HTMLParagraphElement>('#lobby-count');
    if (!list) return;

    if (count) {
      count.textContent = `${this.players.length} player${this.players.length !== 1 ? 's' : ''} in lobby`;
    }

    list.innerHTML = this.players
      .map((p) => {
        const isYou = p.id === this.session.playerId;
        const badge = isYou ? '<span class="host-badge">you</span>' : '';
        const name = this.escapeHtml(p.nickname);
        return `<li><span>${name}</span>${badge}</li>`;
      })
      .join('');
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  private async handleJoin(): Promise<void> {
    const input = this.el.querySelector<HTMLInputElement>('#lobby-nickname');
    const btn = this.el.querySelector<HTMLButtonElement>('#lobby-join-btn');
    const errEl = this.el.querySelector<HTMLDivElement>('#lobby-join-error');

    const nickname = input?.value.trim() ?? '';
    if (!nickname) {
      if (errEl) errEl.textContent = 'Please enter a nickname.';
      input?.focus();
      return;
    }

    if (btn) btn.disabled = true;
    if (errEl) errEl.textContent = '';

    try {
      // Step 1: create a game (or use gameId from URL)
      const urlGameId = new URLSearchParams(window.location.search).get('gameId');
      let gameId = urlGameId ?? '';

      if (!gameId) {
        const createResp = await fetch('/api/games', { method: 'POST' });
        if (!createResp.ok) {
          const text = await createResp.text();
          throw new Error(`Failed to create game: ${text}`);
        }
        const createData = (await createResp.json()) as { gameId: string };
        gameId = createData.gameId;
        // Update URL so others can join with the same gameId
        history.replaceState({ path: '/' }, '', `/?gameId=${encodeURIComponent(gameId)}`);
      }

      // Step 2: join the game
      const joinResp = await fetch(`/api/games/${encodeURIComponent(gameId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      if (!joinResp.ok) {
        const text = await joinResp.text();
        throw new Error(`Failed to join game: ${text}`);
      }
      const joinData = (await joinResp.json()) as { playerId: string; gameId: string; players: Player[] };

      // Update session
      this.session.gameId = gameId;
      this.session.playerId = joinData.playerId;
      this.session.players = joinData.players;
      this.players = joinData.players;

      // First joiner is host (player list length was 0 before joining)
      this.session.isHost = joinData.players.length === 1;

      // Step 3: open WebSocket
      this.wsClient.connect(gameId, joinData.playerId);

      this.renderWaitingRoom();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      if (errEl) errEl.textContent = message;
      if (btn) btn.disabled = false;
    }
  }

  private handleStart(): void {
    // Send start_game via WebSocket
    this.wsClient.send({ type: 'start_game' });

    const btn = this.el.querySelector<HTMLButtonElement>('#lobby-start-btn');
    if (btn) btn.disabled = true;
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
