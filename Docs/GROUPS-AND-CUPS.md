# Round Robin (Groups and Cups) — Design Note

**Status:** Design note, written 2026-10-08; built on the `groups-and-cups` branch the same night, for review (not merged). Decisions taken while building are listed in Docs/PARKING-LOT.md → Other tournament formats.
**Mockup:** `Docs/mockups/group-night.html` (reviewed 2026-10-08, decisions in its last box)

A tournament format for the weekly nights and the December season final: round-robin groups,
then an A cup (the top two of each group) and a B cup (the rest), both single elimination with the
final in the middle. This note says how it fits the three core foundations (the progression
tables, the transaction history, undo) **as additions**: nothing existing changes meaning, double
and single elimination run exactly as before.

---

## Round Robin in Global Settings (review note 9, built 2026-10-08)

The format is offered as **Round Robin** (internal id still `GROUPS`), with its own panel under
Tournaments while it is offered (`config.roundRobin`, additive):
- **Structure:** `groups` — groups and cups, as below (6–32 players); `single` — one group,
  everybody plays everybody, the table decides the placings (3–8 players). The one group's order is
  `roundRobinSchedule(n)` (circle method, referee from the group: never twice in a row, fewest duties,
  the player sitting a round out asked first); groups of up to four keep `GROUP_SCHEDULES`, and groups
  of five or six (Largest group) use the same circle method.
- **To the A cup:** `top2` — the top two of each group, the rest to the B cup; `half` (the default
  since 2026-10-08) — everyone
  ranked across the groups (group place first, then results per match) and split into two cups of the
  same size (A one larger when odd), so a small field doesn't leave a tiny B cup (review note 2).
  Top half only applies with a B cup (maintainer, 2026-10-09): without one, the A cup takes the
  top two of each group whatever the setting (`cupFields(playB)`; with 12 players in 4 groups of 3,
  Top half without a B cup would have made an A cup of 6 with 2 byes, Top two makes a full 8).
- **Group rematches in cup round 1:** `allow` — the mirror draw as it falls; `avoid` —
  `Groups.avoidRematches()` reorders the field so each seed meets the nearest opponent (by seed) from
  another group, the best seeds first, as close to the mirror as possible; when no such pairing
  exists, the mirror stands.
- **Play the B cup:** whether the Draw the cups switch starts on.
- **Largest group** (`maxGroup`, added after v5.4.0): 4 (the default), 5 or 6. The draw makes the
  smallest even number of groups that keeps each group at that size or less, so a larger limit means
  fewer, longer groups: 10 players are 3, 3, 2, 2 at 4 and 5, 5 at 5 or 6; 20 are 5, 5, 5, 5 at 5.
  The cup fields take every group place (`cupFields()`): with top two, the B cup has the thirds, the
  fourths, the fifths and the sixths. At 6, top two with 25 or more players can make a B cup of more
  than 16, drawn in the 32-player single elimination table (30 players: 6 groups of 5, A cup 12, B cup 18).

Each tournament keeps the structure, cup entry, rematches and largest group it was drawn with
(`tournament.groups.settings`); absent means groups and cups, top two, allow, 4.

