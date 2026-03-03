# Single Elimination Support - Design & Planning

**Status:** Core engine + Match Controls implemented — bracket rendering next (Step 5)
**Last Updated:** February 2026

---

## Core Insight

Single Elimination is the Frontside only of Double Elimination. This means massive code reuse rather than building a parallel system.

---

## Design Principles (Agreed)

1. **Rock solid** — same reliability standard as DE
2. **ALWAYS reuse code** — extend existing functions, don't duplicate
3. **Same sources of truth** — hardcoded match progression + transaction-based history
4. **Everything derived from the foundation** — same functions, same information, different contexts
5. **Retain maintainability** — no parallel code paths that diverge over time
6. **JSDoc annotations** — all new and modified functions follow the project's JSDoc standard (see `Docs/CodeReview/JSDOC-ANNOTATIONS-REVIEW.md`)

---

## User-Facing Walkthrough (Agreed Decisions)

### Tournament Setup Page
- **No changes.** Create tournament, give it a name. No bracket type choice here.

### Player Registration Page
- **No changes.** Register players, manage payment, view leaderboard. The leaderboard naturally handles mixed tournament types since it's driven by placement points.

### Global Settings (Config) Page
- **No changes to structure.** Everything applicable to both formats.
- May need SE-specific match configuration (best-of for SE rounds, SE final).
- Bracket type choice does NOT belong here — it's tournament-specific, not global.

### Bracket Generation (Setup Actions in Match Controls)
- **This is where the operator chooses the format.**
- Replace the single "Generate X-Player Bracket" button with **two format cards**:

  **Single Elimination Cup**
  *Players are eliminated after one loss*
  [Generate X-Player Bracket]

  **Double Elimination Cup**
  *Players get a second chance through the backside*
  [Generate X-Player Bracket]

- Cards have descriptions so operators understand the difference at a glance
- Two distinct cards are much harder to misclick than two similar buttons
- The cost of choosing wrong is high (full tournament reset), so clarity matters
- Pattern scales naturally if more formats are added in the future
- `format` gets set at generation time alongside `bracketSize`
- Existing confirmation dialog follows, reflecting the chosen format

### Bracket Confirmation Dialog
- Title clearly states the format: **"Generate 8-Player Single Elimination Bracket?"** or **"Generate 8-Player Double Elimination Bracket?"**
- This is the safety net — if the operator picked the wrong format card, they see it here before anything irreversible happens
- Cancel remains the default action (Enter cancels)
- Player list, bye count, and warning message unchanged from current behavior

---

## Architectural Decisions (Agreed)

### Hardcoded Progression + Transaction History
- **Non-negotiable.** SE uses the same foundational architecture as DE: hardcoded match progression tables + transaction-based history. All current reliability stems from this.

### Separate SE Progression Tables — IMPLEMENTED
- `SE_MATCH_PROGRESSION` added to `clean-match-progression.js`, alongside `DE_MATCH_PROGRESSION`
- `MATCH_PROGRESSION` renamed to `DE_MATCH_PROGRESSION` across all files for naming consistency
- Five bracket sizes: **2, 4, 8, 16, 32** (2 and 4 are SE-only; 8, 16, 32 derived from DE frontside)
- SE tables are the DE frontside winner paths with loser entries removed — verified by inspection
- Separate tables eliminate any risk of SE/DE interference
- `advancePlayer()` already handles missing loser paths (`if (rule.loser && loser)`), so SE tables simply have no loser entries to follow
- Same file, same source of truth — one place to look for all bracket progression logic
- **Purely additive** — no existing code references SE_MATCH_PROGRESSION yet, zero risk to running application

### Separate Rendering Paths
- `renderCleanBracket()` checks `format` once at the top, then branches into SE or DE rendering
- Each branch does its own thing cleanly — no interleaving of SE/DE conditionals throughout the rendering code
- SE rendering can evolve independently (spacing, centering, labels) without touching DE
- DE stays rock solid — zero risk of SE changes accidentally breaking it

### Tournament Bracket Page Decoupling
- The bracket page has format-agnostic chrome (menu buttons, zoom, watermarks, CAD-box) and format-specific content (match layout + title)
- These are already mostly decoupled — the match layout is rendered independently inside the bracket area
- For SE: only the match layout changes (frontside only). All surrounding chrome stays untouched

