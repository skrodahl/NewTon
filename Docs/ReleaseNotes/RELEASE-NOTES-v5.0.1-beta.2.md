# Release Notes — v5.0.1-beta.2 — Nobody Leaves the Oche

**NewTon DC Tournament Manager v5.0.1-beta.2 — 2026-03-27**

---

## Overview

v5.0.1-beta.2 rethinks the Chalker's post-match flow. The scoreboard is now home — a winning checkout lands you back where you started, not on a separate Match Complete screen. The match is saved to history immediately. You review, you start the next one, you move on. No detours.

---

## Scoreboard is now home

When the winning checkout is confirmed, the Chalker stays on the scoreboard. A green banner declares the winner. The match is saved to history at that moment — no button press required.

From the completed scoreboard:

- **STATS** — opens the full stats view: averages, score ranges, leg scoresheets
- **NEW** — settings modal for the next match, pre-populated with the previous settings
- **HISTORY** — browse previous matches; back returns to the scoreboard

The old Match Complete screen (with Rematch, New Match, History, Result QR buttons) is gone.

---

## Stats screen: back arrow and Result QR

The stats screen now has a back arrow in the top-left header, consistent with the history detail screen. The bottom of the screen is reserved for the **Result QR** button — full-width, prominent — shown only for QR-assigned matches. For non-QR matches the bottom is clean.

---

## Winning leg locked after commitment

Scores in the winning leg can no longer be edited after the checkout is confirmed. This is consistent with how all other completed legs work — once you advance past a leg, it is locked. The checkout modal's Cancel button is the designed moment of regret.

---

## QR badge in match history

QR-assigned matches show a small **QR** badge next to the player names in the history list, making it easy to identify which matches were run through the Tournament Manager assignment flow.

---

## Files Changed

- `chalker/js/chalker.js` — `onMatchComplete()`: stays on scoreboard, saves to history; `completeLeg()`: calls `onMatchComplete()`; `showEndScreen()`: no longer saves to history; STATS key: routes to `showEndScreen()` when match complete, `showLiveStats()` otherwise; `startEditingVisit()`: blocked when `matchComplete`; `historyBack()`: calls `updateDisplay()` for completed matches; `updateIdleDisplay()`: hides banner; `renderHistoryList()`: QR badge
- `chalker/index.html` — `#match-complete-banner`; end screen back arrow in header; Result QR as full-width bottom button; Rematch, New Match, History buttons removed
- `chalker/styles/chalker.css` — `.match-complete-banner`, `.btn-full`, `.qr-badge` styles
- `chalker/sw.js` — version `chalker-v105`

---

## Migration

No migration required. Fully compatible with all existing match history.

---

## What's Next

- History as source of truth: match written to history on start, updated in real time
- In-progress matches resumable from history
- `current_match` store deprecated
- TM scans the result QR (camera button in Match Controls)
