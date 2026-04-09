# Release Notes — v5.0.2 — Because Every Other One Wants Your Email

**NewTon DC Tournament Manager v5.0.2 — April 9, 2026**

---

## Overview

We needed a payment QR code for tournament night. Every generator online wanted us to sign up, upgrade, or watermark. So we built one.

v5.0.2 adds a free QR code generator to the NewTon ecosystem — transparent background, custom colours, adjustable label, download or copy to clipboard. Zero dependencies, zero tracking, zero nonsense. Built from scratch with Reed-Solomon error correction.

This release also documents the security architecture in the Privacy page and improves how release notes appear in search results.

---

## QR Code Generator

A standalone tool at `qr-generator.html`. Type text or a URL, get a QR code with transparent background. Customise the colour, module size, quiet zone, and add a labelled pill below the code with adjustable size.

**Features:**

- **Transparent background** — works on any surface, any colour
- **Custom colour** — colour picker for the QR modules and label
- **Label pill** — optional text below the code with auto-contrast text colour
- **Label size slider** — adjust from 50% to 120% of the default
- **Module size slider** — control the resolution
- **Quiet zone slider** — three steps: tight, medium, comfortable
- **Download PNG** — saves as `qrcode.png`
- **Copy to clipboard** — paste directly into documents
- **213 byte limit** — M-level error correction, versions 1–10

**Technical:** Pure JavaScript implementation with Galois Field GF(2⁸) arithmetic, Reed-Solomon error correction, all eight mask patterns evaluated with full penalty scoring. No library, no dependency, no external call. CSP-clean — all styles in `css/landing.css`, all JS in `js/qr-generator.js`.

Linked from the User Guide (Payment Tracking) and the Docker Quick Start (Customization).

---

## Security Architecture

A new section in `Docs/PRIVACY.md` and `privacy.html` explains why NewTon's design is inherently safe:

- **No write surface** — the server only serves static files via GET requests
- **No persistence for attacks** — no database means no stored XSS
- **CSP exfiltration prevention** — `connect-src 'self'` traps any code inside the browser
- **Why `unsafe-inline` is safe here** — no cookies to steal, no sessions to hijack, no accounts to compromise

The conclusion: an attacker can only compromise a user who actively participates in their own compromise. The risk is localised, non-persistent, and architecturally sandboxed.

---

## Release Notes Titles

All 28 release notes HTML pages updated from `Release Notes vX.X.X — NewTon DC Tournament Manager` to `vX.X.X — {Tagline}`. Each release now shows its unique tagline in Google search results instead of identical boilerplate.

---

## Files Changed

- `qr-generator.html` — new QR code generator page
- `js/qr-generator.js` — new QR engine and UI logic
- `css/landing.css` — QR generator styles (`.qr-page`, `.qr-container`, `.qr-wrap`, etc.)
- `Docs/PRIVACY.md` — new Security Architecture section
- `privacy.html` — same section added to HTML version
- `userguide.html` — payment QR link to generator
- `docker-quickstart.html` — customization section link to generator
- `sitemap.xml` — `qr-generator.html` and `v5.0.2.html` added
- All 28 `releases/*.html` files — `<title>` tags updated to tagline format
- `releases/README.md` — template updated for new title format
- `CHANGELOG.md` — v5.0.2 entry added

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history.

---

**NewTon DC Tournament Manager v5.0.2 — Because Every Other One Wants Your Email.**
