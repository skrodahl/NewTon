# Undo System — Achievements

**Status:** Implemented — v5.0.1-beta.4; snapshot anchor refactored in v5.1.2
**Last Updated:** May 2026

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

## Snapshot Anchor — Start Match

The achievement baseline is captured when the match becomes active in `toggleActive()` (the "Start" button in Match Controls). The snapshot lives on the match itself:

```javascript
match.preMatchSnapshot = {
    [player1Id]: { oneEighties, tons, lollipops, highOuts, shortLegs },
    [player2Id]: { ... }
}
```

This snapshot is overwritten on every Start. Stop + Start refreshes the baseline; any pending uncommitted stats from a previous Confirm Winner attempt have already been rolled back via Esc/Cancel.

## Completion Modal — Diff

The Confirm Winner dialog reads the match's anchored snapshot (the operator can click player names to open the Stats Modal and add achievements as usual).

- **Confirm Winner**: the delta between `match.preMatchSnapshot` and current stats is computed and written to the COMPLETE_MATCH transaction's `achievements` field. Stats are already on `player.stats` as normal. The snapshot stays on the match object after completion as audit data.
- **Cancel** (or ESC): the delta is rolled back from `player.stats`, restoring them to the Start-Match baseline. The snapshot stays on the match — it'll be reused as the baseline for the next Confirm Winner attempt. If achievements were entered, the Cancel button label updates to **"Cancel & revert achievements"** before the operator clicks, making the consequence clear.

This means nothing is permanently committed until "Confirm Winner" is clicked, and the snapshot anchor is solid — it can't drift across dialog re-opens or be contaminated by other matches' completions.

### Fallback for snapshot-less matches

A match that was started before the Start-Match anchor landed (i.e. before v5.1.2) will not have a `preMatchSnapshot`. In that case, `showWinnerConfirmation` takes a snapshot at dialog open — same behavior as the original implementation, so existing in-progress tournaments keep working without migration.

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

---

## Why the Anchor Matters

Before v5.1.2 the snapshot was taken when the Confirm Winner modal opened. That timing is loose: if the dialog was previously opened for the same match (and exited via an abnormal path) or if other matches were completed in between, the snapshot could capture player state at the wrong instant. The diff at confirm-time would then record achievements from earlier matches onto the current match's transaction — and undoing the current match would incorrectly revert those earlier achievements too.

Anchoring to `toggleActive()` (Start Match) makes the baseline definitive:

- Start Match is a clear lifecycle event with no ambiguity about timing.
- The snapshot lives on the match object, not in a session-scoped global, so it can't drift between dialog opens.
- Overwriting on every Start is safe: any pending uncommitted stats from a previous Confirm Winner attempt have already been rolled back by the Esc-as-Cancel handler.

The corner case "user adds stats, exits Confirm Winner via abnormal path (tab close), then stops and re-starts the match" is intentionally not handled — orphan stats from that path are accepted as un-attributed lifetime totals. Adding rollback-on-Start logic to cover this would complicate a clean architecture for a near-impossible scenario.

## Pending — Manual Entry Attribution

Stats added via the bare `openStatsModal` (Results table, Command Center) are still untracked per-match — these edits happen outside any winner-confirm flow, so no transaction records them. The plan is to attribute them to the player's last completed match transaction, closing the gap noted in "What This Does Not Solve" above. Deferred until the current architecture proves out in real-world use.
