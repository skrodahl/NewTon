## NewTon DC Tournament Manager v4.1.17 Release Notes

**Release Date:** January 13, 2025
**Enhancement Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.17** redesigns the Chalker info bar as a centered single line with bullet separators, and updates the dart column header to use an arrow symbol.

This release contains no breaking changes and is a drop-in replacement for v4.1.16.

---

## Centered Info Bar

**What Changed:**

The match info bar now displays all information on a single centered line with bullet separators.

| Before | After |
|--------|-------|
| Three separate cells (Lane / Center / Format) | Single centered line: "Lane 5 • 501 • Best of 3" |

**Format Examples:**
- With lane: "Lane 5 • 501 • Best of 3"
- Without lane: "501 • Best of 3"

**Why This Matters:**

The centered layout creates a cleaner visual hierarchy:
1. **Big** - Score anchors at top (351 / 420)
2. **Medium** - Info bar in the middle
3. **Small** - Chalkboard ledger below

This is more readable than trying to align info cells with the chalkboard columns, which caused layout issues with scrollbar presence.

---

## Dart Column Symbol

**What Changed:**

The dart count column header changed from "#" to "➹" (U+27B9, Heavy Black-Feathered North East Arrow).

**Why:**

The arrow symbol is more intuitive - it visually represents darts thrown rather than using a generic number sign.

---

## Technical Details

### CSS Changes (chalker.css)
- Simplified `.match-info-bar` from 3-cell flexbox to single centered text
- Reduced padding to 2px vertical for tighter spacing
- Font size 1.125rem for visual hierarchy

### JavaScript Changes (chalker.js)
- Updated `updateDisplay()` to build info string with bullet separators:
  ```javascript
  const infoParts = [];
  if (state.config.laneName) infoParts.push(state.config.laneName);
  infoParts.push(state.config.startingScore);
  infoParts.push(`Best of ${state.config.bestOf}`);
  elements.matchInfoBar.textContent = infoParts.join(' • ');
  ```
- Changed element reference from 3 cells to single `matchInfoBar`

### HTML Changes (index.html)
- Simplified info bar from 3 spans to single div
- Changed dart column header from "#" to "➹"

### Service Worker
- Cache version bumped from `chalker-v63` to `chalker-v76`

---

## Summary

Version 4.1.17 cleans up the info bar layout with a centered single-line format and adds a dart arrow symbol for the dart count column.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.16.md**: Previous release (Lane Dropdown & Chalkboard Info)

---

**NewTon DC Tournament Manager v4.1.17** - Clean and centered.
