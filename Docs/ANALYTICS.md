# Analytics — Plan

The Analytics tab was introduced in v5.0.1 as a read-only match register browser. The name was chosen deliberately — the tab should earn it over time. This document captures the current state, the data foundation, the architecture, and a phased roadmap.

---

## Current State

A three-panel hierarchical browser:

1. **Tournament list** — all finalized tournaments with name, format, date, player count, status. Export/import buttons for full register backups.
2. **Match list** — all matches for a selected tournament. Match ID, players, result, type (Chalker/Manual), completion date.
3. **Match detail** — full match record. For Chalker matches: leg-by-leg visit scores (decoded from base64), first thrower, checkout darts, achievements (180s, tons, high outs, short legs). For manual matches: leg count only.

Delete requires typing the tournament name. Import merges without overwriting existing records.

---

## Data Foundation

Everything is stored in IndexedDB via `newton-db.js`. Two object stores:

### Matches store
- Key: auto-increment `id`
- Indices: `tournamentId`, `player1Id`, `player2Id`, `matchType`, `completedAt`, compound `[tournamentId, matchId]`
- Contains: player names/IDs, winner, legs won, raw leg data (visits, scores, checkout darts), achievements object, match metadata (format, best-of, type)

### Tournaments store
- Key: `tournamentId`
- Indices: `status`, `closedAt`, `format`
- Contains: tournament name, date, format (SE/DE), player count, status (`live`/`final`), config snapshot at close time, tournament-level achievements per player

### Config snapshot — what's captured per tournament

Every finalized tournament stores a complete frozen copy of the `config` object at close time. This includes:

**Points** (all placement and achievement values):
- `participation`, `first`, `second`, `third`, `fourth`, `fifthSixth`, `seventhEighth`
- `highOut`, `ton`, `oneEighty`, `shortLeg`

**Match format** (best-of settings per round):
- DE: `regularRounds`, `frontsideSemifinal`, `backsideSemifinal`, `backsideFinal`, `grandFinal`
- SE: `seRegularRounds`, `seQuarterfinal`, `seSemifinal`, `seBronze`, `seFinal`
- Chalker: `x01Format`, `maxRounds`, `shortLegThreshold`

**Also captured:** `clubName`, `lanes`, `ui` settings, `server` settings.

This means point recalculation is always possible — the raw results and the original scoring rules are both preserved.

### What's already captured
- Every Chalker match: full visit-level detail
- Every manual match: outcome and leg count
- Achievements per match: 180s, tons (100+), high outs (101+), short legs
- Tournament-level achievement aggregates at finalization
- Config snapshot: full config frozen at tournament close

### Records vs achievements — threshold-free stats from raw data

The `extractAchievements()` function in `newton-stats.js` gates what it stores: high outs require >= 101, short legs require <= threshold (default 21 darts). These thresholds determine **achievement points**, not **records**.

The dashboard should show all-time bests regardless of threshold. If the highest checkout in the register is 40, the card should show 40. If the shortest leg is 33 darts, it should show 33.

The raw data to compute this already exists in every Chalker match record — the `legs` array stores visit scores and checkout darts per leg. For any leg:
- **Checkout score**: last visit of the winning player
- **Total darts**: `(visits.length - 1) * 3 + cd`

No thresholds, just the actual numbers.

**Implementation**: scan raw leg data from Chalker match records for threshold-free bests; fall back to `tournamentAchievements` for manual entries (which are only recorded when the operator considers them notable). Best of both sources.

### Achievement reconciliation — solved

Match-level achievements now always sum to tournament-level totals. Two mechanisms ensure this:

**Backfill** (historical tournaments added via "+ Analytics"):
- Transaction history contains cumulative player stat snapshots per match. Diffing consecutive snapshots for the same player derives per-match achievement deltas — even for manually scored v4 tournaments.
- After all matches are saved, `NewtonDB.reconcileMatchAchievements()` compares the sum of match-level deltas against the authoritative `tournamentAchievements`. Any remainder (achievements entered outside the match completion dialog) is attributed to the player's last match.

