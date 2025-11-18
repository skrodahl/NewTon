# Single Source of Truth Foundation Review

## Executive Summary

This offline-first tournament management webapp implements a **hardcoded lookup table system** as its single source of truth for match progression logic. The architecture is well-designed with clear separation of concerns between tournament data, global configuration, and progression rules.

---

## Core Architecture

### 1. **MATCH_PROGRESSION Lookup Tables** (`clean-match-progression.js`)

The foundation of the entire system is the `MATCH_PROGRESSION` constant object, which defines **all possible match outcomes** for each bracket size (8, 16, 32 players).

#### Structure
```javascript
const MATCH_PROGRESSION = {
    8: { /* 8-player rules */ },
    16: { /* 16-player rules */ },
    32: { /* 32-player rules */ }
};
```

#### Format
Each match ID maps to winner/loser destinations:
```javascript
'FS-1-1': { 
    winner: ['FS-2-1', 'player1'],  // [targetMatchId, slot]
    loser: ['BS-1-1', 'player1'] 
}
```

#### Key Characteristics
- **Immutable**: Hardcoded at compile time, never modified at runtime
- **Complete**: Covers all matches in double-elimination brackets
- **Deterministic**: Every match outcome has a predefined path
- **Self-documenting**: Match IDs follow clear naming convention (FS/BS-Round-Number)

---

## Global State Management

### 2. **Tournament State** (`main.js`)

Three global variables hold the **current tournament state**:

```javascript
let tournament = null;  // Tournament metadata + bracket structure
let players = [];       // Player roster with stats
let matches = [];       // All match objects with results
```

#### Tournament Object Structure
```javascript
tournament = {
    id: timestamp,
    name: string,
    date: string,
    created: ISO timestamp,
    status: 'setup' | 'in-progress' | 'completed',
    players: [...],
    matches: [...],
    bracket: [...],
    bracketSize: 8 | 16 | 32,
    placements: { playerId: rank },
    readOnly: boolean
};
```

#### Key Principles
- **Single instance**: Only one tournament active at a time
- **Synchronized**: `players` and `matches` arrays always match `tournament.players` and `tournament.matches`
- **Persisted**: Saved to `localStorage` on every state change
- **Never contains config**: Configuration is kept separate in global `config` object

---

### 3. **Global Configuration** (`results-config.js`)

The `config` object stores **application-wide settings** that persist across tournaments:

```javascript
const DEFAULT_CONFIG = {
    points: { participation, first, second, third, ... },
    legs: { regularRounds, frontsideSemifinal, ... },
    clubName: "NewTon DC",
    lanes: { maxLanes, excludedLanes, requireLaneForStart },
    ui: { confirmWinnerSelection, autoOpenMatchControls, ... },
    server: { allowSharedTournamentDelete }
};
```

#### Key Principles
- **Global scope**: One config for all tournaments
- **Persistent**: Stored in `localStorage.dartsConfig`
- **Merged with defaults**: User settings merged with `DEFAULT_CONFIG`
- **Never saved with tournament**: Tournament exports exclude config

---

## Data Flow & Progression Logic

### 4. **Match Completion Flow**

The `advancePlayer()` function is the **only** function that moves players between matches:

```javascript
function advancePlayer(matchId, winner, loser) {
    const progression = MATCH_PROGRESSION[tournament.bracketSize];
    const rule = progression[matchId];
    
    // Place winner
    if (rule.winner) {
        const [targetMatchId, slot] = rule.winner;
        targetMatch[slot] = winner;
    }
    
    // Place loser (if applicable)
    if (rule.loser) {
        const [targetMatchId, slot] = rule.loser;
        targetMatch[slot] = loser;
    }
}
```

#### Guarantees
1. **Single code path**: All player advancement goes through this function
2. **Lookup-driven**: No calculations, only table lookups
3. **Atomic**: Either both players advance or neither does
4. **Traceable**: Every advancement is logged and can be undone

---

### 5. **Ranking Calculation**

Rankings are calculated **deterministically** based on match outcomes:

```javascript
function calculateAllRankings() {
    // 1st-3rd: Set by Grand Final and BS-FINAL
    // 4th: Specific backside match loser
    // 5th-6th: Two specific match losers (tied)
    // 7th-8th: Two specific match losers (tied)
    // etc.
}
```

Each bracket size has its own ranking function that assigns placements based on **which backside match a player lost**.

---

## Persistence & Offline-First Design

### 6. **Storage Strategy**

#### LocalStorage Keys
- `dartsTournaments`: Array of all tournaments
- `currentTournament`: Active tournament snapshot
- `dartsConfig`: Global configuration
- `tournament_{id}_history`: Per-tournament transaction log

#### Save Operations
```javascript
function saveTournamentOnly() {
    // 1. Build clean tournament object (no config)
    // 2. Update tournaments array
    // 3. Save to localStorage.dartsTournaments
    // 4. Save to localStorage.currentTournament
}
```

#### Key Principles
- **Immediate persistence**: Every state change saved immediately
- **No server dependency**: Fully functional offline
- **Export/Import**: JSON format for sharing tournaments
- **Transaction log**: Undo/redo support via event sourcing

---

## Strengths of This Architecture

### ✅ **Correctness**
- Hardcoded lookup tables eliminate calculation bugs
- Single code path for player advancement reduces edge cases
- Deterministic rankings based on match outcomes

### ✅ **Maintainability**
- Clear separation: progression rules, tournament data, config
- Self-documenting match IDs (FS-2-1 = Frontside Round 2 Match 1)
- Single source of truth prevents data inconsistencies

### ✅ **Offline-First**
- No server required for core functionality
- LocalStorage provides instant persistence
- Export/import enables data portability

### ✅ **Scalability**
- Adding new bracket sizes requires only new lookup table
- Transaction log enables undo/redo without state snapshots
- Modular design allows feature additions without core changes

---

## Potential Considerations

### ⚠️ **Bracket Size Limitation**
- Currently supports 8, 16, 32 players only
- Adding new sizes requires manual lookup table creation
- No dynamic bracket generation

### ⚠️ **LocalStorage Limits**
- Browser limit typically 5-10MB
- Large tournaments with extensive history may approach limits
- Transaction pruning helps but doesn't eliminate concern

### ⚠️ **No Conflict Resolution**
- Single-user design (no multi-device sync)
- Import/export is manual process
- Server features are optional bonus, not core

---

## Conclusion

The single source of truth foundation is **exceptionally well-designed** for an offline-first tournament management application. The MATCH_PROGRESSION lookup tables provide:

1. **Correctness**: Hardcoded rules eliminate calculation errors
2. **Clarity**: Self-documenting structure makes logic transparent
3. **Reliability**: Deterministic behavior with no edge cases
4. **Maintainability**: Clear separation of concerns

The architecture demonstrates **professional software engineering practices**:
- Immutable data structures for core logic
- Clear separation between data and configuration
- Transaction logging for auditability
- Offline-first design with optional server features

This is a **production-ready foundation** that could scale to support additional bracket sizes, tournament formats, or advanced features without requiring architectural changes.
