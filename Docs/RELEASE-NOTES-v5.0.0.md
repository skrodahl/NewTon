## NewTon DC Tournament Manager v5.0.0 Release Notes

**Release Date:** March 24, 2026
**The Revolution Will Be Scanned**

---

## Overview

**NewTon DC Tournament Manager Version 5.0.0** is the first version where the Tournament Manager and Chalker communicate directly. A QR code replaces the verbal handoff — no more typing player names into the Chalker, no more shouting across the venue.

The TM generates a signed assignment QR for any live match. The Chalker scans it, verifies the signature, and auto-populates everything: player names, format, best-of, max rounds, lane, and referee. The operator confirms and the match starts. From QR to first dart in seconds.

This is a **major version** — TM and Chalker are no longer independent tools. They are now a coordinated system. The QR protocol is also the foundation for the future MQTT network layer, where the same payload schemas will travel over an encrypted connection instead of a camera lens.

---

## TM → Chalker: Match Assignment QR

### QR Button on Live Match Cards

A **QR** button appears to the left of "Stop Match" on every live match card in Match Controls. Click it to display the Chalker assignment QR code. The button only appears for live matches — not pending, not completed.

### Lane & Referee Required

Both must be assigned before a QR code can be generated. If either is missing, the modal shows an amber warning instead of a code.

### Signed Assignment Payload

The QR encodes a JSON payload signed with CRC-32 (`newton-integrity.js`). It carries everything the Chalker needs: player names, x01 format, best-of legs, max rounds, lane, and referee. Keys are sorted before signing — deterministic across all JS engines.

### Server ID

A 12-character hex identifier generated once per TM installation, persisted in global config. Identifies this TM instance in all QR payloads — the foundation for cross-device validation in the network layer.

### Chalker Settings in Global Config

Two new fields in **Config → Match Configuration → Chalker**:

- **x01 Format** — 101 / 201 / 301 / 501 (default: 501)
- **Max Rounds** — 7–20 (default: 13)

Both are sent to the Chalker via QR. Both reset with "Reset to Defaults" and are included in Developer Console → Reset All Config.

---

## Chalker ← TM: QR Scanning

### QR Button in "New Match?" Dialog

A **QR** button has been added to the Chalker's New Match dialog, between "New Match" and "Network". Tap it — the camera opens immediately. No intermediate screens.

### Continuous Scanning

`BarcodeDetector` API scans the camera feed continuously. The moment a valid NewTon assignment QR enters the frame, it's captured — no shutter button needed.

### CRC-32 Verification

Every scan is verified against the CRC-32 signature before any data is accepted. Corrupted or tampered codes are rejected with a clear error message. The camera stays open so the operator can try again.

### Confirmation Screen

A confirmation screen shows the full match assignment before anything starts:

- Player 1 vs Player 2
- x01 format · best-of legs · max rounds
- Lane · Referee

The operator confirms → starting player selection → match begins. Catches wrong-match scans before a dart is thrown.

---

## Referee Everywhere

The referee name is now visible throughout the QR flow:

- **QR modal subtitle**: `Harry vs Bob · Lane 1 · 501 Bo3 · Ref: Charles`
- **Chalker match info bar**: `Lane 1 · 501 · Leg 1 of 3 · Ref: Charles` (QR-started matches)

---

## Match Controls UI

- **Lane dropdown**: Narrowed to 58px — lane numbers are 1–2 digits.
- **Referee dropdown**: Narrowed to 120px — names are truncated to 10 characters.

Prevents the bottom row of Match Controls from wrapping when the QR button is present.

---

## Tournament Manager Polish

- **Chalker link in nav**: A Chalker button at the end of the TM navigation row opens the Chalker in a new tab.
- **Footer link**: "NewTon DC Tournament Manager" in the footer links to [newtondarts.com](https://newtondarts.com), styled to match the surrounding text.

---

## Docker / Reverse Proxy

- **nginx.conf**: `camera=()` → `camera=(self)` in the `/chalker/` location block — required for `getUserMedia` / `BarcodeDetector` to function.
- **Nginx Proxy Manager**: NPM overrides the container's `Permissions-Policy` header. A `more_set_headers` directive in the NPM Advanced tab is required. See the [Docker Quick Start](https://newtondarts.com/docker-quickstart.html) guide for the exact snippet.

---

## Files Changed

**Tournament Manager:**
- `js/main.js` — version bump to 5.0.0; footer link to newtondarts.com
- `js/newton-integrity.js` — new CRC-32 sign/verify module
- `js/qr-bridge.js` — QR payload builder and modal display; referee in subtitle
- `lib/qrcode-generator.js` — QR generation library (qrcode-generator v1.4.4, standalone)
- `js/results-config.js` — `x01Format`, `maxRounds` in DEFAULT_CONFIG; server ID generation
- `js/bracket-rendering.js` — QR button on live cards; narrowed dropdown classes
- `tournament.html` — matchQRModal markup; Chalker subsection in Match Configuration; Chalker nav link
- `landing.html` — `chalker/` → `chalker/index.html`
- `css/styles.css` — `.cc-btn-qr`, `.cc-lane-dropdown`, `.cc-referee-dropdown`; nav-btn font fixes; footer link styles

**Chalker:**
- `chalker/index.html` — QR button; scan modal; confirm modal; script tags
- `chalker/js/chalker.js` — QR scanning, verification, confirmation, and match start from payload; referee in info bar; `video: true` constraint
- `chalker/js/newton-integrity.js` — new file, identical copy of TM CRC-32 module
- `chalker/styles/chalker.css` — camera modal and confirmation modal styles
- `chalker/sw.js` — version `chalker-v99`

**Docker:**
- `docker/nginx.conf` — `camera=(self)` for Chalker location block
- `docker-quickstart.html` — NPM Permissions-Policy workaround documented

**Docs:**
- `Docs/QR.md` — full protocol specification with all v5.0.0 design decisions

---

## Migration from v4.2.x

No migration required. Fully compatible with all existing tournaments and saved configurations.

New global config fields (`x01Format`, `maxRounds`, `serverId`) are generated automatically on first load with correct defaults.

---

**NewTon DC Tournament Manager v5.0.0** — The Revolution Will Be Scanned.
