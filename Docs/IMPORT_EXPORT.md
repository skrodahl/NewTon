# Import/Export Documentation

**NewTon DC Tournament Manager - Tournament Data Management**

Version: 4.0.0

## Overview

The NewTon DC Tournament Manager uses a JSON-based import/export system for tournament data portability. Starting with version 4.0, the system implements per-tournament history storage to ensure data integrity and proper transaction history isolation.

**Key Principles:**
- **Complete Data Portability**: Export includes all tournament data, history, and player snapshots
- **Version Validation**: Import validates export format version for compatibility
- **Per-Tournament Isolation**: Each tournament maintains its own transaction history
- **Idempotent Imports**: Importing the same file multiple times produces consistent results
- **Backwards Compatible**: Automatic migration from pre-4.0 formats (tournament data preserved, history starts fresh)

---

## Export Format v4.0

### File Structure

Tournaments are exported as JSON files with the following naming convention:
```
{TournamentName}_{YYYY-MM-DD}.json
```

### Export JSON Schema

```json
{
  "exportVersion": "4.0",
  "id": 1761554559925,
  "name": "Tournament Name",
  "date": "2025-10-27",
  "created": "2025-10-27T08:42:39.925Z",
  "status": "setup|active|completed",
  "bracketSize": 8|16|32,
  "readOnly": false,
  "players": [...],          // Array of player objects (see Player Object Structure)
  "matches": [...],          // Array of match objects (see Match Object Structure)
  "bracket": [...],          // Ordered array of players for bracket seeding
  "placements": {...},       // Map of playerID to final placement rank
  "history": [...],          // Array of transaction objects (see Transaction History)
  "playerList": [...],       // Simple array of player name strings
  "exportedAt": "2025-10-27T08:45:46.347Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exportVersion` | string | Yes | Export format version (must be "4.0") |
| `id` | number | Yes | Unique tournament identifier (timestamp) |
| `name` | string | Yes | Tournament name |
| `date` | string | Yes | Tournament date (YYYY-MM-DD format) |
| `created` | string | Yes | ISO 8601 timestamp of tournament creation |
| `status` | string | Yes | Tournament status: "setup", "active", or "completed" |
| `bracketSize` | number | Yes | Bracket size (8, 16, or 32) |
| `readOnly` | boolean | Yes | Read-only flag (true for completed tournaments) |
| `players` | array | Yes | Array of player objects |
| `matches` | array | Yes | Array of match objects |
| `bracket` | array | No | Bracket structure (null if not generated) |
| `placements` | object | No | Final placements (empty if tournament not finished) |
| `history` | array | Yes | Per-tournament transaction history |
| `playerList` | array | Yes | Simple array of player name strings (snapshot of saved players database) |
| `exportedAt` | string | Yes | ISO 8601 timestamp of export |

### playerList Field Format

The `playerList` field contains a **simple array of player name strings** (not full player objects):

```json
"playerList": [
  "John",
  "Adam",
  "Chris",
  "Edmond",
  "Henry",
  "James",
  "Tom",
  "Andy",
  "Ron"
]
```

This is a snapshot of the "Saved Players" database at the time of export. It allows tournament organizers to maintain a consistent player roster across multiple tournaments. When importing, this list is restored to the saved players database.

### placements Field Format

The `placements` object maps player IDs to their final placement rank:

```json
"placements": {
  "walkover-5": 13,
  "walkover-8": 13,
  "walkover-13": 13,
  "walkover-0": 13,
  "walkover-14": 9,
  "walkover-7": 9,
  "1761554570908": 9,
  "walkover-11": 9
}
```

- **Keys**: Player IDs (can be numeric IDs or walkover IDs)
- **Values**: Placement rank (1 = winner, 2 = 2nd place, etc.)
- Tied placements share the same rank (e.g., four players tied for 9th-12th all have rank 9)
- This object is empty until players are eliminated
- When tournament completes, all players have placements (1st through last)

### Player Object Structure

Each player in the `players` array has the following structure:

