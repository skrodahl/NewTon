## NewTon DC Tournament Manager v4.1.12 Release Notes

**Release Date:** January 11, 2025
**Maintenance Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.12** simplifies Chalker's responsive layout by removing a problematic tablet breakpoint and optimizing the chalkboard font size for better ton ring display.

This release contains no breaking changes and is a drop-in replacement for v4.1.11.

---

## Unified Responsive Layout

**What Changed:**

Removed the 768-1023px portrait media query that was causing layout issues on laptop browsers.

**Before:** Three different layouts (phone < 768px, tablet 768-1023px portrait, desktop >= 1024px)
**After:** One unified layout that adapts naturally to available screen space

**Why This Matters:**

The tablet breakpoint had aggressive scaling (8rem score anchors, 56px key padding) that worked on actual tablet devices but broke completely when viewing in a laptop browser window at portrait aspect ratios. Since actual phone and tablet devices worked correctly without this breakpoint, removing it simplifies the CSS while fixing the laptop edge case.

---

## Chalkboard Font Size Optimization

**What Changed:**

Reduced chalkboard table cell font size from 2.25rem to 1.9rem.

**Why This Matters:**

The ton ring styling added in v4.1.11 wraps scores 100+ in a bordered span. The slightly smaller font size ensures the rings fit comfortably within the table cells without clipping, while maintaining excellent readability.

---

## Technical Details

### CSS Changes (chalker.css)
- Removed entire `@media screen and (min-width: 768px) and (orientation: portrait)` block (~200 lines)
- Changed `.chalk-table td { font-size: 2.25rem }` to `font-size: 1.9rem`
- Only remaining media query: landscape rotation for horizontal phone orientation

### Service Worker
- Cache version bumped from `chalker-v47` to `chalker-v51`

---

## Summary

Version 4.1.12 is a cleanup release that simplifies Chalker's responsive design and ensures ton rings display correctly at all screen sizes.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.11.md**: Previous release (Ton Ring Styling)

---

**NewTon DC Tournament Manager v4.1.12** - Simplified, unified, responsive.
