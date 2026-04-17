## NewTon DC Tournament Manager v4.1.11 Release Notes

**Release Date:** January 11, 2025
**Enhancement Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.11** adds traditional chalking convention styling to Chalker - ton scores (100+) now display with a ring around the number on the main chalkboard.

This release contains no breaking changes and is a drop-in replacement for v4.1.10.

---

## Ton Ring Styling

**What's New:**

Ton scores (100 or higher) on the chalkboard now display with a black oval ring around the number, following traditional darts chalking conventions.

**Before:** Tons displayed with colored text only (blue for 100-179, green for 180)
**After:** Tons display with colored text AND a black ring around the number

**Styling Details:**
- 2px solid black border
- Rounded oval shape (0.7em border-radius)
- Tight fit around the digits
- Maintains existing color coding (blue for tons, green for 180s)

**Why This Matters:**

In traditional darts scoring on a physical chalkboard, markers circle ton scores to make them visually distinct. This digital implementation brings that familiar convention to Chalker, making high scores immediately recognizable at a glance.

---

## Technical Details

### JavaScript Changes (chalker.js)
- Updated `renderChalkboard()` to wrap ton scores (100+) in `<span>` elements
- Enables targeted CSS styling without affecting the entire table cell

### CSS Changes (chalker.css)
- Added `.chalk-table .col-scored.ton span` and `.ton80 span` styling
- Uses `border` on the span instead of `box-shadow` on the cell
- `display: inline-block` for proper border rendering
- Maintains existing color differentiation

### Service Worker
- Cache version bumped from `chalker-v46` to `chalker-v47`

---

## Summary

Version 4.1.11 is a polish release that improves the visual presentation of ton scores on the Chalker chalkboard, aligning the digital experience with traditional darts chalking conventions.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.10.md**: Previous release (Live Stats screen)

---

**NewTon DC Tournament Manager v4.1.11** - Traditional chalking, digitally delivered.