**Live finalization** (tournament just completed):
- Each match already carries its achievement delta from the snapshot diff computed during the completion dialog.
- The same `reconcileMatchAchievements()` runs after finalization, catching any stats added outside the match dialog (e.g. operator bumps a 180 count directly on the Player Registration stats panel after confirming a winner).

Both paths use the same shared code in `newton-db.js`: `normalizeStats`, `diffStats`, `hasAnyStats`, `addStats`, and `reconcileMatchAchievements`.

**Result**: every match in IndexedDB has per-match achievement attribution. The dashboard reads `tournamentAchievements` for aggregate stats (the authoritative total). Match detail views read per-match achievements for drill-down. The numbers always agree.

### Two-level data model — backwards and forwards compatible

Achievement data exists at two levels, and always will:

- **Match-level**: per-match achievement deltas. Present for all matches — Chalker matches have them from `extractAchievements()`, manual matches have them from the snapshot diff, backfilled matches have them from history diffing + reconciliation.
- **Tournament-level**: per-player aggregate achievements stored on the tournament meta record (`tournamentAchievements`). Always present — written at finalization for every tournament. The authoritative total.

The match-level sum always equals the tournament-level total thanks to reconciliation. But the tournament level remains the canonical aggregate — it's written from the live `player.stats` at finalization, not summed from match deltas.

Future features may add stats that only make sense at the tournament level — custom awards, "most improved player", operator notes — things that aren't derivable from raw match scores. The tournament-level record accommodates this naturally.

---

## The Gap

The data exists. The queries don't.

- **No aggregation** — achievements stored per-match and per-tournament, but never rolled up across tournaments or per player over time
- **No player career view** — no way to see a player's history, averages, or form
- **No cross-tournament queries** — no leaderboards, no season stats, no head-to-head records
- **No control surface** — no way to choose what logic is applied to the data (point mode, date range, grouping)
- **No charts** — form and trends are invisible without visual representation
- **Manual matches lack depth** — visit-level data unavailable; only leg counts shown

---

## Architecture — The Command Center

The Analytics tab becomes a control surface over immutable data. The data never changes — match results, visit scores, achievements, config snapshots are all frozen at finalization. The command center is purely a lens: you choose what to see and how to calculate it.

### Principle: data is immutable, presentation is configurable

The three-panel match browser remains as the raw register — "show me exactly what happened." The command center sits above it as the analytical layer, orchestrating what gets computed and displayed.

### Principle: compute from raw data when the answer depends on interpretation

Where a stat is absolute — a 180 is a 180, a ton is 100+ — using the achievement register is pragmatic. Same answer, less work.

Where a stat depends on a configurable threshold or where the raw data tells a richer story than the summary, compute from raw data. High outs and short legs are threshold-dependent — the achievement register only stores values above the point threshold, but the all-time best might be below it. Averages and checkout percentages need raw visit data by definition.

The pattern:
- **Absolute stats** (180s, tons): use achievement register — the definition is fixed
- **Threshold-dependent stats** (high outs, short legs): compute from raw leg data — the register filters out values below the points threshold
- **Derived stats** (averages, trends, checkout %): compute from raw visit data — no pre-computed summary exists

### Principle: one control surface, no silos

Traditional tournament apps build separate pages for leaderboards, player stats, match history, head-to-head. Each is its own feature with its own logic, its own data path, its own limitations. Crossing boundaries means building another page.

The command center inverts this. There is one computation layer and one set of controls. Everything is the same system at different zoom levels:

- A **leaderboard** is scope + point mode + sort
- A **player profile** is the same system filtered to one player
- A **head-to-head** is filtered to two players
- A **what-if** is the same leaderboard with custom point values
- A **season view** is a date range filter applied to any of the above

No view is a special case. No feature is an island.

### Principle: scope vs focus

The register defines the **scope** — which tournaments are in play. Views provide the **focus** — within that scope, what are you looking at.

```
Register scope (which tournaments)
    ↓
View focus (which players, matchups, achievements)
    ↓
Display mode (table, graph, card)
```

Selecting a player in the Players tab isn't a filter on the register — it's a focus within the current scope. The scope stays the same; the view narrows. Selecting a second player narrows further to their head-to-head. The data pipeline is unchanged; only the lens moves.

