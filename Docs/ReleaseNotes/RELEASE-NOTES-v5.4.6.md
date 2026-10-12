# Release Notes — v5.4.6 — Peek-a-Boo

**NewTon DC Tournament Manager v5.4.6 — October 12, 2026**

---

## Overview

The bracket page opens on Match Controls, and for someone new to it, the bracket behind it was easy to miss. Match Controls now slides over the bracket like a drawer, with the bracket in plain sight beside it and one obvious way back. And undoing a match in a finished Swiss, Round Robin or Cup and Plate tournament now reopens it, as it always did for the other formats.

---

## Match Controls Over the Bracket

- **A drawer, not a wall.** Match Controls slides over the bracket from the right. A strip of the bracket stays visible on its left, lightly dimmed, so it's clear what's underneath.
- **One click back.** Click the dimmed bracket, or the orange **← Bracket** pill at the top of the strip, to see the bracket. Hovering the pill reminds you that the left arrow key does the same.
- **Esc closes Match Controls,** as it would close a dialog. The bracket comes back exactly as you left it, with the same zoom and the same match selected.
- **One Leaderboard.** The header's Leaderboard button stays in view above Match Controls, so the finished tournament's second Leaderboard button is gone.
- **The bracket page stands apart.** The other pages are lighter now, near white, and the bracket page keeps a warmer, deeper surround, so you can tell at a glance that you're on the stage, not in the settings.

The **Bracket | Match Controls** tabs and the arrow keys work as before, and the page still opens on Match Controls if that's how you've set it.

---

## Undo in a Finished Tournament

To correct a finished tournament, you switch off its read-only lock in the Developer Console and undo the match. In Swiss, in Round Robin with one group, and in Cup and Plate when the Plate's last match was played last, the tournament stayed marked as finished after the undo, and Match Controls kept showing the podium.

Now any undo in a finished Swiss, Round Robin or Cup and Plate tournament reopens it, and the podium waits until the matches are played again. Double and single elimination behave as before.

If you have a tournament in that state, undo one more match (in Swiss, a semifinal). It reopens, and you can play the matches again from Match Controls.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. Nothing stored has changed; the export format is unchanged.

This release moves `:latest` forward to v5.4.6. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.4.6 — Peek-a-Boo*
