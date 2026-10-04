# Release Notes — v5.3.0 — A View to a Kill

**NewTon DC Tournament Manager v5.3.0 — October 4, 2026**

---

## Overview

v5.2.0 gave every page a new look. This release is about what you see while the night is running, and what you can see afterwards.

Match Controls has been rebuilt around the dartboards, and it no longer opens over the bracket: it shares the bracket page with it, one tab away. Players get a permanent place in a club-wide player database, so a renamed player keeps their history and duplicates can finally be merged. And Analytics can now draw a player's season as charts, and put several players side by side.

The progression rules, the match history and undo are untouched.

---

## Match Controls, Rebuilt

Match Controls is now laid out the way the room is: by dartboard.

- **Lanes:** one tile per match being played, in lane order. The two players are big **Wins** buttons, so finishing a match is one click on the winner. Each tile shows the match, how many legs it's played over, **how long it has been on the board**, the round, the lane and the referee (both can still be changed while the match is live), and the handover: **QR**, **Transfer**, or a pulsing green **Result ✓** when a Chalker has sent the result back.
- **Free lanes** fit on one line, together with the next match that's ready to go. Click a free lane and that match starts there.
- **Ready to start:** the matches that can start, by round, frontside and backside side by side, each with Lane, Referee and Start. A player who is refereeing another match is flagged on the row, and Start waits until that's sorted.
- **Referees:** live matches without a referee first, then suggestions: recent losers, recent winners, and who refereed lately. The list updates after every action.
- **Before the draw:** the players as chips you click to mark paid, a field to add a player, a short summary of the points, match lengths and lanes, and Shuffle & Draw.
- **When it's over:** the podium, with a plaque for the club, the tournament and the date, and the night's highlights: most 180s, highest checkout, shortest leg, most points, best three-dart average, the longest backside run, deciders, the busiest referee and lane, and more. Anything without data is left out.

Under the hood, about 1,100 lines of old Match Controls code and 620 lines of its styles are gone. On the way, the old finished view's "Most Achievement Points", which always said "None", got fixed.

---

## One Frame, Three Views

Match Controls used to open as a large dialog over the bracket. It now lives **in the same frame as the bracket**, and the header has tabs: **Bracket | Match Controls**. Switching back finds the bracket exactly where you left it, at the same zoom.

- On Match Controls, the bracket's own tools (Finals, Fit all, zoom) and the colour legend step aside. The clock and the status line stay.
- The **left and right arrow keys** switch between the two.
- Click a match in the bracket, then **Match Controls** in the bar that appears: you're taken to that match, and it flashes.
- **Scan QR results** is in the Lanes heading, while matches are being played.
- When a Chalker sends a result over the network, the count of results waiting sits on the Match Controls tab.

In Global Settings, "Open Match Controls with the bracket" is now **Start on Match Controls**, and it's on unless you've turned it off. The bracket page opens on Match Controls; turn it off to open on the bracket.

### The Developer Console moves in

With the Developer Console enabled in Global Settings, it's the third tab, **Console**, instead of a link and a dialog. It's redesigned too: the tournament's vital signs on the left, each with a coloured dot for its health, followed by the commands, grouped into **Inspect**, **Repair** and **Change**. On the right is the current view, with the console output underneath. Every command does exactly what it did before.

The arrow keys leave it out: they switch between Bracket and Match Controls only.

---

## A Player Database

Until now, a player was just a name. Rename someone and Analytics saw two people. Type a name slightly differently one night and the same thing happened, with no way to put them back together.

Player Registration now has a **Player database** tab. Every player gets a permanent ID, a **short name** (what the bracket, Match Controls, the Chalker and the Leaderboard show, unique in the club), and a first and last name.

- **Tonight:** search the database by short, first, last or previous name and add players with a click, most active players first. **+ New player** suggests a short name for you.
- **Edit** renames a player. The old short name is kept as a previous name, so older results still find them.
- **Merge…** joins two entries that are the same person. Two players who played in the same tournament are clearly two people, so Merge refuses them and says where they met.
- **Archive** hides a player from the pick list. Players who have been in Analytics can be archived but never deleted, so their history stays whole. Players who never played can be deleted.

**The first time you open this version**, your saved players and the names in your saved tournaments and Analytics become database players, and a notice says how many. Then it's worth a pass through the Player database tab to merge the duplicates. That's what it's for.

Analytics follows the ID: rename a player and their whole history follows the new name.

**The database travels with your tournaments.** Exports and uploads carry it, full names included, and a shared Analytics instance uses the newest copy it has received. If your Analytics instance is public, members will see full names there. Leave the first and last name empty if you'd rather they didn't.

---

## Player Charts

Analytics → Players → a player's profile now shows their last 10 finishes and six cards, each with a small trend line and a one-line verdict, such as "▲ 2 places in 10". Open a card for its chart:

- **Position:** where they stood in the standings after each tournament, with the top 16 shaded.
- **Points:** points each tournament, with a form line (the average of their last 5).
- **Finishes:** each tournament's result, from Winner down to 17th+.
- **Average:** three-dart average each tournament, with their worst and best match. Needs Chalker matches.
- **Matches:** won and lost each tournament.
- **Highlights:** 180s, high outs and short legs over time.

**+ Compare with** adds up to five more players, each in their own colour, and **The field** adds the median of everyone who played. **Full screen** puts the chart on the whole screen, where you can keep changing who you compare and on what. Ticking several players in the list compares them on the charts too.

Hover over a tournament, or tap it on a phone, for its figures. Everything follows the Lens and the Points controls.

---

## Analytics: As Played, or Custom

The points controls are two buttons. **As played**, the default, scores each tournament the way it was played: its own point values, placement and attendance points included. **Custom** lets you try today's point values instead, or leave placement or attendance points out. The button then says what's custom. "Ranking" points are now called **Placement points**.

### Opens on the current half-year

Analytics now starts every visit on the **current half-year**, or the previous one while the current one has no tournaments yet. Nothing about the Lens is remembered between visits any more, so a member can't be left looking at an old selection. **Show all** still shows every tournament.

---

## Smaller Things

- **Tournament Setup:** the New tournament form is one row at the top, where it can't be missed, and the current tournament runs full width under it. Tournaments and Match history now end at the same line.
- **Status at a glance:** the current tournament on Setup and the next step on Registration have a tinted band across the top: grey **New** (the bracket isn't drawn yet), orange **Active** (12 of 30 matches completed), green **Completed** (won by the winner). A tournament that hasn't been drawn is now called **New** everywhere, instead of "Setup".
- **Test connection:** Remote backup in Global Settings has a button that checks the address and API key before you rely on them. It tells you whether it connected, whether the key was accepted, or what went wrong.
- **No more pop-up hints:** the orange "Tournament created!", "Bracket generated!" and similar pop-ups are gone. The pages already show the same things, and help is still on F1.
- **No stray blue border:** a button you'd clicked could light up with a thin blue border as soon as you pressed a key. It doesn't any more.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings.

- **Player database:** created on the first start from your saved players and the names in your tournaments and Analytics. Tournament players gain a database ID alongside their own; nothing existing changes. Older versions read the new exports and ignore the database.
- **Analytics instance:** it picks up the player database with the next tournament uploaded to it. Until then it shows players as before, by name.
- **Analytics Lens:** the selection saved by older versions is cleared on the first visit, which now opens on the current half-year.
- **Docker:** the image adds `api/key-check.php` for Test connection. Older servers answer "older version" when tested.

This release moves `:latest` forward to v5.3.0. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.3.0 — A View to a Kill.*
