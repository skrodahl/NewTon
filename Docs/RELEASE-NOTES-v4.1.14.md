## NewTon DC Tournament Manager v4.1.14 Release Notes

**Release Date:** January 11, 2025
**Bug Fix Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.14** fixes a bug where editing previous scores could create invalid game states, and adds the ability to delete the last visit by submitting an empty edit.

This release contains no breaking changes and is a drop-in replacement for v4.1.13.

---

## Edit Validation Fix

**The Problem:**

Editing a previous score could create invalid states for subsequent visits. For example:
- Player 1 has 20 remaining after several visits
- Editing an earlier score to 180 would make the current "To Go" show -40
- Editing to create an unprocessed checkout (remaining = 0) left the game stuck

**The Fix:**

The edit validation now simulates all subsequent visits after the proposed edit. If any visit would result in:
- Negative remaining (bust)
- Remaining of 1 (impossible finish)
- Remaining of 0 (unprocessed checkout)

...the edit is silently rejected.

**Why This Works:**

If you need a checkout at a specific point, edit that visit directly and use the checkout dialog. Edits to earlier scores should only result in valid intermediate states (remaining ≥ 2).

---

## Delete Last Visit

**New Feature:**

You can now delete the most recent visit by submitting an empty edit.

**How to Use:**
1. Tap the last score on the chalkboard to enter edit mode
2. Press OK without entering any digits
3. The visit is deleted and it becomes that player's turn again

**Limitations:**
- Only works on the very last visit in the current leg
- Attempting to delete earlier visits is silently ignored
- Checkout visits cannot be deleted (the leg ends immediately after a checkout)

**Use Case:**

Quick correction when you accidentally entered the wrong player's score or need to undo the last entry without restarting the leg.

---

## Technical Details

### JavaScript Changes (chalker.js)

**Edit validation (existing function enhanced):**
```javascript
// Replay this player's remaining visits with the new score
let simulatedRemaining = newRemaining;
for (let i = editingVisitIndex + 1; i < currentLeg.visits.length; i++) {
  if (currentLeg.visits[i].player === visit.player) {
    simulatedRemaining -= currentLeg.visits[i].score;
    // Invalid if any subsequent visit would cause bust or checkout
    if (simulatedRemaining <= 1) {
      return; // Reject edit silently
    }
  }
}
```

**Delete last visit (new logic):**
```javascript
// Handle empty input as delete request
if (inputBuffer === '') {
  // Only allow deleting the very last visit
  if (editingVisitIndex === currentLeg.visits.length - 1) {
    const deletedVisit = currentLeg.visits.pop();
    state.currentPlayer = deletedVisit.player;
    recalculateScores();
    editingVisitIndex = null;
    updateDisplay();
    saveCurrentMatch();
  }
  return;
}
```

### Service Worker
- Cache version bumped from `chalker-v54` to `chalker-v55`

---

## Summary

Version 4.1.14 improves score editing reliability by preventing invalid game states and adds a quick way to undo the last entered score.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.13.md**: Previous release (140+ Score Tracking)

---

**NewTon DC Tournament Manager v4.1.14** - Edit safely, delete quickly.
