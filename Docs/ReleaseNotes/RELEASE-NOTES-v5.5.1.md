# Release Notes — v5.5.1 — Mainly Malmö Manager Mods

**NewTon DC Tournament Manager v5.5.1 — November 13, 2026**

---

## Overview

An achievement you typed is no longer lost because Add was forgotten. That's the change for everyone. The rest of this release is NewTon DC's own: the club's season final, built for the club's installation in Malmö and switched off everywhere else.

---

## Achievements are no longer lost

It happened at the club again and again: a short leg or a high out is typed into its box, Add is forgotten, Save closes the dialog, and the achievement is gone without a word.

Now **Save is stopped while a Short Legs or High Out box still holds a value that was never added.**

- **The dialog stays open,** an amber line appears under the box, and the cursor goes to it: "14 isn't added yet. Press Add, or clear the box."
- **A value out of range says so:** "Short legs are 9–21 darts." or "High outs are 101–170.", with "Fix or clear the box."
- **Pressing Enter is caught too,** not only the Save button.
- **The line goes** as soon as you type in the box, press Add, or open the dialog again. An empty box saves as before, and Cancel still closes without asking.

**Where:** Edit player statistics, which is also what Match Completion and Edit match open from their Edit Statistics links, and Corrections in Analytics. In Corrections, switching to another player with a value waiting is stopped as well, so the value can't end up under the next player's name.

The user guide now names the buttons as they are labelled: **Add**.

---

## NewTon DC club-specific changes

The club's season final: the top 16 of the season's standings, four groups of four, then an A cup and a B cup. It only exists on NewTon DC's own installation, behind a club-only switch. **On every other installation nothing of it shows,** and the Tournament Manager, the Leaderboard and the exports are exactly as before.

- **A format card, "Season final, NewTon DC".** A Round Robin with every setting fixed: four groups, the top two to the A cup, the B cup always played. Groups, schedules, referees, cups, undo and Analytics are the existing ones.
- **The cups drawn by group.** A1 v D2 and B1 v C2 in one half, C1 v B2 and D1 v A2 in the other, so group mates can only meet again in a final. The B cup the same with 3rd and 4th.
- **Points, then OP.** Equal points are decided by OP (Outstanding Player), the County league's score from matches, legs, tons and bonus points for short legs and high outs. OP is a Leaderboard column after Points and in both exports.
- **Fill from season standings.** In Player Registration: the season's 16 best available are invited and added already marked paid, players who can't come are marked Not available and those below move up, and the draw is seeded by season rank. Gated: the tournament's name has to be typed first.
- **A Season final tab in Analytics.** The Leaderboard on the club's website shows who has qualified (Qualified, Reserve n, Not available) for the saved season, and the groups as they would be drawn today. The season and the marks are kept on the server; only the operator changes them.

---

## Files Changed

- `js/player-management.js`, `css/styles.css` — the check before Save (`_statBoxesAllAdded()`), shared by both dialogs
- `js/newton-history.js` — the check in Corrections; OP, the ranking and the Season final tab
- `userguide.html` — the Add buttons
- `js/season-final.js`, `api/season-final.php` — Fill from season standings, and the saved season on the server (club only)
- `js/groups.js`, `js/clean-match-progression.js`, `js/bracket-rendering.js`, `js/results-config.js`, `js/seeding.js`, `js/tournament-management.js`, `js/main.js`, `tournament.html`, `css/` — the format, the cups drawn by group, and the hooks (club only)

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history. The export format is unchanged; the club's season final adds optional fields only where it is used.

This release moves `:latest` forward to v5.5.1. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.5.1 — Mainly Malmö Manager Mods*
