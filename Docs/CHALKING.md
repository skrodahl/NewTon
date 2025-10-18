# Digital Chalking System

## Overview

**Digital Chalking** is a planned feature for v3.1+ that provides iPad-based match scoring with automatic statistics collection and QR code-based data transfer between referee tablets and the tournament manager computer.

**Status:** Planned for Q2 2026 (April-June)

**Core Principle:** Bidirectional QR codes for match initiation and completion - zero network dependencies, maximum reliability.

---

## The Problem

**Current State (Manual Chalking):**
- Referees track scores on paper or chalkboard
- Statistics tracked manually (tons, 180s, high outs, averages)
- Referee reports results verbally to tournament manager
- Tournament manager enters stats manually into computer
- **Pain points:**
  - Transcription errors
  - Forgotten statistics
  - Inconsistent data collection
  - Time-consuming manual entry
  - Difficult in sports bar environment with confusion/noise
  - Inexperienced chalkers make mistakes
  - External participants unfamiliar with tracking requirements

**Desired State (Digital Chalking):**
- iPad provides Nakka N01-style scoring interface
- All statistics tracked automatically and accurately
- QR code transfers data instantly and error-free
- Tournament manager receives complete stats with zero manual entry
- Confident collection of comprehensive statistics

---

## The Solution: Bidirectional QR Codes

### Why QR Codes (Not Network Sync)

**The bidirectional QR approach is elegant because:**

**It's not a compromise.**
It's not "good enough for now."
It's not "we'll do it properly later."

**It's the RIGHT solution.**

**Advantages over network sync:**
- ✅ **Zero network dependencies** - No WiFi required, no connection state, no sync failures
- ✅ **Maximum reliability** - QR codes always work, no "did it send?" ambiguity
- ✅ **Simpler implementation** - 1/10th the complexity of WebSocket approach
- ✅ **Faster development** - 6-8 weeks vs 12+ weeks
- ✅ **Easier maintenance** - No infrastructure, no relay servers, no debugging sync issues
- ✅ **Perfect for sports bar chaos** - Foolproof operation, zero training needed
- ✅ **iPad flexibility** - Any iPad can score any match, stateless devices
- ✅ **Offline resilience** - localStorage on both sides, survives network/device failures
- ✅ **Visual confirmation** - Referee and manager both see data being transferred
- ✅ **Preserves core principles** - Offline-first, zero external dependencies, bulletproof resilience

**Network sync doesn't add value:**
- Real-time updates not needed (match takes 15-20 minutes, stats only needed at end)
- Manager doesn't need live scoring visibility
- Bracket progression happens AFTER match completion
- Adds complexity without solving additional problems

**Future upgrade path:**
- v3.1: Ship QR code approach (complete solution)
- v4.0+: Optionally add network sync as enhancement (if discovered to be needed)
- QR codes remain as fallback even if network added later

---

## Architecture

### Two Web Applications

**1. Tournament Manager** (`tournament.html` - existing app, enhanced)
- Runs on tournament computer (Chrome)
- Generates match initiation QR codes
- Scans match completion QR codes
- Processes results using existing transaction system

**2. Chalker App** (`chalker.html` - new standalone app)
- Runs on iPad (Chrome/Safari, or home screen web app)
- Scans initiation QR to load match details
- Provides Nakka N01-style scoring interface
- Generates completion QR with full statistics
- Works completely offline (localStorage resilience)

### Data Flow

```
TOURNAMENT MANAGER                    iPAD CHALKER APP
==================                    ================

1. MATCH READY
   ↓
Generate Initiation QR
{matchId, players, format}
   ↓
Display QR on screen ────────────→ Scan QR Code
                                       ↓
                                  Load Match Data
                                       ↓
                                  Store in localStorage
                                       ↓
                                  2. SCORING IN PROGRESS
                                       ↓
                                  Track all stats automatically
                                       ↓
                                  3. MATCH COMPLETE
                                       ↓
                                  Generate Completion QR
                                  {matchId, winner, stats}
                                       ↓
Scan Completion QR ←──────────── Display QR + Stats Summary
   ↓
Parse & Validate
   ↓
Process Match
(existing v3.0 logic)
   ↓
4. TOURNAMENT PROGRESSES
```

### No Network Infrastructure Required

**What you DON'T need:**
- ❌ Docker containers
- ❌ SQLite database
- ❌ WebSocket relay server
- ❌ nginx reverse proxy
- ❌ Network configuration
- ❌ Sync logic
- ❌ Concurrent write handling

**What you DO need:**
- ✅ Two tiny JavaScript libraries (qrcode.js + jsQR)
- ✅ Camera access OR clipboard fallback
- ✅ iPad browsers (already have)
- ✅ Tournament computer (already have)

---

## User Workflows

### Match Initiation Workflow

**Tournament Manager Side:**
1. Match becomes READY in Match Controls
2. Manager clicks **"Start on Lane 3"** button
3. Modal displays QR code with match details:
   - Match ID (e.g., "FS-2-1")
   - Player names ("John Smith vs Mary Jones")
   - Match format ("Best of 3 legs")
   - Lane assignment ("Lane 3")
4. Modal includes "Copy to Clipboard" fallback button

**Referee/iPad Side:**
1. Referee picks up any available iPad
2. Opens Chalker App (or launches from home screen)
3. Taps **"📷 Scan Match QR Code"**
4. Points iPad camera at tournament screen
5. QR scanned → Match loads automatically
6. iPad displays: **"Lane 3: FS-2-1 - John Smith vs Mary Jones (Best of 3)"**
7. Referee taps **"Start Match"**
8. Scoring interface appears

**Fallback (if camera fails):**
- Manager clicks "Copy to Clipboard" on tournament screen
- Referee taps "Paste from Clipboard" on iPad
- Same result

**Key Benefits:**
- ✅ Zero manual entry on iPad (no typing player names, selecting dropdowns)
- ✅ Zero chance of wrong players/format
- ✅ matchId links iPad data to tournament data (validation)
- ✅ Any iPad can score any match (stateless devices)
- ✅ Fast setup (5 seconds: scan → start)

### Match Scoring Workflow

**During Match (iPad Only):**
1. Nakka N01-style scoring interface
2. Referee enters each dart score
3. iPad automatically tracks:
   - Current scores (501 countdown)
   - Legs won per player
   - Tons (100+)
   - 180s
   - High outs
   - Short legs (≤15 darts)
   - Averages (3-dart and per-leg)
