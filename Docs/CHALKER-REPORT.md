# Chalker Federation Report - Implementation Plan

**Status:** Planning
**Goal:** Produce n01-compatible scoresheets that can be copy-pasted to the county darts federation.

---

## Target Format (n01 Reference)

```
* Nya Pikado C              Newton A
  Kenny Cederberg  1 Leg    Simon Levin
Scored  To Go               Scored  To Go
          501                         501
85      416       3    58       443
180     236       6    41       402
43      193       9    140      262
43      150      12    121      141
95       55      15     60       81
35       20      18     x3
```

Key elements:
- **Asterisk (*)** marks who throws first in each leg
- **"xN"** in scored column = checkout using N darts (replaces final score)
- **Empty "To Go"** on checkout row
- **Team/club name** above player name
- **"N Leg"** format between player names
- **No match statistics** in the report itself (separate concern)

---

## Stages

### Stage 1: Checkout Dart Count - DONE
- [x] When a player checks out (remaining reaches 0), prompt: "Darts used? 1 / 2 / 3" *(already existed)*
- [x] Store checkout dart count per leg in match history *(already existed)*
- [x] Display as "xN" on stats page scoresheet (checkout row)
- [x] Empty "To Go" cell on checkout row
- [x] Merged `renderLiveStatsScoresheets` and `renderLegScoresheets` into single function
- [x] Extracted `formatVisitDisplay()` helper - single source of truth for visit rendering

---

### Stage 2: Throws First Tracking - DONE
- [x] `firstLegStarter` already tracked in state via starting player modal
- [x] Alternates each leg via `getLegStarter()`
- [x] Persisted `firstLegStarter` in match history (showEndScreen, saveMatchToHistory, showLiveStats)
- [x] Asterisk (*) displayed on throws-first player name in leg scoresheet headers
- [x] Backward compatible: old matches without `firstLegStarter` show no asterisk

### Stage 2b: Expanded Match Statistics - DONE
- [x] Added n01-compatible score range counts: 60+, 80+, 100+, 120+, 140+, 170+, 180
- [x] Added High Finish (highest checkout score per player)
- [x] Added Best Leg / Worst Leg (fewest/most darts in a won leg)
- [x] Kept existing: Short Legs, 100+ Finishes, First 9 Avg, Match Avg, Leg Avgs
- [x] Refactored stats tables to dynamic generation (`populateMatchStats()` single source of truth)
- [x] Eliminated ~42 individual DOM element references across 3 screens
- [x] High Finish, Best Leg, Worst Leg computed from raw leg data (works for all matches)

---

### Stage 3: Team/Club Names (Optional Fields)
- [ ] Add optional "Team 1" and "Team 2" fields to config form
- [ ] Display above player names in scoresheet headers
- [ ] Omit if left empty (tournament/casual mode doesn't need them)

**Data change:** Config gains `team1: string`, `team2: string`

**Discussion points:**
- Should these persist between matches (same session, same teams)?
- Pre-fill from last match?

---

### Stage 4: Report Formatting
- [ ] Reformat leg scoresheets to match n01 layout
- [ ] Leg headers: "1 Leg", "2 Leg" (not "Leg 1")
- [ ] Asterisk on "throws first" team/player name
- [ ] "xN" checkout notation
- [ ] Starting score row (empty scored, 501 in To Go)
- [ ] Copy-paste friendly rendering

**Discussion points:**
- Replace current scoresheet layout, or add a "Federation Report" button/view?
- Should the report be a separate page, a modal, or a reformatted version of stats?
- Include match title/description header? (e.g., "Div 3D Singles3 C-C (Hemma)")

---

### Stage 5: Report Button & Copy-to-Clipboard
- [ ] "Report" button on match complete / history detail screens
- [ ] Generates plain text version of the scoresheets (n01-compatible)
- [ ] Tab/space-aligned for clean pasting into messages, emails, federation sites
- [ ] "Copy" button with visual confirmation
- [ ] Includes match header (players, format, score)

**Discussion points:**
- Render as a modal with pre-formatted text, or a separate screen?
- Include match metadata (date, venue, etc.)?
- Should the report include match statistics, or just the leg scoresheets?

---

## Data Model Impact

### Current Leg Structure
```javascript
{
  legNumber: 1,
  winner: 'player1',
  visits: [
    { player: 1, score: 85, remaining: 416 },
    { player: 2, score: 58, remaining: 443 },
    // ...
  ]
}
```

### Implemented Changes
```javascript
// Match object now includes:
{
  firstLegStarter: 1,       // DONE: who threw first in leg 1 (1 or 2, alternates)
  // checkoutDarts already tracked per visit via isCheckout + dartsUsed
}
```

### Config Additions (Stage 3 - TODO)
```javascript
{
  // ... existing config
  team1: 'Nya Pikado C',    // TODO: optional team/club name
  team2: 'Newton A',        // TODO: optional team/club name
}
```

---

## Backwards Compatibility

- All new fields are optional
- Existing match history without `firstLegStarter` shows no asterisk
- Old matches without new stat fields (60+, 80+, etc.) show 0
- High Finish, Best Leg, Worst Leg show 0 for players who didn't win legs
- Empty team names simply omitted from display
- No breaking changes to current functionality

---

## Related Documents

- **NETWORK-LAYER.md**: Network integration (QR codes encode match results including checkout data)
- **CHALKER-PERSISTENCE.md**: Chalker storage architecture
