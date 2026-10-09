# Cup and Plate

Design note, 2026-10-09. **Built 2026-10-09** (unreleased; CHANGELOG.md has the details). Mockup: `Docs/mockups/cup-and-plate.html`. Decisions are the
maintainer's (Docs/PARKING-LOT.md → More formats, after Round Robin). No open points.

## What it is

Single elimination (the **Cup**) where the round 1 losers play a second single elimination, the
**Plate**. Everyone gets at least two matches. A classic at darts clubs.

- **Not a new format: a switch on single elimination.** The draw, the Cup, seeding, qualifiers and
  the finals positions stay exactly as they are; the Plate is added to them.
- **Play a Plate** is a switch on the single elimination card in Shuffle & Draw, decided at the
  draw (that's when you know how many turned up and how long the night is). It **always starts
  off**, so single elimination is unchanged unless asked for.
- **Offer Play a Plate** in Global Settings, **on by default**: turned off, the switch isn't shown
  at the draw at all, for a club that never plays a Plate (maintainer, 2026-10-09).
- **From 8-player brackets up** (5 or more players). In a 4-player bracket round 1 is already the
  semifinals, whose losers play the bronze final, so there is nothing for a Plate to add.

## Who plays the Plate

- **Every Cup round 1 loser, at a fixed place** in the Plate's first round, as round 1 losers drop
  to the backside in double elimination: the losers of Cup round 1 match 1 and 2 meet in Plate
  match 1, of 3 and 4 in Plate match 2, and so on. No second draw: a Plate match can start as soon
  as its two round 1 matches are played.
- **The Plate is half the bracket:** an 8-player bracket gives a Plate of 4 (semifinals), 16 a
  Plate of 8 (quarterfinals), 32 a Plate of 16.
- **Byes:** a player with a bye never loses in round 1, so their Plate place is a walkover, which
  advances automatically (as on the backside). If they lose their first real match in round 2,
  that is their night: the Plate is for round 1 losers only (the classic rule; it keeps the Plate
  starting early).
- **Qualifiers:** a qualifier loser is not qualified and never goes to the Plate.
- **Byes can meet in the Plate (known, kept; maintainer 2026-10-09).** Two byes in neighbouring round
  1 matches (the pair that feeds one Plate match) make that Plate match walkover against walkover;
  the walkover then loses a Plate semifinal without a match and drops into the Plate's bronze final,
  so two Plate players each lose a match. With a random draw and 12 players (4 byes in 8 matches)
  this happens in about 3 draws in 4 (54 of the 70 ways to place the byes); never with 16; at 9 and
  10 players there are more byes than pairs, so it can't always be avoided. Seeded draws spread the
  byes already (they go to the top seeds, in different quarters). Spreading the random byes over the
  pairs when Play a Plate is on was offered and declined: kept as the draw makes it.

## Placings and points

The Cup's places never change. Round 1 losers share the bottom places of the Cup's bracket, and
the Plate orders them **in the app's shared places**, as everywhere beyond 4th (built 2026-10-09;
the B cup in Round Robin does the same): a place within the Plate, after the Cup's K/2 places,
mapped to its tier (`Groups.placeTier()`).

- 8 players: the Plate's finalists 5th–6th, its bronze pair 7th–8th. The points are what exact
  places would have given (5th and 6th share one value, so do 7th and 8th).
- 16 players: the Plate's semifinalists 9th–12th, its quarterfinal losers 13th–16th.
- 32 players: the Plate's last eight 17th–24th, the rest 25th–32nd.
- The Plate's final and bronze final decide no placings; they are played for the Plate itself.
  The finished view names the **Plate winner** (and who they beat in the final), since the podium
  can't show it. Exact places (9th, 10th …) would need a second way of naming places just for
  the Plate.

## Bronze finals (decided: always played, no switch)

Single elimination keeps its bronze final as always, and the Plate always has one too (maintainer,
2026-10-09). Making them optional was considered and dropped:

