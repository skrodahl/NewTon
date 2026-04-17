## NewTon DC Tournament Manager v4.2.12 Release Notes

**Release Date:** March 19, 2026
**Dedicated Domain: newtondarts.com**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.12** migrates all project URLs from `darts.skrodahl.net` to the new dedicated domain `newtondarts.com`. No changes to tournament functionality — this is a drop-in replacement for v4.2.11.

---

## Domain Migration

All references to the previous subdomain `darts.skrodahl.net` have been updated to `newtondarts.com`:

- **README.md** — All links to the official website, user guide, architecture page, Docker quickstart, REST API reference, and privacy page
- **llms.txt** — Live demo URL and all documentation links
- **sitemap.xml** — All page URLs updated for search engine indexing
- **robots.txt** — Sitemap URL
- **docker-quickstart.html** — Demo site reference link
- **privacy.html** — Demo site reference link

---

## Google Search Console

Verification tag updated for the new domain:

- `landing.html` — `google-site-verification` meta tag replaced
- `landing-page.php` — Same update for Docker-served landing page

Bing Webmaster Tools verification tag remains unchanged.

---

## Accessibility

- `landing.html` — Added `<main>` landmark element wrapping all page content before the footer
- `landing-page.php` — Same change

Resolves the Lighthouse accessibility flag "Document does not have a main landmark". Screen readers use the `<main>` element to let users skip directly to page content. No visual change.

---

## Release Notes Pages

Standalone HTML release notes pages are now served directly from the application at `https://newtondarts.com/releases/`.

- **`releases/index.html`** — always the latest release notes
- **Versioned pages** — permanent pages for each v4.2.x release (`v4.2.0.html` through `v4.2.12.html`), each with a download button linking to the exact GitHub release tag
- **Previous Releases index** — every page lists older releases with version, date, and tagline
- **sitemap.xml** — all release pages indexed; versioned pages use `changefreq: never`, the index uses `changefreq: weekly`

---

## Landing Page — Download Button

The "Download Latest Release" button in the Get Started section now points to `/releases/` instead of directly to GitHub. Visitors land on the release notes page, which provides context and then links to the GitHub release tag. The `target="_blank"` attribute has been removed — no need to open an internal page in a new tab.

---

## Landing Page — Mobile Fix

Get Started card buttons (User Guide, Docker Quickstart) now stack below their text on screens narrower than 600px, matching the responsive behaviour of the rest of the Get Started section.

---

## Files Changed

- `README.md` — All URLs updated to newtondarts.com
- `llms.txt` — All URLs updated to newtondarts.com
- `sitemap.xml` — All URLs updated to newtondarts.com, release notes pages added
- `robots.txt` — Sitemap URL updated to newtondarts.com
- `landing.html` — Google Search Console verification tag updated, `<main>` landmark added
- `landing-page.php` — Google Search Console verification tag updated, `<main>` landmark added
- `docker-quickstart.html` — Demo site link updated
- `privacy.html` — Demo site link updated
- `landing.html` / `landing-page.php` — "Download Latest Release" button points to `/releases/`
- `css/landing.css` — Mobile fix for wide Get Started cards, `.docs-content .btn-github` style added
- `releases/` — New folder with `index.html`, `v4.2.0.html` through `v4.2.12.html`, and `README.md`
- `CHANGELOG.md` — v4.2.12 entry updated

---

## Migration from v4.2.11

No migration required. Fully compatible with all existing tournaments and saved configurations. The previous domain `darts.skrodahl.net` should redirect to `newtondarts.com`.

---

**NewTon DC Tournament Manager v4.2.12** — Dedicated domain: newtondarts.com.
