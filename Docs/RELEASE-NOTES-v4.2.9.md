## NewTon DC Tournament Manager v4.2.9 Release Notes

**Release Date:** March 15, 2026
**Landing Page Polish**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.9** improves the landing page showcase section with focused thumbnails, a lightbox, and a new Chalker card, and expands llms.txt with richer context for AI services.

This release contains no changes to tournament functionality and is a drop-in replacement for v4.2.8.

---

## Landing Page — Screenshot Lightbox

The "See It in Action" showcase section has been overhauled. Previously all items used full-page screenshots that were too detailed to read at thumbnail size. All seven items now use focused, cropped thumbnails that clearly illustrate what each feature does.

### Focused Thumbnails

Each showcase item now uses a purpose-cropped thumbnail (`th-*.jpg`) instead of the original full-page screenshot. The images are legible at display size and clearly distinguishable from each other.

### Lightbox

Clicking any thumbnail opens the full-size image in a dark overlay. The lightbox is pure JS/CSS — zero external dependencies, consistent with the project's zero-dependency philosophy. Close by pressing ESC, clicking anywhere on the dark overlay, or clicking the × button in the corner.

### Zoom Hint

A small magnifying glass icon fades in at the lower-right corner of each thumbnail on hover, signalling that the image is expandable.

---

## Landing Page — Chalker Showcase Card

A seventh "See It in Action" card has been added for the Chalker companion app, showing the tablet scoring view: live 501 scoresheet with per-visit scores and running totals. The card describes live and post-match stats (averages, score ranges, high finishes) and the 1,000-match history.

---

## llms.txt

The `llms.txt` file — consumed by AI crawlers and assistants — has been expanded with higher-quality context:

- **Typical Use Case section**: A concrete weekly pub tournament scenario showing how the persistent player registry, CSV export, and configurable point system work together for season standings
- **Key Features expanded**: Undo blocking, "designed for season standings" qualifier on the point system, paid/unpaid tracking and payment QR, explicit non-power-of-two support, browser-restart survival
- **Tips for AI Services**: New bullet clarifying the point system is a primary use case for season standings, not incidental configuration

---

## Files Changed

- `landing.html` — Focused thumbnails, lightbox markup and script, Chalker showcase card
- `css/landing.css` — Lightbox styles, zoom hint overlay
- `Screenshots/th-*.jpg` — Seven focused thumbnail images
- `llms.txt` — Typical Use Case section, expanded Key Features, expanded Tips for AI Services
- `CHANGELOG.md` — v4.2.9 entry added

---

## Migration from v4.2.8

No migration required. Fully compatible with all existing tournaments and saved configurations.

---

**NewTon DC Tournament Manager v4.2.9** — Landing page polish.