4. Big touch-friendly buttons
5. Visual turn indicator
6. Undo button for mistakes
7. All data persisted to localStorage continuously

**Resilience:**
- If iPad crashes → relaunch app → "Resume match?" prompt
- If network were present and failed → scoring continues unaffected
- If referee makes mistake → Undo button available
- If iPad battery dies → manual entry fallback (like v3.0 today)

### Match Completion Workflow

**iPad Side:**
1. Final checkout scored → match ends
2. iPad shows **Match Complete Summary Screen**:

```
┌──────────────────────────────────────┐
│        MATCH COMPLETE!               │
├──────────────────────────────────────┤
│                                      │
│  Lane 3: FS-2-1                      │
│  John Smith wins 2-1 over Mary Jones │
│                                      │
│  JOHN SMITH                          │
│  • Legs Won: 2                       │
│  • High Out: 120                     │
│  • Tons: 2 (100, 140)                │
│  • 180s: 1 (Leg 2)                   │
│  • Short Legs: 1 (15 darts, Leg 1)   │
│  • Average: 78.5                     │
│                                      │
│  MARY JONES                          │
│  • Legs Won: 1                       │
│  • High Out: 95                      │
│  • Tons: 1 (100)                     │
│  • 180s: 0                           │
│  • Short Legs: 0                     │
│  • Average: 72.3                     │
│                                      │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    ████████████████         │    │
│  │    ██ QR CODE   ██          │    │
│  │    ██   HERE    ██          │    │
│  │    ████████████████         │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                      │
│  Show this QR to tournament manager  │
│                                      │
│  [Copy to Clipboard] [Done]          │
└──────────────────────────────────────┘
```

3. Referee **reviews stats for accuracy** (trust/verification)
4. Referee shows QR code to tournament manager

**Tournament Manager Side:**
1. Manager clicks **"📷 Scan Match Result"** button
2. Points camera at iPad screen (or clicks "Paste from Clipboard")
3. QR scanned → Results parsed
4. Tournament validates:
   - matchId exists and is not already completed
   - Player IDs match expected players
5. Tournament processes match using existing v3.0 logic:
   - Creates `COMPLETE_MATCH` transaction
   - Creates `SYNC_STATS_FROM_CHALKER` transaction (tracks source)
   - Updates match object with stats
   - Progresses tournament (winner/loser placement)
   - Updates bracket display
   - Calculates rankings
6. Shows confirmation: **"✓ Match FS-2-1 imported - John wins 2-1"**

**Fallback (if QR fails):**
- iPad shows "Copy to Clipboard" button
- Manager clicks "Paste from Clipboard"
- Same result

**Manual Fallback (if iPad dead):**
- Manager clicks "Complete Match Manually"
- Opens existing Winner Confirmation modal
- Works exactly like v3.0.0 today

**Key Benefits:**
- ✅ **Visual verification** - Referee sees stats before sending
- ✅ **Trust/confidence** - Stats summary visible on both devices
- ✅ **Zero transcription errors** - Data transferred digitally
- ✅ **Complete statistics** - Nothing forgotten or missed
- ✅ **Fast transfer** - 2 seconds to scan QR
- ✅ **Validation** - Tournament rejects invalid/duplicate results

---

## Data Formats

### Match Initiation QR Code

**Generated by:** Tournament Manager
**Consumed by:** Chalker App

```json
{
  "type": "INIT_MATCH",
  "matchId": "FS-2-1",
  "lane": 3,
  "player1": {
    "id": "1234567890123",
    "name": "John Smith"
  },
  "player2": {
    "id": "4567890123456",
    "name": "Mary Jones"
  },
  "format": "best-of-3",
  "gameType": "501",
  "inRule": "straight",
  "outRule": "double",
  "timestamp": 1729123456789
}
```

**Fields:**
- `type`: Message type identifier (`INIT_MATCH`)
- `matchId`: Tournament match identifier (e.g., `FS-2-1`, `BS-FINAL`, `GRAND-FINAL`)
- `lane`: Dartboard lane number (1-20)
- `player1`/`player2`: Player IDs and names
- `format`: Match length (`best-of-3`, `best-of-5`, `best-of-7`)
- `gameType`: Starting score (`301`, `501`, `701`, `1001`)
- `inRule`: Start rule (`straight`, `double`, `master`)
- `outRule`: Finish rule (`straight`, `double`, `master`)
- `timestamp`: Unix timestamp (milliseconds) for audit trail

### Match Completion QR Code

**Generated by:** Chalker App
**Consumed by:** Tournament Manager

```json
{
  "type": "COMPLETE_MATCH",
  "matchId": "FS-2-1",
  "lane": 3,
  "gameType": "501",
  "outRule": "double",
  "winner": {
    "id": "1234567890123",
    "name": "John Smith",
    "score": 2
  },
  "loser": {
    "id": "4567890123456",
    "name": "Mary Jones",
    "score": 1
  },
  "stats": {
    "1234567890123": {
      "highOut": 120,
      "tons": [100, 140],
      "legs180": [1],
      "shortLegs": [15],
      "average": 78.5
    },
    "4567890123456": {
      "highOut": 95,
      "tons": [100],
      "legs180": [],
      "shortLegs": [],
      "average": 72.3
    }
  },
  "timestamp": 1729125678901
}
```

**Fields:**
- `type`: Message type identifier (`COMPLETE_MATCH`)
- `matchId`: Tournament match identifier (links to initiation)
- `lane`: Dartboard lane number (for validation)
- `gameType`: Starting score that was played (`301`, `501`, `701`, `1001`)
- `outRule`: Finish rule that was enforced (`straight`, `double`, `master`)
- `winner`/`loser`: Player IDs, names, and legs won
- `stats`: Keyed by player ID for accurate mapping
  - `highOut`: Highest checkout value (null if none)
  - `tons`: Array of 100+ scores
  - `shortLegs`: Array of dart counts for legs ≤15 darts
  - `legs180`: Array of leg numbers where 180 was scored
  - `average`: 3-dart average for entire match
- `timestamp`: Unix timestamp (milliseconds) for audit trail

**Stats Format Notes:**
- Uses player IDs as keys (not player1/player2) to prevent assignment errors
- Arrays allow multiple achievements per match
- `legs180` and `shortLegs` use leg numbers for detailed tracking
- `null` values allowed for achievements not earned

---

