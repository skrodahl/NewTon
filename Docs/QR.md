# QR Code Communication Protocol (TM ↔ Chalker)

**Status:** Planning
**Last Updated:** February 2026

---

## Context

The Tournament Manager (TM) and Chalker currently operate independently. To bridge them without requiring network infrastructure, we're designing a QR-code-based communication protocol:

- **TM → Chalker**: "Start Match" generates a QR code with match details that the Chalker scans
- **Chalker → TM**: "Match Complete" generates a QR code with results that the TM scans

This protocol is the **foundation for all future data exchange** — the same payload schemas and integrity checking will be reused for encrypted MQTT messages when networking is implemented. QR communication itself is NOT a licensed feature.

---

## Protocol Design

### Design Principles

1. **Same schema, different transport**: QR today, MQTT tomorrow. Payload format is identical.
2. **Compact field names**: Short keys to minimize QR code size (keeps QR version low = easier to scan)
3. **CRC-32 integrity**: Detects corruption during scanning. Reusable inside encrypted MQTT payloads later.
4. **Replay protection**: TM tracks processed match results by match ID — rescanning triggers a warning.
5. **Schema versioning**: `v` field enables forward-compatible changes.
6. **Offline-first**: No network, no license, no shared secrets required for QR.

### Identification Fields (Present in All Messages)

| Field | Description | Example |
|-------|-------------|---------|
| `v` | Schema version | `1` |
| `t` | Message type | `"a"` (assign) or `"r"` (result) |
| `mid` | Match ID (from TM) | `"FS-1-3"` |
| `tid` | Tournament ID | `"1708123456789"` |
| `sid` | Server/TM instance ID (UUID) | `"f47ac10b-58cc..."` |
| `ts` | Unix timestamp (seconds) | `1708123456` |
| `crc` | CRC-32 of all other fields | `"a1b2c3d4"` |

The `sid` (server ID) is a UUID generated once per TM installation and persisted in global config. It identifies which TM instance created the match. A `lic` (licensee) field will be added when licensing is implemented — the schema version bump will handle this.

---

## Message Schemas

### Match Assignment (TM → Chalker QR)

