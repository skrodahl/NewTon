## NewTon DC Tournament Manager v4.1.16 Release Notes

**Release Date:** January 13, 2025
**Enhancement Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.16** improves the Chalker config form with a lane dropdown, displays lane and match format on the chalkboard, and fixes a border rendering issue in Chrome/Edge.

This release contains no breaking changes and is a drop-in replacement for v4.1.15.

---

## Lane Dropdown

**What Changed:**

The Lane field is now a dropdown instead of free-text input.

| Before | After |
|--------|-------|
| Text input (any value) | Dropdown: No lane, Lane 1-20 |

**Why This Matters:**

Tournament venues typically have numbered dartboards (lanes). A dropdown prevents typos and invalid entries while keeping configuration fast.

---

## Chalkboard Info Cells

**What's New:**

The top row of the chalkboard now displays match information in the previously empty corner cells:

| Left Cell | Right Cell |
|-----------|------------|
| Lane name (e.g., "Lane 5") | Match format (e.g., "Bo3") |

**Why This Matters:**

Players and spectators can see at a glance which lane they're on and how many legs the match is. This is particularly useful in tournaments with multiple concurrent matches.

---

## Removed Double-In Toggle

**What Changed:**

The "Double-In Required" toggle has been removed from the config form.

**Why:**

The toggle was stored but never used in game logic. Validating double-in would require tracking individual dart values rather than just visit totals. Since Chalker scores visits (3-dart totals), it cannot validate whether the first dart of a leg was a double.

---

## Border Rendering Fix

**The Problem:**

Vertical borders between cells would disappear at certain browser widths. This was caused by subpixel rendering issues with `border-collapse: collapse` in Chrome and Edge.

**The Fix:**

Changed to `border-collapse: separate` with one-sided borders. Each cell now has explicit bottom and left borders, with right borders only on the last cell.

---

## Technical Details

### HTML Changes (index.html)
- Replaced Lane text input with select dropdown (options 1-20 plus "No lane")
- Removed Double-In toggle group

### JavaScript Changes (chalker.js)
- Updated `startMatch()` to format lane as "Lane X" when selected
- Updated `loadSettings()` to extract lane number from "Lane X" format
- Modified `updateChalkboard()` to populate row 0 info cells
- Removed `doubleIn` from elements object, config, and settings

### CSS Changes (chalker.css)
- Added `.col-info` class for info cells (gray background, secondary text)
- Changed `.chalk-table` from `border-collapse: collapse` to `border-collapse: separate`
- Changed cell borders to one-sided (bottom + left, right on last-child)

### Service Worker
- Cache version bumped from `chalker-v58` to `chalker-v63`

---

## Summary

Version 4.1.16 improves the config experience with a lane dropdown, makes better use of chalkboard space for match info, and fixes a browser rendering glitch.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.15.md**: Previous release (Tiebreak Warning & Bust Validation)

---

**NewTon DC Tournament Manager v4.1.16** - Know your lane.
