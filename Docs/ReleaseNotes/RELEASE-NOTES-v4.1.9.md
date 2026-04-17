## NewTon DC Tournament Manager v4.1.9 Release Notes

**Release Date:** January 9, 2025
**Patch Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.9** fixes a bug in Chalker where editing a previous score to create a checkout after the opponent had already entered a visit would leave orphaned visit data and fail to advance to the next leg.

This release contains no breaking changes and is a drop-in replacement for v4.1.8.

---

## Bug Fix: Edit-After-Opponent-Entry Checkout

**Problem:**

When editing a previous score to create a checkout after the opponent had already entered a visit:
1. The leg count updated correctly (e.g., 1-0)
2. But the opponent's orphaned visit remained in the leg data
3. The UI didn't advance to show the next leg - stuck on the same chalkboard
4. Dart counts and averages were incorrect due to the orphaned visit

**Reproduction Steps:**
1. Player 1 has 101 remaining, enters 95 (wrong - meant to check out)
2. Player 2 enters 45
3. User edits Player 1's 95 → 101 (checkout)
4. Dart modal appears, user selects 2 darts
5. Bug: Score shows 1-0 but chalkboard still shows leg 1 with Player 2's orphaned "45"

**Root Cause:**

The `completeEditCheckout()` function had two issues:
1. Did NOT remove visits that came after the edited checkout
2. Called `updateDisplay()` instead of `startNewLeg()` when the match wasn't complete

**Fix:**
1. Added `visits.splice()` to remove all visits after the edited checkout
2. Changed to call `startNewLeg()` followed by `updateDisplay()` to properly advance to the next leg
3. Added `saveCurrentMatch()` to persist the state to IndexedDB

---

## Technical Details

### JavaScript Changes (chalker.js)

Updated `completeEditCheckout()` function:

```javascript
// Remove all visits that came after this checkout
// (opponent may have entered scores before the edit was made)
if (visitIdx < currentLeg.visits.length - 1) {
  currentLeg.visits.splice(visitIdx + 1);
}

// ... existing checkout logic ...

// Show end screen or start next leg
if (state.matchComplete) {
  showEndScreen();
} else {
  startNewLeg();
  updateDisplay();
}
saveCurrentMatch();
```

### Service Worker
- Cache version bumped from `chalker-v31` to `chalker-v33`

### Documentation
- Updated `Docs/CHALKER-PERSISTENCE.md` - moved bug from "Known Issues" to "Fixed Issues" section

---

## Chalker Status

NewTon Chalker's score editing feature now correctly handles all edge cases, including checkouts created by editing after the opponent has already entered a score. The fix ensures orphaned visits are removed, the UI advances properly, and statistics calculate correctly.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide (includes Fixed Issues section)
- **Docs/RELEASE-NOTES-v4.1.8.md**: Previous release (unified end screen, 24H time format)

---

**NewTon DC Tournament Manager v4.1.9** - Bulletproof score editing for Chalker.
