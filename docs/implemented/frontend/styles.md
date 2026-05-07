---
component: styles
area: frontend
coverage: 100%
created: 2026-05-07
updated: 2026-05-07
---

# Styles — Implementation Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-ST-01   | done   | `--bg: #1a1a2e` on `:root`, applied to `body` |
| REQ-ST-02   | done   | `--accent: #7c3aed` on `.btn-primary`, focus rings, `.btn-answer.selected` |
| REQ-ST-03   | done   | `--teal: #14b8a6` on `.btn-answer.correct`, `.player-dot` |
| REQ-ST-04   | done   | `--yellow: #facc15` on `.timer-warning`, `.rank-score`, podium gold |
| REQ-ST-05   | done   | Mobile-first, single-column base, `max-width` containers, `@media (min-width: 30rem)` and `48rem` breakpoints; no fixed widths |
| REQ-ST-06   | done   | Body `1rem` (16px); `--text #e2e8f0` on `--bg #1a1a2e` ≈12.5:1 contrast (WCAG AAA); `--text-dim #94a3b8` ≈5.5:1 (WCAG AA) |
| REQ-ST-07   | done   | `.btn-primary` purple+white+hover/active; `.btn-answer` outlined with select/correct/wrong states; all ≥2.75rem height |
| REQ-ST-08   | done   | `.timer` 3.5rem centered tabular-nums; `.timer-warning` yellow; `.timer-danger` red + `pulse` animation |
| REQ-ST-09   | done   | `.podium` flex align-bottom; `.p1/.p2/.p3 .podium-bar` heights 10/7/5rem; gold/silver/bronze colors |
