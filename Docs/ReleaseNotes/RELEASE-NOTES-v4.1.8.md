## NewTon DC Tournament Manager v4.1.8 Release Notes

**Release Date:** January 9, 2025
**Patch Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.8** unifies the Chalker Match Complete screen with the History Detail view, adds a History navigation button, switches to 24-hour time format, and makes the short leg indicator dynamic based on game variant.

This release contains no breaking changes and is a drop-in replacement for v4.1.7.

---

## Match Complete Screen Redesign

**Problem Solved:**

The end-of-match screen had a different layout and fewer statistics than the History Detail view. Users completing a match saw less information than when reviewing the same match in history.

**Solution:**

Redesigned the Match Complete screen to use the identical layout as History Detail:

- **Same stats table**: Tons, 180s, short legs, high outs, first 9 average, match average, and leg averages
- **Full leg scoresheets**: Complete scoring breakdown for each leg with cumulative dart counts
- **Consistent color coding**: Blue for tons (100+), gold for 180s, purple for short legs, green underlined for checkouts (101+)

**Before:** Basic stats display with limited information
**After:** Rich match summary identical to history view

---

## History Button

Added a "History" button to the Match Complete screen action row, allowing quick navigation to the full match history list after finishing a match.

**Button Placement:**
```
[ Rematch ] [ New Match ] [ History ]
```

---

## 24-Hour Time Format

**Problem:** Time displayed in 12-hour format with AM/PM, inconsistent with many users' preferences.

**Solution:** Changed to 24-hour format (e.g., "14:30" instead of "2:30 PM") for all timestamps in history detail and end screen.

---

## Dynamic Short Leg Indicator

**Problem:** Short leg indicator was hardcoded to 21 darts regardless of game variant, which is only accurate for 501.

**Solution:** Short leg threshold now uses the existing `SHORT_LEG_THRESHOLDS` lookup table:

| Game | Short Leg Threshold |
|------|---------------------|
| 101 | 9 darts |
| 201 | 12 darts |
| 301 | 15 darts |
| 401 | 18 darts |
| 501 | 21 darts |
| 601 | 24 darts |
| 701 | 27 darts |
| 901 | 33 darts |
| 1001 | 36 darts |

Short legs are now correctly identified regardless of which starting score is used.

---

## Technical Details

### HTML Changes (index.html)
- Replaced old end screen structure with `history-detail-content` wrapper
- Added stats table with leg averages row
- Added `end-legs-container` div for leg scoresheets
- Added History button with `btn-tertiary` class

### JavaScript Changes (chalker.js)
- Added new element references: `p1LegAvgs`, `p2LegAvgs`, `endMatchInfo`, `endLegsContainer`, `endHistoryBtn`
- Rewrote `showEndScreen()` to populate stats table and render leg scoresheets
- Added `renderEndScreenLegScoresheets()` function (reuses history detail logic)
- Changed `toLocaleTimeString()` to use `hour12: false`
- Short leg detection now uses `SHORT_LEG_THRESHOLDS[config.startingScore] || 21`

### CSS Changes (chalker.css)
- Added `.btn-tertiary` style for History button
- Removed obsolete styles: `.result-display`, `.match-players`, old `.winner-name`, `.loser-name`, `.final-score`, `.stats-container`

### Service Worker
- Cache version bumped from `chalker-v28` to `chalker-v29`

---

## Chalker Status

NewTon Chalker now provides a consistent, polished experience whether you're completing a match or reviewing history. The unified design with rich statistics and leg scoresheets gives players and referees comprehensive match information at every touchpoint.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide (updated with Phase 8)
- **Docs/RELEASE-NOTES-v4.1.7.md**: Previous release (font improvements, bug fixes)

---

**NewTon DC Tournament Manager v4.1.8** - Unified match views, smarter short legs, cleaner timestamps.
