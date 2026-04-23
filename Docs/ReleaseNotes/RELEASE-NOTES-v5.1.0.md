# Release Notes — v5.1.0 — Burgerboy85-rgb to Throw

**NewTon DC Tournament Manager v5.1.0 — April 23, 2026**

---

## Overview

v5.1.0 is about people. The Analytics tab gets its first player-focused view — select one player and see their profile, select two and compare them, select everyone and see the full leaderboard. The data that's been accumulating since v5.0.1 starts telling individual stories.

This is a minor version bump because the Analytics command center is growing into its architecture. The Players tab is the third view in a system designed to expand incrementally — same data, same scope, same point mode, new lens. More views will follow.

Elsewhere: the Leaderboard exports to CSV and JSON, referee suggestions now show which lane a player was on, the app remembers which page you were on across reloads, and the Settings page links directly to its documentation.

This release is named for [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — NewTon's first community contributor. His iOS QR testing across v5.0.14 and v5.0.15, his feature discussions, and his "loser marks" idea that inspired the lane info in referee suggestions all made this release better. The oche is his.

---

## Analytics — Players Tab

The Analytics tab adds a fourth view: **Players**. A split-panel layout with a player list on the left and a context-driven panel on the right.

**Selection drives the view:**
- **All or multiple players selected** → comparison table showing tournaments played and win/loss record, sortable by any column
- **One player selected** → individual profile card with career stats
- **No players selected** → placeholder

**Cross-view navigation** connects the Analytics tabs. Click a player name in the Leaderboard → Players tab opens with that player focused. Click a stat card on the Dashboard (180s, Highest Checkout, Shortest Leg) → jumps to the relevant player's profile. The same data, navigated from different angles.

Player selections are persisted to localStorage and restored on reload. The Players tab is the foundation for per-player analytics — form over time, head-to-head records, and career progression will build on this view.

---

## Leaderboard Export

The Leaderboard now has **Export CSV** and **Export JSON** buttons. Both respect the current scope, point mode, and layers — what you see is what you export.

A new shared utility (`newton-csv.js`) provides `NewtonCSV.exportCSV()` and `NewtonCSV.downloadFile()`. The existing tournament results CSV export has been refactored to use the same utility — one code path for all CSV exports.

---

## Referee Suggestions — Lane Info

Recent Losers, Recent Winners, and Recent Assignments in the Referee Suggestions panel now show the lane number when assigned: `Nick (FS-R1 · Lane 3)`.

This helps operators identify who is already standing at the right board — especially useful for clubs that follow the "loser marks the next game on their board" tradition. The system doesn't enforce the rule, but it gives operators the information to follow it if they choose.

Inspired by [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — [Discussion #6](https://github.com/skrodahl/NewTon/discussions/6).

---

## Everything Else

- **Page persistence** — the app remembers which page you were on across reloads. No more returning to Tournament Setup every time.
- **Analytics cache invalidation** — completing a tournament now invalidates the Analytics cache. The new tournament appears in Analytics on next navigation without a page reload.
- **Documentation links** — Server Settings header and the "Automatically backup" checkbox now have ℹ️ icons linking directly to their documentation pages.
- **Documentation index** — all doc pages listed at the bottom of the User Guide with descriptions.

---

## Contributors

- [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — iOS QR testing (v5.0.14–v5.0.15), feature discussions, and the "loser marks" idea that inspired lane info in referee suggestions

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history. New localStorage keys (`newton_activePage`, `newton_analytics_playerSelection`) are created on first use.

---

**NewTon DC Tournament Manager v5.1.0 — Burgerboy85-rgb to Throw.**
