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

### Tournament Manager — Help System Update

The context-sensitive help system (`dynamic-help-system.js`) is lagging behind recent feature additions. New features needing help coverage include at minimum: TM→Chalker QR assignment, the Chalker nav link, and any Match Controls changes from v5.0.0.

### User Guide — TM→Chalker QR Section

Add a prominent section to `userguide.html` covering the full TM→Chalker QR assignment flow: generating the QR, scanning it in the Chalker, the confirmation screen, and the resulting match start. Targeted at operators setting up a match night.

### Landing Page — Chalker Card Rewrite

Rewrite the Chalker card in `landing.html` to lead with the QR assignment feature. Current text describes the Chalker as a standalone scoring app; it should now reflect that it receives match assignments directly from the TM via QR.

---

## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** March 25, 2026
