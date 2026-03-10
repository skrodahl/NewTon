## NewTon DC Tournament Manager v4.2.3-beta.1 Release Notes

**Release Date:** March 10, 2026
**Landing Page Redesign**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.3** is a complete visual overhaul of the landing page, inspired by the retro comic hero illustration by Nano Banana. The tournament app itself is unchanged.

This release contains no breaking changes and is a drop-in replacement for v4.2.2.

---

## Landing Page Redesign

The landing page has been completely redesigned with a warm retro comic color palette derived from the hero image. Every section has been restyled for a more playful, dynamic, and visually cohesive experience.

### Hero Image
- **Nano Banana illustration** added as a prominent hero image between the tagline and highlight cards
- Styled as a "window into the world" with `border-radius: 24px`, a solid dark border, and a warm glow shadow
- The illustration's color palette (warm tan, burnt orange, muted teal, earthy brown) drives the entire page theme

### Color Theme Overhaul (`css/landing.css`)
- **Background**: Warm parchment (`#f5ebe0`) replaces neutral gray (`#f0f2f5`)
- **Text**: Rich brown (`#2b2118`) replaces near-black (`#1a1a2e`)
- **Accents**: Burnt orange (`#c0562a`), amber gold (`#e8a44a`), muted teal (`#4a8c7e`)
- **Cards**: Cream (`#fff8f0`) with warm borders (`#e0cdb8`) and gradient top accents
- **Header/highlights**: Dark brown (`#2b2118`) with orange border and amber number text
- **Buttons**: Burnt orange launch button, dark brown GitHub button with warm hover states
- **Section dividers**: Gradient orange-to-gold horizontal rules

### Screenshots Replaced with Feature Showcase
The old plain screenshot list has been replaced with an alternating two-column showcase layout:

1. **Interactive Tournament Bracket** — zoomable bracket view with match card zoom
2. **Run Your Tournament from One Panel** — Match Controls command center
3. **Registration Made Simple** — player management with dynamic help
4. **From Zero to Bracket in 60 Seconds** — tournament setup flow
5. **Intelligent Seeding & BYE Handling** — fair draw algorithm and automatic BYE advancement *(new)*
6. **Celebrate the Champion** — winner celebration and results export

Each showcase item features a labeled category pill, heading, descriptive paragraph, and screenshot with a subtle zoom-on-hover effect. Items alternate image position (left/right) for visual rhythm.

### Highlight Card Update
- **Removed**: `~60MB Docker Image Size` (implementation detail, not a user-facing selling point)
- **Added**: `2 Tournament Formats` (Single & Double Elimination)

### Standalone Test File
- `landing.html` created as a standalone copy for local browser testing without Docker/PHP
- Identical content to `landing-page.php` except hardcoded URLs instead of PHP env vars
- Not served in production — purely a development convenience

---

## Technical Details

### Files Changed
- `css/landing.css` — complete rewrite: retro comic theme, showcase layout, responsive breakpoints
- `landing-page.php` — new design with hero image, showcase section, updated highlight cards
- `landing.html` — standalone test version (new file)

### Files Unchanged
- `tournament.html` — PHP include mechanism unchanged
- `docker/` — no Docker configuration changes
- All JavaScript files — no app logic changes

---

## Migration from v4.2.2

### Automatic
- Fully compatible with all existing tournaments
- No data migration required
- All existing features are unchanged

### Docker Deployments
- No configuration changes needed
- `NEWTON_LANDING_PAGE` and `NEWTON_BASE_URL` environment variables work as before
- The hero image (`Screenshots/newton-cartoon.png`) is included in the Docker image automatically via `COPY . /var/www/html/`

---

## Known Issues

None at time of release.

---

**NewTon DC Tournament Manager v4.2.3** — landing page redesign with retro comic theme by Nano Banana.
