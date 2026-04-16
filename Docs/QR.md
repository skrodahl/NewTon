# QR Code Communication Protocol (TM ↔ Chalker)

**Status:** Implemented — v5.0.0 (TM→Chalker assignment) + v5.0.1 (Chalker→TM result) + v5.0.14-beta (iOS image capture on Chalker)
**Last Updated:** April 2026

---

## Context

The Tournament Manager (TM) and Chalker communicate via QR codes — no network infrastructure required. Two message types cover the full match lifecycle:

- **TM → Chalker**: A live match card in the TM generates an assignment QR. The Chalker scans it and auto-populates the match — player names, format, lane, and referee.
- **Chalker → TM**: When the match finishes, the Chalker generates a result QR. The TM scans it, previews the result, and applies it directly to the bracket.

The payload schemas and integrity checking are designed to be transport-agnostic — the same format lends itself to network communication as well.

The QR workflow was added without breaking changes. The underlying tournament data structure is compatible with the one used since the earliest beta — no migration has ever been required in the lifetime of the software, and the addition of QR communication is no exception.

---

## Protocol Design

### Design Principles

1. **Transport-agnostic schema**: Payload format is designed to work beyond QR if needed.
2. **Compact field names**: Short keys minimize QR code size, keeping the QR version low and easy to scan.
3. **CRC-32 integrity**: Detects corruption during scanning, alongside QR's built-in error correction.
4. **Replay protection**: TM checks match state before applying a result — rescanning a completed match triggers a warning.
5. **Schema versioning**: `v` field enables forward-compatible changes.
6. **Offline-first**: No network, no shared secrets required.

### Identification Fields (Present in All Messages)

| Field | Description | Example |
|-------|-------------|---------|
| `v` | Schema version | `1` |
| `t` | Message type | `"a"` (assign) or `"r"` (result) |
| `mid` | Match ID (from TM) | `"FS-1-3"` |
| `tid` | Tournament ID | `"1708123456789"` |
| `sid` | Server/TM instance ID (12-char hex) | `"f47ac10b58cc"` |
| `ts` | Unix timestamp (seconds) | `1708123456` |
| `crc` | CRC-32 of all other fields | `"a1b2c3d4"` |

The `sid` (server ID) is a 12-character hex string generated once per TM installation and persisted in global config. It identifies which TM instance created the match. 12 hex chars = 48 bits of entropy (281 trillion possible values) — collision risk is negligible for local tournament use.

---

## Message Schemas

### Match Assignment (TM → Chalker QR)

```json
{
  "v": 1,
  "t": "a",
  "mid": "FS-1-3",
  "tid": "1708123456789",
  "sid": "f47ac10b58cc",
  "p1": "John Smith",
  "p2": "Jane Doe",
  "sc": 501,
  "bo": 3,
  "mr": 13,
  "ln": 3,
  "ref": "Frank",
  "ts": 1708123456,
  "crc": "a1b2c3d4"
}
```

**Estimated size: ~180-220 bytes** → QR version ~7-9, very easy to scan.

| Field | Type | Description |
|-------|------|-------------|
| `p1` | string | Player 1 name |
| `p2` | string | Player 2 name |
| `sc` | number | Starting score — from Global Config (101 / 201 / 301 / 501, default 501) |
| `bo` | number | Best-of legs — from Global Config match configuration |
| `mr` | number | Max rounds before tiebreak — from Global Config (default 13, range 7–20) |
| `ln` | number | Lane number (1-20). **Optional.** Omitted if unassigned. |
| `ref` | string | Referee name. **Optional.** Omitted if unassigned. |

### Match Result (Chalker → TM QR)

The result payload carries **raw visit scores only** — no computed stats. The TM derives everything (averages, score ranges, high finishes, best/worst leg, etc.) from the raw scores. This keeps the payload minimal and makes the TM the single source of truth for statistics and report generation.

**What the TM derives from raw scores:**
- Tiebreak detection: neither player's scores sum to starting score
- Who threw first each leg: `fls` + alternating
- All score ranges (60+, 80+, 100+, 120+, 140+, 170+, 180)
- All averages (Match, First 9, Leg)
- High Finish, Best/Worst Leg, Short Legs, 100+ Finishes
- Dart counts per player per leg
- Complete n01 scoresheet with asterisks and xN notation

