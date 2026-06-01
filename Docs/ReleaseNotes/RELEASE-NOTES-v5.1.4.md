# Release Notes — v5.1.4 — Pocket Chalker

**NewTon DC Tournament Manager v5.1.4 — June 1, 2026**

---

## Overview

The Chalker now asks to come home with you.

When a referee opens the Chalker in their browser for the first time, a small banner slides up from the bottom: **"Install NewTon Chalker for offline use."** One tap and it's on the home screen — a full-screen app that works without a network connection, launches instantly, and never needs updating manually.

This is the PWA install prompt done right: it appears once, it's dismissible, and it never comes back after the choice is made. Already installed via the Play Store? The banner never appears at all.

---

## Chalker — Install Banner

A fixed banner at the bottom of the screen, styled to match the Chalker's dark theme with the blue accent border.

- **"Install NewTon Chalker for offline use"** — clear, functional, no marketing fluff
- **Install button** — triggers the browser's native install dialog
- **Dismiss (✕)** — hides the banner permanently
- **Persistence** — dismissal or installation saved to localStorage; the banner never reappears
- **Safe area** — respects the bottom notch/home bar on phones with gesture navigation
- **Play Store compatible** — `beforeinstallprompt` doesn't fire inside a TWA, so the banner is invisible to Play Store installs

No inline JavaScript — all logic lives in `chalker.js`, all styling in `chalker.css`. CSP-clean.

---

## Why This Matters

The Chalker is already a PWA — it has a manifest, a service worker, and offline caching. But most users don't know they can install it. The browser's default install prompt is a tiny icon in the address bar that's easy to miss, especially on tablets in full-screen mode.

The banner puts the option where the user can see it, at the moment they're most likely to want it: the first time they use the Chalker at a venue. After that, it's out of the way forever.

---

## Migration

No migration required. Fully compatible with all existing data. The new `chalker_install_dismissed` localStorage key is created on first dismissal or installation.

---

**NewTon DC Tournament Manager v5.1.4 — Pocket Chalker.**
