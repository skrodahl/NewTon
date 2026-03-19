# NewTon Network Layer - App Integration

**Status:** Planning
**Last Updated:** March 14, 2026

---

## Storage Architecture Decision (March 2026, revised)

### Hybrid Storage: localStorage + indexedDB

The storage layer does **not** need to migrate wholesale to indexedDB. Instead, a hybrid approach separates concerns cleanly:

| Store | What it holds | Nature |
|-------|--------------|--------|
| **localStorage** | Tournament structure, match state, config, rankings, undo history | Operational — run the tournament. Ephemeral by design. |
| **indexedDB** | Raw match archive: visit scores, leg data, timestamps | Archival — permanent record. Independent lifecycle. |

**Why this works:**
- Everything in localStorage today is small, fast, and synchronous. It works. Leave it alone.
- The heavy data (visit scores, full scoresheets) does not exist in the codebase yet — it can be built async and indexedDB-native from day one.
- No migration. No async refactoring of existing code. No risk to what is working.

**The archive is independent:**
The indexedDB match archive has its own lifecycle. It is not a cache of localStorage — it is a permanent record. Deleting a tournament from localStorage does not orphan the archive; the archive stands on its own. It can be queried for player statistics, trends, head-to-head records, and season history long after the operational tournament data is gone.

### Match Archive Record

```javascript
{
  matchId:        'FS-1-3',        // TM match ID
  tournamentId:   'uuid',          // Soft reference — archive survives tournament deletion
  timestamp:      'ISO8601',       // Match start time
  player1:        { id, name },
  player2:        { id, name },
  format:         'Bo5',           // Match format
  startingPlayer: 1,               // 1 or 2
  visits:         []               // Raw per-visit scores, per leg
}
```

All derived values — averages, checkout percentages, high finishes, score ranges, head-to-head records — are calculated on read from the raw visits. The store stays lean; the queries stay flexible.

### What this unblocks
- Full scoresheet storage (Chalker → TM result import)
- Series / League season history
- Player statistics and trends across tournaments
- External reporting / API hydration

### Data Flow: Live Stream + Final Transfer

When network is active, Chalker sends data to TM in two phases:

**Live stream** — per-visit data flows from Chalker to TM as the match progresses. Provisional and best-effort. Enables real-time display in TM (live score, running averages, spectator view) without waiting for match completion.

**Final transfer** — complete match record sent on match completion. This is the source of truth. TM writes to the archive only if the incoming data differs from what is already present — making the transfer idempotent and safe to receive multiple times.

This means the live infrastructure is in place from the start. If the stream was uninterrupted, the final transfer is a no-op. If the connection dropped mid-match, the final transfer fills any gaps. Either way the archive ends up correct.

Live opportunities enabled from day one:
- Live score display on the TM bracket during a match
- Running statistics as legs are played
- Real-time leaderboard updates
- Spectator / operator view without manual entry
- **Celebration broadcast** — when the tournament completes and the Celebration Podium appears in TM, the podium is pushed to all connected Chalker tablets simultaneously. Every screen in the venue shows the champion at the same moment

### Live Feed: MQTT Pub/Sub

External consumers (live-view displays, announcer screens, stats overlays) receive live data via the same MQTT broker already used for TM ↔ Chalker communication. No separate mechanism needed.

**TM publishes** live state updates to a dedicated topic (e.g. `newton/live/{tournamentId}`) as events occur — visit scored, leg completed, match completed, leaderboard updated.

**Any subscriber** — on any computer on the network — receives updates in real time simply by subscribing to the relevant topic. Any number of consumers, no polling, no additional infrastructure.

The hub routes messages. The TM is the publisher and source of truth. Consumers are read-only subscribers. This is MQTT used as intended.

The network layer features described below remain valid and unchanged.

---

## Overview

This document focuses on what changes are needed in **this project** (Tournament Manager and Chalker) to support network connectivity while preserving full standalone/offline functionality.

The network hub itself is a separate project (newton-hub). This document is about making TM and Chalker "network-ready" without breaking anything.

---

## Design Principle: Offline First, Network Optional

The apps must work identically in all scenarios:

| Scenario | TM | Chalker | Network |
|----------|-----|---------|---------|
| **Standalone** | Open HTML directly | Open HTML directly | None |
| **Docker (no hub)** | Served via nginx | Served via nginx | None |
| **Docker (with hub)** | Connected to hub | Connected to hub | Full sync |

**Rules:**
- Network code must be purely additive. No existing functionality depends on it.
- The newton-app Docker image must work standalone without newton-hub.
- Hub connectivity is an optional enhancement, not a requirement.
- Users who deploy only newton-app get the same experience as opening HTML directly.
- Network mode is toggled on/off in TM (master control).

### Licensing Boundaries

