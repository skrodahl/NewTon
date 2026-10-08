# Qualifiers above 32 players

Design note, 2026-10-08. **Built 2026-10-09** (unreleased; CHANGELOG.md has the details). Mockup: `Docs/mockups/qualifiers.html` (Option A). Decisions are
the maintainer's (Docs/PARKING-LOT.md → More formats, after Round Robin); the last three are under Settled.

## What it is

**Both formats, always:** everything here applies to single elimination exactly as to double
elimination (maintainer, 2026-10-08). Test both, and both finals positions.

Double elimination and single elimination take 33 to 48 players. The bracket stays a 32-player
bracket; the players above 32 make it in through **qualifiers**, a round 0 before round 1.

- N players, Q = N − 32 qualifier matches, 2Q players in them, 32 − Q straight into round 1.
  33 players: 1 qualifier; 40: 8; 48: 16 (every round 1 match has one qualifier winner and one
  player who went straight in).
- **Cap 48.** 64 stays a possible future option: there nobody goes straight in, so the qualifiers
  would be an uncounted round 1 of a 64-player bracket. The cap also keeps it to at most one
  qualifier per round 1 match, which keeps the draw and the bracket view simple.
- **A round 0 in the bracket**, drawn at once: the qualifiers' places in round 1 show "Winner of
  Q3" until the qualifier is played, and everyone sees their path straight away. A round 1 match
  can start as soon as its own qualifier is done. (Two steps, qualifiers first and then the draw,
  was considered and not built; the qualifier core below is kept apart from the round 0 rendering
  so it could be added as a setting if anyone asks.)
- **Qualifiers are the mirror of byes.** Below 32 there are byes in round 1; above 32 there are
  none, and the qualifier winners take exactly the places the byes would have had.

## A qualifier only decides who gets to play

- **Lose it and you're not qualified:** placed **shared 33rd** (the 33–48 tier, as double
  elimination's shared places), marked as not qualified in the record (`notQualified`), not
  inferred from the number. No placement points (33rd is below every paid place); seeding ranks
  them last.
- **Taking part:** a new Points setting next to Taking part, *Players who don't qualify get Taking
  part*, **on by default** (`config.points.nonQualifiedParticipation`; absent = on). Custom point
  mode in Analytics applies it to old tournaments too, which is why the record marks them.
- **Nothing in a qualifier counts, for the winner either:** no achievements (180s, tons, high outs,
  short legs, lollipops) and no matches or legs won or lost. A qualifier winner's numbers start in
  round 1, the same as everyone else's.
- **Analytics:** the tournament result goes to the register (so a non-qualified player counts as
  attending and shows in their history, at 33rd); the qualifier match itself never does.

## The draw

`generateCleanBracket()` / `confirmBracketGeneration()`, DE and SE, 33–48 paid players:

1. **Who plays a qualifier:** 2Q players chosen at random from the players who aren't seeded
   (`Seeding.forDraw()` decides the seeds as today, for a 32-player bracket). With seeds at 1/2,
   48 players leaves exactly 32 unseeded for 32 qualifier places. With seeding All, the lowest-ranked play them instead (Settled, 2).
2. **The bracket:** `createOptimizedBracketV2(straightIn, 32, seeding)`, unchanged. Drawing the
   32 − Q straight-in players into 32 places leaves Q gaps, which the existing code spreads one
   per round 1 match, opposite the best seeds first (a seed meets a qualifier winner, as byes go
   to the seeds below 32). The gaps come back as walkover players; each is replaced with a TBD
   placeholder for "Winner of Qn". No new layout code.
3. **The qualifiers:** the 2Q players paired at random into Q1…Qn, numbered by the round 1 place
   they feed, top of the bracket first (Q1 feeds the topmost gap).
4. **Recorded** on the tournament (additive): `qualifiers: { slots: { Q1: ['FS-1-3', 'player2'], … } }`,
   and the Q matches in `matches` like any other (`id: 'Q1'`, `side: 'qualifier'`, `round: 0`,
   `legs` from the format's regular rounds length). `tournament.bracketSize` stays 32; `tournament.bracket` is
   the 32 places, placeholders included, so every "has the draw happened?" check works.

The DE and SE progression tables for 32 are untouched. A tournament without `qualifiers` is
exactly what it is today.

## The three foundations (additions only)

- **Progression:** `getProgressionTable()` returns the 32-player table with the qualifier entries
  merged in front: `{ Q1: { winner: ['FS-1-3', 'player2'] }, … }`, built from
  `tournament.qualifiers.slots` (as `cupsProgressionTable()` is built from `tournament.cups`). No
  loser entry: a qualifier loser goes nowhere, in double elimination too (no backside).
  `advancePlayer()` then moves a qualifier winner into round 1 with no change, and the bracket
  view's "Winner of Q3" comes from the same table.
- **Transactions:** a qualifier result is an ordinary `COMPLETE_MATCH` transaction. Nothing new.
- **Undo:** `getUndoBlockingMatches()` and `undoManualTransaction()` follow the progression table,
  so with the merged table a qualifier can be undone while its round 1 match hasn't started or been
  played, and undoing it puts "Winner of Qn" back; undoing a round 1 match never touches its
  qualifier. Nothing new.
- **Walkovers:** round 1 has none above 32. A placeholder is a TBD player, which
  `shouldAutoAdvance()` already never auto-advances.

## What changes where

- **`completeMatch()`:** for a `side: 'qualifier'` match, skip the register (`NewtonDB.saveMatch`),
  as AUTO walkovers are skipped; no achievements in the transaction.
- **Winner dialog:** score only, no achievement entry; the line under it says the winner goes into
  FS-1-3 and the loser is not qualified.
- **Chalker (QR and network):** a qualifier can be scored on the Chalker; on accepting the result
  only **Score only** is offered (no achievements, no raw legs).
- **Placings:** `calculateAllRankings()` places every completed qualifier's loser at 33 and lists
  them in `tournament.notQualified`, for DE and SE, before the format's own ranking (SE skips
  players already placed). `formatRanking()` learns "33rd".