## Chalker App UI Design

### Home Screen

```
┌─────────────────────────────────┐
│      Darts Chalker              │
├─────────────────────────────────┤
│                                  │
│   [📷 Scan Match QR Code]        │
│                                  │
│   [✍️  Manual Match Entry]       │
│                                  │
│                                  │
│   RECENT MATCHES                 │
│   (from localStorage)            │
│                                  │
│   • Lane 3: John vs Mary         │
│     (Incomplete - Resume?)       │
│                                  │
│   • Lane 5: Bob vs Alice         │
│     (Complete - View Stats)      │
│                                  │
└─────────────────────────────────┘
```

**Features:**
- Primary action: Scan QR (most common workflow)
- Manual entry fallback (if QR unavailable)
- Resume incomplete matches (resilience via localStorage)
- View completed match history (referee reference)

### Scoring Interface (Nakka N01 Style)

```
┌─────────────────────────────────────────┐
│  Lane 3: FS-2-1 (Best of 3)             │
│  John Smith vs Mary Jones               │
├─────────────────────────────────────────┤
│                                          │
│  JOHN SMITH              MARY JONES     │
│      [0]                    [1]         │  ← Legs won
│      ⬤ ON THROW                         │  ← Turn indicator
│                                          │
│  ┌─────────────┐       ┌─────────────┐  │
│  │     501     │       │     201     │  │  ← Current scores
│  └─────────────┘       └─────────────┘  │
│                                          │
│  Last throw: 100 (T20, T20, D20)        │  ← Throw history
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  [ 7 ]  [ 8 ]  [ 9 ]   [UNDO]   │   │  ← Number pad
│  │  [ 4 ]  [ 5 ]  [ 6 ]   [BUST]   │   │
│  │  [ 1 ]  [ 2 ]  [ 3 ]   [100+]   │   │
│  │  [ × ]  [ 0 ]  [ ⌫ ]   [180]    │   │
│  └──────────────────────────────────┘   │
│                                          │
│  3 darts remaining this turn            │
│                                          │
│  [Checkout: 120]  [Manual Entry]        │
│                                          │
└─────────────────────────────────────────┘
```

**Key Features:**
- **Large touch targets** - Sized for iPad finger taps (minimum 60×60px)
- **Clear turn indicator** - Visual cue showing whose throw it is
- **Score countdown** - Live 501 decrements with each dart
- **Throw history** - Shows last entered throw for verification
- **Quick action buttons:**
  - `UNDO` - Remove last dart (fix mistakes immediately)
  - `BUST` - Score went below 0 or invalid checkout
  - `100+` - Quick entry for tons (prompted for exact value)
  - `180` - One tap for maximum score
  - `Checkout: X` - Shows valid checkout reminder
- **Manual Entry** - Escape hatch for unusual scoring situations
- **Auto-save to localStorage** - Every dart scored persists immediately

**Scoring Logic:**
- 3 darts per turn (countdown shown)
- Configurable starting score (301, 501, 701, 1001) from initiation QR
- Automatic bust detection based on out rule (straight/double/master)
- Automatic leg completion on valid checkout
- Turn alternates between players
- Stats tracked invisibly in background

### Match Complete Summary Screen

**See "Match Completion Workflow" section above for full mockup**

**Critical Features:**
- ✅ **Complete stats display** - Referee verifies accuracy before sending
- ✅ **Large QR code** - Easy scanning from 1-2 feet away
- ✅ **Visual confirmation** - Both players' achievements listed
- ✅ **Copy to Clipboard fallback** - If QR scan fails
- ✅ **Clear completion indicator** - "MATCH COMPLETE!" heading
- ✅ **Match identification** - Lane, matchId, players clearly shown

**Why Stats Display is Critical:**
- **Trust/verification** - Referee sees what data will be sent
- **Catch errors** - Spot obvious mistakes before submitting
- **Transparency** - Both referee and players see final stats
- **Confidence** - Manager trusts data is accurate when scanning

---

## Tournament Manager Integration

### Config Page - Game Type Configuration

**New section added to Config page for x01 game settings:**

```
┌─────────────────────────────────────┐
│ GAME TYPE CONFIGURATION             │
├─────────────────────────────────────┤
│                                     │
│ Default Game Type: [501 ▼]         │
│   (301, 501, 701, 1001)            │
│                                     │
│ Default In Rule: [Straight ▼]      │
│   (Straight In, Double In)         │
│                                     │
│ Default Out Rule: [Double ▼]       │
│   (Straight Out, Double Out,       │
│    Master Out)                     │
│                                     │
│ [Save Game Settings]                │
└─────────────────────────────────────┘
```

**Implementation:**
- Global default applied to all matches in tournament
- Stored in `globalConfig.gameRules` (localStorage)
- Standard tournament format: 501, Straight In, Double Out
- League/fast formats: 301, Straight In, Double Out
- Practice/casual: Any combination

**Data Structure:**
```javascript
globalConfig.gameRules = {
  defaultGameType: 501,    // 301, 501, 701, 1001
  defaultInRule: 'straight',  // 'straight', 'double', 'master'
  defaultOutRule: 'double'    // 'straight', 'double', 'master'
};
```

**Validation on completion QR scan:**
- Tournament verifies `gameType` and `outRule` match expectations
- Displays on receipts: "Game: 501 (Double Out)"
- Shows in results: "John Smith (501 DO)"
- Prevents disputes about what format was played

### Match Controls Enhancements

**New Buttons in Match Card:**

**For READY matches:**
```
┌────────────────────────────────┐
│ FS-2-1: John Smith vs Mary J.  │
│ READY                          │
├────────────────────────────────┤
│ Lane: [3 ▼]  Ref: [Bob ▼]      │
│                                │
│ [Start Match]  [Start on iPad] │  ← NEW BUTTON
└────────────────────────────────┘
```

**On "Start on iPad" click:**
- Opens modal with match initiation QR code
- Shows match details for verification
- Includes "Copy to Clipboard" fallback
- Marks match as LIVE when iPad scans QR (optional status tracking)

**New Global Button:**
```
[📷 Scan Match Result]  ← NEW BUTTON (top of Match Controls)
```

**On "Scan Match Result" click:**
- Opens camera for QR scanning
- OR provides "Paste from Clipboard" option
- Validates matchId and processes completion
- Shows success confirmation

### Enhanced Match Card Display

