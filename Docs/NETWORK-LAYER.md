# NewTon Network Layer - App Integration

**Status:** Planning
**Last Updated:** January 2025

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
- Network features require a valid license from the hub.
- Network mode is toggled on/off in TM (master control).
- QR codes only appear in Chalker when running a network match (license-gated).

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

## QR Code Result Transfer

QR codes are a licensed feature - only available for network matches.

### When QR Appears
- Chalker is in network mode (match dispatched from TM)
- Match completes successfully
- Acts as fallback if network transmission fails
- NOT available in standalone/manual mode (no license)

### Chalker: Generate QR

On network match completion, generate QR encoding:
```javascript
{
  v: 1,                      // Schema version
  m: 'FS-1-3',              // Match ID (if from TM)
  w: 1,                      // Winner (1 or 2)
  s: '2-1',                  // Score (legs)
  p1: 'John Smith',
  p2: 'Jane Doe',
  stats: { /* compact stats */ }
}
```

Display as QR code on result screen.

### TM: Scan QR

- Camera button on match card
- Scan QR, parse result
- Confirm and apply to bracket

**Library consideration:** Lightweight QR library, loaded only when needed.

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

### Match Assignment (Hub → Chalker)
```json
{
  "type": "match:assign",
  "matchId": "FS-1-3",
  "tournamentId": "uuid",
  "player1": "John Smith",
  "player2": "Jane Doe",
  "startingScore": 501,
  "bestOf": 3
}
```

### Match Result (Chalker → Hub)
```json
{
  "type": "match:result",
  "matchId": "FS-1-3",
  "winner": "player1",
  "legs": [
    { "winner": "player1", "p1Darts": 15, "p2Darts": 12 },
    { "winner": "player2", "p1Darts": 18, "p2Darts": 21 },
    { "winner": "player1", "p1Darts": 12, "p2Darts": 15 }
  ],
  "stats": {
    "player1": { "tons": 3, "ton40": 1, "ton80": 0, "highOut": 84 },
    "player2": { "tons": 2, "ton40": 0, "ton80": 1, "highOut": 72 }
  }
}
```

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
  network-client.js      # TM network client (new)
  qr-scanner.js          # QR scanning for TM (new)

chalker/
  js/
    network-client.js    # Chalker network client (new)
    qr-generator.js      # QR generation for Chalker (new)
```

Existing files to modify:

```
js/
  main.js                # Init network client, add status indicator
  bracket-rendering.js   # Add dispatch button, status display

chalker/
  js/
    chalker.js           # Init network, handle incoming matches
  index.html             # Add network status indicator
```

---

## Implementation Phases

### Phase 1: Network Mode Toggle (TM)
- Add network mode on/off toggle to TM settings
- When off: current behavior, no network features visible
- When on: attempt hub connection, show status indicator

### Phase 2: Chalker Network Client
- Add network-client.js to Chalker
- Connection status indicator
- Receive match assignments
- Send results on completion

### Phase 3: TM Network Client
- Add network-client.js to TM
- Lane status display
- Match dispatch UI
- Result reception

### Phase 4: Polish
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
