# Single Elimination Support - Design & Planning

**Status:** Early design discussion
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
- Supported bracket sizes: **2, 4, 8, 16, 32**
- SE supports smaller brackets (2, 4) that DE doesn't — practical for small club events or quick pickup tournaments
- Non-power-of-2 player counts are handled with byes in R1, same as DE today
- The existing seeding and auto-advancement system handles this identically

### Why Not Compact (Non-Power-of-2) Brackets?
- 5 players without rounding: the 5th player would skip to the Final having played zero matches (unfair)
- Power-of-2 + byes ensures the bye advantage is limited to one round
- Reuses existing seeding, auto-advancement, and bracket generation logic

### Examples
- **2 players** → 2-bracket: 1 match (Final)
- **3 players** → 4-bracket, 1 bye: 1 auto-advance in R1, 1 real R1 match, 1 Final = 2 real matches
- **4 players** → 4-bracket: 2 semis + 1 Final = 3 matches
- **5 players** → 8-bracket, 3 byes: 1 real R1 match, 2 real R2 matches, 1 Final = 4 real matches
- **8 players** → 8-bracket: 4 QF + 2 SF + 1 Final = 7 matches

### SE Progression Tables (Minimal)
**2-player:** `{ 'FS-1-1': {} }`

**4-player:**
```
'FS-1-1': { winner: ['FS-2-1', 'player1'] }
'FS-1-2': { winner: ['FS-2-1', 'player2'] }
'FS-2-1': {}
```

**8, 16, 32-player:** Same frontside structure as DE, but with no loser paths.

---

## Resolved Design Questions

### Match ID Format (Decided: Keep `FS-` prefix)
- SE matches use the same `FS-` prefix as DE frontside matches
- Match IDs always exist within a tournament that has a `format` field — that's the authoritative source for format, not the prefix
- All existing CSS selectors, match ID parsing, Match Command Center grouping, and rendering code works unchanged
- The absence of `BS-` matches is what makes it SE, not a different prefix
- Zero code changes needed for match ID handling

### Tournament Data Format (Decided: `format` field)
- New `format` field on the tournament object, set at bracket generation time
- **No field present** → DE (backward compatible with all existing tournaments and exports)
- **`format: 'DE'`** → explicitly Double Elimination
- **`format: 'SE'`** → Single Elimination
- Field name is `format` (not `bracketType`) — future-proof for non-bracket formats like League
- New tournaments always set the field explicitly; the fallback-to-DE logic only matters for importing legacy data
- Export/import naturally compatible: old exports without `format` import as DE, new exports carry the field

### SE Final Match (Decided: Last FS round = Final)
- The last FS round match (e.g., `FS-3-1` for 8-player) has `{}` in the progression table — tournament complete
- No GRAND-FINAL, no BS-FINAL — those are DE-only concepts
- The match with `{}` directly triggers tournament completion, same pattern as DE's GRAND-FINAL

### SE Placements (Decided: Derived from round)
- Placement = which round you were eliminated in, shown as labels on the bracket
- 8-player: 1st (final winner), 2nd (final loser), 3rd-4th (SF losers), 5th-8th (QF losers)
- Calculated generically from round number — no separate placement mapping needed

## Open Design Questions

### 3rd Place Match
Should SE include an optional 3rd place match (bronze match between semifinal losers)? Common in cup formats but adds complexity. Could be added later.

### SE Match Configuration
What match-length settings does SE need? Possibilities:
- Regular rounds (best-of)
- Semifinal (best-of)
- Final (best-of)

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
| Progression arrows/lines | Winner + loser paths | **Winner paths only** |
| Placement labels | On backside rounds | **On each round column** |
| Match cards | Same | **Same** — identical structure, styling, interaction |

### Layout
- SE renders as a clean **left-to-right tournament tree**, starting from the left edge
- R1 on the far left, progressing through each round to the Final on the right — natural reading direction
- No centering — avoids dead negative space on the left half of the screen
- Same match cards, different coordinate map — positioning is the only difference
- No "FRONTSIDE" label needed — the bracket type is established at generation time

### Round Placement Labels
Same concept as DE's backside placement labels, applied to each round column. Losers of each round get the corresponding placement:

**8-player example:**
```
R1 (Quarterfinals)    R2 (Semifinals)    R3 (Final)
5th-8th Place          3rd-4th Place       1st / 2nd Place
```

**16-player example:**
```
R1                R2 (QF)           R3 (SF)          R4 (Final)
9th-16th Place    5th-8th Place     3rd-4th Place     1st / 2nd Place
```

This makes the bracket self-documenting — the operator can see at a glance what placement each round's losers receive. Also resolves the open design question about SE placements: they're inherently tied to the round.

---

## Further Discussion Needed

- Tournament status bar / info display
- Resolve open design questions (3rd place match, SE match configuration)
- Review `window.DE_MATCH_PROGRESSION` developer console export — may need to also expose `SE_MATCH_PROGRESSION` for debugging, or unify into a single accessor

---

## Implementation Roadmap

Suggested next steps, roughly in dependency order. Each step is designed to be low-risk and independently testable.

### Step 1: `format` field on tournament object
- Add `format` to tournament data at bracket generation time
- Helper function: `getFormat()` that returns `'DE'` when field is absent (backward compat)
- Small, safe change — no behavior difference yet, just data

### Step 2: Format selection UI (Setup Actions)
- Replace single "Generate Bracket" button with two format cards
- Update confirmation dialog to reflect chosen format
- Wire format choice into bracket generation so `format` gets stored
- This is where operators first see SE as an option

### Step 3: SE bracket generation (`generateAllMatches()`)
- When `format === 'SE'`: use `SE_MATCH_PROGRESSION`, skip backside/finals match creation
- Fewer matches created, but same generation logic otherwise
- Auto-advancement/walkovers work unchanged (same `advancePlayer()`)

### Step 4: SE match completion (`completeMatch()`)
- Add `format` check around BS-FINAL and GRAND-FINAL hooks
- SE tournament completion: detect when the `{}` match is completed
- Transaction history works unchanged

### Step 5: SE bracket rendering
- New rendering path in `renderCleanBracket()` for SE
- Left-to-right tree layout with round placement labels
- Winner-only progression lines
- No backside, no gradient, no FRONTSIDE/BACKSIDE headers

### Step 6: SE rankings (`calculateAllRankings()`)
- Placement derived from elimination round
- Feed into existing leaderboard points system

### Step 7: Match Controls adaptation
- Rolling two-column layout for SE
- Match Command Center shows only FS- groups

### Step 8: Testing & polish
- Test all five bracket sizes (2, 4, 8, 16, 32)
- Test non-power-of-2 player counts with byes
- Test undo operations in SE tournaments
- Test mixed leaderboard (SE + DE tournaments)
- CAD-box: update match count / bracket info for SE
