# Release Notes — v5.4.3 — Swiss Precision

**NewTon DC Tournament Manager v5.4.3 — October 10, 2026**

---

## Overview

A new tournament format, **Swiss**: a fixed number of rounds, nobody knocked out, every round pairing players with the same record. And a new way to start a night: the draw is rebuilt around **picking a format**, with a card for each one that tells you what it means for tonight's players before you draw.

Round Robin gets a **double round robin** for small groups, and the lanes in Match Controls stop moving about.

---

## Pick a Format

Before the draw, Match Controls now shows a card for every format, each with a small pictogram of its shape:

- **What it means tonight:** "16-player bracket · 4 byes", "Cup of 16 · Plate of 8", "3 groups of 4", "4 rounds, then the top 4".
- **Pick one** and it opens below: how it works, the player range, **roughly how many matches tonight** and how many each player gets, and its options. One **Draw** button draws it.
- **It opens on the format of your last tournament**, the club's habit.
- **Options at the draw:** Round Robin's structure and how players reach the A cup, Swiss's rounds and finish, for that night only. Global Settings decide how they start.
- **Formats you don't offer** stay on the screen, greyed out, so you can see what exists. One that doesn't fit tonight's field can still be picked and says why.
- **Cup and Plate** is now a format of its own, on its own card and in Formats to offer.
- **Settings for this tournament** show the picked format's match lengths.

---

## Swiss

- **A fixed number of rounds,** and nobody is knocked out: by players (4 rounds for 9–16, 5 for 17–32) or a number you choose.
- **Every round pairs players with the same record who haven't met:** the table in order, 1st against 2nd, 3rd against 4th, never a rematch when there's another way. Round 1 is random, or with seeding the top half against the bottom half.
- **Odd numbers:** one player sits out each round, never the same player twice, and the bye counts as a win.
- **The table:** wins, then opponents' wins (beating strong players counts for more), then leg difference, then legs won.
- **The finish:** the top four play semifinals (1st against 4th, 2nd against 3rd), a bronze final and a final. Or the table decides.
- **Rounds draw themselves:** when the last result of a round is entered, the next round appears. A wrong result in the round just finished can be undone, taking the next round back with it, as long as nothing in it has started.
- **On the bracket page,** each round is a column of its matches, then the top four. Select a match and both players' matches across the rounds light up.
- **In Match Controls,** the table sits beside the queue, with the top four marked.
- Swiss has its own match lengths and its own panel in Global Settings.

---

## Round Robin

- **Play each other: Twice.** One group can now be a double round robin: when everybody has played everybody once, the return round follows in the same order with the players swapped. Both meetings count in the table.
- **Fewer, fuller groups:** with Top half, the draw makes as few groups as fit. 12 players are now 3 groups of 4 (3 group matches each) instead of 4 groups of 3 (2 each), with the same cups.

---

## Smaller Things

- **The lanes stay put:** Match Controls' row of lanes lists every lane in its place, the busy ones dimmed, so a lane never moves under the pointer.
- **The landing page** shows the new draw, and Swiss joins Pick Your Format.
- **Behind the scenes,** the Docker images are built with current GitHub Actions.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. Swiss, the double round robin and the new settings are stored in new fields; tournaments and settings without them work exactly as before. The Offer Play a Plate setting from v5.4.2 is now Cup and Plate in Formats to offer: a setup that had it off keeps Cup and Plate not offered. The export format is unchanged. A Swiss tournament needs v5.4.3 or later to open.

This release moves `:latest` forward to v5.4.3. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.4.3 — Swiss Precision.*
