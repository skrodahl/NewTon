## NewTon DC Tournament Manager v4.2.5 Release Notes

**Release Date:** March 11, 2026
**Landing Page Update**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.5** is a landing page update for Docker deployments. No changes to tournament functionality.

This release contains no breaking changes and is a drop-in replacement for v4.2.4.

---

## Changes

### Landing Page
- **Hero image optimised**: Switched from `newton-cartoon.png` (2.1MB) to `newton-cartoon.jpg` (164KB) — 13× smaller with no visible quality loss
- **OG & Twitter Card image**: Changed to `newton-poster-throw.jpg` for cleaner, more readable link previews on WhatsApp, Slack, and social media
- **Lane & Referee Management card**: Rewritten to accurately describe the conflict detection system — players officiating a match are blocked from playing until free, players in a live match are excluded from referee selection, and suggestions prioritise recent losers, winners, and referee history
- **Google Search Console**: Site verification meta tag added

### Developer Console
- **Bracket Editor**: New placeholder entry added (amber, after Toggle Read-Only) — shows an "upcoming feature / here be dragons" message. Documented in `Docs/PARKING-LOT.md` with full implementation plan for a future release.

---

## Files Changed

- `landing.html` / `landing-page.php` — hero image, OG/Twitter Card image, feature card text, Google Search Console tag
- `tournament.html` — Bracket Editor menu entry
- `js/analytics.js` — `commandBracketEditor()` stub
- `js/main.js` — version bumped to v4.2.5
- `CHANGELOG.md` — v4.2.5 entry added
- `Docs/PARKING-LOT.md` — Bracket Editor documented

---

## Migration from v4.2.4

No migration required. Fully compatible with all existing tournaments and saved configurations.

---

**NewTon DC Tournament Manager v4.2.5** — landing page improvements and a Bracket Editor placeholder in the Developer Console.