```json
{
  "id": 1761554573051,
  "name": "James",
  "paid": true,
  "stats": {
    "shortLegs": [],        // Array of integers (e.g., [19, 15])
    "highOuts": [101],      // Array of checkout values >= 100
    "tons": 3,              // Number (count of 100+ scores)
    "oneEighties": 0        // Number (count of 180s)
  },
  "placement": null,        // Number (1, 2, 3, etc.) or null if not eliminated
  "eliminated": false       // Boolean
}
```

**Important Notes:**
- `shortLegs` is an **array** of integers, not a single number. The array can be empty `[]` or contain leg counts.
- `highOuts` is an array of checkout values >= 100
- `placement` is set when player is eliminated (e.g., 1 for winner, 2 for 2nd place, 9 for tied 9th-12th)
- `eliminated` flag tracks if player has been knocked out
- **Stats in the `players` array are the ONLY source of truth** for Statistics table and points calculations
- Stats are updated independently through the Player Management UI, not from match results

### Match Object Structure

Each match in the `matches` array has this comprehensive structure:

```json
{
  "id": "FS-2-1",
  "numericId": 9,
  "round": 2,
  "side": "frontside",
  "player1": {
    "id": 1761554573051,
    "name": "James",
    "paid": true,
    "stats": { /* full stats object */ }
  },
  "player2": { /* full player object or TBD player */ },
  "winner": { /* full player object or null */ },
  "loser": { /* full player object or null */ },
  "lane": 6,                    // Number (1-20) or null
  "legs": 3,                    // Number of legs (best-of)
  "referee": 1761554565121,     // Player ID or null
  "active": false,              // Boolean (currently being played)
  "completed": true,            // Boolean (match finished)
  "positionInRound": 0,         // Position within the round (0-indexed)
  "autoAdvanced": true,         // Boolean (present if completed via walkover)
  "completedAt": 1761554703660, // Timestamp (present if completed)
  "finalScore": {               // Present if completed and not walkover
    "winnerLegs": 2,
    "loserLegs": 1,
    "winnerId": 1761554566009,
    "loserId": 1761554573051
  }
}
```

**Match ID Format:**
- Frontside: `FS-{round}-{matchNumber}` (e.g., `FS-1-1`, `FS-2-3`)
- Backside: `BS-{round}-{matchNumber}` (e.g., `BS-1-1`, `BS-3-2`)
- Special: `BS-FINAL`, `GRAND-FINAL`

**Side Values:**
- `"frontside"` - Winner's bracket matches
- `"backside"` - Loser's bracket matches
- `"backside-final"` - Backside final match
- `"grand-final"` - Grand final match

**Walkover Matches:**
When a match involves a bye (walkover), the player object has:
```json
{
  "id": "walkover-0",
  "name": "Walkover",
  "isBye": true
}
```

**TBD Players (Incomplete Brackets):**
For matches not yet populated with real players:
```json
{
  "id": "fs-4-0-1",
  "name": "TBD"
}
```

**Important: Stats in Match Objects**

Match objects contain full player objects (including `stats`) in the `player1`, `player2`, `winner`, and `loser` fields. These are **historical snapshots only** and serve the following purposes:

- **Audit Trail**: Record of player state at the time of match completion
- **History Keeping**: Useful for debugging and transaction history
- **Never Used for Calculations**: Statistics table and points calculations ONLY read from the global `players` array

The stats embedded in match objects are frozen snapshots. If you update a player's stats through the Player Management UI, the changes will:
- ✅ Immediately affect the Statistics table and points calculations
- ✅ Be reflected in future match records
- ❌ NOT update stats in previously completed matches (by design)

This architecture ensures that stat corrections always affect current results immediately, without having to recalculate historical match data.

---

## localStorage Architecture

### Storage Keys

Starting with v4.0, tournament data is stored with per-tournament isolation:

```javascript
// Per-tournament storage
tournament_${id}           // Tournament data
tournament_${id}_history   // Transaction history

// Global storage
savedPlayers               // Player database (shared across tournaments)
dartsConfig                // Global configuration
currentTournament          // Active tournament identifier
dartsTournaments           // Tournament registry (legacy, to be phased out)
```

### Per-Tournament History

Each tournament maintains its own transaction history in a separate localStorage key:

