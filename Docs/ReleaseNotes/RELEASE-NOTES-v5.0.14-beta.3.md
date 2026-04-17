# Release Notes — v5.0.14-beta.3 — I Can See Clearly Now

**NewTon DC Tournament Manager v5.0.14-beta.3 — April 17, 2026**

*Beta — iOS QR decode improvements for iPhone. Feedback welcome via [GitHub discussion #4](https://github.com/skrodahl/NewTon/discussions/4).*

---

## Overview

Beta.2 was tested by [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) on both iPad Pro (11-inch, 2nd gen) and iPhone 16 Pro Max running iOS 26.4. The iPad decoded successfully, but the iPhone failed consistently — the photo was captured but jsQR couldn't read it. Two changes: the TM renders a larger QR, and the Chalker tries full-resolution decode before downscaling.

---

## Larger QR on TM

The assignment QR cell size increased from 6px to 8px per module. For a typical assignment payload (QR version 7-9), rendered size goes from ~270-318px to ~360-424px. The modal has plenty of space — the QR was just smaller than it needed to be.

Larger modules in the photo means more pixels per module for the decoder.

---

## Full-Resolution Decode on Chalker

Beta.2 downscaled all captured images to 1000px before running jsQR. On iPhone 16 Pro Max (48MP camera), this crushed the QR module detail — especially when the QR filled a small portion of the frame.

`decodeImageQR()` now tries two passes:
1. **Full resolution** — preserves maximum QR module detail
2. **2000px fallback** — if full-res fails and the image was larger than 2000px, retry downscaled. Downscaling can reduce noise and improve contrast for jsQR.

The iPad Pro that succeeded on beta.2 (even at 1000px) should continue working.

---

## Docs Reorganisation

Release notes moved from `Docs/` to `Docs/ReleaseNotes/` to reduce clutter. 86 files moved. Cross-references within old release notes left as-is.

---

## Contributors

- [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — iPhone 16 Pro Max + iPad Pro testing on iOS 26.4, identified the decode failure pattern (iPad works, iPhone doesn't).

---

## Files Changed

- `js/qr-bridge.js` — QR cell size 6 → 8 in `createSvgTag()`
- `chalker/js/chalker.js` — `decodeImageQR()` two-pass strategy: full resolution first, 2000px fallback
- `js/main.js` — APP_VERSION bumped to 5.0.14-b.3
- `Docs/QR.md` — updated decode strategy documentation
- `Docs/ReleaseNotes/` — all release notes moved from `Docs/`
- `releases/README.md` — added pointer to `Docs/ReleaseNotes/`
- `CHANGELOG.md` — updated release notes path reference

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history.

---

*NewTon DC Tournament Manager v5.0.14-beta.3 — I Can See Clearly Now*
