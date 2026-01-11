# Chalker Persistence Implementation

## Goal
Make Chalker crash-proof with persistent match data, settings, and match history.

## Status: COMPLETE

---

## Requirements

- [x] Current match survives page reload
- [x] Settings remembered between sessions
- [x] Match history stored (up to 1000 matches)
- [x] History accessible via keypad
- [x] Chalkboard is always the main view (no separate config screen)

---

## UI Changes

### Always-visible chalkboard
- App always shows scoring screen (chalkboard + keypad)
- No separate config screen - config is now a modal
- Idle state (no match): scores show "---", numpad disabled except action row

### New keypad row (above numpad)
```
| NEW | HISTORY | STATS |
```
- **NEW** - Opens "New Match?" modal during match (Rematch/New Match), config modal when idle
- **HISTORY** - Opens history screen with match list, tap for details
- **STATS** - Shows live statistics for the current match (same layout as Match Complete/History Detail)

### Simplified header
- Removed hamburger menu
- Header shows: Player 1 name | Leg score | Player 2 name
- All actions accessible via keypad action row

---

## Database Structure

```
Database: newton-chalker (version 1)

Stores:
  settings       - Single record (key: 'default')
  current_match  - Single record (key: 'active')
  match_history  - Completed matches, indexed by timestamp (max 1000)
```

---

## Implementation Phases

### Phase 1: IndexedDB Wrapper ✓
**File:** `chalker/js/db.js` (new)

- [x] Create db.js with async wrapper functions
- [x] `openDB()` - Initialize database and stores
- [x] `dbGet(store, key)` - Read single record
- [x] `dbPut(store, data)` - Write/update record
- [x] `dbDelete(store, key)` - Delete record
- [x] `dbGetAllByIndex(store, index, direction)` - Get all records sorted
- [x] `dbCount(store)` - Count records
- [x] Add db.js to index.html and sw.js cache

### Phase 2: Settings Persistence ✓
**File:** `chalker/js/chalker.js`

- [x] `loadSettings()` - Load saved settings on init
- [x] Pre-fill config form with last used values
- [x] `saveSettings()` - Save settings when match starts
- [x] Settings: laneName, player1Name, player2Name, startingScore, bestOf, maxRounds, doubleIn

### Phase 3: Current Match Persistence ✓
**File:** `chalker/js/chalker.js`

- [x] `saveCurrentMatch()` - Save full state to IndexedDB
- [x] `clearCurrentMatch()` - Delete saved match
- [x] `checkForActiveMatch()` - Check for saved match on load
- [x] Hook save into: recordVisit, completeTiebreak, undoLastVisit, submitEditedScore, completeMatchStart
- [x] Auto-resume when incomplete match found

### Phase 4: Match History ✓
**Files:** `chalker/js/chalker.js`, `chalker/index.html`, `chalker/styles/chalker.css`

- [x] `saveMatchToHistory()` - Save completed match with stats
- [x] `trimHistory()` - Delete oldest when > 1000 matches
- [x] History screen with match list (sorted newest first)
- [x] Display: player names, score, date/time, winner
- [x] Navigate back to scoring screen

### Phase 5: UI Restructure ✓
**Files:** `chalker/index.html`, `chalker/styles/chalker.css`, `chalker/js/chalker.js`

- [x] Add action row (NEW, HISTORY, SETTINGS)
- [x] Convert config screen to modal
- [x] Remove hamburger menu from header
- [x] `updateIdleDisplay()` - Idle state display (scores "---", numpad disabled)
- [x] "New Match?" modal with Rematch and New Match options
- [x] Scoring screen is now always active on load

### Phase 6: Polish ✓

- [x] CSS for action row (`.keypad-actions`, `.key-action`)
- [x] `updateKeypadState()` - Disable numpad when idle
- [x] Tablet scaling for action row in media query
- [x] Service worker cache version bumped to v21

### Phase 7: History Detail View ✓
**Files:** `chalker/js/chalker.js`, `chalker/index.html`, `chalker/styles/chalker.css`

- [x] History detail screen with match statistics
- [x] Leg-by-leg scoresheets with cumulative dart counts
- [x] Separate dart columns for each player (P1 left, P2 right)
- [x] Green highlighting for checkout scores
- [x] Back navigation to history list

### Phase 8: End Screen Unification ✓
**Files:** `chalker/js/chalker.js`, `chalker/index.html`, `chalker/styles/chalker.css`

- [x] Match Complete screen redesigned to match History Detail format
- [x] Same stats table structure with leg averages row
- [x] Leg-by-leg scoresheets with color coding on end screen
- [x] History button added to navigate to history from end screen
- [x] 24-hour timestamp format (removed AM/PM)
- [x] Dynamic short leg indicator (uses SHORT_LEG_THRESHOLDS lookup table)
- [x] Service worker cache version bumped to v29

### Phase 9: Live Stats Screen ✓
**Files:** `chalker/js/chalker.js`, `chalker/index.html`, `chalker/styles/chalker.css`

- [x] Renamed SETTINGS button to STATS
- [x] New Live Stats screen with same layout as Match Complete/History Detail
- [x] Shows current match statistics (tons, 180s, short legs, high outs, averages)
- [x] Displays completed leg scoresheets with color coding
- [x] Current leg in progress shown with "In Progress" badge and yellow border
- [x] Current remaining scores displayed at bottom of in-progress leg
- [x] Best-of indicator ("Bo3") shown in chalkboard center column
- [x] Back button returns to scoring screen
- [x] Service worker cache version bumped to v44

### Phase 10: Ton Ring Styling ✓
**Files:** `chalker/js/chalker.js`, `chalker/styles/chalker.css`

