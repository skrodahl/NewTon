## NewTon DC Tournament Manager v5.0.0-beta.1 Release Notes

**Release Date:** March 22, 2026
**Your Boarding Pass for the Oche**

---

## Overview

**NewTon DC Tournament Manager Version 5.0.0-beta.1** introduces the first step of direct communication between the Tournament Manager and the Chalker: QR-based match assignment. The TM generates a signed QR code for any live match; the Chalker scans it and receives everything it needs to start scoring. No typing, no mistakes.

This is a **major version** because it represents a fundamental architectural shift — TM and Chalker are no longer independent tools. They are now a coordinated system.

---

## QR Match Assignment (TM → Chalker)

### QR Button on Live Match Cards

A "QR" button appears to the left of "Stop Match" on every live match card in Match Controls. It only appears for live matches — not pending, not completed.

Clicking it opens a modal with the Chalker assignment QR code — or a warning if the prerequisites aren't met.

### Lane & Referee Required

Both must be assigned before a QR code can be generated. The Chalker needs lane and referee to function; if either is missing, the modal shows an amber warning instead of a code.

### Assignment Payload

The QR encodes a JSON payload with everything the Chalker needs:

| Field | Description |
|-------|-------------|
| `v` | Payload version (1) |
| `t` | Payload type (`"a"` = assignment) |
| `mid` | Match ID (e.g. `FS-1-1`) |
| `tid` | Tournament ID |
| `sid` | Server ID (TM installation identifier) |
| `p1` | Player 1 name |
| `p2` | Player 2 name |
| `sc` | x01 format (101/201/301/501) |
| `bo` | Best-of legs for this match |
| `mr` | Max rounds |
| `ln` | Lane number |
| `ref` | Referee name |
| `ts` | Unix timestamp |
| `crc` | CRC-32 integrity checksum |

### CRC-32 Integrity

Every payload is signed with a CRC-32 checksum (`js/newton-integrity.js`). Keys are sorted before serialisation — deterministic across all JS engines. The Chalker will verify on scan. The same module will be reused for MQTT payloads in a future release.

### Server ID

A 12-character hex identifier generated once per TM installation, persisted in global config (`config.server.serverId`). Identifies this TM instance in QR payloads and prevents cross-TM result injection.

---

## Chalker Settings in Global Config

Two new fields in **Config → Match Configuration → Chalker**:

### x01 Format

Dropdown: 101 / 201 / 301 / 501 (default: 501). Sent to the Chalker via QR. Use shorter formats for quick rounds — 101 is a warmup, 301 is a sprint, 501 is the classic.

### Max Rounds

Dropdown: 7–20 (default: 13). Sets the tiebreak threshold in the Chalker. The default covers standard 501 tournaments; adjust for longer or shorter formats. A real-world example: some clubs run 501 / 14 rounds.

Both fields reset correctly with "Reset to Defaults" and are included in Developer Console → Reset All Config.

---

## Match Controls UI

- **Lane dropdown**: Narrowed to 58px (`cc-lane-dropdown` class) — lane numbers are 1–2 digits, the old dropdown was wasteful.
- **Referee dropdown**: Narrowed to 120px (`cc-referee-dropdown` class) — names are truncated to 10 characters, the old width had too much padding.

These changes prevent the bottom row of Match Controls from wrapping when a referee is selected and the QR button is present.

---

## Files Changed

- `js/main.js` — version bump to 5.0.0-beta.1
- `js/newton-integrity.js` — new CRC-32 sign/verify module
- `js/qr-bridge.js` — new QR payload builder and modal display
- `lib/qrcode-generator.js` — new QR generation library (qrcode-generator v1.4.4, standalone)
- `js/results-config.js` — `x01Format`, `maxRounds` in DEFAULT_CONFIG; server ID generation on startup; Chalker section in `saveMatchConfiguration` and `resetMatchConfigToDefaults`
- `js/bracket-rendering.js` — QR button on live cards; `cc-lane-dropdown` and `cc-referee-dropdown` classes on match control dropdowns
- `tournament.html` — matchQRModal markup; script tags for new files; Chalker subsection in Match Configuration UI
- `css/styles.css` — `.cc-btn-qr`, `.cc-lane-dropdown`, `.cc-referee-dropdown`
- `Docs/QR.md` — updated with all v5.0.0 design decisions

---

## Migration from v4.2.x

No migration required. Fully compatible with all existing tournaments and saved configurations.

The new global config fields (`x01Format`, `maxRounds`, `serverId`) are generated automatically on first load with the correct defaults. No action needed.

---

**NewTon DC Tournament Manager v5.0.0-beta.1** — Your Boarding Pass for the Oche.
