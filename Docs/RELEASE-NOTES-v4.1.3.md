## NewTon DC Tournament Manager v4.1.3 Release Notes

**Release Date:** January 8, 2025
**Patch Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.3** converts the NewTon Chalker companion app into a Progressive Web App (PWA), enabling offline use and home screen installation.

This release contains no breaking changes and is a drop-in replacement for v4.1.2.

---

## Chalker PWA Features

**Installable App:**

Chalker can now be installed as a standalone app on mobile devices and desktops:
- Add to home screen from browser menu (or use install prompt)
- Launches in standalone mode without browser chrome
- Appears in app switcher like a native app
- Portrait orientation automatically locked

**Offline Support:**

After the first visit, Chalker works completely offline:
- All files cached by service worker
- No internet connection required for scoring
- Perfect for tournament venues with poor connectivity

**Self-Contained Structure:**

Chalker has moved to its own `/chalker/` subfolder:
- Clean URL: `https://your-domain/chalker/`
- All assets (JS, CSS, fonts, icons) contained within
- Completely independent from Tournament Manager
- Easier deployment and maintenance

---

## Technical Details

**New Files:**
- `chalker/manifest.json` — App metadata (name, icons, display mode)
- `chalker/sw.js` — Service worker for offline caching
- `chalker/images/icon-192.png` — Home screen icon
- `chalker/images/icon-512.png` — Splash screen icon

**Caching Strategy:**
- Cache-first: serves from cache, falls back to network
- Version controlled via `CACHE_NAME` constant in sw.js
- Bump version number to force cache refresh on updates

**File Structure Change:**
```
Before: /chalker.html, /js/chalker.js, /styles/chalker.css
After:  /chalker/index.html, /chalker/js/*, /chalker/styles/*, /chalker/fonts/*
```

---

## Chalker Status

The NewTon Chalker companion app is now a fully-featured PWA. While still operating independently from Tournament Manager (no integration), it provides a reliable offline scoring experience that can be installed directly on referee tablets.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/RELEASE-NOTES-v4.1.2.md**: Mobile display improvements
- **Docs/RELEASE-NOTES-v4.1.1.md**: Format-aware statistics and keypad fixes
- **Docs/RELEASE-NOTES-v4.1.0.md**: NewTon Chalker introduction

---

**NewTon DC Tournament Manager v4.1.3** - Chalker is now a PWA with offline support.
