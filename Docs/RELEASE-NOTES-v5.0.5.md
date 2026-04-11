# Release Notes — v5.0.5 — Read Between the Lines

**NewTon DC Tournament Manager v5.0.5 — April 11, 2026**

---

## Overview

v5.0.4 gave Analytics a past. v5.0.5 makes it readable.

A new table utility powers every list in the Analytics tab — sortable columns, pagination, and persistent preferences. The match detail page gets a visual overhaul: two-line title, monospace scores, winner/loser styling, and a horizontal stats table that matches the Results leaderboard format.

The data hasn't changed. It just tells a better story now.

---

## Table Utility

A reusable table component (`newton-table.js`) now drives the tournament list and match list in the Register view.

**Features:**
- **Sortable columns** — click a header to sort ascending, click again to reverse. Active column shows ▲ or ▼.
- **Pagination** — rows-per-page selector (10 / 25 / 50 / All) with Prev/Next navigation.
- **Persistent preferences** — sort column, sort direction, and rows-per-page are saved to localStorage per table. Survives page reloads.
- **Column widths** — compact columns (Format, Players, Matches, Result, Type, Date) get fixed widths; name columns take the remaining space.

Every future tabular view — Leaderboard, Players, cross-tournament stats — will use the same component.

---

## Match List Redesign

The match list inside a tournament now shows:
- **Player 1** and **Player 2** as separate columns, winner bolded
- **Result** column showing the score in P1–P2 order
- Compact fixed widths on Match, Result, Type, and Date columns

Replaces the old combined "Result" column that showed "**Winner** X–Y".

---

## Match Detail Redesign

The match detail page has a new visual hierarchy:

- **Title** — two lines: match ID (small, muted, uppercase) above player names (large, bold)
- **Result line** — P1 score P2: winner bold, loser muted grey, score in monospace
- **Badges** — "Best of N" and "Manual/Chalker" right-aligned in the match header
- **Stats table** — horizontal leaderboard-style layout with Player, Short Legs, High Outs, 180s, Tons. Always shown with all columns, dashes for empty values. Winner bolded. Same format as the Results table.

---

## Tournament Match Count

The tournament list now shows a "Matches" column — the number of completed non-walkover matches. Written at finalization and backfill; self-healing on render for older records (computed and persisted if missing).

---

## Backfill Fix

Backfilled matches now include the `format` field (x01 format and best-of value) read from the localStorage match object. Previously this was written as `null`, which prevented the "Best of N" badge from appearing on backfilled match details.

**Note:** tournaments backfilled under v5.0.4 can be deleted and re-added to pick up the format data.

---

## Files Changed

- `js/newton-table.js` — new reusable sortable/paginated table component
- `js/newton-history.js` — tournament and match tables use `NewtonTable`; match detail title, result, stats table, and badge redesign; match count self-healing
- `js/newton-db.js` — `matchCount` written at finalization
- `js/tournament-management.js` — `matchCount` and `format` written at backfill
- `css/styles.css` — `NewtonTable` sort header and pagination styles; match detail title styles
- `tournament.html` — hardcoded table elements replaced by container divs; `newton-table.js` script tag added

---

## Migration

No migration required. Fully compatible with all existing tournament data. Tournaments backfilled under v5.0.4 can optionally be deleted and re-added to gain the "Best of N" badge — this is cosmetic only, no data is lost.

---

**NewTon DC Tournament Manager v5.0.5 — Read Between the Lines.**
