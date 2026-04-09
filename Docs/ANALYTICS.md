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

### Principle: one control surface, no silos

Traditional tournament apps build separate pages for leaderboards, player stats, match history, head-to-head. Each is its own feature with its own logic, its own data path, its own limitations. Crossing boundaries means building another page.

The command center inverts this. There is one computation layer and one set of controls. Everything is the same system at different zoom levels:

- A **leaderboard** is scope + point mode + sort
- A **player profile** is the same system filtered to one player
- A **head-to-head** is filtered to two players
- A **what-if** is the same leaderboard with custom point values
- A **season view** is a date range filter applied to any of the above

No view is a special case. No feature is an island.

### Design principles for the control model

- **Composable** — controls combine freely; any filter works with any view
- **Zoomable** — all tournaments → one season → one tournament → one match → one leg
- **Connected** — select a player in a leaderboard, drill into their profile, see their matches, compare with another player — all without leaving the control surface
- **Evolvable** — new controls and views slot into the existing system; nothing requires a rewrite

This is why the data layer uses IndexedDB rather than LocalStorage. IndexedDB provides indexed queries, compound keys, and cursor-based iteration — the building blocks for a queryable data layer. LocalStorage would restrict the system to key-value lookups and force every aggregation into application code with no index support. The control surface needs a database underneath it, not a string store.

### Controls

**Point mode:**
- **Original** — each tournament scored using its own `configSnapshot` point values (what actually happened)
- **Current** — all tournaments recalculated using today's Global Settings (what would happen under current rules)
- **Custom** — user-defined point values applied across all tournaments (what-if scenarios)

**Scope:**
- Date range / season filter — which tournaments are in scope
- Format filter — SE, DE, or both
- All-time vs rolling window

**View selector:**
- Dashboard (stats cards — headline numbers)
- Leaderboard (cross-tournament rankings)
- Player profile (individual career view)
- Head-to-head (two-player comparison)
- Match register (the current three-panel browser)

**Grouping:**
- By season / date range
- By format (SE/DE)
- All-time

### Data flow

```
IndexedDB (immutable)
    ↓
Command Center controls (point mode, scope, filters)
    ↓
Computation layer (aggregation, ranking, recalculation)
    ↓
Views (stats cards, leaderboard, player profile, graphs, match register)
```

All views read from the same computation layer. Changing a control (e.g. switching point mode from Original to Current) recomputes and re-renders all active views.

### Default Views

Named views are saved control states. The system ships with built-in defaults that work out of the box:

- **Season Standings** — point mode: Original, scope: current season, view: leaderboard
- **All-Time Leaderboard** — point mode: Original, scope: all-time, view: leaderboard
- **Player Progression** — scope: all-time, view: player profile, display: graph
- **High-Score Matches** — scope: all-time, view: match register, sorted by highest averages
- **Achievement Records** — scope: all-time, view: leaderboard, grouped by achievement type

Every default view is fully adjustable — the user sees the same controls as any custom view. Change a parameter and the view updates. Save it as a new named view, or just explore and discard.

Users can also create their own views from scratch, building up a personalised analytics dashboard for their club.

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

**Last updated:** April 9, 2026 — restructured around command center architecture; added config snapshot detail and point mode concept