- **It saves almost no time:** with several boards, the bronze final runs alongside the final.
- **It would change the points:** without one, 3rd and 4th share a place and would both get 3rd
  place's points, so a time saver would quietly become a points rule.
- **The Plate's bronze never affects points:** with 8 players it decides 7th against 8th, which
  share one points value; with 16 or more the Plate is below the points places. It only gives two
  more players another match, which is what a Plate is for.
- **It would be the risky part:** every single elimination tournament's ending, rankings and both
  layouts would have to cope with a missing bronze. The single elimination tables already include
  the bronze final, so a Plate with one costs nothing extra.

If a club ever asks for no bronze final, it goes in the parking lot then.

## Match lengths (decided: as single elimination)

The Plate uses the single elimination lengths by its own rounds: its quarterfinal the quarterfinal
length, its semifinal the semifinal length, its bronze final and final the bronze and final lengths.
No new settings.

## The three foundations (additions only)

- **Progression:** at the draw, a Plate table is built from `SE_MATCH_PROGRESSION[K/2]` with its IDs
  renamed (`P-QF1`, `P-SF1`, `P-B`, `P-F`, as the cups' `A-QF1`…; `cupMatchId()` can do it with
  cup `P`), and each Cup round 1 match gets a loser path into its Plate place (`FS-1-k` →
  `P-<first round><ceil(k/2)>`, slot `player1` for odd k). `getProgressionTable()` merges both with
  the Cup's table the way the qualifiers are merged: the 32/16/8-player tables themselves are
  untouched; where a Cup round 1 entry gains a loser path, the merged copy combines the two.
- **Transactions:** Plate results are ordinary `COMPLETE_MATCH` transactions; walkovers in the Plate
  are `AUTO`, as on the backside.
- **Undo:** follows the merged table, so undoing a Cup round 1 match takes its loser back out of the
  Plate (blocked once that Plate match is live or played, as on the backside).
- **Recorded** on the tournament (additive): `plate: { size }`. Absent = no Plate.

## What changes where

- **Draw:** `confirmBracketGeneration()` makes the Plate matches after the Cup's (side `'plate'`),
  with TBD places fed by the loser paths.
- **Completion:** a single elimination tournament with a Plate completes when the Cup's final and
  bronze final and the Plate's final and bronze final are all done; today it completes on the Cup
  final.
- **Rankings:** `calculateSERankings()` for the Cup as now; the Plate's places offset by K/2.
- **Bracket view: back to back** (maintainer, 2026-10-09; mockup). The Cup runs left to right with
  its bronze final and final on its right; the Plate mirrors it from the right, its rounds running
  right to left, so the two finals face each other in the middle and the whole tournament fits
  without scrolling. The Plate's rounds sit level with the Cup's (its quarterfinals beside the
  Cup's quarterfinals). Told apart from double elimination by "Cup ▶" and "◀ Plate" labels, the
  Plate shaded like the backside, and **nothing joining the two finals** (no grand final). Loser
  drops from Cup round 1 run round under the bracket into the Plate, shown on selection, as in
  double elimination. With a Plate the layout is always back to back, whatever the Finals setting
  (as double elimination with qualifiers is always in the middle). With qualifiers, their column
  stays outside the Cup's round 1 on the left.
- **Match Controls:** Cup and Plate matches in one queue, labelled Cup · Round 1, Plate · QF; Next
  up as now. Shuffle & Draw: the Play a Plate switch on the single elimination card (unless Offer
  Play a Plate is off).
- **Winner dialog:** "Ola M. moves to P-QF1" for a Cup round 1 loser, as on the backside.
- **Analytics:** the tournament record keeps `plate` (finalize and import), so Analytics names the format **Cup & Plate**. Plate matches are recorded like any other (achievements, matches and legs count; walkovers aren't recorded, as in every format).
- **Help, user guide, llms.txt, web pages.**