This means changing the register scope always changes what every view shows — but the focus within each view is independent. You can be looking at Andy's career stats, switch the register from "all time" to "2026 season", and Andy's view updates to show only his 2026 numbers. The focus stays, the scope changes.

**View-level focus (not register-level filtering):**
- **Players tab**: select one player → career stats within scope. Select two → head-to-head within scope. Available stats: points, averages, legs won/lost, achievements, form over time.
- **Leaderboard tab**: ranked list within scope. Click a player → drills into their player view. Click two → compare.
- **Dashboard tab**: headline numbers from scope. Click a card → jumps to the relevant tab with the right focus pre-set.

Match-level filtering (e.g. "only Chalker matches", "only DE matches") is a display concern within views, not a scope decision in the register. It emerges naturally from view interactions rather than requiring a fourth filter layer.

### Principle: same system, any zoom level

The scope determines what the analytics show. Different scopes tell different stories — all from the same system with no special logic:

- **All-time** (default) — career records, lifetime leaderboards, long-term trends
- **Season** (date range or text filter, e.g. "Monday Cup 2026") — season standings, seasonal bests, who's in form right now
- **Single tournament** — deeper than the end-of-tournament podium. The celebration screen shows top 3 and headline achievements. The analytics show *how* the winner won: every match, every leg, every visit score. Which matches were close, where the 180s fell, who gave the toughest fight, what the averages looked like across the bracket. Full 1st-through-32nd leaderboard with points, achievements, and legs won/lost.
- **Two players** (focus within any scope) — head-to-head record, performance comparison, how they fare against each other vs the field

Each is just the register with a different selection and a view with a different focus. No dedicated pages, no separate features.

### Design principles for the control model

- **Composable** — controls combine freely; any filter works with any view
- **Zoomable** — all tournaments → one season → one tournament → one match → one leg
- **Connected** — select a player in a leaderboard, drill into their profile, see their matches, compare with another player — all without leaving the control surface
- **Evolvable** — new controls and views slot into the existing system; nothing requires a rewrite

This is why the data layer uses IndexedDB rather than LocalStorage. IndexedDB provides indexed queries, compound keys, and cursor-based iteration — the building blocks for a queryable data layer. LocalStorage would restrict the system to key-value lookups and force every aggregation into application code with no index support. The control surface needs a database underneath it, not a string store.

### Controls

**Register as gating filter:**

The tournament register is the scope selector for the entire command center. All other views — dashboard, leaderboard, players — compute from whichever tournaments are currently selected in the register. The default is all finalized tournaments (all-time). Every filter defaults to "everything" and narrows from there — no selection is still a selection.

Three composable filters, evaluated in order:

```
All finalized tournaments
    → Date range (coarse scope — default: all dates)
        → Text filter (pattern match on tournament name)
            → Manual checkboxes (fine-tune individual tournaments)
                → Active scope for all views
```

Each layer narrows the previous one. No layer is required — skip any and the full set passes through.

**Date range:**
- From/to date pickers. Narrows the tournament list to events within the range.
- Default: no range selected = all dates = all-time. Not a special case, just the widest scope.

**Text filter:**
- Type keywords, filtered instantly against tournament names.
- AND logic by default: space-separated terms must all match (case-insensitive). "Monday Cup" matches "Monday Night Cup" and "Monday Afternoon Cup" but not "Monday Practice" or "Thursday Cup."
- Future option: `-` prefix for NOT ("Monday -Practice"), added only if the need arises in practice.

**Manual selection:**
- Checkboxes on the filtered tournament list. Deselect individual tournaments you don't want in scope.
- Operates on the already-filtered list — date range and text filter narrow first, then manual selection fine-tunes.

**Point mode:**
- **Original** — each tournament scored using its own `configSnapshot` point values (what actually happened)
- **Current** — all tournaments recalculated using today's Global Settings (what would happen under current rules)
- **Custom** — user-defined point values applied across all tournaments (what-if scenarios)

