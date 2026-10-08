# Release Notes — v5.4.0 — Just Around the Corner

**NewTon DC Tournament Manager v5.4.0 — October 8, 2026**

---

## Overview

NewTon has a new tournament format: **Round Robin**. Everybody plays everybody, in groups followed by an A cup and a B cup, or in one group where the table decides.

It is the first format that isn't a knockout, and it didn't come out of nowhere. Much of the work in the last releases was done to make it possible:

- **The bracket remake** (v5.1.10) drew every format from its own layout, made from that format's progression tables.
- **The formats list** (v5.1.7) turned "double or single elimination" into a list that can grow, and that Global Settings can filter.
- **Seeding** (v5.3.1) decides who the best players are, separately from where they go. Round Robin uses the same ranking to deal the players into the groups.
- **Single elimination with the final in the middle**, in this release, is exactly how the cups are drawn.

Round Robin was built for the club's season final in December, and for the weekly nights, which may move from double elimination to groups: 15 to 32 players, five boards, started at seven.

The progression rules, the match history and undo are the same three foundations as before. Round Robin is built on them, adding to them without changing them, so double and single elimination run exactly as they did.

---

## Round Robin: Groups and Cups

### The groups

- **An even number of groups, at most four players in each:** 6–8 players make two groups, 9–16 make four, 17–24 six, 25–32 eight. A group of three is fine.
- **Players go in in snake order**, by ranking when seeding is ticked, at random otherwise.
- **Every group plays in a fixed order, with a planned referee from the group.** In a group of four, nobody referees twice in a row, and the top two seeds meet last.
- **Group matches have their own length**, best of 3 by default (Global Settings → Match length).

### The table

Wins, then leg difference, then legs won, then head-to-head between the players still level (which settles a three-way tie too). Players still level when their group has played every match are marked **level**, and you decide with **▲** in Match Controls' group tables. Untouched, the group seed decides.

### Draw the cups

When the last group match is played, Match Controls shows **Draw the cups**: both cups' players in seed order, a **Play the B cup** switch, and the button. Nothing is drawn until you press it.

- **Who goes to the A cup** is a setting: the **top half** across the groups (the default, so the two cups come out the same size), or the **top two of each group**.
- **Seeds:** group winners first, then runners-up and so on, ranked across the groups by results per match. Top seed meets bottom seed, and the best seeds get any byes.
- **Group rematches in round 1** are allowed by default. Set them to **Avoid**, and each seed meets the nearest opponent from another group instead.

### The cups

Each cup is single elimination with a bronze final, drawn with the final in the middle, the A cup above the B cup. Lines, hover, selection, Follow and undo work as in any bracket.

The cup draw can be undone until a cup match has been started, which reopens the groups. Once the cups are under way, the group results are locked.

### Everyone is placed

The A cup's final and bronze final give 1st to 4th, the B cup's give 5th to 8th. Every other player is placed too, on shared places as in the brackets (9th–12th, 13th–16th …): the A cup's other losers first, latest round first, then the B cup's, each round ordered by group results. If the B cup is too small to fill 7th–8th, those places go to the best A cup quarterfinal losers.

---

## Round Robin: One Group

For three to eight players: everybody plays everybody once, in a fixed order with a referee from the group, and the table decides the placings. Set it under **Structure** in the Round Robin settings.

---

## Running a Round Robin Night

Match Controls follows the stage of the night:

- **The group stage:** each group's next two matches in their fixed order, with the planned referee filled in, and the group tables beside them. Every group keeps its heading all night, so the groups stay where they are. A finished group says **All 3 played** in a lighter grey, and a group with a match on a board says so: **2 of 3 played · 1 live**.
- **Referees are a plan until the match starts.** A referee chosen for a match that hasn't started doesn't block anyone. The planned referee is filled in at Start, if free.
- **A match waits while it can't start.** If one of its players referees an earlier match first, or its referee is still to be decided ("the loser of A-QF1"), Match Controls says so and Start waits. Choose another referee and it can go.
- **Next up** only suggests matches that can start, preferring one whose referee is free.
- **The cups:** the A and B cups side by side.

On the bracket page, a **Groups | Cups** switch shows the group cards, with their tables and matches, or the two cups.

---

## Match Controls, for Every Format

- **The free lanes and Next up come first**, straight under the Lanes heading. They used to sit under the live matches and move down the page as matches started. Now they stay in the same place all night.
- **The header keeps up.** The counts at the top (players, live, ready) change as you add players, mark them paid, or start and finish matches in Match Controls.

---

## Single Elimination: Finals in the Middle

The **Finals Right | Middle** switch now works for single elimination too. In the middle, the two halves face each other and meet at the final in the centre, with the bronze final under it. It's the same tournament with the same rules, drawn differently. One setting covers both elimination formats (Global Settings → Bracket, or the bracket header).

---

## Global Settings

- **Round Robin has its own panel** under Tournaments while it's offered: Structure (groups and cups, or one group), To the A cup, Group rematches in cup round 1, and Play the B cup. Each tournament keeps the settings it was drawn with.
- **New defaults:** Round Robin with groups and cups, the top half to the A cup, rematches allowed and the B cup on; **Seeding: Available**, so Shuffle & Draw offers seeding without ticking it; **Chalker handover: None**. Settings you have already saved stay as they are.
- **Reset all config** (Developer Console) brings the settings back to their defaults and keeps the server connection: the server's address, its API key and this instance's server ID. Its preview lists only the settings that will change.

---

## Smaller Things

- **The bracket header is framed at both ends.** The tournament name and date have the same divider as the clock. The Finals, Fit all and zoom tools are centred on the same line as the buttons in the middle.
- **Undo removes the result from Analytics too.** A result undone since v5.1.6 and never played again may still be counted there. One that was played again was replaced, as always.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. Round Robin's data is stored in new fields, which double and single elimination tournaments simply don't have. The export format is unchanged. A Round Robin tournament needs v5.4.0 or later to open.

The new defaults only fill in settings that haven't been saved yet. A setup saved before the Chalker's Handover setting existed keeps QR code.

This release moves `:latest` forward to v5.4.0. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.4.0 — Just Around the Corner.*