- **Points:** `calculatePoints()` (the one place the formula lives) gets whether the player is not
  qualified; Taking part follows the new setting. Callers: `calculatePlayerPoints()` and Analytics
  (`newton-history.js`), which reads `notQualified` from the tournament record.
- **Register:** `finalizeTournament` stores `notQualified` beside `placements` in the tournament
  meta. Player stats (`p.stats`) never get qualifier achievements, since qualifiers never add any.
- **Statistics in the tournament** (Registration's Leaderboard, exports): matches and legs won or
  lost skip `side: 'qualifier'` matches.
- **Limits:** the 32-player checks (`generateCleanBracket()`, `calculateBracketSize()`,
  `TOURNAMENT_FORMATS.maxPlayers`, Registration's "Too many paid players") become 48 for DE and
  SE; Shuffle & Draw says "32-player bracket, 8 qualifiers".
- **Save, export, the three loaders:** carry `qualifiers` and `notQualified` (as `seeding`,
  `groups` and `cups` are carried in `tournament-management.js` and `main.js`).
- **Bracket view:** `structure()` learns `Q` ids; after the format's layout, one contained step
  places each qualifier card one column outward from its round 1 match (left of a left-facing
  round 1, right of a right-facing one, as with the finals in the middle), level with the slot it
  feeds, and the line is drawn from the merged table like any other. A "Qualifiers" column label.
  With one qualifier per round 1 match, the column never needs more room than round 1.
  **Double elimination with qualifiers is always drawn with the finals in the middle** (built
  2026-10-09): with the finals on the right the backside sits straight beside round 1, where the
  qualifiers go. The Finals toggle shows Middle, with Right disabled and a tooltip saying why (the
  cups have the same rule).
- **Match Controls:** qualifiers are ready from the start and go first in Next up (each one
  unblocks a round 1 match); the header and the status band count them. Qualifier losers show in the referee list's losers (Settled, 3).
- **Help, user guide, `llms.txt`:** the format pages and Global Settings.

## Everywhere the pages say 32 (maintainer, 2026-10-08)

Every place that tells people "up to 32 players" for double or single elimination must say 48
when this ships. Found 2026-10-08 (search again before release, the list may have grown):

- `landing.html`, `landing-page.php` (keep the two identical): the keywords meta ("32 player
  tournament") and the structured data's feature list ("4-32 Players").
- `tournament.html`: the description meta ("brackets for 4-32 players").
- `userguide.html`: Player count for double elimination and for single elimination ("4 to 32 players").
- `js/dynamic-help-system.js`: the formats list ("4, 8, 16, or 32 players", "8, 16, or 32 players")
  and the bracket sizes ("17-32 players → 32-player bracket": add 33–48 → 32-player bracket with
  qualifiers).
- `README.md`: "facilitates tournaments for 4-32 players".
- `llms.txt`: the DE and SE lines ("4–32 players"), and take "more than 32 players or qualifiers"
  off the do-not-invent list.
- The release notes and the release page for the version that ships it.

Not changed: Round Robin's groups and cups stays 6 to 32 (its own limit, not part of this), and
the Seeding table's "32-player bracket" row stays right (the bracket is still 32).

## Data: additive fields only

| Field | Where | Meaning |
|---|---|---|
| `qualifiers` | tournament | `{ slots: { Q1: [roundOneMatchId, slot], … } }`. Absent = no qualifiers (32 or fewer). |
| `notQualified` | tournament, register meta | Ids of players who lost a qualifier. Absent = none. |
| `side: 'qualifier'`, `round: 0` | match | A qualifier match (`id` `Q1`…`Q16`). |
| `nonQualifiedParticipation` | config.points | Taking part for players who don't qualify. Absent = on. |

## Settled (maintainer, 2026-10-08)

1. **Qualifier match length:** the format's **regular rounds** length (DE: Regular rounds; SE:
   Regular rounds). No new setting; the `qualifiers` row in the data table is dropped.
2. **Who plays a qualifier:** with seeding **All**, the lowest-ranked players play the qualifiers
   (the unranked first, then from the bottom of the ranking up). Otherwise (no seeding, or seeds at
   1/8, 1/4, 1/2) the seeds are exempt and the qualifier players are drawn at random.
3. **Referees:** Match Controls' referee list shows the losers; qualifier losers show there too,
   so the operator sees they are free for referee duty. The list (`getRefereeSuggestions()` in
   `bracket-rendering.js`) already takes the losers of every completed match, so this mostly comes
   for free; `getRoundDescription()` needs a name for `Q` ids ("Qualifier").

Round Robin keeps its own limits (groups and cups 6 to 32, no qualifiers): above 32 it would be
more groups, not qualifiers, and isn't planned.
