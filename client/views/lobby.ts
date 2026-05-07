// REQ-LB-01 through REQ-LB-07, REQ-LB-10, REQ-LB-11: Lobby view

import type {
  Player,
  JoinGameResponse,
  CreateGameResponse,
} from '../../src/shared/types';
import { WsClient } from '../ws-client';
import { navigate } from '../router';

// ─── Module state ─────────────────────────────────────────────────────────────

let gameId: string | null = null;
let playerId: string | null = null;
let isHost = false;
let players: Player[] = [];

const wsClient = new WsClient();

// ─── Browser-compatible logger (pino is server-only) ──────────────────────────

const log = {
  info: (msg: string, meta?: unknown) => console.info('[Lobby]', msg, meta ?? ''),
  warn: (msg: string, meta?: unknown) => console.warn('[Lobby]', msg, meta ?? ''),
  error: (msg: string, meta?: unknown) => console.error('[Lobby]', msg, meta ?? ''),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showError(msg: string): void {
  const el = document.getElementById('lobby-error');
  if (el) {
    el.textContent = msg;
    el.classList.add('visible');
  }
}

function clearError(): void {
  const el = document.getElementById('lobby-error');
  if (el) {
    el.textContent = '';
    el.classList.remove('visible');
  }
}

// REQ-LB-02, REQ-LB-10: Render player list with count badge
function renderPlayers(): void {
  const list = document.querySelector<HTMLUListElement>(
    '[data-testid="quizzz-list-players"]',
  );
  const countEl = document.getElementById('lobby-player-count');

  if (list) {
    list.innerHTML = players
      .map((p, i) => {
        const initial = escapeHtml(p.nickname.charAt(0).toUpperCase());
        const name = escapeHtml(p.nickname);
        const avatarClass = i === 0 ? 'host' : 'guest';
        const hostBadge =
          i === 0 ? '<span class="host-badge">Host</span>' : '';
        return `<li class="player-item">
          <div class="player-avatar ${avatarClass}">${initial}</div>
          <span class="player-name">${name}</span>
          ${hostBadge}
        </li>`;
      })
      .join('');
  }

  if (countEl) {
    countEl.textContent = String(players.length);
  }
}

// ─── Join handler ─────────────────────────────────────────────────────────────

async function handleJoin(): Promise<void> {
  const input = document.querySelector<HTMLInputElement>(
    '[data-testid="quizzz-input-nickname"]',
  );
  const btn = document.querySelector<HTMLButtonElement>(
    '[data-testid="quizzz-button-join"]',
  );
  if (!input || !btn) return;

  // REQ-LB-11: Validate nickname
  const nickname = input.value.trim();
  if (nickname.length === 0) {
    showError('Nickname is required');
    return;
  }
  if (nickname.length > 20) {
    showError('Nickname must be 20 characters or less');
    return;
  }

  clearError();
  btn.disabled = true;

  try {
    // Determine game ID: prefer ?game= query param, then create a new game
    if (!gameId) {
      const params = new URLSearchParams(location.search);
      const existing = params.get('game');
      if (existing) {
        gameId = existing;
      } else {
        const createRes = await fetch('/api/games', { method: 'POST' });
        if (!createRes.ok) {
          const body = await createRes.text();
          throw new Error(`Create game failed ${createRes.status}: ${body}`);
        }
        const createData = (await createRes.json()) as CreateGameResponse;
        gameId = createData.gameId;
        // Share the URL so others can join the same game
        const url = new URL(location.href);
        url.searchParams.set('game', gameId);
        history.replaceState(null, '', url.toString());
      }
    }

    // REQ-LB-01: Join the game via REST
    const joinRes = await fetch(
      `/api/games/${encodeURIComponent(gameId)}/join`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      },
    );
    if (!joinRes.ok) {
      const body = await joinRes.text();
      throw new Error(`Join game failed ${joinRes.status}: ${body}`);
    }
    const joinData = (await joinRes.json()) as JoinGameResponse;

    playerId = joinData.playerId;
    isHost = joinData.isHost;
    players = joinData.players;

    // Show player list, hide join form
    const form = document.getElementById('lobby-form');
    const playersSection = document.getElementById('lobby-players');
    const startBtn = document.getElementById(
      'lobby-start-btn',
    ) as HTMLButtonElement | null;

    if (form) form.style.display = 'none';
    if (playersSection) playersSection.classList.add('active');

    // REQ-LB-04: Start button only for host
    if (startBtn) {
      startBtn.style.display = isHost ? '' : 'none';
    }

    renderPlayers();
    log.info('Joined game', { gameId, playerId, isHost });

    // REQ-LB-03: Connect WebSocket for live updates
    wsClient.connect(gameId, playerId);

    wsClient.on('player_joined', (msg) => {
      players = msg.players;
      renderPlayers();
    });

    // REQ-LB-06: Navigate to play view when game starts
    wsClient.on('game_start', (_msg) => {
      navigate('/play');
    });
  } catch (err) {
    log.error('Join failed', { err });
    showError('Could not join game. Please try again.');
    btn.disabled = false;
  }
}

// ─── Start handler ────────────────────────────────────────────────────────────

// REQ-LB-05: Host calls backend to start the game
async function handleStart(): Promise<void> {
  if (!gameId) return;

  const btn = document.getElementById(
    'lobby-start-btn',
  ) as HTMLButtonElement | null;
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(
      `/api/games/${encodeURIComponent(gameId)}/start`,
      { method: 'POST' },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Start game failed ${res.status}: ${body}`);
    }
    await res.text(); // drain body
  } catch (err) {
    log.error('Start failed', { err });
    if (btn) btn.disabled = false;
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

// REQ-LB-07: Wire up event listeners on elements with data-testid attributes
export function initLobby(): void {
  const joinBtn = document.querySelector<HTMLButtonElement>(
    '[data-testid="quizzz-button-join"]',
  );
  const startBtn = document.getElementById(
    'lobby-start-btn',
  ) as HTMLButtonElement | null;
  const input = document.querySelector<HTMLInputElement>(
    '[data-testid="quizzz-input-nickname"]',
  );

  joinBtn?.addEventListener('click', () => {
    handleJoin().catch((err: unknown) =>
      log.error('Unhandled join error', { err }),
    );
  });

  // Support Enter key to submit
  input?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin().catch((err: unknown) =>
        log.error('Unhandled join error', { err }),
      );
    }
  });

  startBtn?.addEventListener('click', () => {
    handleStart().catch((err: unknown) =>
      log.error('Unhandled start error', { err }),
    );
  });
}