**What the TM cannot derive (must be in payload):**
- Tiebreak leg winners (`w` per leg) — the tiebreak deciding round is not on the scoresheet. When max rounds is reached without checkout, a separate 3-dart tiebreak round is played (highest score wins). This round is not recorded in the visit scores.
- Checkout dart count (`cd`) — how many darts used on the final visit (1, 2, or 3)

```json
{
  "v": 1,
  "t": "r",
  "mid": "FS-1-3",
  "tid": "1708123456789",
  "sid": "f47ac10b58cc",
  "p1": "Klas Krantz",
  "p2": "Hans Blomqvist",
  "t1": "Nya Pikado C",
  "t2": "Newton A",
  "sc": 501,
  "bo": 5,
  "mr": 13,
  "ln": 3,
  "w": 2,
  "fls": 2,
  "legs": [
    { "w": 2, "s": "SSkoFlEcNxULExU7AA==|GVFCXzwKKTkhAQgMAA==", "cd": 0 },
    { "w": 2, "s": "LS0DLV8NHTYpPw==|KBpRPFUcNChJEA==", "cd": 3 },
    { "w": 1, "s": "GgtfHTkZDR48NwkGVQ==|ZBoWCxwaGlMsZRIA", "cd": 3 }
  ],
  "ts": 1708123789,
  "crc": "d4c3b2a1"
}
```

**Estimated size: ~380-500 bytes** (typical Bo3-Bo5) → QR version ~12-16, easy to scan.

| Field | Type | Description |
|-------|------|-------------|
| `p1` | string | Player 1 name |
| `p2` | string | Player 2 name |
| `t1` | string | Team 1 name. **Omitted if not set.** |
| `t2` | string | Team 2 name. **Omitted if not set.** |
| `sc` | number | Starting score (501, 301, etc.) |
| `bo` | number | Best-of legs |
| `mr` | number | Max rounds before tiebreak |
| `ln` | number | Lane number. **Omitted if unassigned.** |
| `w` | 1 or 2 | Match winner (player number) |
| `fls` | 1 or 2 | First leg starter (alternates each leg) |
| `legs` | array | Per-leg data |
| `legs[].w` | 1 or 2 | Leg winner (essential for tiebreaks — see below) |
| `legs[].s` | string | Base64-encoded visit scores: `P1_SCORES\|P2_SCORES` (see encoding below) |
| `legs[].cd` | 0-3 | Checkout darts used (0 = tiebreak, 1-3 = darts on final visit) |

**Dropped fields:** `wl` (winner's legs) and `ll` (loser's legs) are not in the payload — the TM derives them by counting `legs[].w` values.

**Null field omission:** Fields with no value (`t1`, `t2`, `ln`) are omitted entirely rather than sent as `null`. The TM treats missing fields as unset.

**Score encoding:**

Each visit score (0-180) fits in a single unsigned byte. Per leg, both players' visit scores are packed into byte arrays, base64-encoded, and joined with `|` (pipe is not in the base64 alphabet, so it's a safe separator).

```
Encode: [73, 45, 40, 22, 81, ...] → Uint8Array → btoa() → "SSkoFlE..."
Decode: atob("SSkoFlE...") → Uint8Array → [73, 45, 40, 22, 81, ...]
Combined: "SSkoFlEcNxULExU7AA==|GVFCXzwKKTkhAQgMAA=="
           ← Player 1 scores →  ← Player 2 scores →
```

This saves ~45% compared to JSON number arrays. A 13-round leg goes from ~90 chars (`"v1":[73,45,...],"v2":[25,81,...]`) to ~50 chars (`"s":"...base64...|...base64..."`).

**Tiebreak handling:**

When max rounds (`mr`) is reached without a checkout, a separate tiebreak round is played: 3 darts each, highest score wins the leg. This deciding round is **not** recorded on the scoresheet — it's a separate mechanism. The scoresheet shows only the regular rounds. The `legs[].w` field is the only record of who won, and `legs[].cd = 0` signals the leg was a tiebreak.

**Size analysis (with base64 score encoding):**