**For LIVE matches started on iPad:**
```
┌────────────────────────────────┐
│ FS-2-1: John Smith vs Mary J.  │
│ 🔴 LIVE (iPad - Lane 3)        │  ← iPad indicator
├────────────────────────────────┤
│ Started: 14:23                 │
│                                │
│ [Stop Match]  [Complete Manual]│
└────────────────────────────────┘
```

**iPad indicator benefits:**
- Shows which matches are being digitally chalked
- Helps manager identify which iPad to look for
- Differentiates from matches started via "Start Match" button (non-iPad)

### Transaction Types

**Existing (v3.0):**
- `COMPLETE_MATCH` - Match result and progression
- `START_MATCH` - Match marked as live
- `STOP_MATCH` - Match unmarked from live
- `ASSIGN_LANE` - Lane assigned to match
- `ASSIGN_REFEREE` - Referee assigned to match

**New (v3.1+):**
- `SYNC_STATS_FROM_CHALKER` - Stats imported from iPad QR code

**Transaction Example:**
```javascript
{
  id: 169,
  type: 'SYNC_STATS_FROM_CHALKER',
  matchId: 'FS-2-1',
  description: 'FS-2-1: Stats synced from iPad (Lane 3)',
  timestamp: 1729125678901,
  data: {
    lane: 3,
    statsSource: 'chalker-qr',
    qrTimestamp: 1729125678850
  }
}
```

**Why separate transaction type:**
- Distinguishes iPad-sourced stats from manual entry
- Enables filtering/analysis (how many matches digitally chalked?)
- Preserves audit trail for debugging
- Supports future features (e.g., "Show only iPad matches")

---

## Error Handling & Edge Cases

### QR Code Scanning Failures

**Scenario: Camera doesn't work or QR won't scan**

**Fallback: Clipboard Transfer**
1. Tournament Manager: Click "Copy to Clipboard" below QR code
2. Referee: Tap "Paste from Clipboard" on iPad
3. JSON text pasted into text field
4. Parse and process identically to QR scan

**Fallback: Manual Entry**
- Tournament Manager: "Complete Match Manually" button (existing v3.0 workflow)
- Chalker App: "Manual Match Entry" on home screen (bypass QR entirely)

**Result:** QR is primary, but never blocks operation

### Match Initiation Errors

**Scenario: iPad already has active match**
```javascript
if (localStorage.getItem('currentMatch')) {
  alert('⚠️ Match already in progress.\n\n' +
        'Complete or cancel current match before starting new match.');
  return;
}
```

**Options shown:**
- Resume current match
- Cancel current match (requires confirmation)
- Reject new QR scan

**Scenario: Wrong QR code scanned**
```javascript
if (qrData.type !== 'INIT_MATCH') {
  alert('❌ Invalid QR code.\n\n' +
        'Expected: Match Initiation\n' +
        'Received: ' + qrData.type);
  return;
}
```

### Match Completion Errors

**Scenario: matchId doesn't exist**
```javascript
const match = matches.find(m => m.id === resultData.matchId);

if (!match) {
  alert('❌ Unknown match: ' + resultData.matchId + '\n\n' +
        'This match does not exist in the tournament.\n' +
        'Check QR code or enter manually.');
  return;
}
```

**Scenario: Match already completed**
```javascript
if (match.completed) {
  const overwrite = confirm(
    '⚠️ Match ' + resultData.matchId + ' already completed.\n\n' +
    'Existing winner: ' + match.winner + '\n' +
    'New winner: ' + resultData.winner.name + '\n\n' +
    'Overwrite existing result?'
  );

  if (!overwrite) return;
}
```

**Scenario: Player IDs don't match**
```javascript
const expectedPlayers = [match.player1, match.player2];
const receivedPlayers = [resultData.winner.id, resultData.loser.id];

if (!arraysMatch(expectedPlayers, receivedPlayers)) {
  alert('❌ Player mismatch detected.\n\n' +
        'Expected: ' + getPlayerName(match.player1) +
        ' vs ' + getPlayerName(match.player2) + '\n' +
        'Received: ' + resultData.winner.name +
        ' vs ' + resultData.loser.name + '\n\n' +
        'Cannot import. Check QR code or enter manually.');
  return;
}
```

### Device Failures

**Scenario: iPad crashes mid-match**

**Recovery via localStorage:**
```javascript
// On app relaunch, check for incomplete match
window.addEventListener('load', () => {
  const currentMatch = localStorage.getItem('currentMatch');
  const matchProgress = localStorage.getItem('matchProgress');

  if (currentMatch && matchProgress) {
    const match = JSON.parse(currentMatch);

    const resume = confirm(
      '⚠️ Incomplete match found.\n\n' +
      match.player1.name + ' vs ' + match.player2.name + '\n' +
      'Lane ' + match.lane + ': ' + match.matchId + '\n\n' +
      'Resume this match?'
    );

    if (resume) {
      restoreMatch(currentMatch, matchProgress);
    } else {
      // Clear and start fresh
      localStorage.removeItem('currentMatch');
      localStorage.removeItem('matchProgress');
    }
  }
});
```

**Scenario: iPad battery dies**
- Referee notes score on paper (traditional backup)
- Tournament manager enters manually (existing v3.0 workflow)
- No data loss beyond current match

**Scenario: iPad stolen/broken**
- Grab different iPad (any iPad works)
- Tournament manager generates new initiation QR
- Scan with replacement iPad
- Continue tournament

**Result:** Device failures don't stop tournament

### Network Failures (Future-Proofing)

**If network sync added in v4.0+:**
- QR code workflow remains available as fallback
- If WebSocket connection drops, app automatically switches to QR mode
- Referee sees "⚠️ Offline - Use QR Code" indicator
- No functionality lost

---

## Development Plan

### Target Timeline: Q2 2026 (April-June)

**Phase 1: Foundation (Jan 2026)**
- Research QR code libraries (qrcode.js for generation, jsQR for scanning)
- Set up chalker app project structure
- Test camera API on iPads (Safari compatibility)
- Prototype QR encode/decode with sample data
- **Deliverable:** Can encode match data to QR and decode on iPad

**Phase 2: Chalker App UI (Feb-Mar 2026)**
- Build Nakka N01-style scoring interface
- Implement x01 scoring logic (configurable 301/501/701/1001, countdown, bust detection, checkout validation)
- Support multiple checkout rules (straight out, double out, master out)
- Add leg tracking and turn management
- Build number pad with large touch targets
- Implement localStorage persistence (auto-save every dart)
- Add undo functionality
- Test with real iPads at venue
- **Deliverable:** Fully functional offline chalker (no QR integration yet)