**View selector:**
- Dashboard (stats cards — headline numbers)
- Leaderboard (cross-tournament rankings)
- Player profile (individual career view)
- Head-to-head (two-player comparison)
- Match register (the current three-panel browser)

### Table behaviour — reusable core utility

All tabular views use a shared table utility. Pass it data, column definitions, and a target element — it handles sorting, pagination, and rendering. Every future view (Leaderboard, Players, match lists) gets these features for free.

**Implementation:** client-side sorting and pagination. At club scale (dozens of tournaments, hundreds of matches) the data is already in memory from the initial IndexedDB fetch. Re-querying with different indices would add complexity for zero performance benefit. If the data set ever grows, the utility's internals can switch without changing the calling API.

**Sorting:**
- Default sort per table: date descending where applicable, alphabetical otherwise
- Click a column header to sort ascending; click again to reverse
- Visual indicator on the active column: `▲` ascending, `▼` descending
- Third click resets to default sort (optional — decide during implementation)

**Pagination:**
- Rows-per-page selector below the table, right-aligned: 10 / 25 / 50 / All
- Default: 25
- Previous / Next buttons with current page indicator (e.g. "Page 2 of 4")
- Selection persists to localStorage per table ID so the operator's preference survives page reloads

**Layout defaults:**
- Pagination controls below the table in a compact row: rows-per-page selector on the right, page navigation centred
- Sort indicators inline with header text, right of the label
- No visual clutter when inactive — only the active sort column shows an arrow

**Column visibility** (later):
- Operator can show/hide columns per table
- Reduces noise — only display what matters for the current question
- Another control parameter: same data, different projection
- Deferred until the core sort + pagination utility is stable

**Column widths:**
- Columns accept an optional `width` property (e.g. `'80px'`). Compact columns like Format, Players, Matches get fixed widths; name columns take the remaining space.

**Self-healing data fields:**
- Some computed fields (e.g. `matchCount`) may be missing from older records. The render path computes them on the fly and persists them back to IndexedDB. New records write the field at finalization/backfill. This avoids migration steps — old data fixes itself on first display.

**First targets:**
- Register → tournament list (sort by date, name, format, player count, match count)
- Register → match list (sort by match ID, player names, result, type, date)
- These already have real data and working rendering — adding the utility is purely additive

### Points in tables — deferred until point mode is wired

The tournament list should show an achievement points column — the sum of skill-based points (180s, tons, high outs, short legs) for each tournament. Three distinct point categories:

- **Achievement points** — 180s + tons + high outs + short legs (skill-based, the interesting ones)
- **Placement points** — 1st, 2nd, 3rd etc. (bracket result)
- **Participation points** — flat rate for showing up

