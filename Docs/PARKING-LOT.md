# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

### Chalker Persistence

**Goal:** Match data survives page reload, history of past matches.

**Storage decision: IndexedDB**

Chose IndexedDB over localStorage for these reasons:
- Larger storage (~50MB+ vs ~5MB)
- Selective cleanup: can delete matches older than X days using indexes
- Potential to share unified database with Tournament Manager later
- Complexity is manageable with a thin wrapper (~40 lines)

**Database structure (draft):**
- Database: `newton`
- Stores: `chalker_current`, `chalker_history`

*Note: Tournament Manager stays on localStorage - storage needs are modest after optimization. No need for shared database.*

**Features to consider:**
- Auto-save current match on every score entry
- Resume unfinished match on page load
- History screen to view past matches
- Option to continue incomplete matches

**Open questions:**
- How much history to retain? (last 10? 50? configurable?)
- Cleanup threshold (delete matches older than X days?)

---

## Next
*Ready for implementation when time permits*

*(empty)*

---

## Later
*Worth tracking but not urgent*

*(empty)*

---

## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** January 9, 2025
