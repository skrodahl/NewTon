## NewTon DC Tournament Manager v4.1.15 Release Notes

**Release Date:** January 11, 2025
**Enhancement Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.15** adds visual tiebreak warnings to Chalker and improves score validation for a more consistent input experience.

This release contains no breaking changes and is a drop-in replacement for v4.1.14.

---

## Tiebreak Warning Gradient

**What's New:**

The last three rows before a tiebreak now display with an escalating amber gradient, providing a visual cue that the leg is approaching its round limit.

**How It Works:**

| Row | Background | Dart Count Weight |
|-----|------------|-------------------|
| 3rd from end | Light amber (10% opacity) | Medium (500) |
| 2nd from end | Medium amber (20% opacity) | Semi-bold (600) |
| Final round | Dark amber (30% opacity) | Bold (700) |

**Why This Matters:**

Players can see at a glance when they're entering the "danger zone" where a tiebreak becomes likely. The dual visual cues (background color and dart count boldness) reinforce the warning without being distracting.

---

## Bust Score Rejection

**What Changed:**

Bust scores are now rejected instead of being silently converted to 0.

**Before:** Entering 85 when you have 60 remaining → recorded as 0
**After:** Entering 85 when you have 60 remaining → rejected, must enter 0 explicitly

**Why This Matters:**

This makes score validation consistent across all invalid inputs:
- Score > 180 → rejected
- Illegal score (163, 166, etc.) → rejected
- Score leaving 1 remaining → rejected
- Score exceeding remaining → rejected (NEW)

To record a bust, explicitly enter 0. This prevents typos from being silently accepted as bust rounds.

---

## Technical Details

### JavaScript Changes (chalker.js)

**Tiebreak warning classes:**
```javascript
// Tiebreak warning gradient for last 3 rows
const roundsFromEnd = maxRounds - r;
if (roundsFromEnd <= 3) {
  rowClass += ` tiebreak-warning-${roundsFromEnd}`;
}
```

**Bust rejection:**
```javascript
} else if (newScore < 0 || newScore === 1) {
  // Bust - reject, user must enter 0 explicitly
  return;
}
```

### CSS Changes (chalker.css)
- Added `.tiebreak-warning-1`, `.tiebreak-warning-2`, `.tiebreak-warning-3` classes
- Escalating `background: rgba(255, 193, 7, opacity)` values
- Escalating `font-weight` on `.col-darts` column

### Service Worker
- Cache version bumped from `chalker-v55` to `chalker-v58`

### Documentation
- Added `chalker/README.md` with feature overview and PWA installation instructions

---

## Summary

Version 4.1.15 improves the scoring experience with visual tiebreak warnings and consistent bust validation.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.14.md**: Previous release (Edit Validation Fix)
- **chalker/README.md**: Chalker feature overview

---

**NewTon DC Tournament Manager v4.1.15** - See it coming.