| Feature | License Required | Notes |
|---------|:---:|-------|
| Tournament Manager (DE, future SE) | No | Fully open source with all features |
| Chalker | No | Fully open source, no limitations |
| QR code generation & scanning | No | Open source — the free path for match assignment and result transfer |
| Network bridge (MQTT) | **Yes** | Encryption is the license gate — TM cannot read unencrypted MQTT traffic |
| Series / League | **Yes** | Only available through the network bridge (no QR workflow) |

**Key principle:** Encryption serves double duty — it protects data in transit AND enforces licensing. No license = no decryption keys = MQTT is non-functional. QR bypasses this naturally because it's a visual/local channel requiring no encryption.

---

## Tournament Manager Changes

### New UI Elements

**Lane Assignment on Match Start**
- When starting a match, option to assign to a lane
- Dropdown shows connected/available lanes (from hub) or manual entry (offline)
- Lane assignment stored in match data

**Network Status Indicator**
- Small indicator showing: Disconnected / Connected / Syncing
- Non-intrusive, doesn't block any operations
- Click to see connection details

**Match Dispatch Status**
- Visual feedback when match is sent to Chalker
- States: Not sent / Sending / Delivered / Failed
- Manual retry option if delivery fails

**Result Import**
- Receive results from Chalker via network
- QR code scanner fallback (camera-based)
- Manual entry always available (current behavior)

### New JavaScript Module: `js/network-client.js`

```javascript
// Network client - optional module, app works without it
const NetworkClient = {
  socket: null,
  status: 'disconnected', // disconnected | connecting | connected

  // Attempt connection (fails silently if hub unavailable)
  init(hubUrl) { },

  // Query available lanes
  getLanes() { },

  // Send match to Chalker
  dispatchMatch(matchId, lane, matchData) { },

  // Listen for results
  onResult(callback) { },

  // Status change listener
  onStatusChange(callback) { }
};
```

### Data Structure Extensions

**Match object additions:**
```javascript
{
  // Existing fields...

  // Network fields (optional, absent in offline mode)
  assignedLane: 5,           // Lane number if assigned
  dispatchStatus: 'delivered', // null | pending | delivered | failed
  dispatchTimestamp: 'ISO8601',
  resultSource: 'network'    // manual | network | qr
}
```

---

## Chalker Changes

### New UI Elements

**Network Mode Toggle**
- Setting to enable/disable network mode
- When enabled: shows connection status, receives matches
- When disabled: current behavior (fully manual)

**Connection Status Indicator**
- Header area: Connected (green) / Disconnected (gray)
- Shows lane number when registered

**Incoming Match Alert**
- Modal/toast when match is dispatched from TM
- Shows players, format, accept/reject options
- Auto-accepts if Chalker is idle (configurable)

**Result Transmission**
- On match complete: auto-send results to hub
- Visual confirmation of delivery
- QR code generation as fallback

### New JavaScript Module: `chalker/js/network-client.js`

```javascript
// Network client - optional module, app works without it
const ChalkerNetwork = {
  socket: null,
  status: 'disconnected',
  lane: null,

  // Connect and register lane
  init(hubUrl, laneNumber) { },

  // Send heartbeat (called on interval)
  heartbeat() { },

  // Listen for incoming matches
  onMatchAssigned(callback) { },

  // Send match result
  sendResult(matchId, resultData) { },

  // Status change listener
  onStatusChange(callback) { }
};
```

### Data Structure Extensions

**State object additions:**
```javascript
{
  // Existing fields...

  // Network fields (optional)
  networkMode: false,
  matchId: 'FS-1-3',        // ID from TM (null if manual)
  tournamentId: 'uuid',      // Tournament reference
  resultSent: false          // Whether result was transmitted
}
```

---

## QR Code Communication (Open Source)

QR is the **free, unlicensed path** for match assignment and result transfer. It works in all scenarios — standalone, Docker, with or without a hub. No network or license required.

- **TM → Chalker**: Match assignment QR (player names, format, match/tournament IDs)
- **Chalker → TM**: Match result QR (raw visit scores, leg winners, checkout darts)
- **Fallback for network mode**: If MQTT delivery fails, QR is always available

The TM derives all statistics (averages, score ranges, high finishes, etc.) from raw visit scores in the result payload. Base64-encoded scores keep the payload compact (~380-500 bytes for typical Bo3-Bo5).

> **Full protocol specification:** See **Docs/QR.md** for payload schemas, field definitions, size analysis, encoding details, integrity checking, and verification procedures.

---

## Connection Detection

### Hub URL Discovery

Priority order:
1. Explicit setting in app config
2. Query parameter: `?hub=wss://...`
3. Well-known path: `../hub` (relative to app)
4. Environment variable in Docker: `NEWTON_HUB_URL`

### Graceful Degradation