```javascript
// Example: tournament_1761554559925_history
[
  {
    "id": "tx_1761554632323",
    "type": "COMPLETE_MATCH",
    "completionType": "MANUAL",
    "description": "FS-1-2: Chris (ID: 1761554566009) defeats Henry (ID: 1761554570908)",
    "timestamp": "2025-10-27T08:43:52.323Z",
    "matchId": "FS-1-2",
    "winner": {
      "id": 1761554566009,
      "name": "Chris",
      "paid": true,
      "stats": {
        "shortLegs": [],
        "highOuts": [],
        "tons": 2,
        "oneEighties": 1
      },
      "placement": null,
      "eliminated": false
    },
    "loser": {
      "id": 1761554570908,
      "name": "Henry",
      "paid": true,
      "stats": {
        "shortLegs": 0,
        "highOuts": [],
        "tons": 0,
        "oneEighties": 0
      },
      "placement": null,
      "eliminated": false
    }
  },
  {
    "id": "tx_1761554609001",
    "type": "START_MATCH",
    "description": "FS-1-2: Started",
    "timestamp": "2025-10-27T08:43:29.001Z",
    "matchId": "FS-1-2",
    "beforeState": {
      "active": false
    },
    "afterState": {
      "active": true
    }
  },
  {
    "id": "tx_1761554599125",
    "type": "ASSIGN_LANE",
    "description": "FS-1-2: Lane assigned to 1",
    "timestamp": "2025-10-27T08:43:19.125Z",
    "matchId": "FS-1-2",
    "afterState": {
      "lane": 1
    }
  },
  {
    "id": "tx_1761554604778",
    "type": "ASSIGN_REFEREE",
    "description": "FS-1-2: Referee assigned to Chris (ID: 1761554566009)",
    "timestamp": "2025-10-27T08:43:24.778Z",
    "matchId": "FS-1-2",
    "afterState": {
      "referee": 1761554566009
    }
  }
  // ... more transactions
]
```

**Transaction Types:**
- `COMPLETE_MATCH` - Match completion with winner/loser
- `START_MATCH` - Match marked as active/in-progress
- `STOP_MATCH` - Match stopped (not completed)
- `ASSIGN_LANE` - Dartboard lane assignment
- `ASSIGN_REFEREE` - Referee assignment

**Transaction ID Format:**
- Format: `tx_{timestamp}` (e.g., `tx_1761554632323`)
- Unique identifier for each transaction

**Completion Types:**
- `MANUAL` - Match completed by user clicking winner button
- `AUTO` - Match auto-advanced due to walkover/bye

**Benefits:**
- **Isolation**: No cross-contamination between tournaments
- **Portability**: History exports with tournament data
- **Clean Deletion**: Removing a tournament removes its history
- **Reduced Storage**: No accumulated history from all tournaments
- **Full Undo Support**: Complete state snapshots for reliable undo/redo

---

## Export Process

### Triggering an Export

1. Navigate to Tournament Setup page
2. Ensure a tournament is active
3. Click "Export Tournament" button
4. Browser downloads JSON file automatically

### Export Function Flow

