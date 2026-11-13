# Season final, NewTon DC

Agreed with the maintainer 2026-11-13. Mockup: `Docs/mockups/season-final.html`.

The club's season final: the season's top 16 are invited, seeded into four groups of four, round robin in each group, then an A cup (1st and 2nd of each group) and a B cup (3rd and 4th), drawn by group. Players who can't come are marked Not available and the next in the standings move up. Members follow who has qualified in Analytics.

## Principles

- **A format card, not a new engine.** "Season final, NewTon DC" is built like Cup and Plate (`CP` = `draw: 'SE', plate: true`): underneath it is a Round Robin (`draw: 'GROUPS'` plus a season-final flag), so groups, schedules, referees, cups, placements, undo and Analytics are the existing ones.
- **Fixed settings, nothing to choose:** four groups, top two to the A cup, B cup on, cups drawn by group, seeded by season rank. Exactly 16 players.
- **One club package, only for NewTon DC** (maintainer 2026-11-13): the format, Fill from season standings, OP as the tiebreaker and the Season final tab go together, and exist only where the Docker environment variable `NEWTON_DC=1` is set (the club's two containers: the club computer and the website). It reaches the page through `window.NEWTON_CONFIG`, like the API key.
  - **Without the variable nothing of it shows:** no format card, no entry in Formats to offer, no Fill from season standings, no OP column or tiebreaker (the Leaderboard is exactly as today), no Season final switch behind `?tm`. Running from a file never has it.
  - **With it:** Tournament Manager: the format is offered (Formats to offer can still untick it), with Fill from season standings and OP. Website: the operator switches the Season final on in Analytics with `?tm`, which saves the season record on the server (scope, Not available marks); members then see the Season final tab and OP.
  - **Not a secret, just not in anyone's way:** not in the Docker docs, Global Settings or Help; described here only. The maintainer: "I just don't want it to be an annoyance, and something that needs a lot of extra explanation."
  - A custom OP formula builder for other clubs is parked (Docs/PARKING-LOT.md); OP keeps its parts and bonus tables in one place so a builder can replace them.
- **Additive only** for stored data (CLAUDE.md): new optional fields, missing means default.

## The ranking: points, then OP

Where the variable is set, every place the ranking is used (Leaderboard, Season final list, seeding) orders by total points, then OP. Equal points and equal OP: shared rank. OP is calculated from the tournaments in view, like the points. Sorting by another column orders by that column, as today.

**OP (Outstanding Player)** is the County league's score without its attendance factor (that factor counts singles possible in team fixtures, which has no counterpart on our nights; the maintainer chose to leave it out):

OP = 3w/m + 3v/s + t/s + b / (v + (s+1)/(v+1))

- w / m: matches won / played (walkovers don't count)
- v / s: legs won / played (matches without a final score have no legs)
- t: tons, a 180 counting as 2 (Tons already include the 180s, so t = tons + 180s); lollipops don't count
- b: bonus points. Short legs: 9 darts 40, 10 32, 11 26, 12 20, 13 16, 14 13, 15 10, 16 8, 17 6, 18 5, 19 4, 20 3, 21 2. High outs: 161–170 7, 141–160 5, 121–140 4, 111–120 3, 101–110 2
- A term with nothing to divide by (m = 0, s = 0) counts 0.

OP is a Leaderboard column after Points (two decimals, sortable, hover shows its four parts), and in Export CSV and JSON.

## The cup draw by group

A cup, round 1 in bracket order: A1 v D2, B1 v C2 (top half, one semifinal), C1 v B2, D1 v A2 (bottom half, the other). B cup the same with 3rd and 4th: A3 v D4, B3 v C4, C3 v B4, D3 v A4. Group mates can only meet again in a final. Today's cups seed by results across groups (`cupFields()`, `placeSeededPlayers()`); this rule is used only by this format. A missing place (uneven groups) would be a bye; with exactly 16 it doesn't happen.

## Fill from season standings (Tournament Manager)

In Player Registration when the format is offered. Gated like Reset tournament (maintainer 2026-11-13): the tournament's name, typed exactly, opens it, and it stays open to that tournament. The ranking comes from this computer's own results through the seeding lens (name word, half-year, misspelt tournaments ticked by hand). The 16 best available are invited; any player can be marked Not available (also below 16th), and a mark can be taken back. "Add these 16 players" adds them from the player database already marked paid (invited, no payment), so the unpaid rule never stops the draw. Seed = season rank among the 16.

## Season final tab (Analytics)

A tab in the Leaderboard: the same table as All players, every column, with a Status column (Qualified, Reserve n, Not available) and the line under the 16th qualified. Its scope is the saved season, never the visitor's Lens: the name word and dates (new Måndagscup nights join by themselves) plus tournaments ticked in or left out by hand. Under it, the groups as they would be drawn today. The season and the marks are stored on the server like Corrections; only the operator (Tournament Manager gate) changes them. Shown in the Tournament Manager when the format is offered, and on the website once a season is saved.

## Build order

1. **Cup draw by group** (the final can't be played without it). **Built 2026-11-13:** `cupDraw: 'groups'` in the tournament's group settings (set through the draw choice only), `Groups.drawsByGroup()` / `cupBracketByGroup()`, used by `drawCups()`; FS-1-1 and FS-1-2 do feed the same semifinal.
2. **The format card** with its fixed settings, off by default. **Built 2026-11-13:** `isNewtonDC()`, `SEASON_FINAL_FORMAT` (id `SF`), `seasonFinal: true` in the group settings, the B cup always played. Seeding is the Seeding panel's until step 4.
3. **Points, then OP**: OP calculated in the Leaderboard rows, the column, the order, exports; seeding follows automatically. **Built 2026-11-13:** `_opScore()` in `newton-history.js`, `_rank` shared on equal points and OP, `_pos` for the line under the 16th. Tons already include the 180s (since v5.0.1), so t = tons + 180s. OP is a Leaderboard value: the Position chart keeps ranking by points (maintainer 2026-11-13).
4. **Fill from season standings** in Player Registration. **Built 2026-11-13:** `js/season-final.js` (`SeasonFinal`), the lens shared from `Seeding.lens`, `NewtonHistory.seasonStandings()`, `tournament.seasonFill` (season, marks, seeds), the Season final draw seeded from it through `Seeding.forGroups()`; without Fill the Seeding panel applies.
5. **Season final tab** in Analytics: the saved season and marks on the server, the Status column, the groups preview. The one that can slip. **Built 2026-11-13:** `api/season-final.php` (404 without `NEWTON_DC=1`; one record `{keyword, from, to, periodLabel, ticked, unticked, notAvailable, updatedAt}` in `tournaments/season-final/season.json`), the "All players | Season final" switch in the Leaderboard, `_leaderboardColumns()` shared, `SeasonFinal.classifyRows()` shared with Fill, `Groups.snake` for the preview, exports follow the open tab. The half-year is kept as dates so the season doesn't empty on 1 January; a season older than the lens offers shows under All time when changed, its dates kept.

Each step tested in the browser before the next; commits only when the maintainer asks.
