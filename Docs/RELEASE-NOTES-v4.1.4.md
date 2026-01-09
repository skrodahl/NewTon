## NewTon DC Tournament Manager v4.1.4 Release Notes

**Release Date:** January 9, 2025
**Patch Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.4** adds responsive tablet scaling to the NewTon Chalker app, making the interface comfortable to use on 9"+ tablet screens.

This release contains no breaking changes and is a drop-in replacement for v4.1.3.

---

## Chalker Tablet Scaling

**Problem Solved:**

The Chalker interface was designed for phones and appeared too small on tablets. All UI elements are now scaled up for screens 768px and wider.

**What Changed:**

| Element | Phone | Tablet (768px+) |
|---------|-------|-----------------|
| Score anchors | 3rem | 4.5rem |
| Chalkboard rows | 44px | 64px |
| Chalkboard font | 1.75rem | 2.25rem |
| Keypad buttons | 1.125rem | 1.75rem |
| Form inputs | 1.125rem | 1.5rem |
| Base spacing | 4-32px | 6-44px |

**Affected Screens:**
- Configuration screen (form inputs, labels, buttons)
- Scoring screen (header, score anchors, chalkboard, keypad)
- Modals (checkout, tie-break, menu, confirm)
- End-of-match statistics screen

---

## Technical Details

- Single `@media screen and (min-width: 768px)` breakpoint
- CSS custom properties scaled ~1.5x for tablet spacing
- No JavaScript changes required
- Service worker cache version bumped to `chalker-v2`

---

## Chalker Status

NewTon Chalker is now optimized for both phones and tablets. The PWA works offline on both form factors, with the interface automatically adapting to screen size.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/RELEASE-NOTES-v4.1.3.md**: PWA implementation
- **Docs/RELEASE-NOTES-v4.1.2.md**: Mobile display improvements
- **Docs/RELEASE-NOTES-v4.1.0.md**: NewTon Chalker introduction

---

**NewTon DC Tournament Manager v4.1.4** - Tablet-friendly Chalker interface.
