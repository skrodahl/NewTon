# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

### Enhanced Tournament Validation
**Priority:** Medium (v4.1.0)

**Goal:** Catch tournament integrity problems early, before they become emergencies

**Implementation ideas:**
- Expand Developer Console validation beyond basic health checks
- Test for integrity issues:

  **Essential checks:**
  - Player in multiple simultaneous matches
  - History-state mismatch (corruption indicator)
  - Impossible bracket progression paths
  - localStorage bloat indicators (early warning)
  - Duplicate match completions in history

  **Nice to have:**
  - Orphaned players (referenced in matches but don't exist)
  - Referee in multiple simultaneous matches
  - Lane conflicts (two matches on same lane simultaneously)
  - Transaction timestamp anomalies
  - Invalid match state transitions
  - Missing required transaction data

**Validation mode:**
- **Passive**: Run on-demand from Developer Console (Health Check)
- Display clear problem descriptions with severity levels (essential/warning/info)
- Suggestions for resolution when problems found
- Export button available if critical issues detected (emergency escape)

**Philosophy:** Prevent emergencies through early detection, not emergency editing tools

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

### Import Pre-v4.0 Transaction History
**Date resolved:** October 28, 2025
**Original priority:** High (v4.0.2)

**Question:** Can pre-v4.0 transaction log be imported to enable undo functionality?

**Investigation results:** Pre-v4.0 exports DO contain complete transaction history, but it uses an incompatible snapshot-based format. Each transaction stores the entire tournament state in `beforeState` (~50 KB per transaction), resulting in 8+ MB of data for a typical tournament.

**Decision:** Do NOT import pre-v4.0 history. Import only tournament data (players, matches, bracket, placements).

**Why:**
- Pre-v4.0 snapshot format is incompatible with v4.0's replay-based undo system
- Massive localStorage bloat (8-10 MB per tournament) with zero functionality
- v4.0 cannot use pre-v4.0 snapshots for undo operations
- Tournament data imports correctly without history

**Implementation:** Modified import logic to skip pre-v4.0 history while preserving all tournament data. Results in 98.8% reduction in localStorage usage for imported tournaments.

### Import Saved Players from Shared Tournaments (Automatic)
**Date rejected:** October 28, 2025
**Original priority:** High (v4.0.2)

**Proposal:** When loading a tournament from server (REST API), automatically offer to import the `playerList` included in the export.

**Why rejected:** Corner case that doesn't justify added complexity. The existing "Import Saved Players" button already handles this workflow adequately. Automatic import would add code complexity and potential user annoyance for minimal benefit. The manual workflow (download file → click Import Saved Players) works fine for the rare occasions when this is needed.

**Workaround:** Use existing "Import Saved Players" button on Player Registration page to manually import from tournament export file.

---

**Last updated:** October 28, 2025
