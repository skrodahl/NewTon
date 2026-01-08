## NewTon DC Tournament Manager v4.1.1 Release Notes

**Release Date:** January 8, 2025
**Patch Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.1** improves the NewTon Chalker companion app with format-aware statistics and better mobile display.

This release contains no breaking changes and is a drop-in replacement for v4.1.0.

---

## Chalker Improvements

**Format-Specific Short Leg Thresholds:**

Short legs now use the correct dart threshold for each starting score format, rather than a hardcoded 21-dart limit.

| Format | Short Leg Threshold |
|--------|---------------------|
| 101    | 4 darts             |
| 201    | 8 darts             |
| 301    | 13 darts            |
| 501    | 21 darts            |
| 701    | 29 darts            |
| 1001   | 42 darts            |

The end-of-match stats screen now displays the format-specific threshold (e.g., "Short Legs (≤21)" for 501).

**Improved Per-Leg Statistics:**

Leg stats now display with clearer visual hierarchy:
- Average (primary, bold)
- Checkout info: darts and checkout score (e.g., "15 darts, 107 out")
- Scoring achievements (e.g., "1 × 180, 4 tons")

**Mobile Display Fixes:**
- Reduced keypad height for better phone display
- Fixed 3-digit scores with cursor overflowing on narrow screens

---

## Chalker Status

The NewTon Chalker companion app is now usable for live match scoring. While still in beta (no Tournament Manager integration), it provides a complete standalone scoring experience for referees at the board.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/RELEASE-NOTES-v4.1.0.md**: NewTon Chalker introduction

---

**NewTon DC Tournament Manager v4.1.1** - Smarter statistics for the Chalker app.