| Format | Legs × Rounds | Payload | QR Version |
|--------|--------------|---------|------------|
| Bo3, typical | 2-3 × 8 | ~380 bytes | ~12 |
| Bo5, all 5 legs | 5 × 10 | ~520 bytes | ~16 |
| Bo7, all max rounds | 7 × 13 | ~680 bytes | ~20 |
| Bo13, all max rounds | 13 × 13 | ~1100 bytes | ~30 |
| QR v40 limit (EC-M) | — | 2331 bytes | 40 |

Even the absolute worst case (Bo13, all legs going to max rounds with long player/team names) stays well within QR capacity with ~50% headroom.

---

## CRC-32 Integrity Module

### Purpose
Detects data corruption from scanning errors, alongside QR's built-in error correction.

### Implementation

A standalone utility module (`js/newton-integrity.js` / `chalker/js/newton-integrity.js`) — same file, shared between TM and Chalker:

```javascript
const NewtonIntegrity = {
  // CRC-32 lookup table (generated once)
  _table: null,

  // Compute CRC-32 of a string → 8-char hex
  crc32(str) { ... },

  // Sign a payload object: compute CRC of JSON-sorted fields, append as 'crc'
  sign(payload) { ... },

  // Verify a payload: extract 'crc', recompute, compare
  verify(payload) { ... }
};
```

**Key design decisions:**
- CRC computed over **deterministically serialized** payload (sorted keys, no whitespace)
- The `crc` field is excluded before computing (sign adds it, verify strips it)
- Pure JavaScript, zero dependencies, ~50 lines
- Same file deployed to both TM and Chalker

### Why CRC-32 (not SHA-256)
- CRC-32 = 8 hex chars in the QR payload. SHA-256 = 64 chars — a significant size cost for no benefit here.
- QR requires corruption detection, not cryptographic security.
- The `verify()` interface is algorithm-agnostic — a stronger algorithm could be swapped in without changing callers.

---

## TM Result Application

### Applying the Match Result

`completeMatch(matchId, winnerPlayerNumber, winnerLegs, loserLegs)` handles everything structural — winner declaration, bracket advancement, and the history transaction. Called directly with data from the QR payload. The TM derives `winnerLegs` and `loserLegs` by counting `legs[].w` values.

### Player Achievements

Achievements are stored on `player.stats`, not on the match. The structure:

| Field | Type | Description |
|-------|------|-------------|
| `oneEighties` | counter | Visit scores of exactly 180 |
| `tons` | counter | Visit scores 100–179 |
| `highOuts` | array | Checkout scores ≥ 101 (stored as individual values) |
| `shortLegs` | array | Dart counts for short legs (stored as individual dart counts) |
| `lollipops` | counter | Visit scores of exactly 3 (cosmetic) |

All are fully derivable from the result QR payload:

| Achievement | Derivation |
|------------|------------|
| **180s** | All visits where `score === 180` |
| **Tons** | All visits where `100 ≤ score ≤ 179` |
| **High outs** | Last visit in the winner's score array, if `score ≥ 101` (checkout value = remaining score = last element) |
| **Short legs** | `(winner_visits − 1) × 3 + cd` darts. Non-checkout visits are always 3 darts; `cd` gives the final dart count. |
| **Lollipops** | All visits where `score === 3` |

### Stats Extraction Module

**Design decision: TM-side only.**

The Chalker delivers raw facts — visit scores, leg winners, checkout dart counts. It does not compute, interpret, or summarise. The TM is solely responsible for deriving meaning from the raw data.

This clean separation enables everything downstream: the QR payload stays minimal and stable, and the TM can evolve its analysis independently of the Chalker.

A dedicated module (`js/newton-stats.js`) handles all extraction. It is a pure function module — takes raw leg data in, returns structured stats out. No side effects. No coupling to QR, bracket, or player management.

```javascript
// js/newton-stats.js
const NewtonStats = {
  extractMatchStats(legs, startingScore, firstLegStarter) { ... },
  extractPlayerStats(legs, playerIndex, startingScore) { ... },
  extractAchievements(legs, playerIndex, startingScore) { ... },
  // individual extractors callable independently
  count180s(visits) { ... },
  countTons(visits) { ... },
  highOuts(legs, playerIndex, startingScore) { ... },
  shortLegs(legs, playerIndex) { ... },
  legAverages(legs, playerIndex) { ... },
  matchAverage(legs, playerIndex) { ... },
};
```