**Match length** (Global Settings → Match length → Groups and cups): group matches, and the cups'
own lengths, added after v5.4.0: cup rounds (every round before the semifinals), cup semifinal, cup
bronze final, cup final (`config.legs.cupRounds|cupSemifinal|cupBronze|cupFinal`, defaults 3, 3, 5, 5
as single elimination's). The A and B cups share them, and they are taken when the cups are drawn.
Before they existed the cups used the single elimination lengths, so a config saved without them
keeps those (`loadConfiguration()`: cup rounds from the SE quarterfinal, the rest from the SE
semifinal, bronze final and final).

## The rules (settled with the maintainer, 2026-10-07/08)

**Groups**
- An even number of groups, at most four players in each (or five or six, Largest group): the
  smallest even number of groups that holds everyone (at four: 15–16 players: 4 groups; 17–24: 6;
  25–32: 8). Fewer in a group is fine.
- Players go into the groups in snake order: by ranking when seeding is on and there is a
  ranking (Seeding, js/seeding.js), at random otherwise. The order a player went in is their seed in
  the group (1–4).
- Everybody plays everybody in their group, in a fixed order with a fixed referee from the group:
  - Group of 4: 1v4 (ref 2), 2v3 (ref 4), 2v4 (ref 1), 1v3 (ref 2), 3v4 (ref 1), 1v2 (ref 3).
    Duties 2/2/1/1, nobody referees twice in a row, two back-to-back plays (the minimum).
  - Group of 3: 2v3 (ref 1), 1v3 (ref 2), 1v2 (ref 3): each referees once.
  - Group of 2: one match, no referee planned.
- Group matches are best of 3 (new setting, Global Settings → Match length, default 3).
- The table: wins, then leg difference, then legs won, then head-to-head (a mini-table between the
  players still level, which settles three-way ties too), then the operator decides (the draw
  step shows who is level and lets the operator swap them; untouched, the group seed decides).
  Players are marked level only once their group has played every match; then two players can't
  be (their match decides), only a three-way cycle with identical legs. With one group the
  tournament completes on the last match, so the group seed decides such a tie.
- All groups must be finished before the cups are drawn.

**Cups**
- The top two of each group go to the A cup, the rest to the B cup. A switch on the draw step
  plays without the B cup (on by default). The B cup needs at least two players.
- Each cup is drawn seeded "All": group winners are seeds 1…g, runners-up g+1…2g (the B cup: the
  thirds, then the fourths), ranked across groups per match — win rate, then leg difference per
  match, then legs won per match. Top seed meets bottom seed; the best seeds get any byes (the
  existing `placeSeededPlayers(..., all = true)`). Group rematches in round 1 are allowed (the
  logical consequence of the seeds; maybe a setting later).
- A cup is the existing single elimination with bronze, unchanged: 4, 8 or 16 players. Its match
  lengths are the single-elimination settings (rounds/quarterfinals Bo3, semifinals Bo3, bronze
  and final Bo5 by default).
- Cups are always drawn with the final in the middle, whatever the Finals position setting says
  (two cups have to fit the page).

**Placings** (for points; everyone gets participation) — revised after review 2026-10-08: everyone is placed
- In order: the A cup's final pair (1st, 2nd) and bronze pair (3rd, 4th); with a B cup, its final
  pair and bronze pair; then the A cup's other losers, the latest round first; then the B cup's; each
  round ordered by group performance; then anyone who played no cup.
- Places run on through that order as shared places, as in the brackets (5th–6th, 7th–8th,
  9th–12th, 13th–16th …). A full B cup takes 5th–8th, so the A cup's quarterfinal losers are 9th–12th
  (participation points only, as intended); a B cup too small to fill 7th–8th leaves those places to
  the best A cup quarterfinal losers; without a B cup they take 5th–8th.
- Each block is placed once decided (a round when all its matches are played). The tournament is
  complete when the last cup final is played.

**Referees and boards**
- Boards are always the operator's choice.
- Referees are planned, shown, and filled in when a match starts if the planned referee is free;
  always editable (Match Controls' usual referee control and conflict checks).
- In this format a referee is only taken while their match is live; one chosen for a match that
  hasn't started is a plan and blocks no one (review note 1). Instead a ready match **waits** (Match
  Controls says why) while one of its players is the referee of an earlier ready match in the same
  group or cup, or while its planned referee isn't known yet ("the loser of A-QF1"). Choosing another
  referee for either match lets it start. Plans never point at a match that will be a walkover.
- Cups, round 1: bye winners referee first, then players from the bottom of round 1 (the last
  match's players first), for the top half of the round; the bottom half is refereed by the losers
  of the top half, in order (8 players, no byes: QF1 and QF2 by QF4's players, QF3 by QF1's loser,
  QF4 by QF2's loser — as in the mockup). Later rounds: the loser of a match from the round before,
  counted from the bottom; the bronze final by the loser of the first match two rounds back; the
  final by the bronze final's loser.

---

## Data: additive fields only

Absent fields mean what they always meant, so every stored and exported tournament still reads.

| Field | Where | Meaning |
|---|---|---|
| `format: 'GROUPS'` | tournament | The new format. Absent = DE, as before. |
| `groups` | tournament | The group draw: `{ list: [{ name: 'A', players: [id, …] }], order: { A: [id, …] } }` (players in seed order; `order` = operator's tie decisions, optional). |
| `cups` | tournament | The cup draw, absent until drawn: `{ bCup: bool, A: { size, seeds: [id…] }, B: {…} \| null }`. |
| `groupMatches` | config.legs | Best of for group matches (default 3). |
| `cupRounds`, `cupSemifinal`, `cupBronze`, `cupFinal` | config.legs | Best of for the cups (defaults 3, 3, 5, 5); absent in a saved config = the single elimination lengths. |
| `maxGroup` | config.roundRobin, tournament.groups.settings | The largest group, 4, 5 or 6. Absent = 4. |
| `side: 'group' \| 'cup'`, `group`, `cup`, `seId`, `plannedReferee` | match | Group/cup bookkeeping. `seId` is the cup match's single-elimination ID (FS-2-1…), `plannedReferee` is `{player: id}`, `{loserOf: matchId}` or absent. |

`tournament.bracket` holds the group draw (the players in draw order), so every existing "has the
draw happened?" check (`tournament.bracket && matches.length`) keeps working; `bracketSize` is the
number of players drawn.

Match IDs are readable and are what the operator sees everywhere (Match Controls, history, the
Chalker, Analytics): group matches `A-1` … `H-6`; cup matches `A-QF1`, `A-SF2`, `A-B` (bronze),
`A-F` (final), and `A-R1-3` for a 16-player cup's first round; B cup the same with `B-`. A group ID
is a letter and a number, a cup ID a letter and a round name, so the two never collide.

---

## The three foundations

### 1. Progression tables (clean-match-progression.js)

- **Groups:** a new hardcoded table per group size (`GROUP_SCHEDULES`), beside the DE and SE
  tables: the fixed order and the referee. Group matches don't progress anyone, so they are not
  in the progression table: `advancePlayer()` already treats a missing rule as "no progression".
- **Cups:** the existing `SE_MATCH_PROGRESSION[size]`, unchanged, with each ID renamed to the
  cup's ID (`FS-2-1` → `A-SF1`). The renaming is a pure function of the hardcoded table, so the SE
  table stays the single source of truth for cup progression.
- `getProgressionTable()` gets one branch: for `GROUPS` it returns the two cups' renamed tables
  joined (empty before the cup draw). Every user of it — advancing players, the winner dialog,
  undo blockers, the consequences list, the bracket view — then works unchanged.
- Completion: in this format the tournament ends when every drawn cup's final is complete (a cup's
  bronze and final both have `{}`, so the existing "empty rule = tournament final" test is skipped
  for this format). The final waits for its bronze final, as in single elimination.

### 2. Transaction history

- Group and cup matches are completed, started, laned and refereed through the existing functions,
  so they write the existing `COMPLETE_MATCH`, `START_MATCH`, `ASSIGN_LANE`, `ASSIGN_REFEREE`
  transactions.
- **New transaction: `DRAW_CUPS`** — recorded when the operator presses Draw the cups. It carries
  the cup record (who went into which cup, as which seed). The cups' round-1 walkovers that follow
  are ordinary `AUTO` completions.
- The group draw happens at Shuffle & Draw like any bracket (no transaction, as today).

### 3. Undo

- **Group matches** undo exactly as today (no progression, so nothing downstream) — **until the cups
  are drawn; then they are locked** (`isMatchUndoable()` says no, the status says why).
- **Cup matches** undo exactly as single elimination does (hard block, no cascading).
- **The cup draw is undoable** while no cup match has a result entered by hand or by the Chalker and
  none is live. Undoing it removes the cup matches and their transactions (the round-1 walkovers),
  the `DRAW_CUPS` transaction and `tournament.cups`, and reopens the group stage. It is offered in
  Match Controls, behind a confirmation. The manual Draw the cups step is the first gate.

---

## Screens

- **Shuffle & Draw:** a third format card, *Groups and Cups* (in the formats registry, so it can
  be hidden in Global Settings like the others). The confirmation shows the number and sizes of
  the groups, and whether the draw is by ranking.
- **Bracket page:** a *Groups | Cups* switch in the header (instead of Finals position, which
  doesn't apply). Groups: one card per group with its table (top two marked for the A cup) and its
  match list with referee and state. Cups: the two cups, each drawn as single elimination with the
  final in the middle, A above B, with the usual lines, hover, selection, Follow and undo.
- **Match Controls, group stage:** the lanes board and ready queue as today, the queue grouped by
  group, each match with its planned referee; Next up prefers a match whose players and referee are
  free; the group tables on the right. When the last group match is done, the right column shows
  **Draw the cups**: both seeded fields, the B cup switch, any ties to decide, and the button.
- **Match Controls, cups:** A cup and B cup in two columns (as frontside and backside), Undo the cup
  draw while it is allowed.

---

## Out of scope for the first build

- Withdrawals in the middle of a group (no walkover handling in groups yet).
- A setting to avoid group rematches in cup round 1.
- Analytics views made for groups (results, placements and matches arrive as for any tournament;
  match IDs are readable as they are).
- Late registration (Developer Console) does not apply to this format.
