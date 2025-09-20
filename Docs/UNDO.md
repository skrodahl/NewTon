# UNDO System Logic

This document explains the core logic behind NewTon's surgical undo system, which leverages hardcoded progression tables and transaction-based history to enable precise match rollbacks without corrupting tournament state.

## Core Architecture

### 1. Single Sources of Truth

The undo system is built on two fundamental single sources of truth:

- **Hardcoded Match Progression (`MATCH_PROGRESSION`)**: Defines where winners and losers advance in the bracket
- **Transaction-based History**: Chronological log of every match completion with complete state snapshots

### 2. Surgical vs Rebuilding Approach

**Previous Approach (Problematic)**: Rebuild entire bracket from transaction history
- Called `completeMatch()` for each historical transaction
- Triggered progression logic that overwrote later matches
- Created infinite loops and data corruption

**Current Approach (Surgical)**: Target only affected matches
- Remove specific transactions from history
- Roll back only logically dependent matches
- Use hardcoded progression to identify exact dependencies

## Transaction-based History System

### Transaction Structure
```javascript
{
    id: "unique-transaction-id",
    matchId: "FS-2-8",
    winner: { name: "Player A", id: "player-a" },
    loser: { name: "Player B", id: "player-b" },
    completionType: "MANUAL" | "AUTO",
    timestamp: "2025-01-15T10:30:00.000Z"
}
```

### Transaction Types
- **MANUAL**: User-completed matches (can be undone)
- **AUTO**: Auto-completed walkover matches (consequences of manual completions)

## Hardcoded Match Progression

### Structure
```javascript
MATCH_PROGRESSION = {
    8: {
        'FS-2-8': {
            winner: ['FS-3-4', 'player2'],
            loser: ['BS-2-4', 'player2']
        }
    }
}
```

### Purpose
- **Bulletproof Logic**: No ambiguity about where players advance
- **Dependency Identification**: Enables precise identification of affected matches
- **Auto-advancement Processing**: Drives walkover match completions

## Surgical Undo Algorithm

### Step 1: Identify Target Transaction
```javascript
const targetTransaction = history.find(t => t.id === transactionId);
```

### Step 2: Find All Consequential Matches
Uses `getConsequentialMatches()` to follow winner/loser paths and collect:
- Immediate destination matches
- All intermediate walkover matches in the chain
- Final destination matches with real players

```javascript
// Example: Undoing FS-2-8
// Winner → FS-3-4 (direct)
// Loser → BS-2-4 → BS-3-1 → BS-3-2 (walkover chain)
// Consequential matches: [FS-3-4, BS-2-4, BS-3-1, BS-3-2]
```

### Step 3: Collect Transactions to Remove
```javascript
const transactionsToRemove = [transactionId]; // Target transaction

// Add all transactions for consequential matches
consequentialMatches.forEach(match => {
    const matchTransactions = history.filter(t => t.matchId === match.id);
    matchTransactions.forEach(t => {
        if (!transactionsToRemove.includes(t.id)) {
            transactionsToRemove.push(t.id);
        }
    });
});
```

### Step 4: Clean History
```javascript
const cleanHistory = history.filter(t => !transactionsToRemove.includes(t.id));
localStorage.setItem('tournamentHistory', JSON.stringify(cleanHistory));
```

### Step 5: Surgical State Rollback
For each transaction being removed:
1. Find the match using `matches.find(m => m.id === transaction.matchId)`
2. Use hardcoded progression to find where winner/loser went
3. Remove advancing players from their destination matches
4. Reset match to READY state

```javascript
// Remove winner from destination
if (matchProgression.winner) {
    const [winnerDestMatchId, winnerSlot] = matchProgression.winner;
    const winnerDestMatch = matches.find(m => m.id === winnerDestMatchId);
    winnerDestMatch[winnerSlot] = { name: 'TBD', id: null };
}

// Roll back the match itself
match.completed = false;
match.winner = null;
match.loser = null;
match.state = 'READY';
```

## Auto-advancement Chain Handling

### Problem
When a player advances to a walkover match, that match auto-completes and may trigger further auto-completions.

### Example Chain
```
FS-2-8 completed → Loser goes to BS-2-4 → BS-2-4 auto-completes → Winner goes to BS-3-1 → etc.
```

### Solution
The `collectWalkoverChain()` function follows the complete chain:

```javascript
function collectWalkoverChain(matchId, progression) {
    const chainMatches = [];
    let currentMatchId = matchId;

    while (currentMatchId) {
        chainMatches.push(currentMatchId); // Collect every match in chain

        const match = matches.find(m => m.id === currentMatchId);

        // Stop if match has real players (not walkover)
        if (!isWalkover(match.player1) && !isWalkover(match.player2)) {
            break;
        }

        // Follow to next match in chain
        const nextMatch = progression[currentMatchId]?.winner?.[0];
        currentMatchId = nextMatch;
    }

    return chainMatches;
}
```

This ensures ALL auto-completed matches in the chain are included in `transactionsToRemove`.

## Key Benefits

### 1. Precision
- Only affects matches that are logically dependent on the undone match
- Preserves all unrelated match states
- No unnecessary bracket rebuilding

### 2. Data Integrity
- Single source of truth prevents ambiguity
- Transaction removal ensures clean history
- No risk of infinite loops or corruption

### 3. Performance
- O(n) complexity where n = number of affected matches
- No expensive bracket reconstruction
- Immediate state updates

### 4. Resilience
- Hardcoded progression prevents logic errors
- Transaction-based approach enables complete audit trail
- Surgical approach minimizes failure surface area

## Error Prevention

### Guards Against Infinite Loops
- `window.rebuildInProgress` prevents ranking calculations during rebuilds
- `window.processingAutoAdvancements` prevents recursive auto-advancement calls
- Visited sets in chain traversal prevent circular references

### Data Consistency Checks
- Validate transactions exist before removal
- Verify matches exist before state changes
- Preserve original player assignments from upstream matches

### Graceful Failure
- Operations fail safely without corrupting tournament state
- Extensive logging for debugging and audit trails
- Fallback mechanisms for edge cases

## Usage Examples

### Simple Undo
```javascript
// Undo FS-3-1 (Winners semi-final)
undoManualTransaction(transactionId);

// Result:
// - FS-3-1: COMPLETED → READY
// - Winner removed from GRAND-FINAL
// - Loser removed from BS-FINAL
```

### Complex Chain Undo
```javascript
// Undo FS-2-8 with walkover chain
undoManualTransaction(transactionId);

// Result:
// - FS-2-8: COMPLETED → READY
// - Winner removed from FS-3-4
// - Loser removed from BS-2-4
// - BS-2-4: AUTO-COMPLETED → READY (if was walkover)
// - BS-3-1: AUTO-COMPLETED → READY (if was walkover)
// - Final real match in chain: player removed
```

## Conclusion

The surgical undo system demonstrates the power of combining hardcoded lookup tables (single source of truth for logic) with transaction-based history (single source of truth for state). This architectural approach enables precise, efficient, and bulletproof undo operations that maintain tournament integrity even in complex auto-advancement scenarios.

The key insight: **Don't rebuild what you can surgically repair.**