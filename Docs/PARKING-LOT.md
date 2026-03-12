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

### Match Archive — IndexedDB Store

Add a permanent indexedDB match archive alongside localStorage (no migration — localStorage stays untouched). The archive stores raw visit data per match and is the foundation for full scoresheet storage, player statistics, season history, and external reporting.

See **Docs/NETWORK-LAYER.md** (Storage Architecture Decision section) for record structure and rationale.

---

## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** March 12, 2026
