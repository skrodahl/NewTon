# Release Notes — v5.2.0 — New Flights, Same Arrows

**NewTon DC Tournament Manager v5.2.0 — October 4, 2026**

---

## Overview

v5.1.10 gave the bracket and Global Settings a new look and promised the rest of the app would follow. This is the rest of the app.

Every page now shares one header, one set of colours and one typeface. Tournament Setup, Player Registration and Analytics have been rebuilt around what you do on them. The tournaments, results, points and match history underneath are exactly the same.

Analytics also works on a phone now. That's where club members look up the standings.

---

## One Header for Every Page

The header runs the full width of the window: the club logo and title on the left, the page links underneath, and the tournament's name, date and a large clock on the right. It's the same clock as in the bracket header, readable from across the room. The selected page is underlined. The footer matches, and sits at the bottom of the window even on short pages.

Pages use the width of a full-screen window. Forms and short lists use a comfortable width; Analytics, with its wide tables, uses nearly all of it.

---

## Tournament Setup

Setup now starts with **the tournament you have loaded**: its name, date and format, whether it's being set up, running or completed, and four figures: players (and how many have paid), bracket size, matches completed, and matches being played now.

Under it, **the next step**, which changes as the night goes on: Register players, then Open bracket, then Open in Analytics. If a completed tournament isn't in Analytics yet, the button says **Add to Analytics**. Export, Backup to server and Reset tournament sit in the same panel, since they act on that tournament.

- **New tournament** is its own form, with Import tournament under it.
- **Tournaments** is one scrolling table, newest first. When a server answers, **This computer** and **Server** are two tabs, and the Server tab lists the shared tournaments to import.
- **Match history** shows one line per match: the winner in green, the loser and the score, then the lane, the referee and where both players went next ("Ida to FS-2-2, Siri to BS-1-2", "out (7th-8th)", "wins the tournament"). The match number shows the side: frontside outlined, backside grey, the Grand Final dark. Walkovers are greyed out, and walkovers between two empty slots are left out.

---

## Player Registration

A strip along the top counts **Players, Paid and Unpaid** and says what to do now. Before the draw, that's **Open bracket**, and the button only works when there are enough paid players for one of your formats. After the draw, it's the matches still to play.

- **Players** are rows in as many columns as fit, each with a Paid / Unpaid pill. Click a row to toggle paid; × removes an unpaid player. After the draw the list is locked.
- **Saved players** are chips: click a name to add the player, × to remove the name from the list. Only names not already in the tournament are shown.
- **The payment QR** has its own panel.
- **After the draw, the Leaderboard takes the wide column**, with Export CSV and JSON in its header.

The pop-ups telling you how many more players you need are gone; the strip at the top always shows it.

---

## One Leaderboard

The Leaderboard on the Registration page and the Leaderboard you open from the bracket and Match Controls now look the same. The one in the bracket has no export buttons, so it stays a quick look during play.

Points are also calculated in one place. Registration, the Leaderboard, the exports and every part of Analytics use the same formula: taking part, placement and achievements. Nothing changes in the numbers; they just can't drift apart any more.

---

## Analytics, Rebuilt

Analytics opens with **one strip** across the top. The first row holds the four views (Dashboard, Leaderboard, Players, Register) and the points controls (Original or Current point values, and the Ranking and Attendance layers). The second row says **how many tournaments are being counted, and why**, for example "23 of 24 tournaments · 1 unticked", followed by the **Lens**.

**The Lens now works from every view.** It used to live inside Register → Tournaments, so you had to go there to change what the Leaderboard was counting. Now the name filter, the date range, the half-year buttons (H2 2026, H1 2026) and **Show all** sit in the strip, and the view you're on updates as you type. The strip turns orange when you're not seeing everything. To leave out single tournaments, click **Choose tournaments** and untick them.

- **Dashboard:** the seven headline numbers as tiles, and under them the **Leaderboard's top 10** and the **latest tournaments with their winners**. Click a player or a tournament to open it.
- **Leaderboard:** Points and Played come right after the name. The columns are grouped under Placements, Achievements, Best, Matches and Legs, and a line under the 16th player marks the top 16.
- **Players:** tick one player for a **full profile**: their Leaderboard figures, their rank, how often they finished in each place, and every tournament they played, with their placing and points. Tick several to compare them side by side.
- **Register:** Tournaments and Matches tabs, with a path back from an opened tournament or match. The tournament list shows each **winner**. Match numbers show their side, and each match says whether it was scored on the Chalker or by hand.
- **Match detail:** a large score line, each player's 180s, tons, high outs, short legs and points, and for Chalker matches every leg, visit by visit. The same view opens from Match History on the Setup page.

The figures for each player now come from one calculation, so the Leaderboard, the Dashboard's top 10, the player list and the profile always agree.

---

## Analytics in Your Pocket

On the shared Analytics page, club members mostly open Analytics on their phones, so it now has a proper phone layout. The controls stack, the Dashboard tiles go two to a row, and tables leave out the columns that don't fit. The Leaderboard scrolls sideways with each player's rank and name kept in view. The header, the footer and the Club and Points settings fit a phone too.

The rest of the app stays a desktop app, made for the computer at the oche.

---

## Fixes

- **The tournament list on Setup could show old data** when it was refreshed twice in quick succession. Only the latest refresh is shown now.
- **Reloading the Registration page during a tournament** showed the page as it looks before the draw. It now shows the running tournament.
- **"Player arrived late?"** pointed to the version number in the bracket's corner, which went in v5.1.10. It now points to the Console link in the bracket header.
- **The Analytics player list** stopped at 25 players: its page buttons were hidden. They're back.
- **The Lens** only took effect once the Register had been opened. It works from the start now.
- **Points with a missing point value** showed as "NaN". A missing value now counts as 0.

---

## Under the Hood

About **1,800 lines** of old page styles are gone, replaced by a small set of shared parts: one table style, one match-number tag and one match view, used wherever they appear. That included a narrow-screen rule that changed the layout of every page on small windows.

The progression rules, the match history and undo are untouched.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings.

This release moves `:latest` forward to v5.2.0. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.2.0 — New Flights, Same Arrows.*
