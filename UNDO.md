# UNDO System Documentation

## Overview

This document explains the strategy, implementation, and tools for the bulletproof undo system in NewTon Tournament Manager.

## The Problem

In double-elimination tournaments, undoing a match completion can have cascading effects:
- Winners and losers from the undone match need to be removed from subsequent matches
- Auto-advanced walkover matches that resulted from the undone match need to be reversed
- The bracket needs to be restored to the exact state it was in before the match was completed

## Tools At Our Disposal

### 1. Hardcoded Bracket Progression (`MATCH_PROGRESSION`)

Located in `clean-match-progression.js`, this lookup table defines exactly where winners and losers go for every match in 8, 16, and 32 player brackets.

```javascript
const MATCH_PROGRESSION = {
    'FS-2-1': {
        winner: ['FS-3-1', 'player1'],
        loser: ['BS-2-2', 'player2']
    },
    // ... complete mapping for all matches
};
```

**Benefits:**
- Bulletproof reliability - no dynamic calculation errors
- Deterministic progression - same input always produces same output
- Complete coverage - every match knows exactly where its players go

### 2. Transaction-Based History System

Every match completion creates a transaction record with:
- Unique transaction ID
- Match ID and completion details (winner, loser, scores)
- Timestamp for chronological ordering
- **Completion type: 'MANUAL' or 'AUTO'**

```javascript
{
    id: 'tx_1757781775288',
    matchId: 'FS-2-1',
    description: 'FS-2-1: Player02 defeats Player04',
    winner: { name: 'Player02', ... },
    loser: { name: 'Player04', ... },
    completionType: 'MANUAL',
    timestamp: '2025-09-13T16:42:55.288Z'
}
```

**Key Insight: MANUAL vs AUTO Distinction**
- **MANUAL**: User deliberately completed a match (undoable)
- **AUTO**: System automatically completed a walkover match (consequential)

## Our Strategy: Bulletproof Undo

### Core Principle
Instead of trying to surgically reverse specific changes, we **rebuild the entire bracket state** from scratch using only the transactions we want to keep.

### The Algorithm

1. **Identify Target**: Find the MANUAL transaction to undo
2. **Filter History**: Remove the target transaction AND all AUTO transactions that happened after it
3. **Reset Bracket**: Clear all matches to pristine state (only original Round 1 seeding)
4. **Replay History**: Apply remaining MANUAL transactions in chronological order
5. **Auto-advance**: Let the system naturally handle walkovers after each manual completion

### Why This Works

- **Complete Rebuild**: Eliminates any possibility of inconsistent state
- **Transaction Replay**: Ensures the bracket reaches exactly the state it should be in
- **Hardcoded Logic**: Uses the same reliable progression rules that built the bracket originally
- **Chronological Order**: Maintains proper sequence of events

## Implementation Details

### File Structure

**`bracket-rendering.js`** (Undo System):
- `handleSurgicalUndo()` - Entry point from UI
- `undoManualTransaction()` - Main undo logic
- `calculateAndApplyBracketState()` - Bracket rebuilding
- `resetToPristineState()` - Clear bracket to initial state
- `applyTransactionToState()` - Replay a single transaction

**`clean-match-progression.js`** (Match Logic):
- `completeMatch()` - Creates transactions with MANUAL/AUTO distinction
- `advancePlayer()` - Uses hardcoded MATCH_PROGRESSION
- `processAutoAdvancements()` - Handles walkover completions

### Enhanced Undo Dialog

The undo dialog shows "consequential matches" - matches that will be affected by the undo operation, giving users clear visibility into what will be reset.

## Current Implementation Status

### ✅ Working Components
- Transaction-based history system with MANUAL/AUTO distinction
- Enhanced undo dialog showing consequential matches
- Complete bracket state rebuilding logic
- Proper sequencing (reset → auto-advance → apply manual → auto-advance)

### ❓ Potential Issues
- **UI Refresh**: Changes may be happening but not visible due to UI update timing
- **Save Conflicts**: Multiple rapid saves might overwrite undo changes  
- **Event Cascading**: Undo might trigger additional UI update cycles
- **Function Availability**: Required functions (`processAutoAdvancements`, etc.) might not be available in undo context

### 🔍 Debugging Tools Added
- Undo operation logging: "Undo FS-2-1: removing transaction + 2 auto-transactions"
- Bracket rebuild confirmation: "Bracket rebuilt from 7 remaining transactions"
- Transaction replay summary: "Applied 1 manual transactions with auto-advancement"
- Auto-advancement summary: "Auto-advanced: BS-1-1, BS-2-2 (2 matches)"

## The Expected Flow

### Normal Match Completion:
1. User completes FS-2-1: Player02 defeats Player04
2. Creates MANUAL transaction
3. Auto-advancement processes BS-2-2 walkover
4. Creates AUTO transaction for BS-2-2
5. Tournament saved

### Undo Operation:
1. User clicks undo on FS-2-1
2. System removes FS-2-1 MANUAL transaction + BS-2-2 AUTO transaction  
3. Bracket reset to pristine state
4. Remaining transactions replayed in order
5. Auto-advancement fills in walkovers
6. UI refreshed to show updated state

## Key Insights from Development

### 1. Sequencing is Critical
We learned that AUTO-advancement must happen BEFORE trying to apply MANUAL transactions, since MANUAL transactions depend on players that come from AUTO-advancement.

### 2. Complete Rebuild is Safer
Our initial approach of trying to surgically remove specific changes proved too complex and error-prone. The complete rebuild approach is bulletproof.

### 3. UI Timing Matters
The biggest challenge isn't the logic (which works) but ensuring the UI properly reflects the changes without being overwritten by rapid saves/renders.

## Next Steps for Debugging

1. **Verify Function Availability**: Ensure all required functions are accessible in the undo context
2. **UI Update Timing**: Add delays or better sequencing to UI updates
3. **Save Coordination**: Ensure undo changes aren't overwritten by cascading save operations
4. **Visual Feedback**: Add temporary visual indicators during undo operations

## Architecture Strengths

This undo system leverages the tournament's strongest architectural features:
- **Hardcoded progression logic** ensures reliability
- **Transaction history** provides complete audit trail
- **MANUAL/AUTO distinction** enables surgical removal of consequences
- **Complete rebuild** eliminates edge cases and inconsistencies

The system is designed to be bulletproof - if the logic works (which it does), the bracket will always reach the correct state.