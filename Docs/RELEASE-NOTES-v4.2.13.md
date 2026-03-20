## NewTon DC Tournament Manager v4.2.13 Release Notes

**Release Date:** March 20, 2026
**A+ Security Headers. Yes, Really.**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.13** achieves an A+ security rating on SecurityHeaders.com for the landing page and all documentation pages by eliminating every inline script and style. The Tournament Manager app and Chalker retain their A rating — `unsafe-inline` is an architectural requirement for offline single-file deployment. No changes to tournament functionality — this is a drop-in replacement for v4.2.12.

---

## CSP Hardening

The Content-Security-Policy header has been split into two tiers:

### A+ — Landing Page & Documentation (strict CSP, no `unsafe-inline`)

All inline JavaScript has been extracted to an external file, and all inline styles replaced with CSS classes. These pages now serve a strict CSP that blocks all inline code execution — the gold standard for XSS prevention.

**Pages with A+ rating:**
- Landing page (`landing.html`, `landing-page.php`)
- User Guide (`userguide.html`)
- Privacy (`privacy.html`)
- Architecture & Reliability (`architecture.html`)
- Docker Quick Start (`docker-quickstart.html`)
- REST API (`rest-api.html`)
- All release notes (`releases/*.html`)

### A — Tournament Manager & Chalker (permissive CSP, `unsafe-inline` required)

The Tournament Manager app contains 93+ inline event handlers (`onclick`, `onchange`, `onmouseover`, `onmouseout`) and 266+ inline style attributes throughout the markup. These are an architectural requirement for single-file offline deployment — the app must work by double-clicking `tournament.html` with no build process, no bundler, and no server.

The Chalker scoring app has a similar architecture with inline styles and scripts for its PWA operation.

Both apps retain `'unsafe-inline'` in their CSP and grade **A** on SecurityHeaders.com. External resource loading remains fully blocked (`script-src 'self'`), preventing the primary XSS attack vector.

**Pages with A rating:**
- Tournament Manager (`tournament.php` / `tournament.html`)
- Chalker (`/chalker/`)

---

## What Changed

### js/lightbox.js (new file)

The lightbox functionality has been extracted from inline code to an external JavaScript file:

- `openLightbox()`, `closeLightbox()`, `_lbEsc()` functions
- Click handlers on `.lightbox-trigger` images (using `data-full` attribute for the full-size image path)
- Backdrop click-to-close and close button handlers
- Escape key listener
- Logo error fallback (replaces broken logo image with placeholder)

### HTML changes

- **7 showcase images**: `onclick="openLightbox(...)"` replaced with `data-full="..."` attribute — the JS file reads the `data-full` attribute and the existing `alt` text
- **Lightbox markup**: `onclick` handlers removed from the backdrop `<div>`, content `<div>`, and close `<button>`
- **Logo `<img>`**: `onerror="..."` handler removed
- **Footer text**: `style="color: #a89080;"` replaced with `class="footer-cheeky"`
- **Inline `<script>` block**: replaced with `<script src="js/lightbox.js"></script>`

Applied to both `landing.html` and `landing-page.php`.

### Footer style (all pages)

The inline `style="color: #a89080;"` on the "No popups? No cookies!" text has been replaced with the existing `.footer-cheeky` CSS class across all pages:

- `landing.html`, `landing-page.php`
- `userguide.html`, `privacy.html`, `architecture.html`, `docker-quickstart.html`, `rest-api.html`
- All 13 release notes pages (`releases/v4.2.0.html` through `releases/v4.2.12.html`)
- `releases/index.html`
- `releases/README.md` (template)

### nginx.conf (differentiated CSP)

The server-level CSP is now strict (no `unsafe-inline`). Two location blocks override it with the permissive CSP:

- `location ~ \.php$` — serves `tournament.php` and the REST API
- `location /chalker/` — serves the Chalker PWA

All other requests (static HTML pages, CSS, JS, images, fonts) inherit the strict CSP.

Note: In nginx, `add_header` directives inside a `location` block replace (not add to) server-level headers. This is why the PHP and Chalker blocks repeat all five security headers.

---

## Landing Page Routing

The landing page has been fully decoupled from `tournament.html`.

### tournament.html
The PHP one-liner that previously detected `NEWTON_LANDING_PAGE` and included `landing-page.php` has been removed. `tournament.html` is now a pure tournament app file — opening it locally works exactly as before, and the Docker config injector (`window.NEWTON_CONFIG`) is untouched.

### landing-page.php — new entry point
`landing-page.php` is now the primary index for the Docker image. A redirect check at the top of the file handles routing:

- `NEWTON_LANDING_PAGE=true` → renders the landing page (strict CSP, **A+**)
- Env var not set → 302 redirect to `/tournament.php` (tournament-only deployments go straight to the app)

### /tournament.html — clean, indexable URL
nginx rewrites `/tournament.html` to `tournament.php` internally. The client URL stays `/tournament.html` — clean enough for Google to index, and processed as PHP for the Docker config injection and permissive CSP.

---

## Files Changed

- `js/lightbox.js` — New external lightbox script
- `landing.html` — Inline JS/styles removed, external script added
- `landing-page.php` — Redirect logic added at top; same inline JS/style removals as `landing.html`
- `tournament.html` — PHP landing page switcher removed (line 1)
- `userguide.html` — Footer inline style replaced with class
- `privacy.html` — Footer inline style replaced with class
- `architecture.html` — Footer inline style replaced with class
- `docker-quickstart.html` — Footer inline style replaced with class
- `rest-api.html` — Footer inline style replaced with class
- `releases/*.html` — Footer inline style replaced with class (13 files)
- `releases/index.html` — Footer inline style replaced with class
- `releases/README.md` — Template updated
- `docker/nginx.conf` — Differentiated CSP: strict default, permissive for PHP and Chalker; `landing-page.php` as primary index; `/tournament.html` rewrite added
- `CHANGELOG.md` — v4.2.13 entry added

---

## Migration from v4.2.12

No migration required. Fully compatible with all existing tournaments and saved configurations.

---

**NewTon DC Tournament Manager v4.2.13** — A+ where it matters. A where it must.
