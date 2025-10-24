# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

### Enhanced Tournament Validation
**Priority:** Medium (v4.0.1 or v4.1.0)

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

**Last updated:** October 25, 2025