### Already SE-compatible (no changes needed)
- **`advancePlayer()`** — checks `if (rule.loser && loser)` before advancing losers
- **Undo system** — checks `if (progression.loser)` before walking loser paths
- **Match Command Center** — groups by prefix, naturally shows fewer groups
- **Points system** — generic placement-based, works with any tier structure
- **Auto-advancement/walkovers** — uses `advancePlayer()` which handles missing loser paths

### Format-aware progression table lookup — IMPLEMENTED
- **`getProgressionTable()`** helper returns `SE_MATCH_PROGRESSION` or `DE_MATCH_PROGRESSION` based on `getFormat()`
- All 8 `DE_MATCH_PROGRESSION[...]` lookups in `clean-match-progression.js` replaced with format-aware versions
- `getDownstreamMatches()` also format-aware (uses explicit format check since it takes bracketSize as param)
- Remaining lookups in `bracket-rendering.js`, `main.js`, `analytics.js` are display/rendering code — will be updated in later steps

### Need conditional branching (extend existing functions)
- **`completeMatch()`** — hardcoded BS-FINAL and GRAND-FINAL hooks need `format` check
- **`generateAllMatches()`** — conditionally skip backside/finals generation
- **`renderCleanBracket()`** — branch into SE or DE rendering path
- **`calculateAllRankings()`** — SE ranking logic (placement = which round you lost in)
- **Tournament completion** — detect which match ends the tournament per format

### Truly new (but small)
- ~~SE MATCH_PROGRESSION tables (frontside entries without loser paths)~~ — **DONE**
- `format` field on tournament object (backward compatible — absent = DE)
- Format selection cards in Setup Actions UI

---

## Bracket Sizes (Agreed)

### Power-of-2 Brackets with Byes
- SE uses the same power-of-2 rounding and bye system as DE
- Supported bracket sizes: **4, 8, 16, 32** (minimum 4 players, same as DE)
- Non-power-of-2 player counts are handled with byes in R1, same as DE today
- The existing seeding and auto-advancement system handles this identically

### Why Minimum 4 Players?
- 2-player SE is a single match — the full bracket system is overkill
- 3-player SE puts one player directly in the final via bye — unfair with no backside safety net
- 4 players is where SE becomes meaningful: 2 real semifinals, a real final, and a real bronze match

### Why Not Compact (Non-Power-of-2) Brackets?
- 5 players without rounding: the 5th player would skip to the Final having played zero matches (unfair)
- Power-of-2 + byes ensures the bye advantage is limited to one round
- Reuses existing seeding, auto-advancement, and bracket generation logic

### Examples
- **4 players** → 4-bracket: 2 semis + Final + Bronze = 4 matches
- **5 players** → 8-bracket, 3 byes: 1 real R1 match, 2 SF + Final + Bronze = 5 real matches
- **8 players** → 8-bracket: 4 QF + 2 SF + Final + Bronze = 8 matches

### SE Progression Tables (Minimal)
Bronze and Final are regular FS rounds (no standalone `BRONZE` ID). Semifinal losers route to the Bronze round, semifinal winners route to the Final round. Final gating: the Final cannot start until the Bronze match is completed.

**4-player:** (Semis → Bronze → Final)
```
'FS-1-1': { winner: ['FS-3-1', 'player1'], loser: ['FS-2-1', 'player1'] }
'FS-1-2': { winner: ['FS-3-1', 'player2'], loser: ['FS-2-1', 'player2'] }
'FS-2-1': {}    // Bronze (no further progression)
'FS-3-1': {}    // Final (triggers tournament completion)
```

**8-player:** (QF → SF → Bronze → Final)
```
'FS-1-1': { winner: ['FS-2-1', 'player1'] }
'FS-1-2': { winner: ['FS-2-1', 'player2'] }
'FS-1-3': { winner: ['FS-2-2', 'player1'] }
'FS-1-4': { winner: ['FS-2-2', 'player2'] }
'FS-2-1': { winner: ['FS-4-1', 'player1'], loser: ['FS-3-1', 'player1'] }
'FS-2-2': { winner: ['FS-4-1', 'player2'], loser: ['FS-3-1', 'player2'] }
'FS-3-1': {}    // Bronze
'FS-4-1': {}    // Final
```

**16, 32-player:** Same pattern — only the semifinal round has loser paths (to the Bronze round). All earlier rounds have winner paths only. Bronze is always the penultimate round, Final is always the last round.

