# Release Notes — v5.0.14-beta.1 — No Score...

**NewTon DC Tournament Manager v5.0.14-beta.1 — April 16, 2026**

*Beta — untested on iOS hardware. Feedback welcome via [GitHub discussion #4](https://github.com/skrodahl/NewTon/discussions/4).*

---

## Overview

The Chalker learns to scan QR codes on iOS, and the x01 format picker opens up to any starting score from 2 to 1001. This is a beta — the iOS image capture path needs real-device testing before it ships.

---

## iOS QR Scanning (Chalker)

On iOS/iPadOS, `getUserMedia` is restricted by WebKit — even over HTTPS, even as a Home Screen PWA. The live camera scanner that works on desktop and Android simply doesn't start.

This release adds an image capture path: on iOS, tapping "Scan QR" opens the native rear camera via `<input type="file" capture="environment">`. The user takes a photo, which is decoded client-side by jsQR.

- **Platform detection** — `isIOS()` uses `navigator.platform` + `navigator.maxTouchPoints` to catch iPadOS 13+ devices that report as "Macintosh".
- **Downscaling** — captured images are downscaled to ~1000px before decoding for performance on older iPads.
- **Failure handling** — if jsQR can't read the QR, an error is shown with a hint to retry. The file input resets for another capture.
- **Desktop/Android** — unchanged. Live camera stream with native `BarcodeDetector`.

See `Docs/QR.md` for implementation details and known risks.

---

## x01 Format

The starting score dropdown now covers 101 through 1001 in steps of 100. Both TM Global Settings and Chalker manual setup.

A "Custom score" checkbox reveals a number input for any starting score from 2 to 1001. The TM shows an amber warning that unusual scores may produce larger QR codes. The Chalker has no such constraint — it's a standalone scorekeeper in manual mode.

---

## Contributors

- [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — iOS QR workflow design and platform detection strategy ([discussion #4](https://github.com/skrodahl/NewTon/discussions/4)); x01 format expansion request.

---

## Files Changed

- `chalker/js/chalker.js` — `isIOS()`, `startImageCapture()`, `decodeImageQR()`, custom score toggle, updated `startQRScanner()` branching, `loadSettings()` custom value handling
- `chalker/index.html` — hidden file input, canvas, jsQR script tag, custom score checkbox
- `chalker/js/jsQR.js` — jsQR library copied from TM
- `js/results-config.js` — `initX01Toggle()`, custom score load/save/reset
- `js/main.js` — APP_VERSION bumped to 5.0.14-b.1
- `tournament.html` — x01 presets expanded, custom score checkbox and warning
- `Docs/QR.md` — iOS image capture section updated from planned to implemented

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history. The new x01 presets are purely additive — existing saved configurations are unaffected.

---

*NewTon DC Tournament Manager v5.0.14-beta.1 — No Score...*
