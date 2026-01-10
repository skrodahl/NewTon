## NewTon DC Tournament Manager v4.1.10 Release Notes

**Release Date:** January 11, 2025
**Feature Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.10** adds a Live Stats screen to Chalker, allowing referees and players to view real-time match statistics during an ongoing match. The chalkboard also now displays the match length (Best-of) indicator.

This release contains no breaking changes and is a drop-in replacement for v4.1.9.

---

## Live Stats Screen

**What's New:**

The SETTINGS button has been replaced with a STATS button that opens a new Live Stats screen during a match.

**Features:**
- Same layout as Match Complete and History Detail screens for consistency
- Full statistics table showing:
  - Tons (100+) and 180s
  - Short legs (with format-specific threshold)
  - High outs (101+)
  - First 9 average
  - Match average
  - Per-leg averages
- Completed leg scoresheets with color coding:
  - Blue for tons (100+)
  - Gold for 180s
  - Green for checkouts
  - Green underlined for high outs (101+)
- Current leg in progress:
  - Yellow "In Progress" badge
  - Yellow highlight border around the scoresheet
  - Current remaining scores displayed at bottom
- Back button (←) returns to scoring screen

**Use Cases:**
- Check match statistics mid-game without waiting for match completion
- Review completed leg scoresheets during the match
- Verify tons, 180s, and averages for commentary or announcements

---

## Best-Of Indicator

**What's New:**

The chalkboard now displays the match length in the first row's center cell.

**Before:** Empty cell in row 0 (where dart count would be)
**After:** Shows "Bo3", "Bo5", "Bo7", etc. based on match configuration

**Styling:**
- Smaller font (0.75rem) to distinguish from dart counts
- Secondary text color
- Body font instead of monospace

---

## Technical Details

### HTML Changes (index.html)
- Renamed `key-settings` to `key-stats`
- Added new Live Stats screen (`#stats-screen`) with:
  - Header with back button and "Live Stats" title
  - Stats table matching end screen/history detail format
  - Legs container for scoresheets

### JavaScript Changes (chalker.js)
- Added DOM element references for stats screen
- Updated `showScreen()` to include 'stats' case
- Added `showLiveStats()` function to populate and show stats
- Added `renderLiveStatsScoresheets()` function for leg rendering with in-progress support
- Added `statsBack()` function for back navigation
- Updated `renderChalkboard()` to show `Bo${bestOf}` in row 0 center cell
- Updated event listeners for STATS button and back button

### CSS Changes (chalker.css)
- Added `.in-progress-badge` styling (yellow/warning color)
- Added `.leg-in-progress` styling with yellow border
- Added `.current-remaining-row` and `.current-remaining` for remaining scores
- Added `.col-bestof` styling for best-of indicator

### Service Worker
- Cache version bumped from `chalker-v43` to `chalker-v44`

---

## Chalker Status

NewTon Chalker now provides comprehensive match visibility at any point during play. The Live Stats screen gives referees and players instant access to all statistics without waiting for match completion, while the best-of indicator keeps the match format visible on the main scoring screen.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide (includes Phase 9)
- **Docs/RELEASE-NOTES-v4.1.9.md**: Previous release (edit checkout bug fix)

---

**NewTon DC Tournament Manager v4.1.10** - Live stats at your fingertips.
