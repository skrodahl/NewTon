# Release Notes — v5.0.1-beta.4 — Stats Don't Lie

**NewTon DC Tournament Manager v5.0.1-beta.4 — 2026-03-28**

---

## Overview

v5.0.1-beta.4 closes the gap between match completion and achievement tracking. Until now, achievements were entered through a separate modal with no connection to the match being completed — they landed on player stats but left no record of which match they belonged to. The undo system had no way to reverse them.

That changes here. The match completion session is now achievement-aware from start to finish: stats are snapshotted when the modal opens, the delta is recorded in the transaction when confirmed, and rolled back cleanly on cancel. The undo dialog offers a genuine choice.

---

## Achievements Recorded in the Match Completion Transaction

When the Confirm Match Winner modal opens, a snapshot of both players' stats is taken. The operator uses the Statistics modal exactly as before — click a player name, enter achievements, close. Nothing about that workflow changes.

When "Confirm Winner" is clicked, the system diffs the current stats against the snapshot and writes the delta to the `COMPLETE_MATCH` transaction's `achievements` field. The transaction now knows exactly what was entered during the completion session.

Matches completed before this release have `null` achievements in their transactions — the undo dialog handles this gracefully (single button, warning only).

---

## Cancel & Revert Achievements

If achievements are entered and the operator cancels — whether by clicking Cancel, pressing ESC, or any other exit path — player stats are restored to their pre-session state. Nothing is committed until "Confirm Winner" is clicked.

Once achievements have been entered and the operator returns to the completion modal, the Cancel button updates to **"Cancel & revert achievements"** so the consequence is visible before clicking.

---

## Undo Match + Achievements

The undo dialog now shows recorded achievements when the transaction has them:

> **Recorded achievements for this match:**
> Christian: 4× ton, 1× short leg
> Albert: 1× lollipop

Two choices:

- **Undo match** — resets bracket state only; achievements remain on the leaderboard for manual review
- **Undo match + achievements** — resets bracket state and removes exactly the recorded achievements from both players' stats

The unconditional warning about manually entered achievements remains. The transaction only knows what happened inside the completion session.

---

## Live Achievement Summary in the Completion Modal

As achievements are entered during the session, a green summary box appears in the completion modal — between the leg score section and the buttons — showing exactly what has been recorded for each player. The summary updates each time the Statistics modal closes and disappears if all achievements are removed.

---

## Files Changed

- `js/clean-match-progression.js` — `_completionSnapshot` module variable; `snapshotPlayerStats()`, `diffPlayerStats()`, `restorePlayerStats()` helpers; `showWinnerConfirmation()` snapshots on open, restores on cancel, diffs on confirm, resets Cancel label in cleanup; `openStatsModalFromConfirmation()` updates Cancel button label after Stats modal closes; `completeMatch()` accepts `achievements` param and writes it to the transaction
- `js/bracket-rendering.js` — `rollbackAchievements()`; `showUndoConfirmationModal()` with `onConfirmWithAchievements` param; `handleSurgicalUndo()` wired with achievements callback and `doUndoWithAchievements`
- `tournament.html` — `#completionAchievementsSummary` container in `winnerConfirmModal`; "Undo match + achievements" button in `undoConfirmModal`
- `css/styles.css` — `.completion-achievements-box`, `.completion-achievements-title`, `.completion-achievement-row`
- `Docs/UNDO.md` — updated to reflect the complete design

---

## Migration

No migration required. Fully compatible with all existing tournament data. Matches completed before this release have `null` in the `achievements` field — the undo dialog shows the warning-only variant for those.

---

## What's Next

- beta.5: Complete match from Stats QR — declare winner with score only, or score + achievements; operator decides; `newton-stats.js` extracts achievements from payload
