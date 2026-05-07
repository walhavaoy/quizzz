// REQ-RS-01/RS-02/RS-03/RS-04/RS-05/RS-11: Result view with podium and rankings
import type { Player } from '../../src/shared/types';
import { WsClient } from '../ws-client';
import { navigate } from '../router';

interface RankedPlayer {
  rank: number;
  playerId: string;
  nickname: string;
  score: number;
}

function rankPlayers(players: Player[]): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return sorted.map((p, index) => ({
    rank: index + 1,
    playerId: p.id,
    nickname: p.nickname,
    score: p.score,
  }));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPodiumBlock(ranked: RankedPlayer | undefined, place: 1 | 2 | 3): string {
  if (!ranked) {
    // Render an empty block so the layout stays consistent
    const cls = place === 1 ? 'p1' : place === 2 ? 'p2' : 'p3';
    return `<div class="podium-block ${cls}"></div>`;
  }
  const cls = place === 1 ? 'p1' : place === 2 ? 'p2' : 'p3';
  return `
    <div class="podium-block ${cls}">
      <span class="rank">${place}</span>
      <span class="nick">${escapeHtml(ranked.nickname)}</span>
      <span class="pts">${ranked.score} pts</span>
    </div>`.trim();
}

function buildPodium(rankings: RankedPlayer[]): string {
  const first = rankings[0];
  const second = rankings[1];
  const third = rankings[2];

  // Visual order: 2nd (left), 1st (centre, tallest), 3rd (right)
  return `
    <div class="podium" data-testid="quizzz-podium">
      ${buildPodiumBlock(second, 2)}
      ${buildPodiumBlock(first, 1)}
      ${buildPodiumBlock(third, 3)}
    </div>`.trim();
}

function buildRankingRow(ranked: RankedPlayer, currentPlayerId: string): string {
  const isSelf = ranked.playerId === currentPlayerId;
  const selfClass = isSelf ? ' self' : '';
  const selfLabel = isSelf ? ' (you)' : '';
  return `
    <li class="rank-row${selfClass}">
      <span class="rank-num">${ranked.rank}</span>
      <span class="rank-nick">${escapeHtml(ranked.nickname)}${selfLabel}</span>
      <span class="rank-score">${ranked.score}</span>
    </li>`.trim();
}

function buildRankingsList(rankings: RankedPlayer[], currentPlayerId: string): string {
  const rows = rankings.map((r) => buildRankingRow(r, currentPlayerId)).join('');
  return `<ol class="rankings" data-testid="quizzz-list-rankings">${rows}</ol>`;
}

/**
 * REQ-RS-01/RS-02/RS-03/RS-04/RS-05/RS-11: Render the result view.
 * @param players   Full player list from the game_over message (unsorted).
 * @param wsClient  Active WebSocket client — used to send play_again.
 */
export function showResultView(players: Player[], wsClient: WsClient): void {
  const currentPlayerId = sessionStorage.getItem('quizzz_player_id') ?? '';
  const rankings = rankPlayers(players);

  const html = `
    <div class="container">
      <h1>Game Over!</h1>
      ${buildPodium(rankings)}
      ${buildRankingsList(rankings, currentPlayerId)}
      <button class="btn-again" data-testid="quizzz-button-play-again">Play Again</button>
    </div>`.trim();

  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = html;

  // REQ-RS-03: Play Again button — send play_again via WS; disable after first click
  const btn = app.querySelector<HTMLButtonElement>('[data-testid="quizzz-button-play-again"]');
  if (btn) {
    btn.addEventListener('click', () => {
      btn.disabled = true;
      wsClient.send({ type: 'play_again' });
    });
  }

  // REQ-RS-03: Navigate back to lobby when server confirms reset
  wsClient.on('back_to_lobby', () => {
    navigate('/');
  });
}
