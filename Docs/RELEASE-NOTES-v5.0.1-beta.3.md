# Release Notes — v5.0.1-beta.3 — The Eyes Have It

**NewTon DC Tournament Manager v5.0.1-beta.3 — 2026-03-27**

---

## Overview

v5.0.1-beta.3 gives the Tournament Manager the ability to read result QRs from the Chalker. The round-trip closes: TM assigns, Chalker scores, Chalker generates a result QR, TM scans and sees the raw match data. Two entry points, one scanner, one result preview. A QR Payload Inspector in the Developer Console validates any NewTon QR and shows every field raw.

---

## Scan Result QR in Confirm Match Winner

A **Scan Result QR** button sits in the Final Score section header of the Confirm Match Winner modal — to the right of the "Winner must have more legs than loser" hint. The modal is wider (800px) to give it room.

Camera opens, BarcodeDetector scans continuously. On a valid scan: CRC verified, type checked (`r`), tournament ID and server ID matched, match ID looked up. On success: camera closes, decoded result preview opens.

---

## QR Results in Match Controls

A **QR Results** button in the Match Controls footer opens the same scanner without a pre-selected match. The match ID is resolved from the payload itself — any live match in the current tournament can be resolved this way.

---

## Result Preview

Both entry points produce the same decoded result table:

- Match ID, format (sc Bo), winner and leg score
- Per-leg breakdown: leg number, leg winner, who threw first, P1 visit scores (decoded), P2 visit scores (decoded), checkout darts (or TB for tiebreak)

---

## QR Payload Inspector (Developer Console)

A new **QR Payload Inspector** command in the Developer Console Commands section scans any NewTon QR — assignment or result — and displays:

- **This Tournament Manager** — current tournament ID and server ID for direct comparison
- **All payload fields** with raw values and pass/fail checks: CRC, type, tournament ID, server ID, match found
- Optional fields (lane, referee, teams) shown only when present
- Per-leg breakdown with first-thrower column when legs are present

Never blocks on validation failures — always shows what arrived. Works on assignment QRs too, correctly flagging type mismatch while still displaying all data.

---

## Files Changed

- `tournament.html` — Scan Result QR in `winnerConfirmModal` Final Score header; `winnerConfirmModal` max-width 800px; QR Results in Match Controls footer; `qrResultScanModal`; `qrResultPreviewModal` with dynamic title; QR Payload Inspector in Developer Console Commands
- `js/qr-bridge.js` — `openResultQRScanner()`, `stopResultQRScanner()`, `handleResultQRPayload()`, `showResultScanError()`, `decodeVisitScores()`, `showResultQRPreview()`; `openQRInspector()`, `handleQRInspectorPayload()`
- `js/clean-match-progression.js` — `data-match-id` set on scan button in `showWinnerConfirmation()`
- `js/analytics.js` — restore function added to `analyticsModal` `pushDialog` call (fixes Dev Console return after sub-modals)
- `css/styles.css` — `.qr-result-header`, `.qr-result-match`, `.qr-result-winner`, `.qr-result-legs`, `.qr-visits`
- `docker/nginx.conf` — `camera=(self)` for `location ~ \.php$`

---

## Migration

No migration required. Fully compatible with all existing tournament data.

---

## What's Next

- beta.4: Declare Winner from the result preview — `completeMatch()` called from QR data, `newton-stats.js` extracts achievements
- beta.5: QR reported matches saved to indexedDB (parallel workflow, can wait)