The individual extractors are callable independently — the QR result flow calls what it needs without pulling in unrelated machinery. No extractor depends on another module. New stat types are new named functions; existing callers are unaffected.

### Match Completion Flow

When the result preview modal is open after a successful scan, the operator sees the winner, score, and extracted achievements. They choose how to record the result:

**Option A — Score only**
- `completeMatch(matchId, winner, winnerLegs, loserLegs)` called with `completionType: 'QR'`
- No achievements written to `player.stats`
- Transaction `achievements` field is empty (`null` per player)

**Option B — Score + achievements**
- `completeMatch()` called as above
- `newton-stats.js` extracts achievements from the decoded payload
- Achievements applied to `player.stats`
- Transaction `achievements` field populated with exactly what was written

The operator decides. The software presents the options without forcing either path.

**Why this matters for undo:** the `completionType: 'QR'` and `achievements` field together give the undo dialog full knowledge of what was recorded and how. See `Docs/UNDO.md` for the undo dialog design.

### Replay Protection Covers Achievements

`completeMatch()` is blocked at the match level if the match is already completed. But achievements are **additive on player.stats** — applying them a second time corrupts the totals. The achievement application must be gated by the same replay check as `completeMatch()`. In practice: check match state first; if already completed, show the replay warning and do not call either `completeMatch()` or the achievement application.

---

## Replay Protection

**Approach: Match-state-based (no nonces needed)**

When TM scans a result QR for match `FS-1-3`:
1. Look up match `FS-1-3` in the tournament
2. Match must be live (started, not yet completed) — any other state is rejected with a specific reason
3. Verify `tid` matches current tournament — reject if from a different tournament
4. Verify `sid` matches this TM instance — reject if from a different server

Simple and robust — no nonces or timestamps required.

---

## TM-Side Score Validation

