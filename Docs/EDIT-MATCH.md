# Edit Match

**Status:** Implemented, unreleased (after v5.4.7)
**Raised:** Monday 2026-10-19: several matches were reported incompletely (achievements, legs won and winners had to be corrected). Undo was the only tool, and achievements entered by hand were tied to no match.

---

## What it does

**Edit match** sits beside **Undo match** in the bracket's selection bar. It opens the Confirm Winner dialog filled in with the recorded result, titled "Edit: A beats B", with **Save changes**.

| | Normal stage | Locked stage (Swiss next round started, cups drawn) |
|---|---|---|
| Legs won (winner unchanged) | always | always |
| Achievements | always | always |
| Winner | only if no downstream match is played or live | locked |

Never editable:
- **Read-only tournaments.** Nothing is allowed there; toggling read-only off (Developer Console) is the deliberate step, as for undo.
- **Walkovers and byes** (AUTO completions).
- **Matches reported from the Chalker** (QR or network, `completionType: 'QR'`). They carry leg-by-leg detail in the register that an edit would contradict. Correct them with undo and replay.

## Winner rule: one source

A winner change is allowed exactly when `isMatchUndoable()` is true: not read-only, not a locked stage, and no downstream match live or completed by hand. `getMatchEditState()` reports it as `canChangeWinner`, with `lockedReason` ("FS-2-1 is played", "the cups are drawn", in Swiss "round 2 has started (R2-3 is played) and was drawn from round 1's results": one played match locks the whole round, because the next round is drawn from all of this round's results) for the dialog. No parallel logic.

## How an edit is applied (`applyMatchEdit()`, `js/bracket-rendering.js`)

- **Winner unchanged:** the match's `COMPLETE_MATCH` transaction is rewritten in place (new `achievements`, additive `editedAt`) and `match.finalScore` is replaced. History keeps one transaction per match, so undo and rebuild are untouched. The register record (NewtonDB) gets the new `legsWon` and `achievements` and an `editedAt`; its `completedAt` is kept. Qualifier matches are not in the register.
- **Winner changed:** `undoManualTransaction()` (the existing undo), then `completeMatch()` for the other player, exactly as if the match had been undone and replayed. The new transaction carries `editedAt` and `originalWinner`. Its `completedAt` is the time of the edit. The register write waits for the undo's deletes (`undoManualTransaction()` returns that promise), so a save cannot be deleted with the record it replaces.

Both are additive fields on records that old versions ignore, so no schema marker is needed.

## Achievements

The dialog's diff needs a baseline. For an edit it is the players' stats **without** what the match recorded: `subtractAchievementStats()` (the same function "Undo match + achievements" uses) applied to a snapshot. The dialog then opens showing the match's recorded achievements ("Achievements for this match"), and whatever is added or removed in the Statistics dialog becomes the new delta on the transaction. Cancel and Esc restore the stats to how they were when the dialog opened (`_completionRestore`), not to the baseline.

Stats entered earlier by hand in the Statistics dialog outside any match dialog are tied to no match and stay that way; an edit adds to what the match recorded.

## Limits worth knowing

- **Swiss:** a legs edit does not redraw a next round that was drawn but not started. Only a started round locks (as for undo). The standings update; the draw stays as made.
- **Groups and cups:** the same, once the cups are drawn: the group tables may differ from the ones the cups were drawn from, the draw stays.
- A winner change replays the match, so its lane, referee and start history are cleared, as in undo.

## Files

`js/bracket-rendering.js` (`getMatchEditState()`, `isMatchEditable()`, `handleMatchEdit()`, `applyMatchEdit()`, `subtractAchievementStats()`, `undoManualTransaction()` returns a promise), `js/clean-match-progression.js` (`showWinnerConfirmation()` takes an optional `edit`), `js/bracket-view.js` (the button).
