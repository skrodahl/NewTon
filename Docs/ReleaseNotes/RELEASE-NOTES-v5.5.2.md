# Release Notes — v5.5.2 — NewTon DC Only: The Lens Steps Aside

**NewTon DC Tournament Manager v5.5.2 — November 16, 2026**

---

## Overview

A small release for one club. Both changes are in NewTon DC's season final, which only exists on the club's own installation. **On every other installation nothing changes.**

---

## NewTon DC club-specific changes

- **The Lens steps aside on the Season final tab.** The tab counts the saved season, not the Lens, and its own tags say what that is. So the Lens row (the tournament count, the name, the dates and the half-year buttons) is hidden while the tab is open, which gives the table and the groups the room, most of all on a phone. Points (As played / Custom) stays, because the tab follows it. On All players and every other view the Lens is there as before.
- **Not available is a switch.** The mark on a standings row is now a switch instead of a "Not available" / "Available again" link, in Fill from season standings and on the Season final tab alike. A click on it never opens the player's profile, and if a save fails the switch goes back.

---

## Files Changed

- `js/newton-history.js`, `tournament.html`, `css/analytics-page.css` — the Lens hidden on the Season final tab
- `js/season-final.js`, `css/match-controls.css` — the Not available switch, shared by both tables

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history. Nothing stored has changed.

This release moves `:latest` forward to v5.5.2. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.5.2 — NewTon DC Only: The Lens Steps Aside*
