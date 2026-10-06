# Release Notes — v5.3.1 — Sowing the Seeds of Love

**NewTon DC Tournament Manager v5.3.1 — October 6, 2026**

---

## Overview

v5.3.0 made the night easier to run. This release makes the draw fairer.

Shuffle & Draw can now **seed** the draw: the best players, by the ranking of your earlier tournaments, are kept apart, so the strongest don't knock each other out in round 1. Everyone else is still drawn at random, and it is off until you turn it on. The Remote backup key now locks once it has been verified, so nobody changes it by accident. And an Analytics instance no longer shows a clock, and has working Help buttons.

The progression rules, the match history and undo are untouched.

---

## A Seeded Draw

A new **Seeding** panel in Match Controls, before the draw, ranks your players and seeds the best of them.

- **Seed 1 and 2** go at the top and the bottom of the bracket, the next seeds in the other quarters, and so on. Seeds never meet in round 1.
- **The panel says exactly who is seeded:** how many of the players, what share of the bracket that is, the seeds with their points, who has no ranking, and how many byes there are.
- **The best seeds get the byes.** Players with no ranking, such as a new player, are never seeded, and only get a bye if there are more byes than seeds.
- **Nothing changes until you turn it on.** Global Settings → Tournaments → **Seeding** has **Off** (the draw is always random), **Available** (Shuffle & Draw offers it, and you tick it) and **On** (it is ticked to start with). The default is Off.
- **The draw is remembered.** The tournament keeps who was seeded, from what ranking, so it can be explained afterwards. It travels in exports like the rest of the tournament.

---

## Who the Seeds Are

The ranking is the Leaderboard's points over earlier tournaments **with the same name**, from the tournaments in this browser. The panel is a small version of the Lens:

- **The name is read from the tournament you're drawing.** Numbers, dates and words like "week", "uke" and "Final" are dropped, and the longest word left is the cup. "Måndagscup", "Måndagscup week 43", "NewTon Måndagscup" and "Måndagscup Final" are all the same cup. The word is in a field you can change.
- **A Final is ranked on the season's cups.** Tournaments with "Final" in the name never count in the ranking.
- **The period is the current half-year,** or the previous one while the current has no tournament of the cup yet: the first match of a season. You can pick the other half-year, or all time.
- **The tournaments are ticked for you,** newest first, and you can tick or untick any of them. If the name matches nothing, tick the ones to rank on by hand, and you can still seed.
- **Nothing to rank on, no seeding.** With no earlier tournaments in this browser, or none ticked, the draw is random, and the panel says so. To seed from the club's history, draw on the computer that holds it, or restore a backup there first.

---

## How Many Are Seeded

The number follows the bracket size, set under **Seeded players** in Global Settings, and changeable for each draw: **1/8**, **1/4** or **1/2** of the bracket, or **All**.

| | 1/8 | 1/4 | 1/2 | All |
|---|---|---|---|---|
| 8-player bracket | none | 2 players | 4 players | all ranked |
| 16-player bracket | 2 players | 4 players | 8 players | all ranked |
| 32-player bracket | 4 players | 8 players | 16 players | all ranked |

The bracket is the next size up from the number of players: 13 players play in a 16-player bracket. The default is 1/4.

- **1/2** puts a seed in every round 1 match, and the rest are drawn at random as their opponents.
- **All** is the full seeded draw: the top seed meets the bottom seed in round 1, the second seed the second-last, and so on. With fewer players than places, the byes fall to the top seeds. Players with no ranking take the places that are left over, at random.
- Fewer than two seeds means no seeding.

---

## A Locked Backup Key

Global Settings → Server & backup → Remote backup. Once **Test connection** finds that the server accepts your API key, the **address and the key are locked**, with a note saying so. They can't be changed by accident.

- **Change…** asks first, then clears the key and unlocks both. Test the new key to lock them again.
- Until a key has been verified, the fields stay editable. A failed test, say because the server is down, never locks or unlocks anything.
- The lock takes effect with **Save changes** like any other setting, and **Discard** puts it back.

---

## Smaller Things

- **Help works on an Analytics instance:** the Help buttons in Analytics and Custom Settings do nothing in v5.3.0. They open the help now, and F1 works too. The first-run welcome guide is for the Tournament Manager, so it still isn't shown there.
- **No clock on an Analytics instance:** nobody runs a tournament there, so the clock in the top right is gone, on the Analytics page and on the bracket page.
- **The bracket header holds its shape on an Analytics instance:** the status line no longer runs into the buttons that aren't shown there.
- **The Finishes chart fits its frame:** shown full screen, the top band climbed over the player chips and the bottom one ran over the month labels. The six bands now share the chart equally.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings.

- **Seeding:** off until you turn it on in Global Settings. The new settings are optional, so older settings read as before. A tournament drawn with seeding carries a new `seeding` record; older versions ignore it.
- **Remote backup:** a new optional flag remembers that the key was verified. It is left out of exported tournament files, like the key itself. A key you have already saved is not locked until you run Test connection and save.
- **Docker:** no change to the image's server side.

This release moves `:latest` forward to v5.3.1. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.3.1 — Sowing the Seeds of Love.*
