## NewTon DC Tournament Manager v4.1.21 Release Notes

**Release Date:** February 9, 2026
**Enhancement Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.21** adds a confirmation dialog before bracket generation and visual polish to the Match Controls panels.

This release contains no breaking changes and is a drop-in replacement for v4.1.20.

---

## Bracket Generation Confirmation

**The Problem:**

Admins occasionally forget to register a player before generating the bracket. Once the bracket is generated with auto-advancing byes, adding a missing player requires resetting the entire tournament.

**The Solution:**

Bracket generation now pauses with a confirmation dialog that shows:

1. **Bracket size** - "Generate 32-Player Bracket?"
2. **Player and bye count** - "29 players registered, 3 byes"
3. **All registered players** - Displayed as read-only cards in a 4-column grid
4. **Warning message** - "Make sure all players are registered before proceeding."
5. **Cancel as default** - Pressing Enter cancels, preventing accidental generation

**Why This Matters:**

Seeing "29 players registered, 3 byes" when you expected 32 is an immediate red flag. The player card grid makes it easy to scan for a missing name at a glance.

This is a prevention-first approach. Rather than implementing complex post-generation player insertion (which would require unwinding auto-advancements), the dialog ensures the mistake doesn't happen in the first place.

---

## Match Controls Visual Polish

The Match Controls dialog received subtle visual improvements to improve readability and scannability.

### Tournament Setup Panel
- Subtle box-shadow added to setup action cards for visual depth

### Referee Suggestions Panel
- **Subtle box-shadow** on suggestion cards, matching the style used elsewhere in the app
- **Larger font** (13px to 14px) and **bolder player names** (font-weight 600) for better readability
- **More padding** (10px 12px) giving cards breathing room
- **Color-coded left borders** per category:
  - Muted rose for Recent Losers
  - Muted sage for Recent Winners
  - Muted slate for Recent Assignments

These are intentionally subtle cues — the referee suggestion panel is secondary to the match cards, so the styling hints at category differences without competing for attention.

---

## Technical Details

### New Files/Sections
- **tournament.html**: Added `bracketConfirmModal` with dynamic content areas
- **clean-match-progression.js**: Split bracket generation into three functions:
  - `generateCleanBracket()` - Validates, then shows confirmation
  - `showBracketConfirmation()` - Populates dialog with player cards
  - `confirmBracketGeneration()` - Executes actual bracket generation

### Dialog Features
- Uses existing `pushDialog`/`popDialog` stack system
- Esc key closes the dialog
- Cancel button has autofocus (Enter = Cancel)
- Player cards use `.player-list-item.in-tournament` styling (read-only, no click handlers)
- Subtle box-shadow on cards for visual depth
- Scrollable player area (max 50vh) for large tournaments
- Modal width increased to 700px to accommodate 4-column grid

---

## Summary

Version 4.1.21 adds a simple but effective safeguard against the common "forgot to add a player" mistake. By showing all registered players before generating the bracket, admins get a final checkpoint to verify everyone is accounted for.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/RELEASE-NOTES-v4.1.20.md**: Previous release (Chalker First 9 Average Fix)

---

**NewTon DC Tournament Manager v4.1.21** - Measure twice, generate once.
