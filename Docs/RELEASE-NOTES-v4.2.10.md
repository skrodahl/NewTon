## NewTon DC Tournament Manager v4.2.10 Release Notes

**Release Date:** March 18, 2026
**Doc Pages & User Guide**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.10** adds five standalone documentation pages served directly from the application, a comprehensive user guide, sitemap improvements for search engine visibility, and a small UX fix to the Setup Actions panel.

This release contains one change to tournament functionality (Double Elimination moved to top of Setup Actions) and is otherwise a drop-in replacement for v4.2.9.

---

## User Guide

A full user guide is now available at `userguide.html`. It covers the entire tournament workflow in seven sections:

- **Quick Start** — Seven numbered steps from download to running your first tournament, rendered as styled cards with orange numbered circles
- **Tournament Formats** — Double Elimination vs Single Elimination explained, with guidance on when to choose each
- **Configuration** — Club identity, point system, match configuration, and lane management
- **Managing a Tournament** — Creating tournaments, registering players, the Saved Players registry, payment tracking, and generating brackets
- **Running Matches & Match Controls** — Bracket view (navigation panel, pan & zoom, match states, status panel), Match Controls command center (two-column Frontside/Backside layout, live matches sorted by lane, lane/referee conflict management, Referee Suggestions), Confirm Match Winner dialog with Match Progression preview, per-player Statistics dialog, and mid-tournament Leaderboard access
- **Developer Console** — Statistics panel (Quick Overview, Transaction Health, Match State, Player Count, Lane Usage, localStorage Usage) and a complete command reference including Late Registration
- **Results & Export** — Live standings, CSV export, JSON export/import
- **Tips & Tricks** — Undo, Late Registration, F1 help, offline use, multiple tournaments, data safety, self-hosting

---

## Documentation Pages

Four standalone HTML pages are now served directly from the application, styled consistently with the landing page:

### architecture.html

New page linked from the landing page's Get Started section. Covers the design philosophy and internals behind NewTon's crash-proof design: Single Source of Truth (MATCH_PROGRESSION lookup tables), Transaction History & Undo (event sourcing, surgical undo, auto-recovery), Data Separation (tournament data, transaction history, and global config kept strictly isolated), Offline-First Persistence, Strengths, and Known Limitations. Cross-linked to the Developer Console section in `userguide.html`, Privacy page, and REST API page.

### docker-quickstart.html

Replaces the link to the GitHub markdown file in the landing page's "Get Started" section. Covers the full self-hosting workflow: Quick Start (3 steps), a complete annotated `docker-compose.yml`, persistent storage, environment variables, reverse proxy setup (including an Nginx Proxy Manager example), security headers, logo/QR customisation, and troubleshooting.

### privacy.html

Replaces the GitHub link in the landing page footer. Covers the full privacy architecture: localStorage model, technical storage details, what NewTon doesn't do (no analytics, no telemetry, no external dependencies, no cookies, no accounts), storage key structure, export privacy, demo site model, self-hosting with the REST API, offline operation, FAQ, and summary.

### rest-api.html

New page linked from both `docker-quickstart.html` and `privacy.html`. Covers the complete REST API reference: overview, server requirements, directory structure, all three endpoints (List/Upload/Delete) with request/response examples and error tables, CORS headers, client-side feature detection, data format, security practices, and troubleshooting.

---

## Docs Page Styling (css/landing.css)

New CSS classes shared across all documentation pages:

- `.docs-back-link` — Fixed top-left navigation link in Insignia font
- `.docs-content` — Centered 760px column with doc-appropriate spacing
- `.docs-toc` — Warm cream table of contents box
- `.terminal-wrap` / `.terminal-bar` — macOS-style terminal blocks with traffic light dots (red/amber/green), dark background, soft green monospace text
- `.docs-footer` — Footer width constrained to match the 760px column
- Table styles — Consistent warm-palette table formatting for the REST API endpoint tables
- `.docs-quickstart` — Styled numbered step list with CSS counter circles (used in `userguide.html`)

---

## Landing Page — Get Started Section

Two cards have been added to the Get Started section. The User Guide card spans the full width of the section (below Local Use and Self-Hosted), with description text on the left and the "Read the Guide" button on the right. Below it, an Architecture & Reliability card links to `architecture.html`. Both cards use `.get-started-card--wide`. Applied to both `landing.html` and `landing-page.php`.

---

## Sitemap

`sitemap.xml` updated with all doc pages indexed and priorities rebalanced by search value:

| URL | Priority |
|-----|----------|
| `/` | 1.0 |
| `/userguide.html` | 0.8 |
| `/docker-quickstart.html` | 0.8 |
| `/architecture.html` | 0.7 |
| `/rest-api.html` | 0.7 |
| `/privacy.html` | 0.7 |
| `/chalker` | 0.6 |
| `/?launch` | 0.4 |

The `noindex` meta tag has been removed from all doc pages — they contain substantive content worth indexing.

---

## Setup Actions — Format Order

Double Elimination Cup now appears above Single Elimination Cup in the Setup Actions panel. DE is the primary tournament format for most club use; the previous order (SE first) led to accidental SE bracket generation.

---

## Bing Webmaster Tools

The `<meta name="msvalidate.01">` verification tag has been added to both `landing.html` and `landing-page.php` to enable Bing Webmaster Tools indexing and analytics.

---

## SEO — Meta Descriptions

`<meta name="description">` tags have been added to all five pages that were missing them — `userguide.html`, `docker-quickstart.html`, `privacy.html`, `rest-api.html`, and `chalker/index.html`. Each description summarises the page content for search engine result snippets.

---

## Files Changed

- `architecture.html` — New Architecture & Reliability page
- `userguide.html` — New user guide page
- `docker-quickstart.html` — New Docker quick start page
- `privacy.html` — New privacy architecture page
- `rest-api.html` — New REST API reference page
- `css/landing.css` — Docs page styles, terminal blocks, table styles, `.docs-quickstart`, `.get-started-card--wide`
- `landing.html` — Bing meta tag, Docker Quickstart link, Privacy footer link, User Guide card, Architecture & Reliability card
- `landing-page.php` — Same changes as `landing.html`
- `sitemap.xml` — Five doc pages added, priorities rebalanced
- `chalker/index.html` — Meta description added
- `js/bracket-rendering.js` — Double Elimination moved to top of Setup Actions
- `CHANGELOG.md` — v4.2.10 entry added

---

## Migration from v4.2.9

No migration required. Fully compatible with all existing tournaments and saved configurations.

---

**NewTon DC Tournament Manager v4.2.10** — Doc pages, user guide, and sitemap improvements.
