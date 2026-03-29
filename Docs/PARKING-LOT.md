# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

*(empty)*

---

## Next
*Ready for implementation when time permits*

### User Guide — Screenshot Presentation Style

Images in the user guide should use the same presentation as the landing page "See It in Action" cards: framed container, slight zoom-on-hover, zoom icon overlay, and expand into lightbox on click. Not plain inline images. Reuse the existing lightbox.js and the landing page CSS patterns.

---

### v5.0.1 Release Preparation

Documentation and communication tasks before cutting the stable release:

- **User Guide** (`userguide.html`) — add TM→Chalker QR assignment section prominently; document the History tab and match detail view
- **llms.txt** — update to reflect NewtonMatchDB, History tab, and QR result reporting
- **Landing page — Tablet Scoring card** — update to mention QR assignment and result reporting
- **Landing page — Match Controls card** — update to reflect Scan QR Results button and live match flow
- **Help subsystem** (`dynamic-help-system.js`) — update context-sensitive help for new features
- **Screenshots** — update landing page and GitHub README.md screenshots to reflect current UI
- **Consolidated v5.0.1 release notes** — single authoritative release page summarising all beta improvements into a clean narrative for the stable release

### Reddit Post

Announce NewTon on a relevant subreddit (r/darts, r/opensourcesoftware, or similar) when the timing feels right — not necessarily tied to the exact 5.0.1 release date.

---

## Later
*Worth tracking but not urgent*

### Known Issue: Undo eligibility does not follow walkover chains

The undo check looks one level deep into downstream matches. If a downstream match is an AUTO-completed walkover, it is correctly ignored — but the check does not continue further down the chain. This means a match can show "Can Undo" even if a player has auto-advanced through a walkover into a live or manually-completed match further downstream.

**Why it's low priority:** Requires a specific combination of conditions — a deep BYE chain in a large bracket, an upstream manual match being undone, and a live or completed match at the end of that walkover chain. Always recoverable by stopping the affected downstream match first.

**Slightly elevated risk with Late Registration**, which operates in BYE-heavy brackets and increases the likelihood of long walkover chains. Still a compounding probability scenario; parking for now.

**Fix when addressed:** `isMatchUndoable()` and the bracket tooltip function in `js/bracket-rendering.js` should follow AUTO-completed downstream matches recursively until reaching a non-AUTO match, then apply the existing live/MANUAL checks.


### NewtonMatchDB — Per-Tournament "Record to History" Toggle

Add a checkbox in Tournament Setup (default: on) to opt a tournament out of the match register before it starts. When off, `completeMatch()` skips all `NewtonDB.saveMatch()` and `NewtonDB.saveTournamentMeta()` calls — the tournament never enters the History tab. The running Match History in Tournament Setup is unaffected (reads from the in-memory `matches` array, not IndexedDB).

Effectively a practice mode. No gaps in the historical record because the tournament was never part of it. Eliminates the need for a delete button.

**Implementation:** `tournament.recordHistory` boolean flag (default `true`), checked in the `completeMatch()` DB write hook and the `finalizeTournament` hook.

---

### Chalker: Stay on Scoreboard After Match Completion

**Current behaviour:** Entering a winning checkout immediately transitions to the match completion stats screen. No way back if the score was entered by mistake.

**Desired behaviour:** A successful checkout lands back on the scoreboard (showing the final state — scores, leg count, winner). The match is complete but the operator is still "in it" and can correct a mistaken entry.

**New flow from the completed scoreboard:**
- **Stats** button → opens the match stats (averages, leg detail, etc.)
- **Result QR** → accessible from the stats screen, not the scoreboard
- **New** button → saves the completed match to history and starts the new-match flow (replaces current "Start new match" dialog)
- **Rematch** → still available

**What this removes:** The end-screen "Start new match" dialog (Rematch / New Match / History / Result QR buttons). It takes up half the screen, lacks the QR match option, and becomes redundant once "New" is a button on the completed scoreboard.

**Why it matters:** Currently there is no recovery path for a mistaken checkout entry short of starting a new match. Staying on the scoreboard gives the operator a natural review moment before committing.

**Scope note:** Affects `chalker/js/chalker.js` (`showEndScreen`, `startMatchFromQR` flow) and `chalker/index.html` (end-screen markup). The Result QR button moves from the end-screen to the stats view.

---

## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** March 29, 2026 — removed implemented Match Archive item; added v5.0.1 release prep tasks and Reddit post