```javascript
// Pseudo-code for network initialization
async function initNetwork() {
  const hubUrl = discoverHubUrl();
  if (!hubUrl) return; // No hub configured, stay offline

  try {
    await NetworkClient.init(hubUrl);
    // Connected - enable network features
  } catch (e) {
    // Hub unavailable - continue in offline mode
    console.log('Hub unavailable, running offline');
  }
}
```

### Reconnection

- Auto-reconnect with exponential backoff
- Max reconnect attempts before giving up
- Manual reconnect button in UI

---

## Message Schemas

### Match Assignment & Result (via MQTT)

MQTT uses the **same payload schemas** as QR (see **Docs/QR.md**), wrapped in an encrypted envelope. The `t` field distinguishes message types (`"a"` for assignment, `"r"` for result). This means one schema definition, two transports.

The encrypted MQTT envelope adds:
- Encryption layer (license-gated — TM cannot decrypt without valid license keys)
- CRC-32 inside the encrypted payload for post-decryption integrity verification

### Lane Registration (Chalker → Hub)
```json
{
  "type": "lane:register",
  "lane": 5,
  "deviceId": "uuid"
}
```

### Heartbeat (Chalker → Hub)
```json
{
  "type": "heartbeat",
  "lane": 5,
  "status": "idle|busy",
  "matchId": "FS-1-3|null"
}
```

---

## File Structure

New files to add:

```
js/
  newton-integrity.js         # CRC-32 integrity module — shared with Chalker (new)
  qr-bridge.js                # TM: QR generation (assignments) + scanning (results) (new)
  network-client.js           # TM network client (new)

chalker/
  js/
    newton-integrity.js       # CRC-32 integrity module — same file as TM (new)
    qr-bridge.js              # Chalker: QR scanning (assignments) + generation (results) (new)
    network-client.js         # Chalker network client (new)

lib/
  qrcode-generator.min.js     # QR generation library — loaded on demand (new)
  html5-qrcode.min.js         # QR scanning library — loaded on demand (new)

chalker/lib/
  qrcode-generator.min.js     # Same, for Chalker (new)
  html5-qrcode.min.js         # Same, for Chalker (new)
```

Existing files to modify:

```
js/
  results-config.js      # Add serverId to global config (QR phase)
  main.js                # Init network client, add status indicator
  bracket-rendering.js   # Add QR display on Start Match, scan button, dispatch button

chalker/
  js/
    chalker.js           # Store network fields in state, generate result QR, scan assignment QR
  index.html             # QR display area on Match Complete, scan UI, network status indicator
tournament.html          # QR modal markup, camera viewport
```

---

## Implementation Phases

QR communication (Docs/QR.md) is the foundation for TM ↔ Chalker data exchange and must be completed before the MQTT network phases. QR is the free, offline path; MQTT is the licensed, networked path. Both use identical payload schemas.

### QR Phase 1: Foundation
- Create `newton-integrity.js` (CRC-32 module, shared between TM and Chalker)
- Generate and persist `serverId` in TM global config (`results-config.js`)
- See **Docs/QR.md** for full phase breakdown

### QR Phase 2: Match Assignment QR (TM → Chalker)
- TM generates assignment QR on "Start Match"
- Chalker scans QR to receive match details
- See **Docs/QR.md**

### QR Phase 3: Match Result QR (Chalker → TM)
- Chalker generates result QR on Match Complete
- TM scans result QR and applies to bracket
- See **Docs/QR.md**

### Network Phase 1: Network Mode Toggle (TM)
- Add network mode on/off toggle to TM settings
- When off: current behavior, no network features visible
- When on: attempt hub connection, show status indicator

### Network Phase 2: Chalker Network Client
- Add network-client.js to Chalker
- Connection status indicator
- Receive match assignments
- Send results on completion

### Network Phase 3: TM Network Client
- Add network-client.js to TM
- Lane status display
- Match dispatch UI
- Result reception

### Network Phase 4: Polish
- Reconnection handling
- Error states and recovery
- Settings UI for network config

---

## Open Questions (App-Side)

1. **Network mode default:** Opt-in (must enable) or auto-detect?

2. **Match ID format:** Use TM's internal match ID, or hub assigns new ID?

3. **Partial results:** Send leg-by-leg updates, or only final result?

4. **Multiple tournaments:** Can one Chalker serve matches from different tournaments?

5. **Settings persistence:** Store hub URL and network preferences where? (LocalStorage config)

---

## Related Documents

- **Docs/QR.md**: QR communication protocol (payload schemas, encoding, integrity)
- **CHALKER-PERSISTENCE.md**: Chalker's offline storage architecture
- **CHANGELOG.md**: Version history
- **README.md**: Project overview

---

## Hub Reference (Separate Project)

The newton-hub handles:
- WebSocket server
- Message routing (pub/sub)
- Lane registry
- License validation
- Health monitoring

See newton-hub repository for hub-specific documentation.
