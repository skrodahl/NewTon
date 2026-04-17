## NewTon DC Tournament Manager v4.1.19 Release Notes

**Release Date:** January 14, 2025
**Enhancement Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.19** adds infrastructure for future network tournament integration, improves match progress visibility, and polishes the user experience with better confirmation flows.

This release contains no breaking changes and is a drop-in replacement for v4.1.18.

---

## Network Mode Foundation

**What Changed:**

The app now has the foundation for future network integration with the Tournament Manager, allowing tablets to receive match assignments over the network.

**Key Changes:**

1. **Lane removed from local mode** - Lane selection is no longer part of match setup. In the future, lanes will identify devices on the network.

2. **Network button added** - The NEW menu now includes a "Network" option alongside Rematch and New Match.

3. **Network modal** - Selecting Network opens a lane selection modal (1-20) with a notice that the feature requires a license.

4. **Network waiting state** - When network mode is activated, the app shows "Lane X • Waiting..." in the info bar with a distinctive deep blue header.

| Local Mode | Network Mode |
|------------|--------------|
| Dark gray header | Deep blue header (#1e3a5f) |
| "501 • Leg 1 of 3" | "Lane 5 • Waiting..." |

**Why This Matters:**

This prepares Chalker for tournament integration where:
- Tournament Manager assigns matches to specific lanes
- Tablets identify themselves by lane number
- Match data flows between devices via MQTT

The feature is currently disabled pending the licensing system implementation.

---

## Dynamic Leg Indicator

**What Changed:**

The info bar now shows "Leg X of Y" instead of the static "Best of Y" format.

| Before | After |
|--------|-------|
| 501 • Best of 3 | 501 • Leg 1 of 3 |

**How It Works:**

The leg number updates automatically as the match progresses:
- Start of match: "Leg 1 of 3"
- After first leg: "Leg 2 of 3"
- Deciding leg: "Leg 3 of 3"

---

## Improved NEW Button Flow

**What Changed:**

The NEW button now handles confirmation more intelligently:

| State | Behavior |
|-------|----------|
| Active match | Confirmation dialog → Then shows Rematch/New Match/Network |
| Idle (no match) | Directly shows New Match/Network (no Rematch option) |

**Why This Matters:**

- Prevents accidental loss of active match data
- No unnecessary confirmation when there's nothing to lose
- Rematch only appears when it makes sense (after completing or abandoning a match)

---

## Idle Screen Hint

**What Changed:**

When no match is active, the info bar now shows "Tap NEW to start" instead of being empty.

**Why This Matters:**

New users immediately know how to begin, and returning users get a clear indication that no match is loaded.

---

## Larger Dart Symbol

**What Changed:**

The dart column header symbol (➹) is now larger and more visible.

| Before | After |
|--------|-------|
| 0.625rem | 1rem (60% larger) |

---

## Technical Details

### JavaScript Changes (chalker.js)
- Removed lane from `startMatch()` config
- Added `startNetworkMode()`, `updateDisplayForNetworkWaiting()` functions
- Added `networkWaitingLane` state variable
- Added `loadNetworkLane()`, `saveNetworkLane()` for persistence
- Added `showSettingsModalForState(isIdle)` for conditional menu
- Changed info bar from `Best of ${bestOf}` to `Leg ${legs.length} of ${bestOf}`

### HTML Changes (index.html)
- Removed lane dropdown from config modal
- Added Network button to settings modal
- Added network modal with lane dropdown and license notice
- Added `id="scoring-header"` for network mode styling

### CSS Changes (chalker.css)
- Added `.scoring-header.network-mode` with deep blue background
- Added `.network-notice` styling for license message
- Added larger dart symbol styling

### Service Worker
- Cache version bumped from `chalker-v78` to `chalker-v88`

---

## Summary

Version 4.1.18 prepares Chalker for future tournament integration with network mode infrastructure, improves match progress visibility with the dynamic leg indicator, and polishes the user experience with smarter confirmation flows and helpful idle state hints.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/CHALKER-PERSISTENCE.md**: Complete persistence implementation guide
- **Docs/RELEASE-NOTES-v4.1.18.md**: Previous release (Info Bar & UI Polish)

---

**NewTon DC Tournament Manager v4.1.19** - Ready for the network.