**Phase 3: Match Initiation (Mar 2026)**
- Tournament Manager: Generate initiation QR in Match Controls
- Tournament Manager: Display QR modal with match details
- Chalker App: Implement QR scanning with camera
- Chalker App: Load match from scanned QR data
- Add clipboard fallback (copy/paste JSON)
- **Deliverable:** End-to-end match initiation via QR

**Phase 4: Statistics & Completion (Apr 2026)**
- Chalker App: Automatic stat tracking (tons, 180s, high outs, short legs, averages)
- Chalker App: Build match summary screen with stats display
- Chalker App: Generate completion QR code
- Tournament Manager: Implement QR scanning for results
- Tournament Manager: Parse and validate completion data
- Tournament Manager: Create SYNC_STATS_FROM_CHALKER transaction
- Tournament Manager: Process match completion (existing v3.0 logic)
- **Deliverable:** End-to-end digital chalking with stats

**Phase 5: Testing & Polish (May 2026)**
- Test with multiple iPads simultaneously
- Test all error scenarios (wrong QR, duplicate completion, etc.)
- Referee usability testing (get feedback from actual referees)
- UI refinement based on feedback
- Edge case handling (crashes, battery, interruptions)
- Documentation and training materials
- **Deliverable:** Production-ready system

**Phase 6: Soft Launch (Jun 2026)**
- Deploy to Monday tournaments
- Monitor success rate and gather feedback
- Fix any discovered issues
- Iterate on UI/UX based on real-world use
- **Deliverable:** v3.1 release with digital chalking

### Technical Dependencies

**JavaScript Libraries (Tiny, Zero External Dependencies):**
- **qrcode.js** (~10KB) - QR code generation
  - Used by: Tournament Manager + Chalker App
  - License: MIT
  - CDN or local: Local copy (offline-first principle)

- **jsQR** (~45KB) - QR code scanning
  - Used by: Tournament Manager + Chalker App
  - License: Apache 2.0
  - CDN or local: Local copy (offline-first principle)

**Browser APIs:**
- Camera API (`navigator.mediaDevices.getUserMedia`) - Optional, clipboard fallback available
- Clipboard API (`navigator.clipboard`) - Fallback for QR scanning
- localStorage - Already heavily used in v3.0

**Hardware:**
- iPads (club already owns)
- iPad charging stations (recommended)
- Protective cases for iPads (recommended)

### Development Complexity Estimate

**Lines of Code (Estimated):**
- QR generation/scanning infrastructure: ~100 lines
- Chalker App UI (scoring interface): ~400 lines
- Chalker App logic (501 scoring, stats): ~300 lines
- Tournament Manager integration: ~150 lines
- Error handling & edge cases: ~100 lines
- **Total: ~1,050 lines of new code**

**Compare to network approach: ~5,000+ lines**

**Development Time (Estimated):**
- With v3.0 development intensity: 6-8 weeks
- With "more relaxed" approach: 12-16 weeks
- **Q2 2026 target: Easily achievable**

---

## Testing Strategy

### Unit Testing (Manual)

**QR Code Encode/Decode:**
- Generate initiation QR → scan on iPad → verify data matches
- Generate completion QR → scan on computer → verify data matches
- Test with long player names (Unicode characters)
- Test with maximum stats (lots of tons, 180s, etc.)
- Verify QR size stays scannable (data compression if needed)

**Scoring Logic:**
- Configurable game types (301, 501, 701, 1001)
- Multiple checkout rules (straight out, double out, master out)
- Valid checkouts (all doubles 2-170 for double out)
- Bust scenarios (< 0, odd number on double if double out, 1 remaining)
- Leg completion and turn switching
- Undo across leg boundaries
- Stats accumulation across multiple legs

**localStorage Persistence:**
- Score dart → crash app → relaunch → verify resume works
- Complete leg → crash → resume → verify leg score preserved
- iPad goes to sleep → wake → verify match still active

### Integration Testing

**End-to-End Workflows:**
1. Create tournament → generate bracket → start match on iPad → score match → scan result QR → verify bracket progression
2. Start match on iPad → iPad crashes → resume → complete match → verify stats accurate
3. Start match on iPad → QR scan fails → use clipboard fallback → verify same result
4. Start match on iPad → iPad dies → manual entry → verify tournament continues

**Multi-iPad Testing:**
- 3 matches on 3 iPads simultaneously
- Complete in different orders
- Verify no cross-contamination
- Verify tournament processes all correctly

**Error Scenarios:**
- Scan wrong QR code (expect clear error message)
- Complete same match twice (expect confirmation dialog)
- Scan result for non-existent match (expect rejection)
- Player IDs don't match (expect validation error)

### User Acceptance Testing

**Referee Testing (Critical):**
- Recruit 3-5 referees (mix of experienced/inexperienced)
- Give them test match to score on iPad
- Observe:
  - Do they understand the interface?
  - Where do they get confused?
  - How long does it take to complete a match?
  - Do they trust the stats summary?
  - Would they prefer this over paper/chalkboard?
- Iterate UI based on feedback

**Tournament Manager Testing:**
- Test scanning QR codes in sports bar lighting (sometimes dark)
- Test from various distances (1-3 feet)
- Test with iPad at different angles
- Verify clipboard fallback is easy to use

### Performance Testing

**Battery Life:**
- Run full tournament (20+ matches) on single iPad charge
- Measure battery drain per match
- Verify iPads can last full tournament night

**localStorage Limits:**
- Store 50+ completed matches in iPad localStorage
- Verify no performance degradation
- Test localStorage size limits (should be far from limit)

**Camera Performance:**
- Test QR scanning speed (should be < 2 seconds)
- Test in various lighting conditions
- Test with different QR sizes

---

## Future Enhancements (v4.0+)

### Optional Network Sync

**If discovered to be needed:**
- Add WebSocket connection as **optional enhancement**
- Automatic result sync when network available
- QR codes remain as fallback if network fails
- Backwards compatible with v3.1 QR-only workflow

**Decision criteria:**
- Do referees request real-time sync?
- Is QR scanning proving cumbersome?
- Do we want overview displays (separate feature)?

**Current assessment:** QR workflow likely sufficient, network may never be needed

