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
  "id": 1234567890,
  "name": "Tournament Name",
  "date": "2025-10-23",
  "created": "2025-10-23T20:29:17.350Z",
  "status": "active|completed",
  "bracketSize": 8|16|32,
  "readOnly": false,
  "players": [...],
  "matches": [...],
  "bracket": [...],
  "placements": {...},
  "history": [...],
  "playerList": [...],
  "exportedAt": "2025-10-23T22:46:00.000Z"
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
| `playerList` | array | Yes | Snapshot of saved players database |
| `exportedAt` | string | Yes | ISO 8601 timestamp of export |

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
// Example: tournament_1729712462714_history
[
  {
    "type": "match_complete",
    "matchId": "FS-1-1",
    "timestamp": "2025-10-23T20:32:28.428Z",
    "beforeState": {
      "match": {...}
    },
    "afterState": {
      "match": {...},
      "placements": {...}
    }
  },
  // ... more transactions
]
```

**Benefits:**
- **Isolation**: No cross-contamination between tournaments
- **Portability**: History exports with tournament data
- **Clean Deletion**: Removing a tournament removes its history
- **Reduced Storage**: No accumulated history from all tournaments

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
}
```

### Console Output

```
✓ Tournament exported (v4.0 format, 31 transactions)
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
    const isPreV4 = !data.exportVersion;

    if (isPreV4) {
        // Pre-4.0 format - validate basic structure
        console.log('Detected pre-4.0 export format - will import without history');
    }

    // 2. Validate required fields (works for both v3.x and v4.0)
    if (!data.name || !data.date) {
        return { valid: false, error: 'Missing required tournament fields (name, date)' };
    }

    // 3. Validate data types
    if (!Array.isArray(data.players) || !Array.isArray(data.matches)) {
        return { valid: false, error: 'Invalid data structure (players and matches must be arrays)' };
    }

    // 4. Generate ID if missing (pre-4.0 exports may not have ID)
    if (!data.id) {
        data.id = Date.now(); // Generate new ID for pre-4.0 imports
        console.log(`Generated new tournament ID: ${data.id}`);
    }

    return {
        valid: true,
        isPreV4: isPreV4,
        message: isPreV4 ? 'Pre-4.0 format detected' : 'v4.0+ format detected'
    };
}
```

### Import Function Flow

```javascript
function continueImportProcess(importedData, isPreV4 = false) {
    // 1. Build tournament object (preserve or generate ID)
    tournament = {
        id: importedData.id || Date.now(),  // Generate ID for pre-4.0 exports
        name: importedData.name,
        date: importedData.date,
        created: importedData.created || new Date().toISOString(),
        status: importedData.status || 'setup',
        players: importedData.players || [],
        matches: importedData.matches || [],
        bracket: importedData.bracket || null,
        placements: importedData.placements || {},
        bracketSize: importedData.bracketSize,
        readOnly: (importedData.status === 'completed')
    };

    // 2. Restore per-tournament history (empty for pre-4.0)
    const historyKey = `tournament_${tournament.id}_history`;
    const history = importedData.history || [];  // Empty array for pre-4.0
    localStorage.setItem(historyKey, JSON.stringify(history));

    // 3. Restore saved players snapshot (optional, v4.0+ only)
    if (importedData.playerList) {
        localStorage.setItem('savedPlayers', JSON.stringify(importedData.playerList));
    }

    // 4. Clear undone transactions (fresh import)
    localStorage.removeItem('undoneTransactions');

    // 5. Save tournament data to new per-tournament key
    const tournamentKey = `tournament_${tournament.id}`;
    localStorage.setItem(tournamentKey, JSON.stringify(tournament));

    // 6. Update tournament registry
    updateTournamentRegistry(tournament.id);

    // 7. Update displays
    updateTournamentStatus();
    updatePlayersDisplay();
    if (tournament.bracket) renderBracket();
    displayResults();

    // 8. Show success message with format-specific info
    if (isPreV4) {
        showImportStatus('success',
            `✓ Tournament "${tournament.name}" imported from pre-4.0 format! ` +
            `${players.length} players, ${completedMatches} completed matches. ` +
            `Transaction history not available (starts fresh from now).`
        );
    } else {
        showImportStatus('success',
            `✓ Tournament "${tournament.name}" imported successfully! ` +
            `${players.length} players, ${completedMatches} completed matches, ` +
            `and ${history.length} transaction history entries restored.`
        );
    }

    // 9. Navigate to registration page
    showPage('registration');
}
```

### Console Output

**v4.0+ Import (with history):**
```
✓ Restored 31 transaction history entries to tournament_1729712462714_history
✓ Restored 19 saved players from export snapshot
✓ Tournament imported (v4.0 format, global config preserved)
```

**Pre-4.0 Import (without history):**
```
Detected pre-4.0 export format - will import without history
Generated new tournament ID: 1729800000000
✓ Created empty history array at tournament_1729800000000_history
✓ Tournament imported from pre-4.0 format (transaction history starts fresh)
```

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

```json
{
  "type": "match_complete",
  "matchId": "FS-1-1",
  "timestamp": "2025-10-23T20:32:28.428Z",
  "beforeState": {
    "match": {
      "id": "FS-1-1",
      "completed": false,
      "winner": null
    }
  },
  "afterState": {
    "match": {
      "id": "FS-1-1",
      "completed": true,
      "winner": 1,
      "player1": {...},
      "player2": {...}
    },
    "placements": {
      "1": 5,
      "2": 3
    }
  }
}
```

**Note:** Starting v3.0.1, `beforeState.matches` arrays are excluded for 98% storage reduction.

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