Achievement points depend on the point values in the active config — which means the column must respect the point mode toggle (Original uses the frozen `configSnapshot`, Current uses today's settings, Custom uses operator-defined values). This is the first real connection between the control bar and the table data.

Implement when the point mode computation layer is in place.

### Data flow

```
IndexedDB (immutable)
    ↓
Register filters (date range → text filter → manual selection)
    ↓
Active scope (selected tournaments)
    ↓
Point mode (Original / Current / Custom)
    ↓
Computation layer (aggregation, ranking, recalculation)
    ↓
Views (stats cards, leaderboard, player profile, graphs, match register)
```

All views read from the same computation layer. Changing any control — a filter, the point mode, or the view — recomputes and re-renders from the active scope.

### Default Views

Named views are saved control states. The system ships with built-in defaults that work out of the box:

- **Season Standings** — point mode: Original, scope: current season, view: leaderboard
- **All-Time Leaderboard** — point mode: Original, scope: all-time, view: leaderboard
- **Player Progression** — scope: all-time, view: player profile, display: graph
- **High-Score Matches** — scope: all-time, view: match register, sorted by highest averages
- **Achievement Records** — scope: all-time, view: leaderboard, grouped by achievement type

Every default view is fully adjustable — the user sees the same controls as any custom view. Change a parameter and the view updates. Save it as a new named view, or just explore and discard.

Users can also create their own views from scratch, building up a personalised analytics dashboard for their club.

### Tournament Analytics from the Podium

When a tournament completes, the full match data is already written to IndexedDB. The celebration podium shows top 3 and headline achievements — but the real story is deeper.

A **"Tournament Analytics"** button on the podium screen sets the register scope to this single tournament and switches to the Analytics tab. One click from celebration to deep analysis. The dashboard, leaderboard, and player views all show data for just this tournament — no manual filtering needed.

This is the moment everyone wants the details. "How did Benedict win?" — instead of scrolling through a bracket, the operator opens the full analytical story: every match, every leg, every visit score, full leaderboard from 1st to last, head-to-head records, and achievement breakdowns.

Not a separate feature — just another predefined view. The register scoped to one tournament, the dashboard as the entry point.

### The What-If Scenario

The Custom point mode turns the leaderboard into a simulation tool. Load the season data, adjust the point values, and watch the standings reshuffle in real time.

This solves a real problem: clubs debate point systems endlessly in the abstract. With the command center, you load the actual season, change the values, and show the room what happens. "If we double 180 points, does it change the top 3?" becomes a 5-second answer.

No data is modified — the original tournament records and their frozen `configSnapshot` values are untouched. Custom mode is purely a lens applied at computation time.

### Graphs

Graphs are a display mode, not a separate feature. Any view that produces a series over time can render as a graph instead of (or alongside) a table.

**Club-level graphs:**
- Tournament participation over time (how many players per event)
- Average points per tournament (is the competition getting tighter?)
- Achievement frequency (are 180s becoming more common as skill improves?)

**Player-level graphs (select a player, see their story):**
- Ranking position over time (1st, 3rd, 5th… tournament by tournament)
- Points accumulated per tournament and cumulative
- Legs won/lost ratio over time
- Match averages over time (form and progression)
- Achievement trends (180s, tons, high outs per tournament)

**Player comparison:**
Select two or more players and overlay their graphs. The same data, same controls — just filtered to a subset of players. This naturally leads into head-to-head:

- How many times have they met?
- Win/loss record between them
- Average performance when facing each other vs overall

All driven by the same computation layer. Player selection is just another control parameter — scope the data to those players, pick a display mode (graph, table, head-to-head card), and the view renders.

Zero-dependency — canvas-based or inline SVG. No chart libraries.

---

## Roadmap

The command center is the frame. Each phase adds views and controls that render within it.

### ~~Priority — Tournament Setup Integration~~ DONE (v5.0.4)

Backfill implemented. "+ Analytics" label on each completed tournament in "My Tournaments". One-click import with per-match achievement reconstruction from transaction history. Achievement reconciliation shared between backfill and live finalization. See v5.0.4 release notes.

### Next — Table Utility

Reusable sort + pagination utility, applied to the existing Register tables (tournament list, match list). This is the foundation for every tabular view that follows. See "Table behaviour" section above for the full specification.

### Next — Scope Selector

The tournament selection that drives all views. This is the first real control on the control surface.

- **Scope state** — an array of selected tournament IDs (default: all finalized)
- **Visual indicator** — in the control bar, showing the current scope ("All tournaments" or "Måndagscup" or "3 tournaments selected")
- **Entry points** that set the scope:
  - "Analytics" label in Recent Tournaments → scope to that single tournament, switch to Analytics tab
  - Podium "Tournament Analytics" button → same, scope to the just-completed tournament
  - Register checkboxes → manual selection within the filtered list
- **Clear button** to reset to all-time
- **All views read from the scope** — Dashboard stats, Leaderboard rankings, Player profiles, Register tables all filter by the active scope

Without scope, clicking "Analytics" on a tournament opens a filtered register but the Dashboard still shows all-time data. With scope, every view is consistent — one selection, one dataset, every view agrees.

The scope must be set before the full filter system (date range → text → checkboxes) is built. The filters narrow the scope; the scope is the result. Start with manual selection (entry points + clear), add filters later.

### Phase 1 — Stats Cards + Point Mode

The command center skeleton with a dashboard view.

**Stats cards** — headline numbers computed from finalized data:
- Most 180s (player, count, across all tournaments)
- Highest match average (player, value, tournament)
- Most tournament wins (player, count)
- Current title holder (winner of most recent finalized tournament)
- Total matches played (all tournaments)

Clickable — drill into the underlying data.

**Point mode toggle** — Original vs Current. The first control. Demonstrates the principle that the same data tells different stories depending on the scoring rules applied.

### Phase 2 — Player View

Aggregate stats per player across all finalized tournaments.

- Tournament results (placements, win/loss record)
- Achievement totals (180s, tons, high outs, short legs)
- Match averages (where Chalker data available)
- Form over time (last N tournaments)
- Points total (respects point mode toggle)

Indexed by player ID. Requires scanning all matches for a player — existing `player1Id`/`player2Id` indices support this.

### Phase 3 — Cross-Tournament Leaderboard

Rankings across the full register.

- Season leaderboard (configurable date range — first scope control)
- All-time records
- Head-to-head records between players
- Achievement leaderboards (most 180s, highest single-match average, most high outs)

May benefit from a computed cache/summary to avoid scanning all matches on every render.

**Export:** Season leaderboard exportable as JSON and CSV — same format as single-tournament results export. The data shape is identical (players, points, placements, achievements), just aggregated across the selected scope. Any filtered/configured leaderboard view should be exportable, not just the default.

### Phase 4 — Graphs

Visual representation of form and trends.

- Player averages over time
- Achievement frequency
- Win rate trends
- Tournament participation

Zero-dependency — canvas-based or inline SVG. No chart libraries.

### Phase 5 — Custom Views

Saved filters or pivot views over the match register. Users define what to see and save it for quick access.

Most speculative phase — depends on what patterns emerge from actual usage of Phases 1–4.

---

## Design Constraints

- **No external libraries** — consistent with the zero-dependency philosophy
- **Client-side only** — all computation from IndexedDB, no server
- **Offline-capable** — must work without network access
- **Non-destructive** — analytics are read-only views over immutable finalized data
- **Configurable, not editable** — the command center changes how data is presented and calculated, never the underlying records
- **Progressive** — each phase is independently useful; no phase depends on a later one
- **Performance** — small club scale (dozens of tournaments, hundreds of matches); full scans are acceptable for now, caching optional

---

## Open Questions

Decisions deferred — to be revisited as implementation progresses.

### ~~Lazy vs eager recompute~~ — Decided: lazy

The active view recomputes on filter change. Other views are marked dirty and recompute when switched to. The user never sees stale data — the view refreshes the moment they activate it. No wasted work rendering hidden views, and the right foundation before graphs and canvas rendering are added later.

### Dashboard drill-through targets

Each stats card on the dashboard is described as "clickable — drill into the underlying data." But where does each card link to? Options:
- "Most 180s: Andy (5)" → Player view, filtered to Andy?
- "Most 180s: Andy (5)" → Leaderboard, sorted by 180s?
- Both? (Player name clicks to player, card title clicks to leaderboard?)

The drill-through targets define what makes the dashboard a gateway rather than just a summary.

### Dashboard stat cards — dynamic visibility and content

Current behaviour: cards with no data show "No data yet" or "0". Better: hide cards that have nothing to show. A dashboard with three meaningful cards is more useful than six cards where half say zero.

Beyond that: cards should be operator-selectable. The system offers a catalogue of available stat cards; the operator picks which ones appear on their dashboard. A club that doesn't track tons doesn't need a tons card. A club obsessed with 180s might want both "Most 180s this season" and "180s per tournament average."

Same principle as everything else — the data exists, the operator chooses the lens. The dashboard is a configurable view, not a fixed layout.

Defer specifics until the scope selector is working and real data flows through the dashboard at different zoom levels.

### Raw data principle in roadmap phases

The architecture section defines when to use raw data vs the achievement register (absolute stats → register shortcut; threshold-dependent and derived stats → raw data). The roadmap phases should consistently reference this. Currently Phase 2 (Player View) mentions "match averages (where Chalker data available)" but doesn't state which source is used for other stats. Each phase should be explicit about which data source it draws from.

---

**Last updated:** April 10, 2026 — implementation sequence: table utility → scope selector → views; Tournament Setup integration marked done (v5.0.4)