---

## Resolved Design Questions

### Match ID Format (Decided: Keep `FS-` prefix)
- SE matches use the same `FS-` prefix as DE frontside matches
- Match IDs always exist within a tournament that has a `format` field — that's the authoritative source for format, not the prefix
- All existing CSS selectors, match ID parsing, Match Command Center grouping, and rendering code works unchanged
- The absence of `BS-` matches is what makes it SE, not a different prefix
- Zero code changes needed for match ID handling
- **Display labels**: SE strips the `FS-` prefix at render time — operators see `1-1`, `2-1`, `3-1` instead of `FS-1-1`, `FS-2-1`, `FS-3-1`. The "Frontside" concept doesn't exist in SE, so the prefix is meaningless to the operator. Internal IDs remain `FS-` for code reuse.

### Tournament Data Format (Decided: `format` field)
- New `format` field on the tournament object, set at bracket generation time
- **No field present** → DE (backward compatible with all existing tournaments and exports)
- **`format: 'DE'`** → explicitly Double Elimination
- **`format: 'SE'`** → Single Elimination
- Field name is `format` (not `bracketType`) — future-proof for non-bracket formats like League
- New tournaments always set the field explicitly; the fallback-to-DE logic only matters for importing legacy data
- Export/import naturally compatible: old exports without `format` import as DE, new exports carry the field

### SE Final Match (Decided: Last FS round = Final, gated behind Bronze)
- The last FS round match (e.g., `FS-4-1` for 8-player) has `{}` in the progression table — triggers tournament completion
- No GRAND-FINAL, no BS-FINAL — those are DE-only concepts
- The Bronze round also has `{}` (no further progression), but only the Final triggers tournament completion (identified by `isSEFinalMatch()` vs `isSEBronzeMatch()`)
- **Final gating**: The Final match cannot be started until the Bronze match is completed. Both matches receive their players simultaneously (from the semifinals), but the `canMatchStart()` function blocks the Final while Bronze is pending. This ensures the natural order: Bronze → Final
- Tournament completion = Final match completed (Bronze is always completed first due to gating)

### SE Placements (Decided: Derived from round + bronze match)
- Placement = which round you were eliminated in, shown as labels on the bracket
- 8-player: 1st (final winner), 2nd (final loser), 3rd (bronze winner), 4th (bronze loser), 5th-8th (QF losers)
- Earlier rounds calculated generically from round number — no separate placement mapping needed
- **Bronze match resolves 3rd/4th**: Bronze is always played before the Final (gated). Winner = 3rd, loser = 4th
- **Dropout zones**: Players eliminated in the same round share a placement tier (e.g., all QF losers are "5th-8th"). The bronze match splits the semifinal losers into definitive 3rd and 4th positions

### Bronze Match (Decided: Always included, gates the Final)
- 3rd place match between the two semifinal losers — **always generated** for 4+ player SE brackets
- **Not configurable** — no toggle needed. Simplifies code, progression tables, and operator experience
- **Match ID**: Regular FS-prefixed ID in its own round (e.g., `FS-3-1` for 8-player, `FS-2-1` for 4-player) — no standalone special ID
- **Display label**: "BRONZE" on the match card badge (render-time label based on `isSEBronzeMatch()`)
- **SE-only** — DE already determines 3rd place through the backside bracket
- **Relevant for 4+ player brackets** — minimum SE bracket size is 4 players
- Semifinal losers route to Bronze via loser paths in the progression table (8-player example):
  ```
  'FS-2-1': { winner: ['FS-4-1', 'player1'], loser: ['FS-3-1', 'player1'] }
  'FS-2-2': { winner: ['FS-4-1', 'player2'], loser: ['FS-3-1', 'player2'] }
  'FS-3-1': {}  // Bronze — no further progression
  'FS-4-1': {}  // Final — triggers tournament completion
  ```
- **Gates the Final** — the Final cannot start until the Bronze match is completed. This is enforced by `canMatchStart()` in bracket-rendering.js. The Final shows as "Waiting" while Bronze is pending. This ensures the natural tournament order: Bronze → Final
- **`advancePlayer()` handles this naturally** — already checks `if (rule.loser && loser)`, so the loser paths to Bronze work without any engine changes
- **Bracket rendering**: Bronze and Final positioned identically to DE's BS-FINAL and GRAND-FINAL — two matches stacked vertically to the right of the semifinal round, with Bronze on top and Final on bottom. Same coordinates, same connector pattern. Reuses `renderFinalMatches()` positioning logic