```javascript
function exportTournament() {
    // 1. Validate active tournament
    if (!tournament || !tournament.id) {
        alert('No active tournament to export');
        return;
    }

    // 2. Read per-tournament history
    const historyKey = `tournament_${tournament.id}_history`;
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');

    // 3. Prune history for completed tournaments (optional optimization)
    if (tournament.status === 'completed' && history.length > 0) {
        history = pruneTransactionHistory(history, completedMatches);
    }

    // 4. Get saved players snapshot
    const playerList = getPlayerList();

    // 5. Build export object (v4.0 format)
    const tournamentData = {
        exportVersion: "4.0",
        id: tournament.id,
        name: tournament.name,
        date: tournament.date,
        created: tournament.created,
        status: tournament.status,
        bracketSize: tournament.bracketSize,
        readOnly: tournament.readOnly || false,
        players: players,
        matches: matches,
        bracket: tournament.bracket,
        placements: tournament.placements || {},
        history: history,
        playerList: playerList,
        exportedAt: new Date().toISOString()
    };

    // 6. Download JSON file
    const dataStr = JSON.stringify(tournamentData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournament.name}_${tournament.date}.json`;
    link.click();

    console.log(`✓ Tournament exported (v4.0 format, ${history.length} transactions)`);
}
```

### Console Output

Example console output when exporting:
```
✓ Tournament exported (v4.0 format, 41 transactions)
```

For completed tournaments with history pruning enabled:
```
✓ Export pruning: Removed 15 redundant transactions from export
✓ Tournament exported (v4.0 format, 26 transactions)
```

---

## Import Process

### Triggering an Import

1. Navigate to Tournament Setup page
2. Click "Import Tournament" button
3. Select a JSON file from file picker
4. System validates format and displays result

### Import Validation

The import process includes validation with automatic format detection:

```javascript
function validateTournamentData(data) {
    // 1. Detect format version
    let isOldFormat = false;

    if (!data.exportVersion) {
        // Old format (pre-v4.0) - no exportVersion field
        isOldFormat = true;
    } else {
        const exportVersion = parseFloat(data.exportVersion);
        if (exportVersion < 4.0) {
            // Old format with version number < 4.0
            isOldFormat = true;
        }
    }

    // 2. Validate required fields
    if (!data.name || typeof data.name !== 'string') {
        return { valid: false, error: 'Tournament name is required' };
    }

    if (!data.date || typeof data.date !== 'string') {
        return { valid: false, error: 'Tournament date is required' };
    }

    // 3. Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
        return { valid: false, error: 'Tournament date must be in YYYY-MM-DD format' };
    }

    // 4. Generate ID if missing (pre-4.0 exports may not have ID)
    if (!data.id) {
        data.id = Date.now();
        console.warn('Generated new ID for imported tournament:', data.id);
    }

    // 5. Validate arrays
    if (data.players && !Array.isArray(data.players)) {
        return { valid: false, error: 'Players must be an array' };
    }

    if (data.matches && !Array.isArray(data.matches)) {
        return { valid: false, error: 'Matches must be an array' };
    }

    if (data.history && !Array.isArray(data.history)) {
        return { valid: false, error: 'History must be an array' };
    }

    // 6. Set defaults for missing fields
    if (!data.status) data.status = 'setup';
    if (!data.players) data.players = [];
    if (!data.matches) data.matches = [];
    if (!data.created) data.created = new Date().toISOString();
    if (!data.history) data.history = [];

    return {
        valid: true,
        isOldFormat: isOldFormat
    };
}
```

### Import Function Flow

```javascript
function continueImportProcess(importedData) {
    // 1. Calculate bracketSize if missing (for older tournaments)
    let bracketSize = importedData.bracketSize;
    if (!bracketSize && importedData.bracket) {
        bracketSize = importedData.bracket.length;
    }

    // 2. Build tournament object (strip any config contamination)
    tournament = {
        id: importedData.id,
        name: importedData.name,
        date: importedData.date,
        created: importedData.created,
        status: importedData.status || 'setup',
        players: importedData.players || [],
        matches: importedData.matches || [],
        bracket: importedData.bracket || null,
        placements: importedData.placements || {},
        bracketSize: bracketSize,
        readOnly: (importedData.status === 'completed')
    };

    // 3. Set global arrays
    players = tournament.players;
    matches = tournament.matches;

    // 4. Restore per-tournament history (v4.0 format)
    if (importedData.history && Array.isArray(importedData.history) && importedData.history.length > 0) {
        const historyKey = `tournament_${tournament.id}_history`;
        try {
            localStorage.setItem(historyKey, JSON.stringify(importedData.history));
            console.log(`✓ Restored ${importedData.history.length} transaction history entries`);
        } catch (e) {
            console.warn('Could not restore tournament history:', e);
        }
    }

    // 5. Clear any undone transactions (fresh import)
    localStorage.removeItem('undoneTransactions');

    // 6. Restore playerList snapshot (v4.0 feature)
    if (importedData.playerList && Array.isArray(importedData.playerList)) {
        try {
            localStorage.setItem('savedPlayers', JSON.stringify(importedData.playerList));
            console.log(`✓ Restored ${importedData.playerList.length} saved players from export snapshot`);
        } catch (e) {
            console.warn('Could not restore saved players:', e);
        }
    }

    // 7. Save tournament (preserves global config)
    saveTournamentOnly();

    // 8. Update all displays
    updateTournamentStatus();
    updatePlayersDisplay();
    updatePlayerCount();
    updateTournamentWatermark();
    loadRecentTournaments();

    // 9. Render bracket if exists
    if (tournament.bracket && typeof renderBracket === 'function') {
        renderBracket();
    }

    // 10. Display results using global config
    if (typeof displayResults === 'function') {
        displayResults();
    }

    // 11. Show success message
    const historyCount = importedData.history ? importedData.history.length : 0;
    showImportStatus('success',
        `✓ Tournament "${tournament.name}" imported successfully! ` +
        `${players.length} players, ${matches.filter(m => m.completed).length} completed matches, ` +
        `and ${historyCount} transaction history entries loaded.`
    );

    // 12. Auto-switch to registration page
    setTimeout(() => {
        showPage('registration');
    }, 1500);

    console.log(`✓ Tournament imported (v${importedData.exportVersion} format, global config preserved)`);
}
```

### Console Output

**v4.0+ Import (with history):**
```
📥 Processing imported tournament (stripping any config data)...
✓ Restored 41 transaction history entries
✓ Restored 9 saved players from export snapshot
✓ Saved tournament "My Tournament" as current tournament
✓ Tournament imported (v4.0 format, global config preserved)
```

**Pre-4.0 Import (without history):**
```
📥 Processing imported tournament (stripping any config data)...
Generated new ID for imported tournament: 1729800000000
✓ Saved tournament "Old Tournament" as current tournament
✓ Tournament imported (v3.x format, global config preserved)
```

**Note:** Pre-4.0 imports do not restore transaction history. Undo functionality will only work for matches completed after import.

---

## Error Handling

### Version Validation Messages

**Old Format (No exportVersion field):**
- System automatically detects pre-4.0 format
- Imports tournament data successfully
- Creates empty transaction history
- User notified: "Imported pre-4.0 tournament (transaction history not available)"

**v4.0+ Format:**
- Full import with complete transaction history
- Undo functionality preserved
- User notified: "Tournament imported (v4.0 format, X transactions restored)"

### Data Validation Errors

- **Missing Required Fields**: "Tournament name is required"
- **Invalid Date Format**: "Tournament date must be in YYYY-MM-DD format"
- **Invalid Data Types**: "Players must be an array"

### UI Feedback

All import errors are displayed via:
1. **Alert Dialog**: Immediate modal alert for critical errors
2. **Status Message**: Red error banner below import button
3. **Console Logging**: Detailed error information for debugging

---

## Duplicate Tournament Handling

### Overwrite Detection

When importing a tournament that already exists (matching `id`):

```javascript
const existingTournament = tournaments.find(t => t.id === importedData.id);

