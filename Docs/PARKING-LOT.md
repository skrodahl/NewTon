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

### ~~Registration Page — "Add Player" During Active Tournament~~ — ✅ Complete (v4.2.8)

The "Tournament Already in Progress" modal now includes a third amber block pointing operators to the "Player arrived late?" button at the bottom of the Tournament Players list.

### Chalker Link in Tournament Manager Nav

Add a "Chalker" link to the main navigation menu in `tournament.html`, opening the Chalker app in a new tab. No tournament state awareness needed — just a convenient shortcut for referees at the board.

### ~~Late Registration~~ — ✅ Complete (v4.2.6–v4.2.8)

A mid-tournament tool accessible via the Developer Console for adding a player who was not registered before the tournament started. Replaces the earlier "Bracket Editor" concept — narrower, safer, and gated with a strong confirmation step.

All three stages are complete and deployed. Works in both DE and SE formats.

**What was built:**
- Eligibility checker scans FS Round 1 BYE slots and reports how many are available, listing any blocking matches by name and live/completed status
- Name input with duplicate detection and whitespace validation
- Random slot selection from eligible slots only — operator cannot choose
- Confirmation gate requiring the operator to type the player name exactly
- Re-validation at execution time — catches slots that go live between Step 1 and Step 3
- Player added to participant list and registered as paid
- BYE auto-advance undone cleanly before placement
- LATE_REGISTRATION transaction recorded in the audit log
- Bracket re-rendered and saved immediately after placement

### Known Issue: Undo eligibility does not follow walkover chains

The undo check looks one level deep into downstream matches. If a downstream match is an AUTO-completed walkover, it is correctly ignored — but the check does not continue further down the chain. This means a match can show "Can Undo" even if a player has auto-advanced through a walkover into a live or manually-completed match further downstream.

**Why it's low priority:** Requires a specific combination of conditions — a deep BYE chain in a large bracket, an upstream manual match being undone, and a live or completed match at the end of that walkover chain. Always recoverable by stopping the affected downstream match first.

**Slightly elevated risk with Late Registration**, which operates in BYE-heavy brackets and increases the likelihood of long walkover chains. Still a compounding probability scenario; parking for now.

**Fix when addressed:** `isMatchUndoable()` and the bracket tooltip function in `js/bracket-rendering.js` should follow AUTO-completed downstream matches recursively until reaching a non-AUTO match, then apply the existing live/MANUAL checks.

### Landing Page — Screenshot Lightbox

The "See It in Action" showcase section uses full-page screenshots that are too detailed to read at thumbnail size.

**Plan:**
- Replace current screenshots with focused thumbnails (cropped or purpose-made) that clearly illustrate each specific feature
- Add a pure JS/CSS lightbox so clicking a thumbnail expands the full-size image — no external libraries, consistent with zero-dependencies philosophy

Both changes can be done independently: new images first, lightbox wired up when images are ready.

### Match Archive — IndexedDB Store

Add a permanent indexedDB match archive alongside localStorage (no migration — localStorage stays untouched). The archive stores raw visit data per match and is the foundation for full scoresheet storage, player statistics, season history, and external reporting.

See **Docs/NETWORK-LAYER.md** (Storage Architecture Decision section) for record structure and rationale.

---

## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** March 13, 2026
