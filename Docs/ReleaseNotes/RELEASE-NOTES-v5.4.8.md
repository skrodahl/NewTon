# Release Notes — v5.4.8 — Non, je ne regrette rien

**NewTon DC Tournament Manager v5.4.8 — October 23, 2026**

---

## Overview

A completed match can now be corrected without undoing it. **Edit match** changes the score, the achievements and, when nothing depends on it, the winner. Achievements belong to the match they were recorded in, and the Analytics register keeps them that way when the tournament ends.

---

## Edit match

Select a completed match in the bracket and click **Edit match**, next to **Undo match**. The Confirm Winner dialog opens filled in with the recorded result. Change what is wrong and click **Save changes**.

**What can be edited**

- **The score:** always.
- **The achievements:** always. The dialog shows what the match recorded; add or remove 180s, tons, high outs and short legs in the Statistics dialog as before. Cancel and Esc leave everything as it was.
- **The winner:** while none of the matches it feeds are live or played. Click **Change winner**, set the score and save. The next match and the backside follow, as if the match had been undone and played again. If a later match is already played, the dialog says which one, and the score and achievements can still be edited.

**Why the winner is held back**

The winner decides who plays next, so it follows the same rule as Undo. In a Swiss tournament the next round is drawn from every result of the round before, so one played match in round 2 holds back the winners in round 1. The dialog says so.

**What can't be edited**

- Matches reported from the Chalker, by QR code or over the network. Their leg-by-leg detail is part of the match in Analytics, and an edit would contradict it. Undo and replay them.
- Walkovers and byes.
- Anything in a completed tournament. Nothing can be changed there; switch read-only off first, as for undo.

**Why not just undo and enter it again?** Undo is refused once a later match is played, and it sends the match back to ready, takes the players out of their next matches and clears the lane and referee. Edit changes only the result.

---

## Achievements at the end of the night

When a tournament ends, achievements entered outside the match dialogs are added to the player's last match in Analytics. That step now recognises the achievements the matches already recorded, so a player's last match shows only its own, plus whatever was entered outside a dialog. Before, it could show the player's whole night beside the match's own.

Tournaments finished with an earlier version keep what they have.

---

## Files Changed

- `js/bracket-rendering.js` — Edit match: the rules, the dialog entry and applying an edit
- `js/clean-match-progression.js` — the Confirm Winner dialog serves Edit match; match achievements are stored in the register's format
- `js/bracket-view.js` — the Edit match button in the selection bar
- `js/newton-db.js` — the register's achievements format and the end-of-tournament step
- `js/dynamic-help-system.js` — help for Edit match

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history. Edited matches carry two new optional fields that older versions ignore; the export format is unchanged.

Tournaments already finished and added to Analytics are not changed.

This release moves `:latest` forward to v5.4.8. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.4.8 — Non, je ne regrette rien*
