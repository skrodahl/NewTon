# Swiss

Design note, 2026-10-10. **Built 2026-10-10** (unreleased; CHANGELOG.md has the details). Decisions are the maintainer's (Docs/PARKING-LOT.md → More formats, after
Round Robin). Mockup: `Docs/mockups/swiss.html`.

## What it is

A fixed number of rounds, and nobody is knocked out. Each round pairs players with the same record
who haven't met yet; the table decides, or the top four finish with semifinals, a bronze final and a
final. Everyone plays the same number of rounds, so the night's length is predictable.

## The rules

- **Players:** 4 to 48.
- **Rounds:** chosen at the draw, starting from Global Settings → Swiss → Rounds: **By players**
  (the default: 3 for 5–8 players, 4 for 9–16, 5 for 17–32, 6 for 33–48; 2 for 4) or a fixed
  number. Never more than players − 1 (everyone could have met everyone).
- **Finish:** chosen at the draw, starting from Global Settings → Swiss → Finish: **Semifinals and
  final** (the default: the top four after the last round, 1st v 4th and 2nd v 3rd, with a bronze
  final) or **The table decides**.
- **Pairing ("Monrad"):** round 1 random, or with seeding ticked the ranked players best first (the
  unranked after them at random), top half against bottom half (1 v N/2+1, 2 v N/2+2, …). Later rounds:
  the table in order, 1st v 2nd, 3rd v 4th, skipping anyone already played; when a skip leaves no
  pairing, the search backtracks; if no pairing without a rematch exists at all, rematches are allowed
  (fewest first).
- **Byes:** with an odd number, one player sits out each round: the lowest-placed player who hasn't
  had a bye. A bye counts as a win, with no legs.
- **The table:** wins (a bye is a win), then opponents' wins (Buchholz: the sum of the wins of the
  players you met; a bye adds none), then leg difference, then legs won, then the draw order.
- **Placings:** with the top four, the knockout gives 1st to 4th; everyone else by the table, from 5th,
  in the shared places (5th–6th, 7th–8th, 9th–12th …). With the table deciding: the table, 1st, 2nd,
  3rd, 4th, then the shared places.
- **Match lengths: their own settings** (Global Settings → Match length → Swiss): rounds, semifinal,
  bronze final, final (defaults 3, 3, 5, 5).
- **Referees:** suggestions only (no planned referees): with fewer boards than matches, players are
  always waiting.

## Drawing rounds: automatic

When the last match of a round is entered, the next round is drawn at once (and after the last round,
the top-four knockout). Match Controls says so ("Round 4 drawn") with the pairings.

- **A wrong result in the round just finished:** undoing it also takes back the round drawn from it,
  as long as none of that round's matches has started or has a result; entering the result again
  draws the round again (perhaps with other pairings).
- **Once a match in the new round has started or has a result,** the earlier rounds are locked (as
  the groups lock once a cup match is played); undo says why.

## The three foundations (additions only)

- **Progression:** Swiss rounds progress no one (like group matches): their matches are in no table.
  The top four is `SE_MATCH_PROGRESSION[4]` with its IDs renamed (`K-SF1`, `K-SF2`, `K-B`, `K-F`,
  `cupMatchId('K', …)`), returned by `getProgressionTable()` once drawn (an empty table before).
- **Transactions:** each round's draw is a `DRAW_SWISS_ROUND` transaction (the knockout's
  `DRAW_SWISS_KNOCKOUT`), as the cup draw is `DRAW_CUPS`; results are ordinary `COMPLETE_MATCH`.
- **Undo:** within a round as for any match; taking back a round's draw removes its matches and its
  transaction, as `undoCupDrawConfirmed()` does for the cups.

## Data (additive)

| Field | Where | Meaning |
|---|---|---|
| `format: 'SWISS'` | tournament | The format. |
| `swiss` | tournament | `{ rounds, finish: 'top4'\|'table', drawn: [{ round, byes: [id] }], knockout: bool, seeded: bool }` |
| `side: 'swiss'`, `round` | match | A Swiss round match, `R3-2` (round 3, match 2). |
| `side: 'swissko'`, `seId` | match | A top-four match, `K-SF1`, `K-B`, `K-F`. |
| `swiss` | config | `{ rounds: 'auto'\|3..6, finish: 'top4'\|'table' }` |
| `swissRounds`, `swissSemifinal`, `swissBronze`, `swissFinal` | config.legs | Best of (3, 3, 5, 5). |

`tournament.bracketSize` is the number of players drawn (as for Round Robin), and `tournament.bracket`
the players in draw order, so "has the draw happened?" works as everywhere.

## Where it shows

- **Pick a format:** a Swiss card (pictogram: rounds as columns, then a small final), its options
  (Rounds, Finish), "Tonight: 4 rounds, then the top 4", matches tonight.
- **Match Controls:** the round in play in the queue ("Round 3 of 4"), then "Top four"; the table in
  the right column (W–L, opponents' wins, leg difference, the top four marked); "Round 4 drawn" when
  it is.
- **The bracket page:** each round as a column of its matches (no lines), a bye shown in its round,
  then the top four as a small knockout with lines (room kept for it from the start). Selecting a
  round match lights up both players' matches across the rounds, as Follow does for one player.
- **Global Settings:** a Swiss panel (shown while the format is offered) with Rounds and Finish; Swiss
  lengths under Match length.
- **Analytics:** the format named Swiss.