### Overview Displays

**Large screens showing tournament state:**
- Current matches in progress
- Next matches ready to start
- Recent results
- Bracket progression visualization

**Separate feature from digital chalking:**
- Can be implemented with/without iPad chalking
- Would use WebSocket if implemented
- Read-only displays (no write operations)

**Timeline:** Not planned, only if requested by club

### Extended Statistics

**Additional tracking possibilities:**
- Dart-by-dart tracking (every single dart scored)
- Checkout percentage (attempts vs successes)
- First-9 averages (scoring ability metric)
- Per-leg statistics (leg-by-leg breakdown)

**Challenges:**
- More complexity for referees
- Longer match scoring time
- Larger data payloads in QR codes

**Decision:** Start with essential stats, expand only if requested

### Multi-Language Support

**If tournament attracts international participants:**
- Chalker App UI in multiple languages
- Number pad remains universal (digits are digits)
- Match summary translatable

**Effort:** Low (just UI strings)
**Priority:** Not planned unless needed

---

## Comparison to Alternatives

### Manual Chalking (Current v3.0)

**Advantages:**
- ✅ Zero technology required
- ✅ Familiar to all referees
- ✅ No device failures

**Disadvantages:**
- ❌ Transcription errors common
- ❌ Statistics often forgotten/incomplete
- ❌ Time-consuming manual entry
- ❌ Hard to track averages/complex stats
- ❌ Difficult in noisy sports bar environment

### Network-Synced Digital Chalking

**Advantages:**
- ✅ Real-time updates (marginal value)
- ✅ "Feels modern"
- ✅ Could enable overview displays (separate feature)

**Disadvantages:**
- ❌ 10x development complexity
- ❌ WebSocket relay infrastructure required
- ❌ WiFi dependency (failure mode)
- ❌ Connection state management
- ❌ Concurrent write issues
- ❌ Harder to debug
- ❌ More referee training needed
- ❌ 3+ months development time

### QR Code Digital Chalking (Planned v3.1)

**Advantages:**
- ✅ Eliminates transcription errors
- ✅ Complete, accurate statistics
- ✅ Fast data transfer (2 seconds)
- ✅ Zero network dependencies
- ✅ Simple, foolproof workflow
- ✅ Any iPad can score any match
- ✅ Works offline with localStorage resilience
- ✅ Visual verification (referee sees stats before sending)
- ✅ 6-8 weeks development time
- ✅ Easy maintenance