After CRC verification passes, the TM performs arithmetic validation on the decoded scores. This catches encoding/decoding bugs and Chalker scoring bugs that CRC cannot detect (CRC only proves the data wasn't corrupted in transit, not that it was correct in the first place).

**Validation checks (per leg):**

| Check | Rule | Catches |
|-------|------|---------|
| Score range | Every visit score is 0-180 | Encoding errors, byte overflow |
| Visit count parity | Both players have equal visits, or first-thrower has exactly +1 | Data corruption, missing visits |
| Checkout sum | Normal leg (`cd > 0`): winner's scores sum to `sc` | Scoring bugs, wrong winner |
| Tiebreak sum | Tiebreak leg (`cd == 0`): neither player's scores sum to `sc` | Misclassified tiebreak |
| Winner consistency | `legs[].w` matches the player whose scores sum to `sc` (normal legs) | Wrong leg winner assignment |
| Leg count | Winner has exactly `ceil(bo/2)` legs won | Impossible match outcome |

**Soft warning, not hard rejection:** If validation fails, the TM accepts the data but flags it visually (e.g., warning icon on the match). The operator can review. Rejecting the QR would force manual entry — worse UX for what might be a harmless edge case. The derived stats will also look visibly wrong, which is self-correcting.

**Cost:** Negligible — the TM is already decoding and summing scores to derive statistics. Validation is just checking what's already being computed.

---

## Server ID

A 12-character hex string generated once when the TM is first used, stored in global config (localStorage):

```javascript
if (!config.serverId) {
  config.serverId = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  saveGlobalConfig();
}
```

12 hex chars = 48 bits of entropy (281 trillion possible values) — collision risk is negligible for local tournament use.

Purpose:
- Identifies this TM instance in QR payloads
- Prevents cross-TM result injection (Chalker echoes it back, TM verifies)

---

## Flows

### Match Assignment Flow (TM → Chalker)

1. Operator clicks "Start Match" on match card in TM
2. TM generates assignment payload with match details + CRC
3. TM displays QR code on screen (overlay on match card or modal)
4. Chalker operator scans QR with device camera
5. Chalker parses payload, verifies CRC
6. Chalker auto-populates: player names, starting score, best-of, match ID, tournament ID
7. Chalker stores `mid`, `tid`, `sid` in match state for later inclusion in result QR
8. Match proceeds as normal on Chalker

### Match Result Flow (Chalker → TM)

1. Match completes on Chalker
2. Chalker builds result payload with raw visit scores, leg winners, and checkout dart counts + CRC
3. Operator taps **Stats**, then **Result QR** — Chalker displays the result QR code
4. TM operator clicks **Scan QR Results** in the Match Controls footer
5. TM parses payload, verifies CRC
6. TM checks `mid`, `tid`, `sid` against current tournament
7. TM checks replay (is match already completed?)
8. TM applies result: calls `completeMatch()` with winner + leg scores
9. TM stores stats from QR payload in the match record

### Manual Fallback (No Camera/HTTPS)

If QR scanning isn't available, both sides fall back gracefully:
- **Match assignment**: Operator sets up the Chalker manually — type player names, select format
- **Match result**: Operator clicks winner and enters the leg score in the TM as normal
- No data loss — stats are not transferred automatically, but the tournament continues unaffected

---

## QR Library Choices

| Side | Need | Library | Size | Notes |
|------|------|---------|------|-------|
| TM | Generate assignment QR | qrcode-generator (~8KB) | Lightweight | Generates QR as canvas/SVG |
| TM | Scan result QR | `BarcodeDetector` API (native) + jsQR fallback (~250KB) | Zero-dep primary | jsQR used on Windows Enterprise where `BarcodeDetector` is unavailable |
| Chalker | Scan assignment QR | `BarcodeDetector` API (native) + jsQR for iOS image capture | Zero-dep primary | jsQR used on iOS/iPadOS where `getUserMedia` is restricted |
| Chalker | Generate result QR | qrcode-generator (~8KB) | Lightweight | Displayed via Stats → Result QR |

**Zero-dependency requirement**: All libraries are standalone JS, no npm/build needed. Loaded via `<script>` tag.

---

## iOS-Compatible QR Scanning via Image Capture

**Status:** Implemented (Chalker side) — v5.0.14-beta
**Context:** [GitHub discussion #4](https://github.com/skrodahl/NewTon/discussions/4) — iOS/iPadOS WebKit restricts `getUserMedia` in PWAs and non-Safari browsers, blocking the live camera scanner on iPads at the oche.
**Contributors:** [@burgerboy85-rgb](https://github.com/burgerboy85-rgb) — platform detection strategy, `capture="environment"`, image downscaling, auto-retry UX

### Problem

The live scanner uses `getUserMedia` with a video stream and native `BarcodeDetector`. This works on desktop Chrome/Edge and Android but fails on iOS due to WebKit camera restrictions — even over HTTPS, even as a Home Screen PWA.

### Solution: image capture as primary iOS path

On iOS/iPadOS, `<input type="file" accept="image/*" capture="environment">` opens the native rear camera. The user takes a photo, which is decoded client-side by jsQR. This avoids `getUserMedia` entirely and uses a pattern iOS fully supports.

Image capture is the **default** on iOS/iPadOS — not a fallback triggered by `getUserMedia` failure. Some iPads technically support `getUserMedia` but behave unreliably in standalone PWA mode, which is worse UX than a consistent two-tap flow. Platform detection determines the path, not feature detection.

### Platform detection

```javascript
function isIOS() {
    return /iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
```

iPadOS 13+ reports as "Macintosh" in the User-Agent to receive desktop sites. The `navigator.platform === 'MacIntel'` + `navigator.maxTouchPoints > 1` check catches iPads disguised as Macs — real Macs report `maxTouchPoints` of 0.

### How it works

1. User taps "Scan QR" — `startQRScanner()` calls `isIOS()`
2. **iOS path**: `startImageCapture()` hides the video element, shows the scan modal, and triggers the file input — iOS opens the native rear camera
3. User takes a photo of the QR code
4. `decodeImageQR()` loads the photo into a canvas, downscales to ~1000px on the longest side (iPad photos can be 12MP+ — downscaling improves decode speed without losing QR resolution)
5. jsQR decodes the QR from the canvas pixel data
6. On success: `handleQRPayload()` — same entry point as the live scanner. CRC verification, payload parsing, and confirmation flow are identical.
7. On failure: error message displayed, hint updated to "Tap below to try again", file input reset for another capture

**Desktop/Android path**: unchanged — live camera stream with `BarcodeDetector`.

### Implementation details

**HTML additions** (`chalker/index.html`):
- `<input type="file" id="qr-image-input" accept="image/*" capture="environment">` — hidden, triggered programmatically
- `<canvas id="qr-image-canvas">` — hidden, used for image downscaling and pixel extraction
- `<script src="js/jsQR.js">` — jsQR library (~250KB), same copy used by the TM

**JS functions** (`chalker/js/chalker.js`):
- `isIOS()` — platform detection
- `startImageCapture()` — opens native camera via file input, wires up `onchange` handler
- `decodeImageQR(file)` — loads image, downscales, extracts pixel data, runs jsQR
- `stopQRScanner()` — extended to reset image capture state (file input, hint text, video visibility)
- `isQRScanAvailable()` — updated: returns `true` on iOS (image capture is always available)

**What stays the same:**
- Payload format, CRC signing, replay protection — all unchanged
- `handleQRPayload()` is the single entry point for both scan paths
- Offline-first model preserved — no URLs, no server dependency
- Security model unchanged — same signed payload, same verification

### Known risks and potential pitfalls

**Platform detection fragility:**
- `navigator.platform` is deprecated. Current browsers still support it, but future versions may remove it or return a generic value. If Apple changes `maxTouchPoints` behavior on desktop Macs (e.g. for trackpad), the detection could false-positive. Monitor for changes; a `navigator.userAgentData` path may be needed eventually.
- The detection is conservative: if it returns `false` on an iPad, the user gets the `getUserMedia` path which will fail with a camera error — not a crash, but a dead end that requires manual match setup.

**`capture="environment"` behavior varies:**
- On iPhone, this reliably opens the rear camera. On iPad, behavior depends on iOS version and context — some versions may show a file picker instead of the camera. If this happens, the user can still pick a previously taken photo, but the UX is less direct.
- In standalone PWA mode (Home Screen app), `capture` may behave differently than in Safari. This is the hardest configuration to test remotely.

**jsQR decode reliability:**
- jsQR needs a reasonably sharp, well-lit photo with the QR code filling a significant portion of the frame. Blurry photos, extreme angles, or heavy glare will fail to decode.
- The 1000px downscale is a balance: too small loses QR detail, too large is slow on older iPads. If decode rates are low, this threshold may need tuning.
- jsQR does not support multiple QR codes in one image — if the photo captures more than one QR (e.g. multiple match cards visible), it may decode the wrong one or fail entirely.

**Image orientation (EXIF):**
- iOS photos include EXIF orientation metadata. The `drawImage()` canvas approach in modern browsers auto-applies EXIF rotation. Older browser versions may not — the image could be rotated 90°, which would cause jsQR to fail. All currently supported iOS versions handle this correctly, but worth noting.

**Memory on older iPads:**
- A 12MP photo loaded into an `Image` element, drawn to a canvas, and processed by jsQR creates multiple large buffers. On older iPads with limited memory, this could cause a brief freeze or, in extreme cases, a tab reload. The downscale mitigates this — the canvas is only 1000px, not the full 12MP.

**Cancel flow:**
- If the user opens the native camera via the file input and then dismisses it (taps Cancel in iOS camera UI), no `onchange` event fires. The scan modal remains visible with the hint text. The user must tap the Cancel button in the modal to return to the Chalker. This is expected behavior but may confuse first-time users.

### Future work

- **TM-side image capture**: The TM also scans QR codes (result QR from Chalker). If the TM is used on an iPad, it needs the same image capture path. The implementation is analogous — same `isIOS()` check, same `decodeImageQR()` function, branching in the TM's scan flow.
- **Auto-retry on failure**: Currently the user sees an error and must manually trigger another capture. A future improvement could auto-reopen the file input after a short delay, keeping the user in the flow.

**Why not deep links:**
Deep links (`https://server/chalker/?assign=<payload>`) would require a known server URL, break offline-first, and open Safari instead of the PWA. Image capture keeps everything self-contained.

