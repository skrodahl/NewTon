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

### Table behaviour

Any view that renders a table (tournaments, matches, leaderboards, player lists) should support:

**Pagination:**
- Configurable items per page (operator selects)
- Page navigation controls
- Applies to tournament lists, match lists, and any other tabular view

**Sortable columns:**
- Click a column header to sort by that field
- Click again to reverse
- Visual indicator for active sort column and direction

**Column visibility:**
- Operator can show/hide columns per table
- Reduces noise — only display what matters for the current question
- Another control parameter: same data, different projection

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

### Priority — Tournament Setup Integration

The Tournament Setup page shows recent/saved tournaments. Each tournament should indicate whether it exists in Analytics (IndexedDB) or not — a small badge, icon, or status label.

For tournaments not yet in Analytics, a button to **add them** would allow operators to backfill historical tournaments into the register. This is important because tournaments completed before v5.0.1 (when IndexedDB recording was introduced) have no Analytics entry. Without backfill, the leaderboard and cross-tournament stats only tell the story from v5.0.1 onward.

**Feasibility question:** localStorage tournament data includes match results, placements, and achievements — but not raw visit scores (those only exist for Chalker matches recorded via QR). A backfilled tournament would have manual-level detail: outcomes, leg counts, and operator-entered achievements. No visit-level data, no averages, no checkout darts. The question is whether this partial data is useful enough to include, or whether it creates a confusing mix of rich and shallow records in the register.

**Likely answer:** yes, it's useful. Points, placements, and achievement counts are the foundation of the leaderboard. A tournament doesn't need visit-level data to contribute to season standings. The Analytics views already handle the distinction — manual matches show "Manual" type and skip visit-level display. The data quality difference is already part of the design.

**Top priority for the next phase** — if feasible, implement before continuing with Phase 2.

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

### Raw data principle in roadmap phases

The architecture section defines when to use raw data vs the achievement register (absolute stats → register shortcut; threshold-dependent and derived stats → raw data). The roadmap phases should consistently reference this. Currently Phase 2 (Player View) mentions "match averages (where Chalker data available)" but doesn't state which source is used for other stats. Each phase should be explicit about which data source it draws from.

---

**Last updated:** April 10, 2026 — scope vs focus principle; zoom levels (all-time, season, single tournament, head-to-head); open questions added
