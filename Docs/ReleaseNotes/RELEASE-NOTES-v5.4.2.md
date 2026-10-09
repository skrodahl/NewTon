# Release Notes — v5.4.2 — All the Dishes Rattle in the Cupboards

**NewTon DC Tournament Manager v5.4.2 — October 9, 2026**

---

## Overview

Single elimination gets a classic from the darts club: **Cup and Plate**. Lose in round 1 and your night isn't over: you play on in the Plate, a second knockout for the round 1 losers. Everyone plays at least two matches.

It follows Round Robin and qualifiers, and it is built the same way: on the three foundations (the progression rules, the match history and undo), adding to them without changing them. Single elimination without a Plate runs exactly as before.

---

## Cup and Plate

### How it works

- **The Cup** is your single elimination bracket, as always.
- **The Plate** is a second single elimination, half the Cup's size, with its own bronze final. Every round 1 loser goes into it at a fixed place: the losers of round 1 match 1 and 2 meet in the Plate's first match, 3 and 4 in its second, and so on.
- **Lose in round 2 or later** and you're out, as in any single elimination. The Plate is for round 1 losers only.
- **No waiting:** a Plate match is ready as soon as its two round 1 matches are played.
- **Byes:** a player with a bye in round 1 isn't in the Plate; their place there is a walkover.
- **Match lengths and bronze finals** are single elimination's, by the Plate's own rounds.

### At the draw

A **Play a Plate** switch on the single elimination card in Shuffle & Draw, from 5 players. It always starts off, so you decide on the night. A club that never plays a Plate can turn off **Offer Play a Plate** in Global Settings, and the switch isn't shown at all.

### In the bracket

The Cup and the Plate are drawn **back to back**: the Cup runs left to right, the Plate mirrors it from the right, and the two finals face each other in the middle, with nothing joining them. There is no grand final: the Plate can't win the night. The whole tournament fits on one page, qualifiers included.

### Placings

The Cup's places are as always, and 1st and 2nd always come from the Cup's final. The Plate orders the round 1 losers in the shared places: with 8 players the Plate's finalists are 5th–6th and its bronze pair 7th–8th; with 16, its semifinalists are 9th–12th. The tournament ends when both the Cup and the Plate are done, and the finished view names the **Plate winner**.

Plate matches count fully: their 180s, high outs, short legs and tons, matches and legs. Analytics names the night **Cup & Plate**.

---

## Reset, Only Before the End

- **A completed tournament can't be reset.** Its results are final, so the Reset link isn't shown once a tournament is completed. To correct a result after the end, use Developer Console → Toggle Read-Only, then undo the match.
- **Resetting an unfinished tournament starts Analytics clean too.** Analytics keeps a hidden record of the matches as they are played; a reset now clears it, so a new draw never carries results from the old one.

---

## Smaller Things

- **The landing page** has a new section, **Pick Your Format**, with a card for each format, laid out to take more formats as they arrive. The Chalker's card is now **Chalk. Send. Done.**: results come back by QR code or over your own network.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. The Plate and the new setting are stored in new fields; tournaments and settings without them work exactly as before. The export format is unchanged. A tournament with a Plate needs v5.4.2 or later to open.

This release moves `:latest` forward to v5.4.2. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.4.2 — All the Dishes Rattle in the Cupboards.*
