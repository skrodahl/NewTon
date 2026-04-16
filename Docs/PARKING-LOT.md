# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

*(empty)*

---

## Next
*Ready for implementation when time permits*

### User Guide — QR Workflow Illustration

The TM→Chalker QR assignment and result reporting workflow spans two devices and is hard to convey in text alone. One or two targeted screenshots or a simple diagram showing the flow would be sufficient. No full screenshot coverage — too much maintenance overhead for a living project.

---

## Later
*Worth tracking but not urgent*

### Analytics — Future Enhancements

The tab is named Analytics — it should earn that name over time. The IndexedDB foundation is already there; this is purely a UI and query layer on top.

**Player tab**
Dedicated per-player drill-down — form over time, head-to-head records, tournament history.

**Graphs**
Performance and form over time — the kind of thing that makes improvement (or decline) visible in a way a table never can.

**Leaderboard export**
Export leaderboard data (CSV or similar) for use outside the app.

**Table cogwheel**
Column visibility toggle and top-N threshold control on Analytics tables.

---

### Automated Testing

Flagged as the single most impactful improvement by the independent code audit (April 2026, `Docs/CodeReview/INDEPENDENT-AUDIT-2026-04.md`). The lookup-table architecture is highly testable — each entry in `DE_MATCH_PROGRESSION` and `SE_MATCH_PROGRESSION` can be verified mechanically.

**What to test first (from audit recommendations):**
- Progression tables — verify every match outcome routes to the correct winner/loser destination for 8, 16, and 32-player brackets
- `completeMatch() → advancePlayer()` pipeline — clear inputs and outputs
- Undo/redo — transaction rollback, achievement reversal, cascade through dependent matches
- Ranking calculations — per-bracket-size ranking functions for DE and SE

**Why it's not urgent:** The architecture is proven by hundreds of real tournament nights across v4 and v5. No automated tests exist, but the hardcoded lookup tables and single code path eliminate the class of bugs that tests would typically catch. The value is confidence during refactoring and future feature additions, not catching current bugs.

**Implementation approach:** Own tests first, then GitHub Actions to run them automatically.
- `node --test` (built into Node.js, zero dependencies) as the test runner — consistent with the zero-dependency philosophy
- Test files in `tests/` — pure logic tests against lookup tables and functions. No browser, no DOM, no mocking. Just "given this match result, does the winner go to the right place?"
- `.github/workflows/test.yml` to run on every push. Takes seconds, costs nothing. Blocks the build if something fails.

---

### Known Issue: Undo eligibility does not follow walkover chains

The undo check looks one level deep into downstream matches. If a downstream match is an AUTO-completed walkover, it is correctly ignored — but the check does not continue further down the chain. This means a match can show "Can Undo" even if a player has auto-advanced through a walkover into a live or manually-completed match further downstream.

**Why it's low priority:** Requires a specific combination of conditions — a deep BYE chain in a large bracket, an upstream manual match being undone, and a live or completed match at the end of that walkover chain. Always recoverable by stopping the affected downstream match first.

**Slightly elevated risk with Late Registration**, which operates in BYE-heavy brackets and increases the likelihood of long walkover chains. Still a compounding probability scenario; parking for now.

**Fix when addressed:** `isMatchUndoable()` and the bracket tooltip function in `js/bracket-rendering.js` should follow AUTO-completed downstream matches recursively until reaching a non-AUTO match, then apply the existing live/MANUAL checks.


## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** April 16, 2026 — removed completed items (Dashboard, Leaderboard, Stats cards); added Practice Mode and Chalker scoreboard retention
