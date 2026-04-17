# Release Notes — v5.0.14-beta.2 — Picture This

**NewTon DC Tournament Manager v5.0.14-beta.2 — April 17, 2026**

*Beta — iOS QR fixes based on real-device testing. Feedback welcome via [GitHub discussion #4](https://github.com/skrodahl/NewTon/discussions/4).*

---

## Overview

Beta.1 failed on iOS — the image couldn't load and the file input was exposed raw. Both issues are fixed. The Analytics match detail header also gets a redesign.

---

## iOS QR Scanning — Fixes

Beta.1 was tested on an iPhone 16 Pro Max (iOS 26.4.1) by [@burgerboy85-rgb](https://github.com/burgerboy85-rgb). The camera opened and the photo was taken, but the Chalker couldn't load the image afterwards.

Two root causes, both fixed:

- **Image loading** — `URL.createObjectURL()` failed to load HEIF/HEIC photos on iOS Safari. Replaced with `FileReader.readAsDataURL()` which converts the file to a base64 data URL — more universally supported.
- **User gesture chain** — programmatic `fileInput.click()` doesn't work on iOS. WebKit requires a direct user gesture to trigger file inputs. Replaced with a styled "Take Photo" `<label>` button linked to the hidden file input — iOS treats label taps as valid user gestures.

---

## Match Detail Header

The Analytics match detail view has a cleaner layout:

- **Headline** — match ID and result at 18px: **FS-3-1** · Andrew **0–1** **Carl**
- **Context line** — tournament name (bold) · date · time on a single line below

---

## Date Column

Tournament register date no longer wraps to two lines.

---

## Contributors

- [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — iOS testing on iPhone 16 Pro Max (iOS 26.4.1), identified both beta.1 failures.

---

## Files Changed

- `chalker/js/chalker.js` — `decodeImageQR()` switched to `FileReader.readAsDataURL()`; `startImageCapture()` uses label button instead of programmatic click; `stopQRScanner()` resets label visibility
- `chalker/index.html` — added `<label id="qr-image-label">` styled as "Take Photo" button
- `js/newton-history.js` — match detail header redesign; date column `nowrap`
- `js/main.js` — APP_VERSION bumped to 5.0.14-b.2
- `Docs/QR.md` — updated implementation details and added beta.1 lessons learned

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history.

---

*NewTon DC Tournament Manager v5.0.14-beta.2 — Picture This*
