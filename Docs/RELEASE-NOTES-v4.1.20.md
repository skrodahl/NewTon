## NewTon DC Tournament Manager v4.1.20 Release Notes

**Release Date:** January 17, 2025
**Bug Fix Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.20** fixes a bug in the First 9 Average calculation that was only using data from the first leg instead of averaging across all legs in the match.

This release contains no breaking changes and is a drop-in replacement for v4.1.19.

---

## First 9 Average Bug Fix

**What Was Wrong:**

The First 9 Average statistic was only calculating the average from the first leg of the match, ignoring all subsequent legs.

**Example (Best of 3 match):**

| Leg | Player 1 First 9 |
|-----|------------------|
| Leg 1 | 180 + 177 + 144 = 501 |
| Leg 2 | 9 + 9 + 9 = 27 |
| Leg 3 | 26 + 180 + 180 = 386 |

| Calculation | Result |
|-------------|--------|
| **Before (bug)** | 501 / 3 = **167.0** (only Leg 1) |
| **After (fixed)** | (501 + 27 + 386) / 9 = **101.6** (all legs) |

**What Was Fixed:**

The calculation now properly averages the first 9 darts (first 3 visits) from every leg played in the match.

**Affected Views:**

- Match Complete screen
- History Detail screen
- Live Stats screen (during match)

**Why This Matters:**

First 9 Average is a key performance indicator in darts. It shows how well a player starts each leg. The bug made the statistic misleading for any match that went beyond one leg.

---

## Technical Details

### Root Cause

The `calculateStats()` function correctly collected first-9 scores from all legs into an array, but then incorrectly used `.slice(0, 3)` which limited the calculation to only the first 3 visits (first leg).

### The Fix

```javascript
// Before (bug)
stats.player1.first9Avg = stats.player1.first9Scores.slice(0, 3).length > 0
  ? stats.player1.first9Scores.slice(0, 3).reduce((a, b) => a + b, 0) /
    stats.player1.first9Scores.slice(0, 3).length
  : 0;

// After (fixed)
stats.player1.first9Avg = stats.player1.first9Scores.length > 0
  ? stats.player1.first9Scores.reduce((a, b) => a + b, 0) /
    stats.player1.first9Scores.length
  : 0;
```

### Service Worker
- Cache version bumped from `chalker-v88` to `chalker-v89`

---

## Summary

Version 4.1.20 fixes the First 9 Average calculation to properly average across all legs in a match, not just the first leg.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.19.md**: Previous release (Network Mode Foundation)

---

**NewTon DC Tournament Manager v4.1.20** - Accurate averages, every leg.
