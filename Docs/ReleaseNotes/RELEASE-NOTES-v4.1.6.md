## NewTon DC Tournament Manager v4.1.6 Release Notes

**Release Date:** January 9, 2025
**Patch Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.6** improves score legibility in the Chalker app by switching from monospace coding fonts to clean system fonts, and increases keypad button size on tablets.

This release contains no breaking changes and is a drop-in replacement for v4.1.5.

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

## Tablet Keypad Enhancement

Increased the vertical padding on keypad buttons for the tablet layout, making them easier to tap accurately on larger screens.

---

## Technical Details

- Added `--font-scores` CSS variable: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Applied `font-variant-numeric: tabular-nums` to keep digit widths consistent
- Tablet keypad button padding increased from `--spacing-md` (24px) to `--spacing-lg` (40px)
- Service worker cache version bumped to `chalker-v5`

---

## Chalker Status

NewTon Chalker continues to mature with improved visual design. The combination of viewport-based row heights (v4.1.5) and system fonts (v4.1.6) creates a much more polished tablet experience.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/RELEASE-NOTES-v4.1.5.md**: Viewport-based row heights
- **Docs/RELEASE-NOTES-v4.1.4.md**: Tablet scaling
- **Docs/RELEASE-NOTES-v4.1.3.md**: PWA implementation

---

**NewTon DC Tournament Manager v4.1.6** - Cleaner, more legible score display.
