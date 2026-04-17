## NewTon DC Tournament Manager v4.1.7 Release Notes

**Release Date:** January 9, 2025
**Patch Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.7** improves score legibility in Chalker, fixes the tie-break display bug, and ensures tablet styles only apply in portrait orientation.

This release contains no breaking changes and is a drop-in replacement for v4.1.6.

---

## Chalker Legibility Improvements

**Problem Solved:**

The Cascadia Code monospace font used for scores was difficult to read at a distance, particularly for referees standing at the dartboard while players and spectators view from further away.

**Solution:**

Switched to native system fonts with tabular numerals:
- **iOS/macOS**: San Francisco
- **Android**: Roboto
- **Windows**: Segoe UI

These fonts are designed for UI readability and are instantly familiar on each platform.

**Affected Elements:**
- Score anchors (the large remaining score displays)
- Chalkboard table (scored values and "to go" columns)

---

## Bug Fixes

### Tie-Break Display Fix

**Problem:** After selecting a tie-break winner, the old leg's chalkboard remained visible. The new leg would start but the display didn't update until input was entered.

**Solution:** Added `updateDisplay()` call after `startNewLeg()` in the tie-break completion handler.

### Tablet Styles Portrait-Only

**Problem:** Desktop browsers at 768px+ width were getting tablet-sized UI elements (oversized keypad, spacing), making the interface unusable.

**Solution:** Changed tablet media query to require portrait orientation: `@media screen and (min-width: 768px) and (orientation: portrait)`. Desktop/landscape screens now get the phone-sized interface.

---

## Tablet Keypad Enhancement

Increased the vertical padding on keypad buttons for the tablet layout (portrait only), making them easier to tap accurately on larger screens.

---

## Technical Details

- Added `--font-scores` CSS variable: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Applied `font-variant-numeric: tabular-nums` to keep digit widths consistent
- Tablet keypad button padding increased from `--spacing-md` to `--spacing-xl`
- Added `updateDisplay()` call after tie-break winner selection
- Changed tablet media query to `(min-width: 768px) and (orientation: portrait)`
- Service worker cache version bumped to `chalker-v7`

---

## Chalker Status

NewTon Chalker continues to mature with improved visual design and bug fixes. The combination of viewport-based row heights (v4.1.5), system fonts, and portrait-only tablet scaling creates a polished experience across all devices.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/RELEASE-NOTES-v4.1.6.md**: Original legibility improvements
- **Docs/RELEASE-NOTES-v4.1.5.md**: Viewport-based row heights
- **Docs/RELEASE-NOTES-v4.1.4.md**: Tablet scaling

---

**NewTon DC Tournament Manager v4.1.7** - Cleaner scores, fixed tie-breaks, better desktop compatibility.
