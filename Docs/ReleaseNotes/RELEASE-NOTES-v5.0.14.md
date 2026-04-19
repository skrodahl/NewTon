# Release Notes — v5.0.14 — Narrowing the Scope

**NewTon DC Tournament Manager v5.0.14 — April 19, 2026**

---

## Overview

The app gets tighter on small screens. Tables, padding, headers, and navigation all adapt below 1024px — making Analytics and Global Settings genuinely usable on phones and tablets. The bracket nav panel gains an Analytics shortcut, and the main navigation underline is rebuilt from scratch.

---

## Mobile Layout (< 1024px)

Everything below 1024px is now optimised for narrow screens. The changes are global — they apply to all views, not just Analytics.

- **Reduced padding** — container, page, config sections, and Analytics header all tightened. The grey body border shrinks to a subtle 2px frame.
- **Denser tables** — smaller cell padding (2px), font size (10px), and row spacing (2px) across all tables. Player names drop from 15px to 10px (bold preserved). Badge cells (rank, points) tightened to match regular cells. Headers at 9px.
- **Header** — title font reduced to 1.5rem (prevents two-line wrapping that stretched the logo), clock hidden, padding and gap tightened.
- **Analytics** — description text and import/export buttons hidden. The data is what matters on a phone.
- **Global Settings** — number inputs narrowed to 80px (plenty for point values). Config buttons get `nowrap` and smaller font to prevent wrapping.

The leaderboard went from showing 4 truncated rows to 12+ full rows with all columns visible. Horizontal scroll handles overflow columns.

---

## Navigation Underline

The main nav bar underline was a sliding `::after` pseudo-element, positioned by JavaScript on every page change and window resize. When the nav wrapped to two lines on narrow screens, the underline appeared on the wrong line.

Replaced with a per-button `border-bottom` — the same approach used by the Analytics view tabs. Each button carries its own underline, so wrapping doesn't break anything. The `updateNavUnderline()` function and its resize listener are removed.

---

## Analytics Button on Bracket

The bracket navigation panel (Leaderboard, Match Controls, Setup, Registration, Config) now includes an Analytics button at the bottom. Previously, checking Analytics mid-tournament required exiting the bracket first and then clicking Analytics in the main nav — an unnecessary extra step.

---

## iOS QR Scanning — Status

The iOS image capture path (introduced in v5.0.14-beta.1, fixed in beta.2, improved in beta.3) is included in this release. iPad Pro (11-inch, 2nd gen) has been tested successfully. iPhone testing is ongoing — the full-resolution decode strategy in beta.3 has not yet been confirmed on iPhone. The workflow is functional but should be considered beta on iPhone until further testing.

The desktop and Android QR scanning paths are unaffected.

---

## Contributors

- [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — iOS platform detection strategy, real-device testing on iPhone 16 Pro Max and iPad Pro, identified the decode failure pattern that led to the full-resolution decode approach.

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history.

---

*NewTon DC Tournament Manager v5.0.14 — Narrowing the Scope*
