# Release Notes — v5.0.15-beta.1 — Ka-ZXing!

**NewTon DC Tournament Manager v5.0.15-beta.1 — April 20, 2026**

*Beta — QrScanner replaces jsQR as the primary iOS decoder. Feedback welcome via [GitHub discussion #4](https://github.com/skrodahl/NewTon/discussions/4).*

---

## Overview

The iPad QR scanning problem is solved. jsQR — the decoder used since the image capture path was introduced — consistently failed on photos of QR codes displayed on screens. Perspective distortion, glare, and uneven lighting were too much for it. QrScanner, a ZXing-based decoder, handles all of these. Tested successfully on photos taken at steep angles, poor lighting, and with visible screen reflections.

This release also tightens layout for desktop and tablet screens.

---

## QrScanner Replaces jsQR on iOS

The Chalker's `decodeImageQR()` now uses QrScanner (a JavaScript port of the ZXing barcode engine) as the primary decoder. jsQR remains as a last-resort fallback.

**What changed:**
- All captured photos are downscaled to max 1500px before decoding — faster and more reliable than full-resolution processing
- BarcodeDetector (the native browser API) was removed from the image capture path after confirming it is unavailable on iOS Safari (iPadOS 26). It remains in the TM's live camera scanner where it works on desktop Chrome/Edge.
- The QR confirmation modal now shows "Not set" instead of "undefined" when lane or referee are not assigned in the payload.

**What was tried and ruled out:**
- **BarcodeDetector on static images**: Apple's Vision framework backs this API, but Safari does not expose it — confirmed `'BarcodeDetector' in window` returns `false` on iPad Air (M4) simulator running iPadOS 26.
- **Full-resolution QrScanner**: 3072x4096 photos failed to decode; downscaling to 1500px succeeded consistently.
- **jsQR at multiple resolutions**: tried full-res, 2000px, and 1000px in previous betas — none reliably decoded screen photos.

**Library details:**
- `qr-scanner.umd.min.js` (~16KB) — UMD wrapper, loaded via `<script>` tag
- `qr-scanner-worker.min.js` (~44KB) — Web Worker containing the ZXing engine, loaded dynamically
- Total addition: ~60KB. jsQR (~250KB) stays for fallback.

---

## Layout

- **Responsive breakpoint** moved from 1024px to 1120px, covering tablets in portrait mode (e.g. iPad Air at 1080px).
- **Denser desktop tables** — cell padding halved. Shows 24 players on a desktop screen.
- **Sticky header fix** — removed `overflow-x: hidden` that was creating a scroll container and breaking `position: sticky` on table headers.
- **Scope indicator preserved** — the Analytics scope pill was hidden below 1120px because its parent container was set to `display: none`. Fixed by hiding only the button children.

---

## Contributors

- [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — real-device iPad testing that identified jsQR's limitations with screen photos, driving the switch to QrScanner.

---

## Files Changed

- `chalker/js/chalker.js` — QrScanner as primary decoder in `decodeImageQR()`, 1500px downscale, BarcodeDetector removed from image path, "Not set" for missing lane/ref, version bump
- `chalker/index.html` — added `qr-scanner.umd.min.js` script tag, cache buster increment
- `chalker/js/qr-scanner.umd.min.js` — QrScanner/ZXing UMD build (~16KB)
- `chalker/js/qr-scanner-worker.min.js` — QrScanner Web Worker (~44KB)
- `chalker/qr-scanner-worker.min.js` — duplicate worker at page root (dynamic import path resolution)
- `Docs/QR.md` — updated decoder chain, library table, reliability notes
- `releases/README.md` — added beta release process, cache buster step, version format note
- `css/styles.css` — breakpoint 1024px → 1120px, desktop table padding halved, sticky header fix, scope indicator fix

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history.

---

*NewTon DC Tournament Manager v5.0.15-beta.1 — Ka-ZXing!*