### SE Match Display Labels (Decided: Strip FS- prefix, special labels for Final/Bronze)
- Regular SE matches strip the `FS-` prefix at render time: `FS-1-1` → `1-1`, `FS-2-1` → `2-1`
- The SE Final match displays **"FINAL"** as its badge label (identified by `isSEFinalMatch()`)
- The Bronze match displays **"BRONZE"** as its badge label (identified by `isSEBronzeMatch()`)
- Internal match IDs are all `FS-` prefixed — only the visual badge changes
- Consistent with DE where `BS-FINAL` and `GRAND-FINAL` have special display treatment

### SE Round Display Names (Decided: Named from the end)
Round names are assigned from the Final backwards. The last four rounds always have fixed names; anything earlier is "Round N".

**Rule:** Final → Bronze Final → Semifinals → Quarterfinals → Round N (counting from 1)

| Bracket | R1 | R2 | R3 | R4 | R5 | R6 |
|---------|----|----|----|----|----|----|
| 4-player | Semifinals | Bronze Final | Final | | | |
| 8-player | Quarterfinals | Semifinals | Bronze Final | Final | | |
| 16-player | Round 1 | Quarterfinals | Semifinals | Bronze Final | Final | |
| 32-player | Round 1 | Round 2 | Quarterfinals | Semifinals | Bronze Final | Final |

- Displayed on match cards (replaces "Frontside Round X") and Match Controls section headers
- Internal match IDs and round numbers unchanged — display names are render-time only
- `getSERoundDisplayName(round, bracketSize)` in `clean-match-progression.js` — single source of truth
- `getRoundDescription(match)` in `bracket-rendering.js` calls it for SE matches; DE path unchanged

## Open Design Questions

### SE Match Configuration
What match-length settings does SE need? Possibilities:
- Regular rounds (best-of)
- Semifinal (best-of)
- Final (best-of)
- Bronze match (best-of)

---

## Match Controls for SE (Agreed)

### Rolling Two-Column Layout
- **Left column**: Current round (lowest incomplete round)
- **Right column**: Next round (where winners are advancing to)
- As the current round completes, both columns shift forward
- Example for 8-player SE:
  1. Left = R1 (Quarterfinals), Right = R2 (Semifinals)
  2. R1 completes → Left = R2 (Semifinals), Right = R3 (Final)
  3. R2 completes → Left = R3 (Final), Right = empty or tournament results

### Early Starts
- Operators can start matches in later rounds before the current round is fully complete
- The column view is driven by **round completion**, not by activity in later rounds
- If R2 matches are started while R1 is still in progress, both R1 and R2 matches appear in their respective columns
- Columns only shift when ALL matches in the left column's round are completed

### Referee Suggestions
- No behavioral change from DE — shows Recent Losers, Recent Winners, Recent Assignments
- Works identically for both formats

---

## Future Enhancement: Seeded Brackets

Both SE and DE currently use **random draw** for player placement. Seeded brackets (placing top-ranked players in favorable positions) would be a natural future addition.

Seeding only affects **one step**: which player goes into which slot at generation time. Once the bracket is populated, all progression logic, auto-advancement, undo, and rendering work identically regardless of how players were placed. This makes it a clean, independent feature that can be added to both formats later without any architectural changes.

---

## SE Bracket Rendering (Agreed)

### Visual Elements
The bracket page has format-agnostic chrome and format-specific content. For SE:

| Element | DE | SE |
|---------|----|----|
| Title/Date | Keep | Keep |
| "FRONTSIDE" / "BACKSIDE" headers | Keep | **Remove** — no backside to distinguish from |
| Backside gradient | Keep | **Remove** |
| Progression arrows/lines | Winner + loser paths | **Winner paths only** (except SF → Bronze loser feed) |
| Placement labels | On backside rounds | **On each round column** |
| Match cards | Same | **Same** — identical structure, styling, interaction |
| Finals area | BS-FINAL + GRAND-FINAL | **Bronze round + Final round** — same layout, same positions |

