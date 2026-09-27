# Release Notes — v5.1.9 — Every Chalker Needs an Eraser

**NewTon DC Tournament Manager v5.1.9 — September 27, 2026**

---

## Overview

Every chalker writes a wrong number now and then. The good ones rub it out and write the right one, and nobody at the oche thinks twice about it.

NewTon has now been through real club nights, and two things came back from them. A finished tournament's achievements could not be corrected once they reached Analytics — however hard anyone tried. And undoing a match left the next match's lane and referee booked. This release hands Analytics an eraser, and tidies up after undo.

---

## Correcting Achievements

A 180 gets missed, a high out is entered for the wrong player, a ton is counted twice. It happens, and it is usually noticed after the tournament is over — when the numbers are already on the Leaderboard.

Until now there was no reliable way to fix them. Each browser that opens Analytics takes its own copy of a finished tournament the first time it sees it, and never reads it again. Editing the tournament file, deleting and re-uploading it, or editing an exported register all ran into that somewhere along the way — often in a browser nobody was looking at.

So corrections no longer try to rewrite the record. They sit on top of it.

- In maintenance mode, each tournament in **Analytics → Register → Tournaments** has an **Edit** button.
- Pick a player, then add or remove **180s, tons, lollipops, high outs and short legs** for that tournament. The recorded values are shown alongside, so it is always clear what has changed.
- **Reset Player** puts a player back to exactly what was recorded.

Corrections are saved on the server and apply to Analytics **on every device** the next time it loads — the Dashboard, the Leaderboard, the Players view and tournament points alike. The tournament itself is never changed, so the normal flow carries on as before: the tournament computer uploads, Analytics picks it up, and the corrections apply on top. A tournament that is removed from Analytics and picked up again keeps its corrections.

Match details still show what was recorded on the night. Corrections belong to the tournament, not to any single match.

This needs the Docker container, since corrections have to live somewhere every device can reach. The Edit button is not shown on the public Analytics page.

---

## Undo Frees the Board

Undoing a match sends both players back to it. If the next match they had been sent to already had a lane and a referee lined up, those stayed booked: the referee showed as busy and the lane as in use, for a match that was once again waiting for its players. The only way out was to find that match and clear them by hand.

Undo now clears the lane and referee on those waiting matches as well. They are assigned again as normal once the players are known.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, and Analytics.

Corrections are stored in a new `corrections` folder inside the container's tournaments folder, which the container creates at startup. Back up the tournaments folder as before and the corrections come with it.

This release moves `:latest` forward to v5.1.9. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.1.9 — Every Chalker Needs an Eraser.*
