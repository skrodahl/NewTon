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

### Bracket Editor

A mid-tournament bracket editing tool accessible only via the Developer Console (`newton.bracketEditor()`). Allows direct editing of player names in any bracket slot — including BYEs — to recover from registration errors or player substitutions (e.g. someone leaving, replaced by a recent loser).

**Implementation steps:**
1. **Hidden access** — not in any menu, only via DevTools console (`newton.bracketEditor()`)
2. **Confirmation phrase** — must type "Bracket Editor" to continue (similar to Reset All Config / Reset Tournament gates)
3. **Forced export** — JSON backup downloads automatically before the editor opens
4. **Strong warning** — explicit acknowledgement that this can corrupt the tournament
5. **Minimal editor** — name fields only, nothing structural; edit any slot including BYEs
6. **Built-in reimport** — one-click restore from the backup taken in step 3

The menu entry already exists in the Developer Console (amber, after Toggle Read-Only) and shows an "upcoming feature / here be dragons" placeholder message.

### Match Archive — IndexedDB Store

Add a permanent indexedDB match archive alongside localStorage (no migration — localStorage stays untouched). The archive stores raw visit data per match and is the foundation for full scoresheet storage, player statistics, season history, and external reporting.

See **Docs/NETWORK-LAYER.md** (Storage Architecture Decision section) for record structure and rationale.

---

## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** March 11, 2026