### Layout
- SE renders as a clean **left-to-right tournament tree**, starting from the left edge
- R1 on the far left, progressing through each round to the Final on the right — natural reading direction
- No centering — avoids dead negative space on the left half of the screen
- Same match cards, different coordinate map — positioning is the only difference
- No "FRONTSIDE" label needed — the bracket type is established at generation time
- **Finals area** (4+ player brackets): Bronze and Final in separate columns for 8-player; shared column for 4/16/32-player. See below for the 8P staggered layout.

### 8-Player Finals Area (Staggered Layout)
The 8P bracket uses a staggered finals layout to visually represent round progression. BRONZE FINAL and FINAL are in separate columns, each spaced the same gap apart as all other round columns:

```
QF (550)    SF (905)    BRONZE (1279)    FINAL (1615)
```

- Column spacing = `matchWidth + horizontalSpacing` = 355px throughout
- BRONZE is at `sf1Y` (same height as SF1, Y=335)
- FINAL is at `centerY` (vertically centered between SF1 and SF2, Y=500)
- BRONZE center is at the midpoint of the FINAL horizontal line
- A vertical line drops from BRONZE's bottom-center down to the FINAL horizontal, making the SF2 → BRONZE path visually legible (SF2 loser travels right along the FINAL line, then branches up to BRONZE)
- The SF1→BRONZE direct horizontal is intentionally omitted — BRONZE is fed only from below

This layout is unique (no established convention exists for SE bronze visualization). It reads as left-to-right round progression: QF → SF → Bronze → Final.

**Open question: communicating that BRONZE is played between SF losers**
The bracket currently doesn't make it explicit that the two players in BRONZE FINAL are the losers of SF1 and SF2 — a viewer unfamiliar with the format might not know who ends up there. Options under consideration:
- A subtitle on the BRONZE match card: *"Loser SF1 vs Loser SF2"* (or just *"3rd place match"*)
- A small annotation label below the BRONZE FINAL column header
- The connector line style (dotted = loser path) doing the work implicitly — see refinement below
- Some combination of the above

No decision yet — noting for later.

**Implemented: dashed vertical connector**
The vertical line from BRONZE's bottom-center down to the FINAL horizontal is rendered as a dashed line (`repeating-linear-gradient`, 10px dash / 10px gap). This:
- Visually distinguishes the loser path (dashed) from the winner path (solid)
- Remains clearly visible even when the bracket is zoomed out to 65%
- Reinforces that BRONZE is a secondary destination — losers arrive via this connector

### Alternative: Drop-Down Bronze Layout (Under Consideration)

An alternative where SF losers "drop down" below the main bracket to reach BRONZE, keeping the winner path clean and horizontal:

```
QUARTERFINALS         SEMIFINALS            FINAL
[ FS-1-1 ] ───┐
              ├───── [ FS-2-1 ] ──────┐
[ FS-1-2 ] ───┘           │           │
                          │           ├────────── [ FS-4-1 ] (GOLD FINAL)
[ FS-1-3 ] ───┐           │           │
              ├───── [ FS-2-2 ] ──────┘
[ FS-1-4 ] ───┘           │
                          │
                  (Losing Players Drop)
                          │
                          ▼
                    [ FS-3-1 ] (BRONZE FINAL)
                    (Loser FS-2-1 vs. Loser FS-2-2)
```

**Key differences from the staggered layout:**
- Winner path (QF → SF → Final) is a pure left-to-right flow — no visual interruption
- BRONZE sits below the main bracket, fed by a downward drop from the SF spine
- Suggests a natural hierarchy: winners go right, losers drop down
- Also note: FINAL relabeled as "GOLD FINAL" in this concept — worth considering whether that's more expressive than "FINAL"
- Would require the bracket canvas to extend downward to accommodate BRONZE below the SF rows

**Decision pending.**

### Alternative: Loser-Branch Bronze Layout (Under Consideration)

A third option where SF winners travel straight right to FINAL (unbroken horizontal), and SF losers branch sideways via dashed/secondary lines to a centrally-positioned BRONZE:

