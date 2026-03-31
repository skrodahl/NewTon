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

### Reddit Post

Announce NewTon on a relevant subreddit (r/darts, r/opensourcesoftware, or similar) when the timing feels right.

---

## Later
*Worth tracking but not urgent*

### Analytics — Future Enhancements

The tab is named Analytics — it should earn that name over time. The IndexedDB foundation is already there; this is purely a UI and query layer on top.

**Entry point — Stats cards**
Headline numbers at a glance: most 180s this season, highest average, current title holder, longest winning streak. Clickable to drill into the underlying detail.

**Player view**
Aggregate stats per player across all tournaments — averages, achievements, tournament results, form over time.

**Cross-tournament leaderboard**
Who has the most 180s, highest average, most titles across the full history.

**Custom views — Oracle-style**
Saved filters or pivot views over the match register. Users define what they want to see and save it for quick access.

**Graphs**
Performance and form over time — the kind of thing that makes improvement (or decline) visible in a way a table never can. Makes the club want to keep running tournaments just to watch the data accumulate.

**Simplified summary view**
Tournament card with headline stats, expandable to match detail — less table-heavy than the current list.

No decisions made — just a direction.

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

**Last updated:** March 31, 2026 — v5.0.1 shipped; prep list cleared; QR workflow illustration and Reddit post remain in Next; Analytics future enhancements in Later
