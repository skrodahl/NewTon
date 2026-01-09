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

### New keypad row (5th row, below DEL/0/OK)
```
| NEW | HISTORY | ⚙ |
```
- **NEW** - Opens config modal to start new match (confirms if match in progress)
- **HISTORY** - Opens history screen
- **⚙** - Opens settings modal during match (rematch, abandon)

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
- [x] History screen with match list
- [x] Display: player names, score, date/time, winner
- [x] Navigate back to scoring screen

### Phase 5: UI Restructure ✓
**Files:** `chalker/index.html`, `chalker/styles/chalker.css`, `chalker/js/chalker.js`

- [x] Add 5th keypad row (NEW, HISTORY, ⚙)
- [x] Convert config screen to modal
- [x] Remove hamburger menu from header
- [x] `updateIdleDisplay()` - Idle state display (scores "---", numpad disabled)
- [x] Settings modal (⚙ button) with Rematch and Abandon Match options
- [x] Scoring screen is now always active on load

### Phase 6: Polish ✓

- [x] CSS for action row (`.keypad-actions`, `.key-action`)
- [x] `updateKeypadState()` - Disable numpad when idle
- [x] Tablet scaling for action row in media query
- [x] Service worker cache version bumped to v9

---

## Files Modified

| File | Changes |
|------|---------|
| `chalker/js/db.js` | New file - IndexedDB wrapper |
| `chalker/js/chalker.js` | Save/load hooks, idle state, UI logic, removed config screen |
| `chalker/index.html` | Config modal, settings modal, action row, removed hamburger menu |
| `chalker/styles/chalker.css` | Action row styles, idle state styles, modal styles |
| `chalker/sw.js` | Add db.js to cache, bumped to v9 |

---

## Testing Checklist

- [x] Settings persist after closing app
- [x] Match survives page reload mid-leg
- [x] App opens to chalkboard (idle or active match)
- [x] NEW button opens config modal
- [x] HISTORY button shows match history
- [x] ⚙ button shows settings/abandon during match
- [x] Numpad disabled when no active match
- [x] Completed matches appear in history
- [x] History limited to 1000 entries
- [x] History sorted newest first

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

---

**Completed:** January 9, 2025