```
SEMIFINALS (Col 2)      BRONZE (Col 3)         FINAL (Col 4)
[ FS-2-1 ] ━━━━━━━━━━━(Winner goes past)━━━━━━━━━▶ [ FS-4-1 ]
    │                      ▲                      ▲
    └- - -(Loser) - - - ▶[ FS-3-1 ]               ┃
    ┌- - -(Loser) - - - - -┘                      ┃
    │                                             ┃
[ FS-2-2 ] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Key differences from the other layouts:**
- Winner path is the dominant visual — solid, unbroken horizontal to FINAL
- Loser path is visually secondary — dashed or lighter lines branching to BRONZE
- BRONZE is in a middle column, vertically centered between the two SFs
- No ambiguity about which match is the "main" event
- Requires two distinct line styles (winner vs. loser) — adds rendering complexity
- Most closely resembles how DE brackets already distinguish winner/loser paths

**Decision pending.**

### Round Placement Labels
Round labels appear above each column. They use the round display name (from `getSERoundDisplayName()`), not the placement range. This is more natural for operators than placement tiers and keeps the bracket self-documenting.

**8-player column labels (implemented):**
```
QUARTERFINALS    SEMIFINALS    BRONZE FINAL    FINAL
```

**16-player column labels (planned):**
```
ROUND 1    QUARTERFINALS    SEMIFINALS    BRONZE FINAL    FINAL
```

**32-player column labels (planned):**
```
ROUND 1    ROUND 2    QUARTERFINALS    SEMIFINALS    BRONZE FINAL    FINAL
```

Labels for BRONZE FINAL and FINAL are handled by `createSEBracketLabels()` (which also controls their x-position). Labels for all earlier rounds are handled by `createSEPlacementLabels()`.

---

## Further Discussion Needed

- Tournament status bar / info display
- Resolve open design questions (SE match configuration)
- Review `window.DE_MATCH_PROGRESSION` developer console export — may need to also expose `SE_MATCH_PROGRESSION` for debugging, or unify into a single accessor

---

## Implementation Roadmap

Suggested next steps, roughly in dependency order. Each step is designed to be low-risk and independently testable.

### Step 1: `format` field on tournament object — IMPLEMENTED
- `getFormat()` helper added to `tournament-management.js` — returns `'DE'` when field is absent (backward compat)
- `format` field added to all 5 tournament object construction sites (create, load, import, save, export)
- `format` property added to Tournament typedef in `types.js`
- Purely additive — no behavior change, just plumbing for Step 2

### Step 2: Format selection UI (Setup Actions) — IMPLEMENTED
- Two format cards in Setup Actions: "Single Elimination Cup" and "Double Elimination Cup"
- Each card has a description and its own format-aware generate button
- `calculateBracketSize(playerCount, format)` helper added for format-aware sizing
- SE supports bracket sizes 2, 4, 8, 16, 32 (minimum 2 players); DE supports 8, 16, 32 (minimum 4 players)
- Confirmation dialog title shows format: "Generate X-Player Single/Double Elimination Bracket?"
- `pendingFormat` flow carries the chosen format from card → confirmation → `tournament.format`
- **Note**: SE bracket generation logic (Step 3) not yet implemented — generating SE currently produces DE match structure

### Step 3: SE bracket generation (`generateAllMatches()`) — IMPLEMENTED
- `generateAllMatches()` checks `getFormat()` — for SE, skips `generateBacksideMatches()` and `generateFinalMatches()`
- `createOptimizedBracketV2()` bracket size whitelist expanded to include 2 and 4
- `calculateCleanBracketStructure()` already generic (uses `Math.log2`) — works for all sizes
- `generateFrontsideMatches()` already generic — iterates structure, works for all sizes
- Auto-advancement/walkovers work unchanged (same `advancePlayer()` which checks `if (rule.loser && loser)`)

### Step 4: SE match completion (`completeMatch()`) — IMPLEMENTED
- Tournament completion now detects any match with `{}` progression (empty object = tournament final)
- Works for both DE (GRAND-FINAL has `{}`) and SE (last FS round has `{}`) — same detection logic
- 1st/2nd place set from final match winner/loser; 3rd place from BS-FINAL loser only in DE
- Undo of tournament-ending match also format-aware (detects `{}` instead of hardcoded GRAND-FINAL)

### Step 5: SE bracket rendering — IMPLEMENTED
- `renderCleanBracket()` branches to `renderSEBracket()` when `tournament.format === 'SE'`; DE path completely untouched
- `renderSEBracket()` dispatches to `render4/8/16/32PlayerSEMatches()` — same grid/coordinate system as DE, frontside-only
- **4-player**: SFs at Bronze/Final Y positions (420/580) for clean horizontal connections; finalsX = round1X + matchWidth + 4×horizontalSpacing
- **8/16/32-player**: SF positions mirror DE frontside semi positions — always Y=335/665 regardless of bracket size; preliminary rounds use identical Y formulas as their DE counterparts
- **Progression lines** (`create4/8/16/32PlayerSELines()` in bracket-lines.js):
  - L-shaped lines connect each round to the next (same `createLShapedProgressionLine()` as DE)
  - Shared vertical spine at `finalsX - 40` with horizontal branches to Bronze (upper) and Final (lower)
  - `createSEFinalsLines()` is a reusable helper called by all four size functions
- **Labels**: `createSEBracketLabels()` adds tournament header (centered on bracket) + BRONZE FINAL / FINAL column labels; `createSEPlacementLabels()` adds round name labels above each earlier column (e.g., "QUARTERFINALS" above QF column, "SEMIFINALS" above SF column)
- **Match badges**: "BRONZE" / "FINAL" shown on SE special match cards (via `isSEBronzeMatch()` / `isSEFinalMatch()`)
- **Zoom/pan defaults** (tunable): 4P zoom=0.8, 8P zoom=0.65, 16P zoom=0.45, 32P zoom=0.33; `resetZoom()` updated with SE-specific values

### Step 6: SE rankings (`calculateAllRankings()`) — IMPLEMENTED
- `calculateSERankings()` derives placement from which round a player was eliminated in
- Generic formula: losers in round R get placement `2^(totalRounds - R) + 1`
- Works for all bracket sizes (2, 4, 8, 16, 32) — no hardcoded match ID lookups
- Live rankings update after every match completion (same as DE)
- Feeds into existing leaderboard points system unchanged

### Step 7: Match Controls adaptation — IMPLEMENTED
- `getSERoundDisplayName(round, bracketSize)` added to `clean-match-progression.js` — single source of truth for SE round names
- `getRoundDescription(match)` updated in `bracket-rendering.js` to use it for SE matches (DE unchanged)
- Rolling two-column layout: left = earliest ready round, right = remaining rounds
- SE live matches render in left column only (no frontside/backside split)
- Section headers show proper round names with emojis: 🏆 Final, 🥉 Bronze Final, ⚪ Semifinals/Quarterfinals/Round N
- **Known polish items** (not yet addressed):
  - Referee suggestions show raw round keys ("FS-R1") instead of display names ("Semifinals")
  - Match card headers show raw match IDs ("FS-3-1") instead of friendly labels for Bronze/Final
  - Progression text shows DE destinations for SE matches (e.g., "Leads to GRAND-FINAL and BS-FINAL" on Bronze match, "Leads to FS-2-1 and BS-1-1" on QF matches) — `getMatchProgressionText()` needs to be format-aware
  - Leaderboard ranking tier labels use DE sizing — 8-player SE QF losers show "5th-6th" instead of correct "5th-8th". The `calculateSERankings()` placement tiers need SE-specific labels

### Step 8: Testing & polish
- Test all five bracket sizes (2, 4, 8, 16, 32)
- Test non-power-of-2 player counts with byes
- Test undo operations in SE tournaments
- Test mixed leaderboard (SE + DE tournaments)
- CAD-box: update match count / bracket info for SE

---

## Appendix: Series / League (Future, Licensed)

Context for how SE feeds into the broader roadmap. Series/League is a separate licensed feature that builds on the SE and QR/MQTT foundations.

### Format
- **Two teams**, four players each + one reserve per team
- **Round-robin singles**: Each player plays against each opponent (4x4 = 16 singles matches)
- **Doubles matches**: 2 doubles matches per round
- **Reserve exchange**: A team can swap one player for the reserve between matches

### What Series/League needs from the platform
- SE-style match progression (round-robin, not elimination bracket)
- Player-to-team assignment with reserve slot
- Match scheduling (round-robin order, not bracket-driven)
- Team scoring (aggregate of individual match results)
- Reserve substitution tracking (who was swapped and when)
- QR or MQTT for match result transfer (licensed feature — MQTT only)

### Key differences from cups
- Matches are scheduled in a fixed order, not bracket-driven
- No elimination — all matches are played regardless of results
- Team aggregate scoring replaces bracket progression
- Doubles matches require pairing two players per side

> **Note:** Series/League is a licensed feature, only available through the network bridge (MQTT). It cannot be started via QR. See **Docs/NETWORK-LAYER.md** for licensing boundaries.
