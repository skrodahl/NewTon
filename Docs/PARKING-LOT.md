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

### Chalker Link in Tournament Manager Nav

Add a "Chalker" link to the main navigation menu in `tournament.html`, opening the Chalker app in a new tab. No tournament state awareness needed — just a convenient shortcut for referees at the board.

### Late Registration

A mid-tournament tool accessible via the Developer Console for adding a player who was not registered before the tournament started. Replaces the earlier "Bracket Editor" concept — this is narrower, safer, and fully reversible via the undo system.

**Scope:**
- Always a new, unregistered player — not a substitution for an existing player
- New player is automatically placed in a BYE slot in FS-R1 (random selection — never operator-chosen, to preserve draw fairness)
- Operation is recorded as a transaction; the undo system is the safety net (no forced export required)
- Dev Console only — the right level of friction for an edge case

**Eligibility rules for a FS-R1 BYE slot:**
- No completed downstream matches (except BYE-vs-BYE downstream matches, which are safe)
- No live downstream matches

**Warnings shown before any action:**
- If any FS-R1 BYE slots are ineligible: fairness warning — the draw cannot be fully fair, new player will only be placed in the remaining eligible slots
- List of specific completed matches that would need to be undone (by name: e.g. "FS-2-1 Edward vs Ben") and live matches that would need to be stopped — with explicit note that all affected matches must be replayed from the beginning
- If no eligible slots exist at all: clear refusal with explanation

**Implementation stages:**
1. **Stage 1 — Eligibility checker** (read-only, no data changes): scan FS-R1 BYE slots, apply eligibility rules, report "X of Y slots eligible", list blocking matches by name, display fairness and replay warnings. Verify this logic is correct before proceeding.
2. **Stage 2 — Player registration**: add the new player to the participant list, reusing the existing registration function (no duplication)
3. **Stage 3 — Slot placement**: randomly select an eligible BYE slot, undo the auto-advance of the FS-R1 match, place the new player, record as a transaction, re-render the bracket

The Dev Console menu entry (amber, after Toggle Read-Only) already exists and shows a placeholder message.

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
