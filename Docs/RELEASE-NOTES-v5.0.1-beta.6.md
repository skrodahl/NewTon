# Release Notes — v5.0.1-beta.6 — The Record Books Open

**NewTon DC Tournament Manager v5.0.1-beta.6 — 2026-03-28**

---

## Overview

v5.0.1-beta.6 introduces NewtonMatchDB — a persistent, IndexedDB-backed global match register that records every completed match across all tournaments. A new History tab gives read-only access to the archive: browse finalized tournaments, drill into match lists, and open full match detail including visit scores and achievements. Match cards in Tournament Setup → Match History are now clickable for the same detail view. Several bugs and UX issues from beta.5 testing are also resolved.

---

## NewtonMatchDB — Global Match Register

A new IndexedDB layer (`js/newton-db.js`) persists every non-walkover match completion across all tournaments:

- **Two stores**: `matches` (one record per match) and `tournaments` (one record per tournament)
- **Write at completion**: every MANUAL or QR completion is written immediately, fire-and-forget
- **Delete on undo**: undoing a match removes it from the register
- **Finalize at close**: completing a tournament promotes all its records to `status: 'final'` and attaches a full player stats snapshot
- **Each match record includes**: match ID, tournament ID, both player names/IDs, winner, leg scores, raw visit scores (base64), achievements, first starter, format, completion type, and timestamps
- **Export/import**: full DB dump as JSON via the History tab

---

## History Tab

A new **History** navigation item (between Global Settings and Chalker) gives a read-only, three-panel view of the match register:

- **Tournament list** — all finalized tournaments, showing format, date, player count, and status badge
- **Match list** — all final matches for the selected tournament, with winner, leg score, match type (Chalker/Manual), and date
- **Match detail** — full record: type badge, format, date, winner, legs table with visit scores and checkout darts (Chalker matches), and achievements table

Navigation: tournament list → match list → match detail, with back buttons at each level. The match list back button correctly returns to the match list for the current tournament (not the tournament list root).

Export and import of the full DB are available from the History tab.

---

## Match Detail Modal — Setup Page

Completed match cards in **Tournament Setup → Match History** are now clickable. Clicking a non-walkover card opens an inline modal with the full match detail (identical content to the History tab detail view). Walkover cards remain non-clickable. The pointer cursor is the only visual hint needed.

---

## Tons Fix

180s were incorrectly excluded from the Tons count. `NewtonStats.extractAchievements()` now counts any visit ≥ 100 as a ton (including 180s), matching standard darts scoring where a 180 is a ton. The label "Tons (100–179)" has been corrected to "Tons" throughout.

---

## QR Results Button Redesign

The **Scan QR Results** button in Match Controls has been moved out of the footer and into its own row above the Leaderboard/Close row. It uses the orange glow from live match cards as a visual cue — consistent with the language of "something active can happen here". The button is hidden automatically when the tournament is completed.

---

## Bug Fixes

- **Match Controls not refreshing after QR completion**: the refresh check used `classList.contains('active')` which was wrong for the dialog stack system. Fixed to use `window.dialogStack`.
- **Back button in match detail wired incorrectly**: the HTML button had no id, so `openMatch()` could never wire its `onclick`. Fixed by adding `id="historyMatchDetailBackBtn"` and updating the label to "← Back to matches".
- **QR Results button shown after tournament completion**: now hidden via `tournament.status === 'completed'` check in `showMatchCommandCenter()`.

---

## Files Changed

- `js/newton-db.js` — new module: `initDB()`, `saveMatch()`, `deleteMatch()`, `getMatch()`, `getMatchesByTournament()`, `saveTournamentMeta()`, `finalizeTournament()`, `getTournament()`, `getFinalTournaments()`, `exportAll()`, `importAll()`
- `js/newton-history.js` — new module: three-panel History UI; `openMatchModal()` for inline detail; `_buildMatchDetailHtml()` shared builder
- `js/newton-stats.js` — `extractAchievements()`: tons threshold changed to `>= 100`
- `js/clean-match-progression.js` — DB write hook at match completion; `finalizeTournament` hook at tournament close; `rawLegs`/`firstStarter` params added to `completeMatch()`
- `js/bracket-rendering.js` — `undoManualTransaction()` calls `NewtonDB.deleteMatch()`; `showMatchCommandCenter()` hides QR Results button when tournament completed; Match Controls refresh fix
- `js/qr-bridge.js` — "Tons (100–179)" label corrected to "Tons"
- `js/main.js` — `updateMatchHistory()` adds clickable onclick to non-walkover completed match cards
- `tournament.html` — History nav item; three-panel History page; `#matchDetailModal`; two-row Match Controls footer; `newton-db.js`, `newton-history.js` script tags; `historyMatchDetailBackBtn` id and label fix
- `css/styles.css` — History panel styles: `.history-table`, `.history-row`, `.history-back-row`, `.history-panel-title`, `.history-panel-meta`, `.history-detail-header`, `.history-type-badge` variants

---

## Migration

No migration required. NewtonMatchDB is populated going forward from beta.6. No existing tournament data is affected. Tournaments completed before beta.6 will not appear in the History tab until they are closed again (not retroactive).

---

## What's Next

- v5.0.1 stable release
