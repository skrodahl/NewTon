# Release Notes — v5.0.13 — The Pointy End

**NewTon DC Tournament Manager v5.0.13 — April 16, 2026**

---

## Overview

Tournament exports now carry the full Global Settings — point values and match lengths travel with the data instead of being silently replaced on import. The Analytics leaderboard gets visual polish and a filter-awareness upgrade.

---

## Config in Exports

Tournament JSON exports are now v4.1 format, including the complete Global Settings snapshot (point values, match lengths, and all configuration). Previously, exports contained no config — importing a tournament into Analytics would silently apply whatever settings happened to be active at import time, potentially misrepresenting the original scoring.

---

## Import Respects Config

When importing a v4.1 export into Analytics, the config from the JSON is used as the tournament's configuration snapshot. This ensures "Original" point mode shows the actual values the tournament was played with, not whatever happens to be in Global Settings today.

For older exports (pre-4.1) without a config field, current Global Settings are used as before — but the import confirmation modal now shows an amber warning making this explicit.

---

## Reset Button Accent

The Lens Reset button in the Analytics filter bar lights up with an amber border and warm tint when any filter is active. Provides a clear visual cue that the view is scoped — and where to click to clear it.

---

## Leaderboard Empty Cells

Zero-value cells in the Leaderboard now render as blank instead of em-dashes. Reduces visual noise and lets actual numbers stand out. The Points badge column shows 0 explicitly — important when viewing with Ranking and Attendance layers toggled off.

---

## Files Changed

- `js/tournament-management.js` — `config` field added to export payload in both `exportTournament()` and `buildTournamentPayload()`, export version bumped to 4.1
- `js/newton-history.js` — import prefers `t.config` from JSON over current settings; import warning toggle; leaderboard renders empty cells instead of dashes; reset button `.has-filter` class toggled in `renderScopeIndicator()`
- `js/main.js` — APP_VERSION bumped to 5.0.13
- `css/styles.css` — `.analytics-reset-btn.has-filter` warm accent styles
- `tournament.html` — `analyticsResetBtn` id on Reset button; `analyticsImportWarning` div in import modal

---

*NewTon DC Tournament Manager v5.0.13 — The Pointy End.*
