## NewTon DC Tournament Manager v4.1.13 Release Notes

**Release Date:** January 11, 2025
**Enhancement Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.13** adds 140+ score tracking to Chalker's match statistics, providing a more detailed breakdown of high-scoring visits.

This release contains no breaking changes and is a drop-in replacement for v4.1.12.

---

## 140+ Score Tracking

**What's New:**

The stats tables now display three tiers of high scores instead of two:

| Stat | Description |
|------|-------------|
| Tons (100+) | All scores 100 and above |
| 140+ | All scores 140 and above |
| 180s | Maximum scores only |

**How Counting Works:**

The counts are cumulative (overlapping), not exclusive:
- A score of 120 counts as: 1 ton
- A score of 160 counts as: 1 ton, 1 (140+)
- A score of 180 counts as: 1 ton, 1 (140+), 1 (180)

**Example:**
If a player scores 100, 140, 160, 180, their stats show:
- Tons: 4
- 140+: 3
- 180s: 1

**Why This Matters:**

In competitive darts, 140+ scores (ton-forties) represent a recognized achievement tier. They typically require two treble 20s plus a decent third dart. Tracking them separately gives players and commentators more insight into scoring consistency at the higher end.

---

## Technical Details

### JavaScript Changes (chalker.js)
- Added `ton40s` counter to player stats object in `calculateStats()`
- Added counting logic: `if (visit.score >= 140) { playerStats.ton40s++; }`
- Added element references for 140+ display fields
- Updated `populateMatchStats()` to display 140+ values

### HTML Changes (index.html)
- Added 140+ row to History Detail stats table
- Added 140+ row to Match Complete stats table
- Added 140+ row to Live Stats stats table

### Service Worker
- Cache version bumped from `chalker-v52` to `chalker-v53`

---

## Summary

Version 4.1.13 adds granular high-score tracking to Chalker, giving players visibility into their 140+ scoring frequency alongside tons and 180s.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.12.md**: Previous release (Responsive Layout Fix)

---

**NewTon DC Tournament Manager v4.1.13** - Track every ton-forty.