- [x] Ton scores (100+) on chalkboard display with black oval ring
- [x] Traditional darts chalking convention
- [x] Tight fit around digits (span-based styling, not cell-based)
- [x] Maintains existing color coding (blue for tons, green for 180s)
- [x] Service worker cache version bumped to v47

### Phase 11: Responsive Layout Cleanup ✓
**Files:** `chalker/styles/chalker.css`

- [x] Removed broken 768-1023px portrait media query (~200 lines)
- [x] All screen sizes now use same base styles
- [x] Reduced chalkboard font size from 2.25rem to 1.9rem for ton ring fit
- [x] Increased keypad button vertical padding from 8px to 10px for larger touch targets
- [x] Only remaining media query: landscape rotation for horizontal phones
- [x] Service worker cache version bumped to v52

### Phase 12: 140+ Score Tracking ✓
**Files:** `chalker/js/chalker.js`, `chalker/index.html`

- [x] Added `ton40s` counter to stats calculation (scores ≥140)
- [x] Added 140+ row to all three stats tables (Live Stats, Match Complete, History Detail)
- [x] Cumulative counting: Tons includes 140+, 140+ includes 180s
- [x] Service worker cache version bumped to v53

### Phase 13: Edit Validation Fix & Delete Last Visit ✓
**Files:** `chalker/js/chalker.js`

- [x] Fixed edit validation to prevent invalid game states
  - Simulates subsequent visits after proposed edit
  - Rejects edits that would leave remaining ≤1 (bust, impossible finish, or unprocessed checkout)
- [x] Added delete last visit feature
  - Submit empty edit (OK with no digits) to delete most recent visit
  - Only works on the very last visit in the current leg
  - Restores deleted player's turn
- [x] Service worker cache version bumped to v55

---

## Files Modified

| File | Changes |
|------|---------|
| `chalker/js/db.js` | New file - IndexedDB wrapper |
| `chalker/js/chalker.js` | Save/load hooks, idle state, UI logic, history detail view |
| `chalker/index.html` | Config modal, settings modal, action row, history detail screen |
| `chalker/styles/chalker.css` | Action row styles, idle state styles, history detail styles |
| `chalker/sw.js` | Add db.js to cache, bumped to v21 |

---

## Testing Checklist

- [x] Settings persist after closing app
- [x] Match survives page reload mid-leg
- [x] App opens to chalkboard (idle or active match)
- [x] NEW button opens config modal (idle) or "New Match?" modal (during match)
- [x] HISTORY button shows match history
- [x] Tapping history item shows match details with stats and leg scoresheets
- [x] Numpad disabled when no active match
- [x] Completed matches appear in history
- [x] History limited to 1000 entries
- [x] History sorted newest first
- [x] Leg scoresheets show cumulative dart counts per player

---

## Technical Notes

### State to persist (current match)
```javascript
{
  id: 'active',
  state: {
    config: { laneName, player1Name, player2Name, startingScore, bestOf, maxRounds, doubleIn },
    legs: [{ startingScore, visits: [...], winner, tiebreak }],
    player1Legs, player2Legs,
    currentPlayer, player1Score, player2Score,
    matchComplete, matchWinner, firstLegStarter
  },
  inputBuffer: '',
  timestamp: Date.now()
}
```

### Match history record
```javascript
{
  id: autoIncrement,
  timestamp: Date.now(),
  config: {...},
  legs: [...],
  player1Legs, player2Legs,
  matchWinner,
  stats: {
    player1: { tons, ton80s, shortLegs, highOuts, first9Avg, matchAvg, ... },
    player2: { tons, ton80s, shortLegs, highOuts, first9Avg, matchAvg, ... }
  }
}
```

### Visit record (in leg.visits array)
```javascript
{
  player: 1 | 2,
  score: number,
  dartsUsed: number,  // Default 3, actual count on checkout
  isCheckout: boolean
}
```

---

## Known Issues

*(none)*

---

## Fixed Issues

### Edit-after-opponent-entry checkout bug
**Status:** Fixed (January 2025)

**Scenario:**
When editing a previous score to create a checkout after the opponent had already entered a visit, the leg count updated but the UI stayed on the same leg with orphaned visit data, causing incorrect dart counts.

**Root cause:** `completeEditCheckout()` didn't remove visits that came after the edited checkout, and called `updateDisplay()` instead of `startNewLeg()`.

**Fix:** Added `visits.splice()` to remove orphaned visits, and changed to call `startNewLeg()` to properly advance to the next leg.

---

## Future Enhancements

### Resume unfinished matches from history
**Status:** Planned

Allow users to pick up and continue matches that were abandoned mid-game from the history screen. Currently only completed matches are shown in history; unfinished matches are only auto-resumed on app reload.

### Show game format in history display
**Status:** Planned

Update history list and match detail screens to show the full game format instead of just "Best of X":
- Current: `Best of 3`
- Desired: `501 • Best of 3`

Should display the starting score (101, 201, 301, 401, 501, 601, 701, 901, 1001) alongside the match length.

### Swipe navigation between legs
**Status:** Idea

When viewing Live Stats or Match History, allow swiping left/right between completed legs instead of scrolling through a vertical list. This would enable:
- Quick lookup of earlier legs
- Editing erroneous scores in past legs (would require additional editing logic)
- Undo if a leg was ended by mistake (would require additional undo logic)
- More intuitive mobile-native navigation

**Note:** The swipe UI would be the navigation layer; the underlying edit/undo functionality for past legs doesn't exist yet. Building swipe without that functionality has limited value.

---

**Completed:** January 9, 2025 (Phases 1-7)
**Updated:** January 11, 2025 (Phase 13 - Edit Validation Fix & Delete Last Visit)
