# Undo System — Achievements

**Status:** Implemented — v5.0.1-beta.4
**Last Updated:** March 2026

---

## The Problem

The undo system reliably rolls back bracket state — match completion, player advancement, lane and referee assignments. What it has never handled is achievements.

Achievements are stored on `player.stats` (oneEighties, tons, highOuts, shortLegs, lollipops). They are additive counters. Undoing a match does not touch them. If achievements were registered for a match — whether automatically via Stats QR or manually via the Statistics Modal — they remain on the player record after the match is undone.

This is a separate problem from bracket undo, and it requires its own handling.

---

## Transaction Memory

Every `COMPLETE_MATCH` transaction has an `achievements` field:

```javascript
{
    type: 'COMPLETE_MATCH',
    completionType: 'MANUAL',    // 'MANUAL', 'AUTO', or 'QR'
    achievements: {
        [player1Id]: { oneEighties: 2, tons: 8, highOuts: [121], shortLegs: [9], lollipops: 1 },
        [player2Id]: null
    }
}
```

- **`completionType: 'MANUAL'`** — completed via the winner confirmation modal. `achievements` contains the delta of stats entered during the session (what changed between modal open and Confirm). `null` per player if nothing was added.
- **`completionType: 'AUTO'`** — walkover/bye. `achievements` is always `{ [p1]: null, [p2]: null }`.
- **`completionType: 'QR'`** — completed via Stats QR (beta.5+). `achievements` populated by `newton-stats.js`.

The `achievements` field is always present. A `null` value for a player means no achievements were recorded for them in this transaction — not that they have none overall.

## Completion Modal — Snapshot & Diff

When the winner confirmation modal opens, a snapshot of both players' stats is taken. The operator can click player names to open the Stats Modal and add achievements as usual.

- **Confirm Winner**: the delta between snapshot and current stats is computed and written to the transaction's `achievements` field. Stats are already on `player.stats` as normal.
- **Cancel** (or ESC): the delta is rolled back from `player.stats`, restoring them to their pre-session state. If achievements were entered, the Cancel button label updates to **"Cancel & revert achievements"** before the operator clicks, making the consequence clear.

This means nothing is permanently committed until "Confirm Winner" is clicked.

---

## Undo Dialog

### Match with recorded achievements

> **Undo: FS-1-2 — Harry defeats Bob 2–0**
>
> Recorded achievements for this match:
> - Harry: 2× 180, 8× ton, 1× high out (121)
>
> ⚠️ Achievements may have been entered manually for these players. Review the leaderboard.
>
> [ Undo match ] &nbsp; [ Undo match + achievements ]

"Undo match + achievements" removes exactly what the transaction recorded from `player.stats`.

### Match with no recorded achievements

> **Undo: FS-1-2 — Harry defeats Bob 2–0**
>
> ⚠️ Achievements may have been entered manually for these players. Review the leaderboard.
>
> [ Undo match ]

Single button only. The warning is unconditional — the transaction can only account for what it recorded.

---

## Rollback Mechanics

When "Undo match + achievements" is chosen, the system subtracts exactly what the transaction recorded:

| Field | Rollback method |
|-------|----------------|
| `oneEighties` | Subtract count, floor at zero |
| `tons` | Subtract count, floor at zero |
| `lollipops` | Subtract count, floor at zero |
| `highOuts` | Remove each recorded value from the array |
| `shortLegs` | Remove each recorded value from the array |

The operator is responsible for any achievements entered outside the completion session — hence the unconditional warning.

---

## Relationship to Stats QR Completion (beta.5)

Match completion via Stats QR is documented in `Docs/QR.md`. In summary:

- Operator scans result QR → preview shows winner, score, and extracted achievements
- Two options: **Score only** or **Score + achievements**
- "Score only" → `achievements` field has `null` per player
- "Score + achievements" → `achievements` field populated, `completionType: 'QR'`

The undo dialog handles QR-completed matches identically to manually completed ones — the same two-button choice, same rollback mechanics.

---

## What This Does Not Solve

- Achievements entered manually via the Statistics Modal are not tracked per-match. The transaction has no record of them.
- The warning in the undo dialog is the only safeguard. The operator must review the leaderboard manually for any match where stats were hand-edited.
- This is by design — adding per-match tracking to manual achievement entry is a separate, larger problem not addressed here.
