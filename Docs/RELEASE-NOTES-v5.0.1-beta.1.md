# Release Notes — v5.0.1-beta.1 — The Round-Trip Begins

**NewTon DC Tournament Manager v5.0.1-beta.1 — 2026-03-26**

---

## Overview

v5.0.1-beta.1 closes the first half of the QR round-trip. The Chalker can now generate a result QR at the end of a QR-assigned match. The TM operator scans it to record the result — no typing, no shouting across the venue.

This is a beta for testing the result QR payload and scanning flow before the TM scanning side is built.

---

## Chalker generates result QR on Match Complete

When a match was started from a TM assignment QR, a **Result QR** button appears on the Match Complete screen alongside Rematch, New Match, and History. Tap it — a modal shows the signed QR code with a title (`Winner beat Loser 2-1`) and a subtitle summarising the format.

The TM operator points the TM camera at the code to record the result. The TM scanning side is not yet implemented — this beta establishes the payload and QR generation side.

### What the payload carries

- Match identification: `mid`, `tid`, `sid` (echoed from the assignment QR)
- Players: `p1`, `p2`
- Format: `sc`, `bo`, `mr`, optional `ln`
- Match winner: `w` (1 or 2)
- First leg starter: `fls`
- Per-leg data:
  - `w` — leg winner (1 or 2)
  - `s` — base64-encoded visit scores: `P1_SCORES|P2_SCORES`
  - `cd` — checkout darts (1–3); `0` = tiebreak leg
- Timestamp: `ts`
- Integrity: `crc` (CRC-32, signed by `NewtonIntegrity.sign()`)

The TM derives all statistics (averages, high finishes, score ranges, etc.) from the raw visit scores. The payload is minimal by design.

### Tiebreak legs

When max rounds is reached without a checkout, the tiebreak round is not recorded in the visit scores. `cd = 0` signals the leg was a tiebreak; `legs[].w` records who won. The TM uses both fields to reconstruct the correct result.

### QR only for QR-assigned matches

Matches started manually (no assignment QR) do not show a Result QR button — the `mid`/`tid`/`sid` fields needed for TM routing are only present when the match was QR-assigned.

---

## Result QR accessible from match history

QR-assigned matches retain all the data needed to regenerate the result QR. A **Result QR** button appears at the bottom of the match detail screen in Chalker history for any QR-assigned match. A missed scan can always be recovered later — no need to reshoot the match.

---

## Canonical links added to all pages (SEO)

`<link rel="canonical">` tags added to all 25 HTML pages. Each page points to its own URL on `newtondarts.com` (no `www`), fixing a Google indexing issue where `www.newtondarts.com` was being treated as the canonical origin.

Rules applied:
- Absolute URLs with full protocol and domain: `https://newtondarts.com/...`
- Directory index pages use trailing slash: `https://newtondarts.com/releases/` (not `/releases/index.html`)
- Each versioned release page points to itself: `https://newtondarts.com/releases/vX.X.X.html`
- Tag placed immediately after the viewport meta in `<head>`

`releases/README.md` updated with canonical link instructions as Step 3 in the release process, including the trailing-slash rule and an updated HTML template.

---

## Chalker info bar: lane suppressed when unassigned

When a QR-assigned match has no lane set in the TM, the Chalker info bar previously showed "Lane undefined". Fixed — the info bar now shows only `Leg N of M` (and `Ref: name` when present) when no lane is assigned.

---

## Files Changed

### Site / SEO

- All 25 HTML pages — `<link rel="canonical">` added to each
- `releases/README.md` — canonical link instructions added as Step 3; HTML template updated

### Chalker

- `chalker/lib/qrcode-generator.js` — new file; QR generation library (qrcode-generator v1.4.4, copied from TM's `lib/`)
- `chalker/index.html` — Result QR button on end screen; `#result-qr-modal` markup; Result QR button in history detail screen; `qrcode-generator.js` script tag
- `chalker/js/chalker.js` — `buildResultPayload()`, `showResultQRModal()`, `uint8ToBase64()`; show/hide Result QR button in end screen and history detail; `laneName` undefined fix in `startMatchFromQR()`
- `chalker/styles/chalker.css` — `.result-qr-code` styles (centered, 220×220px SVG)
- `chalker/sw.js` — version bumped to `chalker-v102`

---

## Migration

No migration required. Fully compatible with all existing matches and saved configurations. The new fields are only added to matches started from a TM assignment QR.

---

## What's Next

- TM scans the result QR (camera button in Match Controls)
- TM verifies CRC, checks `mid`/`tid`/`sid`, detects replay
- TM applies the result and derives match statistics
- IndexedDB match archive (foundation for Players Lab)