**Disadvantages:**
- ❌ Requires iPads (club already owns)
- ❌ Not "real-time" (doesn't matter - no value in real-time for this use case)
- ❌ Requires camera or clipboard (both widely available)

**Winner:** QR code approach (95% of value, 20% of complexity)

---

## Success Metrics

### Adoption Rate
- **Target:** 80%+ of matches scored on iPad within 2 months of launch
- **Measure:** Count `SYNC_STATS_FROM_CHALKER` transactions vs total matches
- **Fallback:** If < 50% after 3 months, investigate why (UI issues? referee resistance?)

### Data Quality
- **Target:** 100% of iPad-scored matches have complete stats (tons, 180s, averages, high outs)
- **Measure:** Audit match stats completeness
- **Compare:** Manual entry completeness (currently ~60% from estimate)

### Time Savings
- **Target:** 50% reduction in time between "match ends" and "result entered"
- **Baseline:** Manual entry ~2-3 minutes (verbal communication + typing)
- **Goal:** QR scan ~30 seconds (show QR + scan + process)

### Error Rate
- **Target:** < 1% error rate in stats (vs estimated 10-15% manual transcription errors)
- **Measure:** Referees reporting "that stat is wrong" after reviewing summary
- **Validation:** Compare leg scores to tournament results for consistency

### Referee Satisfaction
- **Survey after 1 month:** "Do you prefer iPad chalking or manual?"
- **Target:** 80%+ prefer iPad
- **If < 50%:** Investigate UI/UX issues, iterate

### System Reliability
- **Target:** 99%+ successful QR scans (primary + clipboard fallback)
- **Measure:** Track scan failures reported by users
- **Fallback:** Manual entry always available (0% blocking issues)

---

## Risks & Mitigations

### Risk: Referees Resist Using iPads

**Likelihood:** Low (referees are requesting this)
**Impact:** High (feature unused)

**Mitigation:**
- Early referee involvement in UI design
- Simple, intuitive interface (Nakka N01 proven pattern)
- Training session before launch
- Champions program (get 2-3 referees excited, they influence others)
- Gradual rollout (optional at first, observe adoption)

### Risk: iPad Battery/Hardware Failures

**Likelihood:** Medium (devices fail)
**Impact:** Low (manual entry fallback)

**Mitigation:**
- Charging stations at venue
- Protective cases for iPads
- Backup iPads available (club owns multiple)
- Manual entry workflow unchanged (instant fallback)

### Risk: QR Codes Don't Scan Reliably

**Likelihood:** Low (QR is proven tech)
**Impact:** Medium (friction in workflow)

**Mitigation:**
- Test in venue lighting conditions
- Optimize QR size for scanability
- Clipboard fallback always available
- jsQR library is mature and reliable

### Risk: Development Takes Longer Than Expected

**Likelihood:** Medium (software projects often slip)
**Impact:** Low (not time-critical)

**Mitigation:**
- Q2 2026 target is conservative (6 months away)
- Incremental development (can ship partial features)
- No external dependencies causing delays
- Scope can be reduced if needed (e.g., defer some stats)

### Risk: Data Privacy/GDPR Concerns

**Likelihood:** Low (no external data transmission)
**Impact:** Low (local data only)

**Mitigation:**
- All data stored locally (tournament computer localStorage)
- No cloud services, no external servers
- No data transmitted over internet
- Players consent to stats tracking (tournament registration)

---

## Open Questions

### Technical

1. **QR Code Size Limits:**
   - How much data can fit in scannable QR code?
   - Need compression for large stat payloads?
   - **Resolution:** Test with maximum stats scenario, optimize if needed

2. **Safari Camera API Support:**
   - Does Safari on iPad support `getUserMedia` reliably?
   - Fallback to clipboard sufficient?
   - **Resolution:** Test early in Phase 1, confirm compatibility

3. **iPad Home Screen Web App:**
   - Should chalker app be installable (PWA)?
   - Offline service worker needed?
   - **Resolution:** Nice-to-have, not required for v3.1

### UX/Workflow

1. **Match Summary Verbosity:**
   - Show every ton value or just count?
   - Show leg-by-leg breakdown or totals only?
   - **Resolution:** User testing in Phase 5 will inform

2. **Undo Scope:**
   - Can referee undo across leg boundaries?
   - Can referee undo completed match?
   - **Resolution:** Yes for legs, no for completed matches (export QR = final)

3. **iPad Assignment:**
   - One iPad per lane permanently, or grab any iPad?
   - Label iPads "Lane 1", "Lane 2" or keep generic?
   - **Resolution:** Keep generic (QR determines lane), more flexible

### Operational

1. **Charging Strategy:**
   - Charge iPads between matches or overnight only?
   - USB charging station or individual chargers?
   - **Resolution:** Depends on venue setup, test battery life

2. **Training Requirements:**
   - Formal training session or learn-by-doing?
   - Printed quick-start guide or digital only?
   - **Resolution:** Both - brief training + laminated guide at lanes

3. **Fallback Frequency:**
   - How often will manual entry be needed?
   - Should we track fallback usage to identify issues?
   - **Resolution:** Yes, track via transaction types for improvement insights

---

## Optional Enhancement: Thermal Receipt Printing

### Overview

While QR codes displayed on screens are the primary workflow, **thermal receipt printers** offer an optional enhancement that combines physical documentation with digital efficiency.

**Status:** Post-v3.1 consideration (v3.2+)
**Cost:** $60-120 for WiFi/Bluetooth thermal printer + ~$0.05-10 per receipt
**Benefit:** Physical match records, player keepsakes, tournament archives

### Why Thermal Printing is Brilliant

**QR codes aren't just for screen display - they're printable too:**

- ✅ **Self-contained data** - QR code on paper = complete match record
- ✅ **Human + machine readable** - Print stats as text AND QR code on same receipt
- ✅ **Physical + digital hybrid** - Screen scanning primary, printing optional
- ✅ **Graceful degradation** - Printer broken? Use screen. Screen busy? Print ahead.
- ✅ **Physical archival** - Stack of receipts = complete tournament backup

**The key insight:** QR codes ARE the data format, not just a transport mechanism. Printed receipts become a physical archive that's machine-readable years later.

### Use Cases

#### 1. Match Initiation Receipts

**Workflow:**
1. Tournament manager clicks "Start on iPad"
2. Optional: Click "Print Receipt"
3. Thermal printer outputs match initiation QR
4. Referee grabs printed receipt
5. Scans QR from paper (not screen)
6. Keeps receipt for match documentation

**Benefits:**
- Queue multiple matches (print 3-4 receipts ahead)
- No waiting for manager's screen
- Referee has physical reference
- Paper backup if iPad scanning fails

**Receipt Format (58mm thermal paper):**
```
================================
   NEWTON DC DARTS CLUB
================================
MATCH START

Match: FS-2-1 (Frontside Round 2)
Lane: 3
Format: Best of 3 legs
Game: 501 (Double Out)

John Smith
    vs
Mary Jones

[QR CODE]

Scan with iPad to begin
================================
Time: 20:30
```

#### 2. Match Completion Receipts (Player Keepsakes)

**Workflow:**
1. iPad generates completion QR
2. Manager scans QR (imports to tournament)
3. Manager clicks "Print Player Receipt"
4. Two receipts print automatically:
   - One for tournament archive
   - One for player/referee

**Benefits:**
- Players get professional memento
- Physical proof of achievements (180, high out, etc.)
- Referee has paper backup
- Tournament archive builds automatically

**Receipt Format:**
```
================================
   YOUR MATCH STATISTICS
================================
John Smith
Match: FS-2-1 (Frontside Round 2)
Game: 501 (Double Out)
Date: 2026-04-15  Time: 20:45

RESULT: WIN (2-1 vs Mary Jones)

YOUR STATS:
✓ High Out: 120
✓ Tons: 2 (100, 140)
✓ 180s: 1 (Leg 2)
✓ Average: 78.5

TOURNAMENT STANDING:
Current Rank: 3rd
Next Match: Semifinals (Lane 5)

[QR CODE]
Scan to verify stats

================================
   NewTon DC Darts Club
================================
```

#### 3. Physical Tournament Archive

**End of tournament:**
- Stack of thermal receipts (one per match)
- Each has match stats + QR code
- Rubber-band together, file in archive box
- Physical records that are machine-readable

**Years later:**
- "Who won the 2026 Spring Tournament?"
- Pull out receipt stack
- Scan Grand Final QR code
- Import to computer
- See complete bracket + stats

**This is physical blockchain.** Each receipt is a tamper-evident record with embedded data.

### Printer Options

#### Budget WiFi Thermal Printers ($80-120)
- **MUNBYN WiFi Receipt Printer** - $89
  - 58mm thermal paper
  - WiFi + USB connectivity
  - Works with any device on network
  - Browser print API compatible

- **POLONO Thermal Printer** - $99
  - WiFi + Bluetooth + USB (triple connectivity)
  - 58mm paper, fast printing
  - Works with phones/tablets/computers

- **Xprinter XP-365B** - $110
  - Dedicated WiFi model
  - High reliability
  - HTTP API available (some models)

#### Bluetooth Options ($60-80)
- Portable, no WiFi needed
- Pairs with tournament computer or iPad
- Smaller form factor
- Slightly less reliable than WiFi

### Implementation

**Browser Print API (Simple):**
```javascript
function printMatchReceipt(matchData, qrCodeDataURL) {
  const printWindow = window.open('', '', 'width=300,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <style>
          body {
            font-family: monospace;
            font-size: 12px;
            width: 58mm;
          }
          .qr {
            text-align: center;
            margin: 10px 0;
          }
          .center { text-align: center; }
          .separator {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <strong>NEWTON DC DARTS CLUB</strong>
        </div>
        <div class="separator"></div>

        <p><strong>Match:</strong> ${matchData.matchId}</p>
        <p><strong>Lane:</strong> ${matchData.lane}</p>
        <p>${matchData.player1.name} vs ${matchData.player2.name}</p>

        <div class="qr">
          <img src="${qrCodeDataURL}" width="200">
        </div>

        <div class="center">
          <small>Scan with iPad to begin</small>
        </div>
        <div class="separator"></div>
        <div class="center">
          <small>Time: ${new Date().toLocaleTimeString()}</small>
        </div>
      </body>
    </html>
  `);

  printWindow.print();
  printWindow.close();
}
```

**That's it.** ~30 lines of code. Browser handles the rest.

### Cost Analysis

**Initial Setup:**
- WiFi thermal printer: $90
- 10 rolls of 58mm thermal paper: $20
- **Total: $110**

**Per-Tournament Cost:**
- 62 matches (32-player tournament)
- ~2 receipts per match (initiation + 2× completion)
- 124 receipts × $0.05/receipt = **$6.20 per tournament**

**ROI:**
- Manual stat entry time saved: 62 matches × 2 min = 124 minutes
- Professional appearance for players: Priceless
- Physical tournament archive: Priceless
- **Payback: Instant**

### Extreme Ideas (Brainstorm)

These are intentionally over-the-top to explore the possibility space. The pendulum will swing back to something practical.

#### 1. Referee Belt Printer
**Concept:** Tiny Bluetooth printer clips to referee belt ($60)

**Workflow:**
- iPad completes match
- Prints receipt wirelessly to belt printer
- Referee hands receipt to player immediately

**Pros:** Players get instant physical stats
**Cons:** Referee looks like traffic cop
**Verdict:** Too much, but instant receipt idea is good

#### 2. Lane-Mounted Printers
**Concept:** Small printer at each dartboard ($800 for 8 printers)

**Workflow:**
- iPad completes match → auto-prints to lane printer
- Receipt drops into tray
- Fully automated

**Pros:** Zero manager involvement
**Cons:** Expensive, over-engineered
**Verdict:** Overkill unless running daily tournaments

#### 3. QR Badge System
**Concept:** Print QR badge at player check-in

**Workflow:**
- Player registers → print thermal badge with player ID QR
- Player wears badge
- iPad scans badge to confirm identity

**Pros:** Zero typing, instant player verification
**Cons:** Solving problem that doesn't exist
**Verdict:** Cool, but unnecessary

#### 4. Giant Bracket Poster
**Concept:** Wall-mounted poster with QR grid

**Workflow:**
- Print entire bracket as grid of QR codes
- Players scan any match with phone to see details
- Interactive bracket display without screens

**Pros:** Extremely cool, zero electricity
**Cons:** Requires large-format printer
**Verdict:** Visionary, probably too ambitious

### Where the Pendulum Settles

**Prediction: One WiFi printer, optional receipts**

**v3.1 (Q2 2026):**
- Ship QR on screens (no printer)
- Prove the workflow works

**v3.2 (Q3 2026):**
- Add one WiFi thermal printer at tournament desk
- "Print Player Receipt" button (optional)
- Hand receipts to players as keepsakes

**Why this is perfect:**
- Players love physical proof of their 180s
- Professional tournament feel
- Optional (doesn't block operation)
- Low cost ($90 printer + $6/tournament)
- 5 lines of code (browser print API)

**Not too extreme (belt printers), not too minimal (screen only), but perfectly practical.**

### Network Topology (WiFi Printer)

```
Tournament Computer ──┐
                      │
