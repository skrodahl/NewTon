## NewTon DC Tournament Manager v4.1.18 Release Notes

**Release Date:** January 13, 2025
**Enhancement Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.18** adds a dynamic leg indicator to the Chalker info bar and increases the visibility of the dart symbol in the chalkboard header.

This release contains no breaking changes and is a drop-in replacement for v4.1.17.

---

## Dynamic Leg Indicator

**What Changed:**

The info bar now shows "Leg X of Y" instead of the static "Best of Y" format, giving players instant visibility into match progress.

| Before | After |
|--------|-------|
| Lane 3 • 501 • Best of 3 | Lane 3 • 501 • Leg 1 of 3 |

**How It Works:**

The leg number updates automatically as the match progresses:
- Start of match: "Leg 1 of 3"
- After first leg: "Leg 2 of 3"
- Deciding leg: "Leg 3 of 3"

**Why This Matters:**

Players can now see both:
1. **Current leg** - Which leg they're playing
2. **Match length** - How many legs in total

Previously, you had to check the leg score in the header (e.g., "1 - 0") to know where you were in the match. Now it's visible at a glance in the info bar.

---

## Larger Dart Symbol

**What Changed:**

The dart column header symbol (➹) is now larger and more visible.

| Before | After |
|--------|-------|
| 0.625rem (same as other headers) | 1rem (60% larger) |

**Technical Detail:**

The larger symbol uses `line-height: 1` to prevent it from affecting the row height. The symbol grows but the header row stays the same size.

---

## Technical Details

### JavaScript Changes (chalker.js)
- Changed info bar text generation:
  ```javascript
  // Before
  infoParts.push(`Best of ${state.config.bestOf}`);

  // After
  infoParts.push(`Leg ${state.legs.length} of ${state.config.bestOf}`);
  ```

### CSS Changes (chalker.css)
- Added styling for dart column header:
  ```css
  .chalk-table thead th:nth-child(3) {
    width: 40px;
    font-size: 1rem;
    line-height: 1;
  }
  ```

### Service Worker
- Cache version bumped from `chalker-v76` to `chalker-v80`

---

## Summary

Version 4.1.18 makes match progress more visible with a dynamic "Leg X of Y" indicator and improves the dart symbol visibility in the chalkboard header.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.17.md**: Previous release (Info Bar Redesign)

---

**NewTon DC Tournament Manager v4.1.18** - Know where you stand.
