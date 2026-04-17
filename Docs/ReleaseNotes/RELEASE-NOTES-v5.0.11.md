# Release Notes — v5.0.11 — We Found You a Match

**NewTon DC Tournament Manager v5.0.11 — April 15, 2026**

---

## Overview

The Analytics register learns to show every match in one view, and the navigation learns to tell you where you are.

v5.0.11 adds a flat all-matches view wired to the Dashboard, breadcrumb navigation that replaces back buttons, register sub-tabs, half-year lens presets, and a bugfix for match detail lookups.

---

## Matches View

The **Matches** stat card on the Dashboard now links through to a flat list of every completed match across the current scope. Columns: Match ID, Player 1, Player 2, Result, Points, Tournament, Date, and Type. Winners bolded. Tournament names are clickable — drill into any tournament directly from the list.

The Register now has two sub-tabs: **Tournaments** and **Matches**. Switch between the tournament list and the flat match view at any time. The Matches tab is also reachable via the Dashboard card.

---

## Breadcrumb Navigation

The sub-tab bar doubles as a breadcrumb trail. Drill into a tournament and the bar extends:

```
Tournaments / Måndagscup (2026-03-09) / FS-4-1   Matches
```

Every segment is clickable. The tournament date is shown in parentheses for disambiguation — essential when 30 tournaments share the same name. The old back buttons are gone; the breadcrumb is the navigation.

Match detail headers now show date and match ID: **2026-03-09 · FS-4-1**.

---

## Other Changes

- **Import confirmation modal** — replaces the plain confirm() dialog with a styled modal showing tournament name, date, player count, match count, and format.
- **Delete modal shows date** — tournament name includes the date in parentheses for disambiguation.
- **Import Register in analytics mode** — no longer hidden. Register import is safe (merge, not overwrite).
- **Half-year presets** — two buttons in the Lens bar for quick date scoping: current and previous half-year (e.g. 2026H1, 2025H2).
- **Leaderboard sort direction** — first click sorts descending for numeric columns. Best Leg sorts ascending (fewest darts first).

---

## Bugfix

- **Match detail lookup** — fixed a stale closure where clicking a match in the per-tournament match list would fail with "Match record not found" after viewing more than one tournament in the same session. The table's row click handler captured the tournament ID from the first call, ignoring subsequent tournaments.

---

## Files Changed

- `tournament.html` — register sub-tabs, breadcrumb bar, removed back button rows, import confirmation modal
- `js/newton-history.js` — matches view, breadcrumb navigation, switchRegisterTab(), match detail bugfix, half-year presets, import modal, leaderboard sort direction
- `js/main.js` — APP_VERSION updated
- `css/styles.css` — breadcrumb styles, sub-tab styles

---

*NewTon DC Tournament Manager v5.0.11 — We Found You a Match.*
