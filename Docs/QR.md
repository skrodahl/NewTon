# QR Code Communication Protocol (TM ↔ Chalker)

**Status:** In Development — v5.0.0
**Last Updated:** March 2026

---

## Decisions (March 2026)

- **Version**: This feature ships as **v5.0.0** — TM↔Chalker communication is a fundamental architectural shift.
- **First implementation target**: TM generates assignment QR (TM → Chalker direction). Chalker scanning comes second.
- **`sc` and `mr` in TM Global Settings (Match Configuration card)**: Two new fields added at the bottom of the existing Match Configuration section. x01 Format: 101 / 201 / 301 / 501 (default 501). Max Rounds: dropdown 7–20 (default 13). Both are included in the assignment payload. This keeps TM as the single source of truth for match format — the Chalker executes whatever it is told.
- **Network and QR unified in Chalker**: Not two separate buttons. The "New Match?" dialog will have a single **"Network / QR"** button. QR is the fallback when network is unavailable. The existing "Network Mode" placeholder (currently shows "requires a license") will be extended rather than replaced.
- **Chalker scanning QR**: Deferred — comes after TM QR generation is working.

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
| `sid` | Server/TM instance ID (12-char hex) | `"f47ac10b58cc"` |
| `ts` | Unix timestamp (seconds) | `1708123456` |
| `crc` | CRC-32 of all other fields | `"a1b2c3d4"` |

The `sid` (server ID) is a 12-character hex string generated once per TM installation and persisted in global config. It identifies which TM instance created the match. 12 hex chars = 48 bits of entropy (281 trillion possible values) — collision risk is negligible for local tournament use. A `lic` (licensee) field will be added when licensing is implemented — the schema version bump will handle this.

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
| `sc` | number | Starting score (501, 301, etc.) |
| `sc` | number | Starting score — from Global Config (101 / 201 / 301 / 501, default 501) |
| `bo` | number | Best-of legs — from Global Config match configuration |
| `mr` | number | Max rounds before tiebreak — from Global Config (default 13, range 7–20) |
| `ln` | number | Lane number (1-20). **Required for QR — warning shown if unset.** |
| `ref` | string | Referee name. **Required for QR — warning shown if unset.** |

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

**Future optimization — full binary encoding:**

The entire payload could be binary-encoded (MessagePack or custom binary format) instead of JSON, potentially halving the size again. The TM can decode either format. Marked as an interesting future option if payload size ever becomes a concern — current JSON + base64 scores is well within limits and much easier to debug.

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
// In results-config.js or a new config section
if (!config.serverId) {
  config.serverId = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  saveGlobalConfig();
}
```

12 hex chars = 48 bits of entropy (281 trillion possible values). More than sufficient for identifying local TM instances — collision risk is negligible.

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

8. **Stats the TM doesn't currently track**: The result QR carries raw visit scores from which the TM can derive everything (averages, score ranges, high finishes, best/worst leg, etc.). The TM currently doesn't store this detail beyond winner/loser and leg score. A future enhancement could display derived stats in the bracket or leaderboard.

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
