# Release Notes — v5.0.15-beta.2 — Offline at the Oche

**NewTon DC Tournament Manager v5.0.15-beta.2 — April 21, 2026**

---

## Overview

A new documentation page covering Automatic Backup — the feature that bridges offline tournament management and online Analytics. Plus a small quality-of-life addition for Analytics Mode administrators.

---

## Automatic Backup Documentation

New page at [automatic-backup.html](https://newtondarts.com/automatic-backup.html) covering:

- **Local backup** — tournaments saved to disk automatically at completion
- **Remote backup** — upload to a second instance (e.g. an online Analytics site) in the same step
- **The venue-to-cloud workflow** — how a club can run tournaments offline and publish results online immediately
- **Analytics Mode** — read-only access for all visitors
- **Manual fallback** — export/import when the internet connection isn't available
- **Setup guide** with Server Settings screenshot

Links added from the User Guide and Docker Quick Start.

---

## Analytics Mode Unlock

Undocumented `?tm=1` query parameter unlocks the full Tournament Manager interface when running in Analytics Mode (`NEWTON_MODE=analytics`). This allows administrators to load tournaments, review brackets, and correct missed achievements — then re-upload the corrected data.

---

## Files Changed

- `automatic-backup.html` — new documentation page
- `Screenshots/backup.png` — Server Settings screenshot
- `tournament.html` — `?tm=1` query parameter overrides Analytics Mode; body class uses `$appMode` variable
- `userguide.html` — links to Automatic Backup page
- `docker-quickstart.html` — link to Automatic Backup page
- `releases/README.md` — beta release process, cache buster step, version format note
- `js/main.js` — APP_VERSION bumped to 5.0.15-b.2
- `chalker/js/chalker.js` — CHALKER_VERSION bumped to 5.0.15-b.2
- `chalker/index.html` — cache buster incremented

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history.

---

*NewTon DC Tournament Manager v5.0.15-beta.2 — offline at the oche, online for everyone else.*
