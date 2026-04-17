## NewTon DC Tournament Manager v4.2.7 Release Notes

**Release Date:** March 13, 2026
**SEO & Landing Page Polish**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.7** delivers SEO infrastructure (sitemap and robots.txt update), font loading improvements that eliminate the flash of unstyled text, and a new "Get Started" section on the landing page.

This release contains no changes to tournament functionality and is a drop-in replacement for v4.2.6.

---

## SEO

### sitemap.xml
A `sitemap.xml` has been added to the repo root, listing the three indexable URLs on the site:

- `https://darts.skrodahl.net/` — landing page
- `https://darts.skrodahl.net/?launch` — Tournament Manager
- `https://darts.skrodahl.net/chalker` — Chalker App

### robots.txt
A `Sitemap:` directive has been added pointing to `https://darts.skrodahl.net/sitemap.xml`, allowing Google and other crawlers to discover the sitemap automatically.

---

## Landing Page

### Font Loading — No More Flicker
Two changes work together to eliminate the flash of unstyled text (FOUT) on page load:

- **`<link rel="preload">`** hints added to `<head>` for both custom fonts (Insignia and Manrope) — the browser fetches the fonts early, before it would otherwise discover them via the stylesheet
- **`font-display: block`** replaces `swap` in `landing.css` — the browser holds a brief invisible slot for the font rather than rendering fallback text and swapping later

Combined with preloading, the invisible window is imperceptible on a normal connection, and the page renders with the correct branded fonts from the first paint.

### Get Started Section
A new "Get Started" section has been added directly below the hero buttons, before Key Features. It presents two clear paths for new users:

- **Local Use**: Download the latest release, unzip, double-click `tournament.html` — no installation required
- **Self-Hosted**: Deploy with Docker using the quickstart guide

Both cards link to the relevant GitHub resources and include hover effects consistent with the rest of the page.

### Meta Description
Shortened from 190 to 155 characters to fit within Google's search result display window. All key selling points are preserved.

### App Buttons Open in New Tab
"Launch Tournament Manager" and "Open Chalker App" now open in a new tab (`target="_blank"`), keeping the landing page open. "View on GitHub" is unchanged.

---

## Files Changed

- `sitemap.xml` — new file
- `robots.txt` — `Sitemap:` directive added
- `landing.html` — font preload hints, meta description, app button targets, Get Started section
- `landing-page.php` — same changes as `landing.html`
- `css/landing.css` — `font-display: block`, Get Started section styles
- `CHANGELOG.md` — v4.2.7 entry added

---

## Migration from v4.2.6

No migration required. Fully compatible with all existing tournaments and saved configurations.

---

**NewTon DC Tournament Manager v4.2.7** — sitemap, font loading fix, and Get Started section.
