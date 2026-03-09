## NewTon DC Tournament Manager v4.2.2 Release Notes

**Release Date:** March 9, 2026
**Bug Fix Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.2** fixes a bug where the landing page HTML was visible when opening `tournament.html` directly in a browser without PHP processing. The landing page feature cards have also been reorganized.

This release contains no breaking changes and is a drop-in replacement for v4.2.1.

---

## Landing Page HTML Leak Fix

When `tournament.html` was opened directly in a browser (outside Docker), the landing page HTML content was rendered above the tournament app. Browsers parse `<?php ?>` tags as "bogus comments" ending at the first `>` character — and the landing page HTML contains many `>` characters in its tags, causing them to leak through.

**Solution:** The landing page HTML has been moved to a separate `landing-page.php` file and is included via the `<script><?php include ?></script>` pattern. Browsers treat PHP inside script tags as invalid JavaScript and silently ignore it. This is the same pattern already used by the demo site banner.

- `tournament.html` now contains a single-line PHP include (invisible to browsers)
- `landing-page.php` contains the full landing page (only accessed server-side via `include`)
- No change to Docker configuration or environment variables

---

## Landing Page Card Reorganization

- **New card**: Chalker Scoring App — tablet-optimized x01 scoring companion for referees
- **Removed**: Magic Zoom card (bracket visualization now mentioned in Single & Double Elimination card)
- **Highlight number cards** (0 dependencies, 4-32 players, ~60MB image, 100% privacy) moved into the hero section above the action buttons

**Feature card layout (2 rows of 4):**
1. Single & Double Elimination | Lane & Referee Management | Complete Undo System | Import & Export
2. Chalker Scoring App | Offline-First Design | Total Privacy | Self-Hostable with Docker

---

## Migration from v4.2.1

### Automatic
- Fully compatible with all existing tournaments
- No data migration required
- All existing features are unchanged

### Docker Deployments
- No configuration changes needed
- `NEWTON_LANDING_PAGE` and `NEWTON_BASE_URL` environment variables work as before

---

## Known Issues

None at time of release.

---

**NewTon DC Tournament Manager v4.2.2** — landing page fix, cleaner card layout.
