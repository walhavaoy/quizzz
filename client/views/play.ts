import type { Question } from '../../src/shared/types.js';
import type { WsClient } from '../ws-client.js';
import type { Router } from '../router.js';
import type { GameSession } from '../session.js';

type PlayPhase = 'loading' | 'question' | 'answered' | 'reveal';

const QUESTION_TIMER_TOTAL = 15;
const LOADING_TRANSITION_MS = 350;

/**
 * Play view: question display, countdown timer, answer feedback, score.
 *
 * REQ-PL-01 to 10: Core play features.
 * REQ-ST-10: Correct/wrong bounce & shake animations; score pop animation.
 * REQ-ST-11: Between-question loading indicator.
 */
export class PlayView {
  private el: HTMLElement;
  private wsClient: WsClient;
  private router: Router;
  private session: GameSession;

  private phase: PlayPhase = 'loading';
  private currentQuestion: Question | null = null;
  private currentRound = 0;
  private totalRounds = 0;
  private remaining = QUESTION_TIMER_TOTAL;
  private selectedIndex = -1;
  private myScore = 0;
  private loadingTimer: ReturnType<typeof setTimeout> | null = null;

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

    router.register('/play', el, () => this.activate(), () => this.deactivate());
    this.renderLoading('Get ready…');
    this.attachWsHandlers();
  }

  // ─── Router lifecycle ─────────────────────────────────────────────────────

  private activate(): void {
    // Reset for a fresh game start
    this.phase = 'loading';
    this.currentQuestion = null;
    this.selectedIndex = -1;
    this.myScore = 0;
    this.renderLoading('Get ready…');
  }

  private deactivate(): void {
    if (this.loadingTimer !== null) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
  }

  // ─── WebSocket handlers ───────────────────────────────────────────────────

  private attachWsHandlers(): void {
    this.wsClient.on('question', (msg) => {
      const q: Question = { id: '', text: msg.text, options: msg.options, correctIndex: -1 };
      if (this.phase === 'reveal') {
        // REQ-ST-11: Brief loading state between reveal and new question
        this.renderLoading('Next question…');
        this.loadingTimer = setTimeout(() => {
          this.loadingTimer = null;
          this.showQuestion(q, msg.round, msg.totalRounds);
        }, LOADING_TRANSITION_MS);
      } else {
        this.showQuestion(q, msg.round, msg.totalRounds);
      }
    });

    this.wsClient.on('timer_tick', (msg) => {
      this.remaining = msg.remaining;
      if (this.phase === 'question' || this.phase === 'answered') {
        this.updateTimer(msg.remaining);
      }
    });

    this.wsClient.on('round_result', (msg) => {
      this.phase = 'reveal';
      const prevScore = this.myScore;
      const me = msg.scores.find((p) => p.playerId === this.session.playerId);
      if (me) this.myScore = me.score;

      this.showReveal(msg.correctIndex, prevScore < this.myScore);
    });

    this.wsClient.on('game_over', (msg) => {
      this.session.players = msg.rankings.map((r) => ({
        id: r.playerId,
        nickname: r.nickname,
        score: r.score,
        currentAnswer: null,
      }));
      this.router.navigate('/result');
    });
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  private renderLoading(label: string): void {
    this.phase = 'loading';
    this.el.innerHTML = `
      <div class="question-loading">
        <div class="waiting-dots" data-testid="quizzz-indicator-waiting">
          <span></span><span></span><span></span>
        </div>
        <p class="waiting-label">${this.escapeHtml(label)}</p>
      </div>
    `;
  }

  private showQuestion(question: Question, round: number, totalRounds: number): void {
    this.phase = 'question';
    this.currentQuestion = question;
    this.currentRound = round;
    this.totalRounds = totalRounds;
    this.selectedIndex = -1;
    this.remaining = QUESTION_TIMER_TOTAL;

    this.el.innerHTML = `
      <div class="card">
        <div class="round-header">
          <span class="round-label" data-testid="quizzz-text-round">
            Question ${round} of ${totalRounds}
          </span>
          <div class="score-row">
            <span class="score-label">Score</span>
            <span class="score" id="play-score">${this.myScore}</span>
          </div>
        </div>

        <div class="timer-bar">
          <div class="timer-bar-fill" id="play-timer-bar" style="width:100%"></div>
        </div>
        <div class="timer" id="play-timer" data-testid="quizzz-timer-countdown">
          ${QUESTION_TIMER_TOTAL}
        </div>

        <p
          id="play-question-text"
          style="font-size:1.1rem;font-weight:600;margin:1rem 0 1.25rem;"
          data-testid="quizzz-text-question"
        >${this.escapeHtml(question.text)}</p>

        <div id="play-answers">
          ${question.options.map((opt, i) => `
            <button
              class="btn-answer"
              data-index="${i}"
              data-testid="quizzz-button-answer-${i}"
            >${this.escapeHtml(opt)}</button>
          `).join('')}
        </div>
      </div>
    `;

    const answersEl = this.el.querySelector<HTMLDivElement>('#play-answers');
    answersEl?.addEventListener('click', (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.btn-answer');
      if (!btn || btn.disabled) return;
      const idx = Number(btn.dataset['index']);
      void this.handleAnswer(idx);
    });
  }

  private showReveal(correctIndex: number, scored: boolean): void {
    if (!this.currentQuestion) return;

    const answerBtns = this.el.querySelectorAll<HTMLButtonElement>('.btn-answer');
    answerBtns.forEach((btn) => {
      btn.disabled = true;
      const idx = Number(btn.dataset['index']);

      if (idx === correctIndex) {
        btn.classList.remove('selected', 'wrong');
        btn.classList.add('correct');
      } else if (idx === this.selectedIndex && idx !== correctIndex) {
        btn.classList.remove('selected');
        btn.classList.add('wrong');
      }
    });

    // Update score with pop animation if it changed
    if (scored) {
      const scoreEl = this.el.querySelector<HTMLSpanElement>('#play-score');
      if (scoreEl) {
        scoreEl.textContent = String(this.myScore);
        // Re-trigger animation: remove then re-add .pop after reflow
        scoreEl.classList.remove('pop');
        void scoreEl.offsetHeight;
        scoreEl.classList.add('pop');
      }
    }
  }

  private updateTimer(remaining: number): void {
    const timerEl = this.el.querySelector<HTMLDivElement>('#play-timer');
    const barEl = this.el.querySelector<HTMLDivElement>('#play-timer-bar');
    if (!timerEl || !barEl) return;

    timerEl.textContent = String(remaining);
    const pct = (remaining / QUESTION_TIMER_TOTAL) * 100;
    barEl.style.width = `${pct}%`;

    const urgent = remaining <= 5;
    timerEl.classList.toggle('urgent', urgent);
    barEl.classList.toggle('urgent', urgent);
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  private async handleAnswer(index: number): Promise<void> {
    if (this.phase !== 'question') return;
    this.phase = 'answered';
    this.selectedIndex = index;

    // Visually mark selected button
    const btns = this.el.querySelectorAll<HTMLButtonElement>('.btn-answer');
    btns.forEach((btn) => {
      btn.disabled = true;
      if (Number(btn.dataset['index']) === index) {
        btn.classList.add('selected');
      }
    });

    // Submit answer via REST
    try {
      const resp = await fetch(
        `/api/games/${encodeURIComponent(this.session.gameId)}/answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: this.session.playerId, answerIndex: index }),
        },
      );
      if (!resp.ok) {
        await resp.text(); // drain body
      }
    } catch {
      // Server will handle timeout; answer submission failure is non-fatal
    }
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