if (existingTournament) {
    showImportOverwriteModal(importedData);
    return;
}
```

### Overwrite Confirmation Modal

User is presented with a confirmation dialog:
- Tournament name and date displayed
- Option to cancel or proceed with overwrite
- Overwriting replaces both tournament data and history

---

## Transaction History System

### History Storage (v4.0)

Each tournament maintains its own transaction history:

```javascript
// Save transaction to per-tournament history
function saveTransaction(transaction) {
    if (!tournament || !tournament.id) {
        console.warn('No active tournament - transaction not saved');
        return;
    }
    const historyKey = `tournament_${tournament.id}_history`;
    let history = getTournamentHistory();
    history.unshift(transaction);
    localStorage.setItem(historyKey, JSON.stringify(history));
}

// Read per-tournament history
function getTournamentHistory() {
    if (!tournament || !tournament.id) return [];
    const historyKey = `tournament_${tournament.id}_history`;
    const historyData = localStorage.getItem(historyKey);
    return historyData ? JSON.parse(historyData) : [];
}
```

### Transaction Structure

Transactions vary by type. Here are the main structures:

#### COMPLETE_MATCH Transaction
```json
{
  "id": "tx_1761554632323",
  "type": "COMPLETE_MATCH",
  "completionType": "MANUAL",
  "description": "FS-1-2: Chris defeats Henry",
  "timestamp": "2025-10-27T08:43:52.323Z",
  "matchId": "FS-1-2",
  "winner": { /* full player object */ },
  "loser": { /* full player object */ }
}
```

#### START_MATCH Transaction
```json
{
  "id": "tx_1761554609001",
  "type": "START_MATCH",
  "description": "FS-1-2: Started",
  "timestamp": "2025-10-27T08:43:29.001Z",
  "matchId": "FS-1-2",
  "beforeState": {
    "active": false
  },
  "afterState": {
    "active": true
  }
}
```

#### ASSIGN_LANE Transaction
```json
{
  "id": "tx_1761554599125",
  "type": "ASSIGN_LANE",
  "description": "FS-1-2: Lane assigned to 1",
  "timestamp": "2025-10-27T08:43:19.125Z",
  "matchId": "FS-1-2",
  "afterState": {
    "lane": 1
  }
}
```

#### ASSIGN_REFEREE Transaction
```json
{
  "id": "tx_1761554604778",
  "type": "ASSIGN_REFEREE",
  "description": "FS-1-2: Referee assigned to Chris (ID: 1761554566009)",
  "timestamp": "2025-10-27T08:43:24.778Z",
  "matchId": "FS-1-2",
  "afterState": {
    "referee": 1761554566009
  }
}
```

**Important Notes:**
- `COMPLETE_MATCH` transactions contain full player objects (not just IDs) for winner and loser
- `completionType` can be `"MANUAL"` (user action) or `"AUTO"` (walkover)
- Transaction `id` format is `tx_{timestamp}` for uniqueness
- Some transaction types use `beforeState`/`afterState` for state changes
- Match completion transactions store complete player state at time of completion

**Player Stats in Transactions:**
The `winner` and `loser` objects in `COMPLETE_MATCH` transactions include the full `stats` object as a historical snapshot. These stats are:
- **For history/audit purposes only** - never read back for calculations
- **Frozen at time of match completion** - represent player state at that moment
- **Not the source of truth** - the global `players` array is the only source for Statistics table and points

This means if you correct a player's stats (e.g., add a forgotten 180), the change immediately affects the Statistics table and points, but won't alter the historical snapshots in completed match transactions.

### History Pruning

For completed tournaments, history can be pruned during export:

```javascript
if (tournament.status === 'completed' && history.length > 0) {
    const completedMatches = matches.filter(m => m.completed);
    history = pruneTransactionHistory(history, completedMatches);
}
```

This removes redundant intermediate states while preserving undo capability.

---

## Undo System Integration

### Undo After Import

The undo system works seamlessly with imported history:

1. Import restores per-tournament history to correct key
2. Undo button reads from restored history
3. Each undo removes most recent transaction
4. Bracket state recalculated using hardcoded progression logic

### Verification

```javascript
// After import, verify undo works
let historyKey = Object.keys(localStorage).filter(k => k.endsWith('_history'))[0];
let history = JSON.parse(localStorage.getItem(historyKey));
console.log(`History contains ${history.length} transactions`);

