# Release Notes — v5.0.1-beta.8 — History, Properly Kept

**NewTon DC Tournament Manager v5.0.1-beta.8 — 2026-03-29**

---

## Overview

v5.0.1-beta.8 is a polish and correctness release. History management gets delete support and a working import. The undo dialog now tells you whether achievements came from the Chalker or were entered manually. The tons counter is fixed. QR Results button placement is cleaned up across the UI. Help system updated for new features.

---

## Undo Dialog: Source Awareness

The undo confirmation now shows whether a match was completed via **Chalker** or **Manual** entry, and adjusts its achievement message accordingly:

- **Chalker match**: Green info line — "Achievements were recorded automatically from Chalker visit scores."
- **Manual match**: Amber warning — "Achievements may have been entered manually for these players. Review the leaderboard."

The source label also appears in the match score line: e.g. "Frank wins 1–0 (Chalker)".

---

## Tons Fix

`NewtonStats.extractAchievements()` previously used `if / else if` — a 180 was counted as a 180 but not as a ton. Fixed to two independent checks: any visit ≥ 100 now increments `tons`, and any visit of exactly 180 also increments `oneEighties`. A match with two 180s and one additional ton now correctly shows 3 tons and 2 180s.

---

## QR Results Button — Placement and Visibility

- **Confirm Match Winner dialog**: Scan Results QR button added to the footer row (alongside Cancel and Confirm Winner), with an amber glow to make it stand out. Replaces the previous position in the dialog header.
- **Match Controls**: Scan QR Results moved to the single bottom row (Leaderboard | Scan QR Results | Close). Magnifying glass icon removed for consistency.
- **Visibility**: Button is hidden by default (never shown in setup mode), and only appears when the tournament is active and at least one live match exists.

---

## History: Delete Tournament

Each tournament row in the History tab now has a Delete button. Clicking it opens a confirmation modal that requires typing the exact tournament name before the Delete button enables. All match records and the tournament meta record are permanently removed.

---

## History: Import Fix

`importAll()` previously deleted the `id` field from imported match records and used `put()`, which caused a ConstraintError on the `tournamentMatch` unique index when records for the same tournament already existed in the database. Rewritten to do a proper per-record upsert: look up each match by `(tournamentId, matchId)`, overwrite if found (preserving the DB's primary key), add as new if not. Tournament metadata continues to use `put()` directly (keyed by `tournamentId`).

---

## History: Delete Bug Fix

`deleteTournament()` was calling `.delete(meta.id)` on the tournaments store. The tournaments store uses `tournamentId` as its keyPath — there is no `id` field. Fixed to `.delete(tournamentId)` directly.

---

## Help System

- **Tournament bracket**: Match Management section updated with Chalker assignment QR info; Completing Matches section updated with Scan Results QR explanation; Match Controls section updated with Scan QR Results entry.
- **History page**: New help section with three parts — tournament list and delete, match detail (Chalker legs vs manual), and export/import register.
- **History header**: ℹ️ help icon added, consistent with Setup, Registration, and Config pages.

---

## llms.txt

- Chalker → TM result QR is now documented as implemented (was incorrectly marked "not yet implemented")
- Persistence line corrected: localStorage + IndexedDB (NewtonMatchDB)
- "Do not invent" list updated: removed Chalker→TM result reporting; removed indexedDB
- Docker SSL section added

---

## Files Changed

- `js/newton-stats.js` — tons fix: `if / else if` → two independent `if` checks
- `js/bracket-rendering.js` — undo dialog source label and confidence message; QR Results button visibility gating
- `js/newton-db.js` — `deleteTournament()` keyPath fix; `importAll()` rewritten as per-record upsert
- `js/newton-history.js` — `promptDeleteTournament()`, `onDeleteInputChange()`, `confirmDeleteTournament()`; import error null-safety fix
- `js/dynamic-help-system.js` — tournament bracket QR sections; new History page help entry
- `js/main.js` — version 5.0.1-b.8
- `tournament.html` — History delete modal; History ℹ️ button; History page title; Scan Results QR in Confirm Match Winner footer; QR Results in Match Controls bottom row
- `css/styles.css` — `.undo-achievements-info` (green italic style for Chalker undo message)
- `llms.txt` — factual corrections and additions

---

## What's Next

- v5.0.1 stable release