```json
{
  "v": 1,
  "t": "a",
  "mid": "FS-1-3",
  "tid": "1708123456789",
  "sid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
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

**Estimated size: ~200-250 bytes** → QR version ~8-10, very easy to scan.

| Field | Type | Description |
|-------|------|-------------|
| `p1` | string | Player 1 name |
| `p2` | string | Player 2 name |
| `sc` | number | Starting score (501, 301, etc.) |
| `bo` | number | Best-of legs |
| `mr` | number | Max rounds before forced tiebreak (requires new Global Settings field in TM) |
| `ln` | number/null | Lane number (1-20, null if unassigned) |
| `ref` | string/null | Referee name (null if none) |

> **Note:** The TM does not currently have a max rounds setting. This needs to be added to the Global Settings page (Config) as a prerequisite for QR match assignment. Default value: 13 rounds (39 darts).

### Match Result (Chalker → TM QR)

```json
{
  "v": 1,
  "t": "r",
  "mid": "FS-1-3",
  "tid": "1708123456789",
  "sid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "sc": 501,
  "bo": 3,
  "mr": 13,
  "ln": 3,
  "w": 1,
  "wl": 2,
  "ll": 1,
  "p1": "John Smith",
  "p2": "Jane Doe",
  "legs": [
    { "w": 1, "d1": 15, "d2": 18, "co": 84, "a1": 48.2, "a2": 35.1, "tb": false },
    { "w": 2, "d1": 21, "d2": 15, "co": 40, "a1": 38.5, "a2": 42.7, "tb": false },
    { "w": 1, "d1": 12, "d2": 18, "co": 104, "a1": 52.1, "a2": 36.8, "tb": false }
  ],
  "s1": { "t": 3, "t4": 1, "t8": 0, "ho": [104], "sl": [12], "a": 45.2, "f9": 85.3 },
  "s2": { "t": 2, "t4": 0, "t8": 1, "ho": [], "sl": [], "a": 38.1, "f9": 72.1 },
  "ts": 1708123789,
  "crc": "d4c3b2a1"
}
```

**Estimated size: ~700-900 bytes** → QR version ~18-22, still comfortable.

| Field | Type | Description |
|-------|------|-------------|
| `sc` | number | Starting score (echoed from assignment) |
| `bo` | number | Best-of legs (echoed from assignment) |
| `mr` | number | Max rounds before tiebreak (echoed from assignment) |
| `ln` | number/null | Lane number (echoed from assignment) |
| `w` | 1 or 2 | Winner (player number) |
| `wl` | number | Winner's legs won |
| `ll` | number | Loser's legs won |
| `legs` | array | Per-leg detail |
| `legs[].w` | 1 or 2 | Leg winner |
| `legs[].d1` | number | Player 1 darts thrown |
| `legs[].d2` | number | Player 2 darts thrown |
| `legs[].co` | number | Checkout score (winning double) |
| `legs[].a1` | number | Player 1 leg average (per 3 darts) |
| `legs[].a2` | number | Player 2 leg average (per 3 darts) |
| `legs[].tb` | boolean | Tiebreak leg |
| `s1`, `s2` | object | Per-player stats |
| `s_.t` | number | Tons (100+) |
| `s_.t4` | number | 140+ |
| `s_.t8` | number | 180s |
| `s_.ho` | number[] | High outs (101+) list |
| `s_.sl` | number[] | Short legs (dart counts) list |
| `s_.a` | number | Match average (per 3 darts) |
| `s_.f9` | number | First 9 average |

---

## CRC-32 Integrity Module

### Purpose
- **QR codes**: Detects data corruption from scanning errors (belt-and-suspenders alongside QR's built-in ECC)
- **Future MQTT**: Same CRC function reused inside encrypted message payloads for integrity verification after decryption

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
- CRC-32 = 8 hex chars in the QR payload. SHA-256 = 64 chars. Significant size difference.
- For QR, we only need corruption detection, not cryptographic security.
- For MQTT, the encryption envelope provides authentication — the CRC inside just catches post-decryption data errors.
- If stronger integrity is ever needed for QR, the `verify()` interface stays the same — only the algorithm changes.

---

## Replay Protection

**Approach: Match-state-based (no nonces needed)**

When TM scans a result QR for match `FS-1-3`:
1. Look up match `FS-1-3` in the tournament
2. If match is NOT completed → apply result normally
3. If match IS already completed → show warning: "This match already has a result. Rescan? (requires confirmation)"
4. Verify `tid` matches current tournament — reject if from a different tournament
5. Verify `sid` matches this TM instance — reject if from a different server

This is simple, robust, and doesn't require tracking nonces or timestamps.

---

## Server ID

A UUID generated once when the TM is first used, stored in global config (localStorage):

```javascript
// In results-config.js or a new config section
if (!config.serverId) {
  config.serverId = crypto.randomUUID();
  saveGlobalConfig();
}
```

Purpose:
- Identifies this TM instance in QR payloads
- Prevents cross-TM result injection (Chalker echoes it back, TM verifies)
- Will coexist with licensee ID when licensing is implemented

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
2. Chalker computes stats, builds result payload with leg-level detail + CRC
3. Chalker displays QR code on the Match Complete screen (alongside existing stats)
4. TM operator scans QR (camera button in Match Controls, or dedicated scan page)
5. TM parses payload, verifies CRC
6. TM checks `mid`, `tid`, `sid` against current tournament
7. TM checks replay (is match already completed?)
8. TM applies result: calls `completeMatch()` with winner + leg scores
9. TM stores stats from QR in match data (or a linked stats record)

### Manual Fallback (No Camera/HTTPS)

If QR scanning isn't available:
- **Match assignment**: Operator manually sets up the Chalker as today (type player names, select format)
- **Match result**: Operator manually clicks winner + enters leg score in TM as today
- No data loss — just no automatic stats transfer

---

## QR Library Choices

| Side | Need | Library | Size | Notes |
|------|------|---------|------|-------|
| TM | Generate assignment QR | qrcode-generator (~8KB) | Lightweight | Generates QR as canvas/SVG |
| TM | Scan result QR | html5-qrcode (~50KB) | Camera-based | Wraps getUserMedia + decoding |
| Chalker | Scan assignment QR | html5-qrcode (~50KB) | Camera-based | Chalker needs camera too |
| Chalker | Generate result QR | qrcode-generator (~8KB) | Lightweight | Display on Match Complete screen |

Both sides need both generation and scanning. Libraries loaded on-demand (not at startup).

**Zero-dependency requirement**: Both libraries are standalone JS, no npm/build needed. Loaded via `<script>` tag or dynamic import.

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `js/newton-integrity.js` | CRC-32 module (shared code, copied to both) |
| `chalker/js/newton-integrity.js` | Same file, for Chalker |
| `js/qr-bridge.js` | TM: QR generation (assignments) + scanning (results) |
| `chalker/js/qr-bridge.js` | Chalker: QR scanning (assignments) + generation (results) |
| `lib/qrcode-generator.min.js` | QR generation library |
| `lib/html5-qrcode.min.js` | QR scanning library |
| `chalker/lib/qrcode-generator.min.js` | Same, for Chalker |
| `chalker/lib/html5-qrcode.min.js` | Same, for Chalker |

### Modified Files

| File | Change |
|------|--------|
| `js/results-config.js` | Add `serverId` to global config |
| `js/bracket-rendering.js` | Add QR display on "Start Match", add scan button for results |
| `tournament.html` | QR modal markup, camera viewport |
| `chalker/js/chalker.js` | Store network fields in state, generate result QR on complete, scan assignment QR |
| `chalker/index.html` | QR display area on Match Complete, scan UI for assignments |

---

## Implementation Phases

### Phase 1: Foundation
- Create `newton-integrity.js` (CRC-32 module)
- Generate and persist server ID in TM config
- Define and document payload schemas

### Phase 2: Match Assignment QR (TM → Chalker)
- TM: Generate QR on "Start Match" (`qr-bridge.js`)
- Chalker: Scan QR to receive match assignment
- Chalker: Store `mid`, `tid`, `sid` in match state

### Phase 3: Match Result QR (Chalker → TM)
- Chalker: Generate result QR on Match Complete screen
- TM: Scan result QR (camera button in Match Controls)
- TM: Parse, verify, apply result with replay protection

### Phase 4: Polish & Edge Cases
- Error handling (invalid QR, wrong tournament, CRC mismatch)
- UX refinement (scan success/failure animations)
- Test with all bracket sizes (8, 16, 32 players)

---

## Things to Consider

1. **UTF-8 player names**: Names with accents (Ødegaard, Müller) must survive QR encoding correctly. JSON + UTF-8 handles this natively.

2. **Tournament ID compactness**: Current `tid` is `Date.now()` (~13 digits). Could encode as base36 to save bytes, but the saving is small (~3 bytes). Not worth the complexity.

3. **QR error correction level**: Use level M (medium, ~15% recovery). Good balance between scan reliability and capacity. Level L would give more capacity but less tolerance for screen glare/angles.

4. **Multiple Chalkers**: Each Chalker scans its own assignment QR and produces its own result QR. The `mid` field ensures results route to the correct match. No conflict possible.

5. **Clock differences**: `ts` is informational only (for logging/debugging). Never used for validation. Different devices may have different clocks.

6. **Chalker stays "dumb"**: The Chalker doesn't need tournament knowledge. It receives IDs via the assignment QR and echoes them back in the result QR. All validation happens on the TM side.

7. **Self-signed SSL**: Works for camera access. Browser shows a one-time certificate warning; once accepted, `getUserMedia` (camera API) works normally. Docker can auto-generate a self-signed cert.

8. **Stats the TM doesn't currently track**: The result QR carries leg-level detail (per-leg dart counts, checkout scores) and player stats (tons, 180s, averages) that the TM currently doesn't store beyond winner/loser and leg score. A future enhancement could display these in the bracket or leaderboard.

---

## Related Documents

- **Docs/NETWORK-LAYER.md**: Full network integration plan
- **Docs/SINGLE-SOURCE-OF-TRUTH.md**: Data architecture principles

---

## Verification

- Generate a test assignment QR in TM, scan with phone QR reader, verify JSON is valid and CRC matches
- Generate a test result QR in Chalker, scan with phone QR reader, verify payload completeness
- Round-trip test: TM assigns → Chalker scans → plays match → Chalker generates result → TM scans → result applied to bracket
- Test with special characters in player names
- Test replay protection: scan same result QR twice, verify warning on second scan
- Test CRC verification: manually corrupt one byte in QR data, verify rejection