// Test undo
undoLastMatch(); // Should work correctly with imported history
```

---

## Migration from Pre-4.0

### Backwards Compatibility

**v4.0 DOES support importing pre-4.0 exports with automatic migration:**

**What gets imported:**
- ✅ Tournament data (name, date, bracket size, status)
- ✅ Players (with all statistics and payment status)
- ✅ Matches (with completion state, winners, leg scores)
- ✅ Bracket structure
- ✅ Placements (final rankings)

**What does NOT get imported:**
- ❌ Transaction history (pre-4.0 history was contaminated from multiple tournaments)
- ❌ Undo capability (no history = no undo after import)

### Automatic Migration Process

When importing a pre-4.0 export (missing `exportVersion` field):

1. **Detection**: System recognizes old format by absence of `exportVersion` field
2. **Validation**: Validates tournament data structure (name, date, players, matches)
3. **Migration**: Imports tournament data into new per-tournament storage model
4. **Storage**: Stores in `tournament_${id}` key with isolated history key
5. **History**: Creates empty history array (undo not available for pre-import state)
6. **Success**: Tournament fully functional in v4.0 architecture

### Import Flow Example

```javascript
// Old format (no exportVersion)
{
  "name": "My Tournament",
  "date": "2025-10-20",
  "players": [...],
  "matches": [...]
}