iPad 1 ──────────────┤
iPad 2 ──────────────├── Local WiFi Network
iPad 3 ──────────────┤
                      │
WiFi Thermal Printer ─┘
```

**All devices can print:**
- Tournament computer prints initiation QRs
- Tournament computer prints completion receipts (after scanning iPad QR)
- iPads could print directly (but unnecessary - manager handles completion)

**Zero infrastructure beyond WiFi already present at venue.**

### Integration Points

**Tournament Manager (Match Controls):**
```
[Start on iPad] → Modal opens with QR
                  ↓
              [Print Receipt] button (optional)
                  ↓
              Thermal receipt prints
```

**Tournament Manager (After scanning completion QR):**
```
Scan completion QR → Import stats
                     ↓
                 [Print Player Receipt] button (optional)
                     ↓
                 Two receipts print:
                   - Tournament archive
                   - Player keepsake
```

### Future Possibilities

**If thermal printing proves popular:**

1. **Auto-print completion receipts** (no button click needed)
2. **Print match queue** (print next 3 matches for efficiency)
3. **Player stat cards** (end-of-tournament summary for each player)
4. **Tournament summary sheet** (bracket + final standings)

**But start simple:** One printer, manual print button, optional workflow.

### Why This Enhancement Works

**It leverages the core insight:**

QR codes aren't just digital - **they're printable data**. The same QR code that displays on screen can print on paper. The physical receipt becomes a permanent, machine-readable record.

**This is the hybrid solution:**
- Primary: Screen → scan (fast, zero cost)
- Optional: Print → scan (physical record, player delight)
- Fallback: Clipboard paste (if camera fails)
- Ultimate fallback: Manual entry (if iPad fails)

**Four layers of resilience, each building on the last.**

### Timeline

**Don't implement yet. Wait for v3.1 to prove QR workflow first.**

**After v3.1 ships and runs successfully:**
1. Buy $90 WiFi printer (low risk investment)
2. Add "Print Receipt" buttons (5 LOC)
3. Test in one tournament
4. Evaluate player response
5. If positive: Make it standard
6. If meh: Keep as option but don't emphasize

**Let real-world use inform whether printing adds value or just complexity.**

---

## Conclusion

**Digital Chalking via Bidirectional QR Codes** is the right solution for NewTon DC Tournament Manager's next phase of evolution.

**Why it's the right choice:**
- ✅ Solves the real problem (accurate stats, zero transcription errors)
- ✅ Maintains core principles (offline-first, zero dependencies, bulletproof resilience)
- ✅ Simpler than alternatives (1/10th the complexity of network sync)
- ✅ Perfect for use case (sports bar chaos, inexperienced chalkers)
- ✅ Achievable timeline (Q2 2026 realistic)
- ✅ Low maintenance burden (no infrastructure)
- ✅ Upgradeable future (can add network in v4.0+ if needed)

**The bidirectional QR approach is elegant because:**

**It's not a compromise.**
It's not "good enough for now."
It's not "we'll do it properly later."

**It's the RIGHT solution.**

---

**Status:** Planned for v3.1 release in Q2 2026
**Dependencies:** qrcode.js, jsQR (both tiny, zero external dependencies)
**Prerequisites:** v3.0.0 stable and deployed
**Next Steps:** Phase 1 planning and library research (Jan 2026)

**Document Version:** 1.0
**Last Updated:** October 18, 2025
**Author:** Havard Skrodahl
