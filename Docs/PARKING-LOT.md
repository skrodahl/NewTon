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

### v5.0.1 Release Preparation

Documentation and communication tasks before cutting the stable release:

- **User Guide** (`userguide.html`) — add TM→Chalker QR assignment section prominently; document the History tab and match detail view
- **Landing page — Tablet Scoring card** — update to mention QR assignment and result reporting
- **Landing page — Match Controls card** — update to reflect Scan QR Results button and live match flow
- **Screenshots** — update landing page and GitHub README.md screenshots to reflect current UI
- **Consolidated v5.0.1 release notes** — single authoritative release page summarising all beta improvements into a clean narrative for the stable release
- ~~**llms.txt**~~ — done (beta.8)
- ~~**Help subsystem**~~ — done (beta.8)

### Reddit Post

Announce NewTon on a relevant subreddit (r/darts, r/opensourcesoftware, or similar) when the timing feels right — not necessarily tied to the exact 5.0.1 release date.

---

## Later
*Worth tracking but not urgent*

### Analytics — Future Enhancements

The tab is named Analytics — it should earn that name over time. Ideas to consider:

- **Search / filter** — find a player or tournament across the full history
- **Player view** — aggregate stats per player across all tournaments (averages, achievements, tournament results)
- **Cross-tournament leaderboard** — who has the most 180s, highest average, most titles
- **Simplified summary view** — tournament card with headline stats, expandable to match detail; less table-heavy

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

**Last updated:** March 31, 2026 — Analytics future enhancements added; Record to History toggle removed (superseded by delete); Chalker scoreboard removed (done); llms.txt and help subsystem ticked off v5.0.1 prep list