// After import → stored as:
// tournament_1729434000000 (tournament data)
// tournament_1729434000000_history (empty array)
```

### User Impact

**For tournaments exported from v3.x:**
- ✅ All tournament data preserved
- ✅ Results, placements, and statistics intact
- ✅ Works seamlessly in v4.0
- ⚠️ Cannot undo matches that were completed before import
- ✅ Can undo new matches completed after import

### Recommendation

For users migrating from pre-4.0:
- Import old tournaments directly - migration is automatic
- Transaction history starts fresh after import
- Future exports will include proper per-tournament history
- Undo functionality works for all post-import actions

---

## Testing Import/Export

### Test Export

1. Create a test tournament with several matches
2. Complete matches and assign lanes/referees
3. Export the tournament
4. Verify export file contains:
   - `exportVersion: "4.0"`
   - All tournament data
   - Per-tournament history
   - PlayerList snapshot

### Test Import

1. Delete the test tournament from localStorage
2. Verify deletion:
   ```javascript
   localStorage.getItem('tournament_${id}'); // null
   localStorage.getItem('tournament_${id}_history'); // null
   ```
3. Import the exported JSON file
4. Verify restoration:
   - Tournament appears in list
   - History restored to correct key
   - Undo functionality works
5. Test overwrite by importing same file again

### Test Validation

**Test Pre-4.0 Import:**
1. Create an old format export (remove `exportVersion` field from v4.0 export)
2. Attempt import
3. Verify successful import with warning message about missing history
4. Check tournament data is intact
5. Verify empty history array created
6. Test undo button (should be disabled/no history)

**Test v4.0+ Import:**
1. Export tournament from v4.0
2. Import the file
3. Verify full restoration including history
4. Test undo functionality (should work)
5. Verify all transaction history restored

---

## API Integration

The import/export system can integrate with the optional REST API:

### Upload Tournament to Server

```javascript
async function uploadTournamentToServer() {
    // Export tournament data
    const tournamentData = exportTournament();

    // Upload to server
    const response = await fetch('/api/upload-tournament.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: `${tournament.name}_${tournament.date}.json`,
            data: tournamentData
        })
    });
}
```

### Download from Server

```javascript
async function downloadTournamentFromServer(filename) {
    const response = await fetch(`/api/tournaments/${filename}`);
    const importedData = await response.json();
    processImportedTournament(importedData);
}
```

See [REST_API.md](REST_API.md) for complete API documentation.

---

## Troubleshooting

### Import Button Not Working

1. Check browser console for errors
2. Verify file is valid JSON
3. Check file has `.json` extension
4. Verify `exportVersion` field exists

### History Not Restored After Import

```javascript
// Check if history key exists
Object.keys(localStorage).filter(k => k.endsWith('_history'))

// Check history for imported tournament
let historyKey = `tournament_${tournament.id}_history`;
let history = JSON.parse(localStorage.getItem(historyKey));
console.log(`History length: ${history.length}`);
```

If history is `null`, check:
- Export file contains `history` array
- Import validation passed
- No JavaScript errors during import

### Undo Not Working After Import

1. Verify history was restored (see above)
2. Check console for undo errors
3. Verify `tournament.id` matches history key
4. Test with a fresh import

### Export File Too Large

For completed tournaments with extensive history:
- History pruning reduces file size by ~90%
- Smart pruning (Developer Console) removes redundant transactions
- Export size for 32-player tournament: ~110KB (vs 9.9MB pre-v4.0)

---

## Security Considerations

### File Upload Safety

- Validate JSON structure before processing
- Reject files with invalid `exportVersion`
- Sanitize tournament names to prevent XSS
- No code execution from imported data

### Data Privacy

- Exports contain complete player information
- Store exports securely (encrypted storage recommended)
- Consider GDPR implications for player data
- Delete old exports after aggregation

---

## Future Enhancements

Potential improvements for future versions:

- **Export Compression**: gzip compression for large tournaments
- **Partial Imports**: Import only players or configuration
- **Batch Export**: Export multiple tournaments at once
- **Cloud Sync**: Automatic backup to cloud storage
- **Version Migration**: Automated upgrade from old formats
- **Export Templates**: Pre-configured export settings
- **Encrypted Exports**: Password-protected tournament files

---

*For REST API integration, see [REST_API.md](REST_API.md)*
*For general documentation, see project README.md*
