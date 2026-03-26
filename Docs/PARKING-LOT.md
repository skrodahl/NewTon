# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

*(empty)*

---

## Next
*Ready for implementation when time permits*

*(empty)*

---

## Later
*Worth tracking but not urgent*

### Known Issue: Undo eligibility does not follow walkover chains

The undo check looks one level deep into downstream matches. If a downstream match is an AUTO-completed walkover, it is correctly ignored — but the check does not continue further down the chain. This means a match can show "Can Undo" even if a player has auto-advanced through a walkover into a live or manually-completed match further downstream.

**Why it's low priority:** Requires a specific combination of conditions — a deep BYE chain in a large bracket, an upstream manual match being undone, and a live or completed match at the end of that walkover chain. Always recoverable by stopping the affected downstream match first.

**Slightly elevated risk with Late Registration**, which operates in BYE-heavy brackets and increases the likelihood of long walkover chains. Still a compounding probability scenario; parking for now.

**Fix when addressed:** `isMatchUndoable()` and the bracket tooltip function in `js/bracket-rendering.js` should follow AUTO-completed downstream matches recursively until reaching a non-AUTO match, then apply the existing live/MANUAL checks.

### Match Archive — IndexedDB Store

Add a permanent indexedDB match archive alongside localStorage (no migration — localStorage stays untouched). The archive stores raw visit data per match and is the foundation for full scoresheet storage, player statistics, season history, and external reporting.

See **Docs/NETWORK-LAYER.md** (Storage Architecture Decision section) for record structure and rationale.


### Chalker: Stay on Scoreboard After Match Completion

**Current behaviour:** Entering a winning checkout immediately transitions to the match completion stats screen. No way back if the score was entered by mistake.

**Desired behaviour:** A successful checkout lands back on the scoreboard (showing the final state — scores, leg count, winner). The match is complete but the operator is still "in it" and can correct a mistaken entry.

**New flow from the completed scoreboard:**
- **Stats** button → opens the match stats (averages, leg detail, etc.)
- **Result QR** → accessible from the stats screen, not the scoreboard
- **New** button → saves the completed match to history and starts the new-match flow (replaces current "Start new match" dialog)
- **Rematch** → still available

**What this removes:** The end-screen "Start new match" dialog (Rematch / New Match / History / Result QR buttons). It takes up half the screen, lacks the QR match option, and becomes redundant once "New" is a button on the completed scoreboard.

**Why it matters:** Currently there is no recovery path for a mistaken checkout entry short of starting a new match. Staying on the scoreboard gives the operator a natural review moment before committing.

**Scope note:** Affects `chalker/js/chalker.js` (`showEndScreen`, `startMatchFromQR` flow) and `chalker/index.html` (end-screen markup). The Result QR button moves from the end-screen to the stats view.

---

## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** March 26, 2026
