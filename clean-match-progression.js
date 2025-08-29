// clean-match-progression.js - Single Source of Truth Lookup System
// Based on the *_players.md files - hardcoded bracket progressions

/**
 * SINGLE SOURCE OF TRUTH: CORRECTED Match progression lookup tables
 * Based on proper double elimination mirroring rules
 * Format: matchId -> { winner: [targetMatchId, slot], loser: [targetMatchId, slot] }
 */
const MATCH_PROGRESSION = {
    8: {
        // === FRONTSIDE ===
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-2', 'player2'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-1', 'player2'] },
        'FS-3-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },

        // === BACKSIDE ===
        'BS-1-1': { winner: ['BS-2-1', 'player1'] },
        'BS-1-2': { winner: ['BS-2-2', 'player1'] },
	'BS-2-1': { winner: ['BS-3-1', 'player1'] },
	'BS-2-2': { winner: ['BS-3-1', 'player2'] },
	'BS-3-1': { winner: ['BS-FINAL', 'player2'] },
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] }
    },

16: {
  // === FRONTSIDE ===
  'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-4', 'player1'] },
  'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-4', 'player2'] },
  'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-3', 'player1'] },
  'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-3', 'player2'] },
  'FS-1-5': { winner: ['FS-2-3', 'player1'], loser: ['BS-1-2', 'player1'] },
  'FS-1-6': { winner: ['FS-2-3', 'player2'], loser: ['BS-1-2', 'player2'] },
  'FS-1-7': { winner: ['FS-2-4', 'player1'], loser: ['BS-1-1', 'player1'] },
  'FS-1-8': { winner: ['FS-2-4', 'player2'], loser: ['BS-1-1', 'player2'] },

  'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-4', 'player2'] },
  'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-3', 'player2'] },
  'FS-2-3': { winner: ['FS-3-2', 'player1'], loser: ['BS-2-2', 'player2'] },
  'FS-2-4': { winner: ['FS-3-2', 'player2'], loser: ['BS-2-1', 'player2'] },

  // Winners side semis
  'FS-3-1': { winner: ['FS-4-1', 'player1'], loser: ['BS-4-2', 'player2'] }, // mirror into BS-4
  'FS-3-2': { winner: ['FS-4-1', 'player2'], loser: ['BS-4-1', 'player2'] },

  // Winners side final
  'FS-4-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },

  // === BACKSIDE (16) ===
  // BS-R1 (4 matches) winners → BS-R2.player1
  'BS-1-1': { winner: ['BS-2-1', 'player1'] },
  'BS-1-2': { winner: ['BS-2-2', 'player1'] },
  'BS-1-3': { winner: ['BS-2-3', 'player1'] },
  'BS-1-4': { winner: ['BS-2-4', 'player1'] },

  // BS-R2 winners → BS-R3.player1
  'BS-2-1': { winner: ['BS-3-1', 'player1'] },
  'BS-2-2': { winner: ['BS-3-1', 'player2'] }, // player2 supplied later by FS-3-2 loser
  'BS-2-3': { winner: ['BS-3-2', 'player1'] },
  'BS-2-4': { winner: ['BS-3-2', 'player2'] }, // player2 supplied later by FS-3-1 loser

  // BS-R3 winners go straight to BS-R4 player1
  'BS-3-1': { winner: ['BS-4-1', 'player1'] },
  'BS-3-2': { winner: ['BS-4-2', 'player1'] },

  // BS-R4 winners meet in BS-R5-1
  'BS-4-1': { winner: ['BS-5-1', 'player1'] },
  'BS-4-2': { winner: ['BS-5-1', 'player2'] },

  // BS-R5 winner → BS-FINAL.player2
  'BS-5-1': { winner: ['BS-FINAL', 'player2'] },

  // BS champion → GRAND-FINAL.player2
  'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] }
    },

32: {
    // === FRONTSIDE ===
    'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-8', 'player1'] },
    'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-8', 'player2'] },
    'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-7', 'player1'] },
    'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-7', 'player2'] },
    'FS-1-5': { winner: ['FS-2-3', 'player1'], loser: ['BS-1-6', 'player1'] },
    'FS-1-6': { winner: ['FS-2-3', 'player2'], loser: ['BS-1-6', 'player2'] },
    'FS-1-7': { winner: ['FS-2-4', 'player1'], loser: ['BS-1-5', 'player1'] },
    'FS-1-8': { winner: ['FS-2-4', 'player2'], loser: ['BS-1-5', 'player2'] },
    'FS-1-9': { winner: ['FS-2-5', 'player1'], loser: ['BS-1-4', 'player1'] },
    'FS-1-10': { winner: ['FS-2-5', 'player2'], loser: ['BS-1-4', 'player2'] },
    'FS-1-11': { winner: ['FS-2-6', 'player1'], loser: ['BS-1-3', 'player1'] },
    'FS-1-12': { winner: ['FS-2-6', 'player2'], loser: ['BS-1-3', 'player2'] },
    'FS-1-13': { winner: ['FS-2-7', 'player1'], loser: ['BS-1-2', 'player1'] },
    'FS-1-14': { winner: ['FS-2-7', 'player2'], loser: ['BS-1-2', 'player2'] },
    'FS-1-15': { winner: ['FS-2-8', 'player1'], loser: ['BS-1-1', 'player1'] },
    'FS-1-16': { winner: ['FS-2-8', 'player2'], loser: ['BS-1-1', 'player2'] },
    'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-8', 'player2'] },
    'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-7', 'player2'] },
    'FS-2-3': { winner: ['FS-3-2', 'player1'], loser: ['BS-2-6', 'player2'] },
    'FS-2-4': { winner: ['FS-3-2', 'player2'], loser: ['BS-2-5', 'player2'] },
    'FS-2-5': { winner: ['FS-3-3', 'player1'], loser: ['BS-2-4', 'player2'] },
    'FS-2-6': { winner: ['FS-3-3', 'player2'], loser: ['BS-2-3', 'player2'] },
    'FS-2-7': { winner: ['FS-3-4', 'player1'], loser: ['BS-2-2', 'player2'] },
    'FS-2-8': { winner: ['FS-3-4', 'player2'], loser: ['BS-2-1', 'player2'] },
    'FS-3-1': { winner: ['FS-4-1', 'player1'], loser: ['BS-3-6', 'player2'] },
    'FS-3-2': { winner: ['FS-4-1', 'player2'], loser: ['BS-3-5', 'player2'] },
    'FS-3-3': { winner: ['FS-4-2', 'player1'], loser: ['BS-3-2', 'player2'] },
    'FS-3-4': { winner: ['FS-4-2', 'player2'], loser: ['BS-3-1', 'player2'] },
    'FS-4-1': { winner: ['FS-5-1', 'player1'], loser: ['BS-4-4', 'player2'] },
    'FS-4-2': { winner: ['FS-5-1', 'player2'], loser: ['BS-4-1', 'player2'] },
    'FS-5-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },

    // === BACKSIDE ===
    // R1 winners → R2
    'BS-1-1': { winner: ['BS-2-1', 'player1'] },
    'BS-1-2': { winner: ['BS-2-2', 'player1'] },
    'BS-1-3': { winner: ['BS-2-3', 'player1'] },
    'BS-1-4': { winner: ['BS-2-4', 'player1'] },
    'BS-1-5': { winner: ['BS-2-5', 'player1'] },
    'BS-1-6': { winner: ['BS-2-6', 'player1'] },
    'BS-1-7': { winner: ['BS-2-7', 'player1'] },
    'BS-1-8': { winner: ['BS-2-8', 'player1'] },

    // R2 winners → R3
    'BS-2-1': { winner: ['BS-3-1', 'player1'] },
    'BS-2-2': { winner: ['BS-3-2', 'player1'] },
    'BS-2-3': { winner: ['BS-3-3', 'player1'] },
    'BS-2-4': { winner: ['BS-3-3', 'player2'] },
    'BS-2-5': { winner: ['BS-3-4', 'player1'] },
    'BS-2-6': { winner: ['BS-3-4', 'player2'] },
    'BS-2-7': { winner: ['BS-3-5', 'player1'] },
    'BS-2-8': { winner: ['BS-3-6', 'player1'] },

    // R3 winners → R4
    'BS-3-1': { winner: ['BS-4-1', 'player1'] },
    'BS-3-2': { winner: ['BS-4-2', 'player1'] },
    'BS-3-3': { winner: ['BS-4-2', 'player2'] },
    'BS-3-4': { winner: ['BS-4-3', 'player1'] },
    'BS-3-5': { winner: ['BS-4-3', 'player2'] },
    'BS-3-6': { winner: ['BS-4-4', 'player1'] },

    // R4 winners → populate 2 matches in R5
    'BS-4-1': { winner: ['BS-5-1', 'player1'] },
    'BS-4-2': { winner: ['BS-5-1', 'player2'] },
    'BS-4-3': { winner: ['BS-5-2', 'player1'] },
    'BS-4-4': { winner: ['BS-5-2', 'player2'] },

    // R5 (2 matches → feed R6)
    'BS-5-1': { winner: ['BS-6-1', 'player1'] },
    'BS-5-2': { winner: ['BS-6-1', 'player2'] },

    // R6 (1 match → BS-Final slot2)
    'BS-6-1': { winner: ['BS-FINAL', 'player2'] },

    // FS-5-1 loser already goes to BS-Final.slot1
    // BS-Final winner → Grand-Final.slot2
    'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] }
}
    
    // TODO: Add 48-player progression when needed
};

/**
 * CORE FUNCTION: Advance player using lookup table
 * This is the ONLY function that moves players between matches
 */
function advancePlayer(matchId, winner, loser) {
    if (!tournament || !tournament.bracketSize) {
        console.error('No tournament or bracket size available');
        return false;
    }
    
    const progression = MATCH_PROGRESSION[tournament.bracketSize];
    if (!progression) {
        console.error(`No progression rules for ${tournament.bracketSize}-player bracket`);
        return false;
    }
    
    const rule = progression[matchId];
    if (!rule) {
        console.log(`No progression rule found for match ${matchId} (probably grand final)`);
        return true; // Grand final has no further progression
    }
    
    console.log(`Advancing from ${matchId}: Winner=${winner?.name}, Loser=${loser?.name}`);
    
    // Place winner
    if (rule.winner) {
        const [targetMatchId, slot] = rule.winner;
        const targetMatch = matches.find(m => m.id === targetMatchId);
        
        if (targetMatch) {
            targetMatch[slot] = {
                id: winner.id,
                name: winner.name,
                paid: winner.paid,
                stats: winner.stats
            };
            console.log(`✓ Winner ${winner.name} → ${targetMatchId}.${slot}`);
        } else {
            console.error(`Target match ${targetMatchId} not found for winner`);
        }
    }
    
    // Place loser (if rule exists)
    if (rule.loser && loser) {
        const [targetMatchId, slot] = rule.loser;
        const targetMatch = matches.find(m => m.id === targetMatchId);
        
        if (targetMatch) {
            targetMatch[slot] = {
                id: loser.id,
                name: loser.name,
                paid: loser.paid,
                stats: loser.stats
            };
            console.log(`✓ Loser ${loser.name} → ${targetMatchId}.${slot}`);
        } else {
            console.error(`Target match ${targetMatchId} not found for loser`);
        }
    }
    
    return true;
}

/**
 * SIMPLE MATCH COMPLETION: Sets winner/loser and advances using lookup table
 */
function completeMatch(matchId, winnerPlayerNumber) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }
    
    // Determine winner and loser
    const winner = winnerPlayerNumber === 1 ? match.player1 : match.player2;
    const loser = winnerPlayerNumber === 1 ? match.player2 : match.player1;
    
    if (!winner || !loser) {
        console.error('Invalid player selection');
        return false;
    }
    
    // Set match as completed
    match.winner = winner;
    match.loser = loser;
    match.completed = true;
    match.active = false;
    
    // Use lookup table to advance players
    const success = advancePlayer(matchId, winner, loser);
    
    if (success) {
        console.log(`✓ Match ${matchId} completed: ${winner.name} defeats ${loser.name}`);
        
        // Save tournament
        if (typeof saveTournament === 'function') {
            saveTournament();
        }
        
        // Trigger auto-advancement check (Phase 3)
        processAutoAdvancements();
        
        return true;
    } else {
        console.error(`Failed to advance players from ${matchId}`);
        return false;
    }
}

/**
 * CHECK IF PLAYER IS WALKOVER (for auto-advancement)
 */
function isWalkover(player) {
    if (!player) return false;
    
    return player.isBye === true || 
           player.name === 'Walkover' || 
           (player.id && player.id.toString().startsWith('walkover-'));
}

/**
 * AUTO-ADVANCEMENT: Real player vs Walkover = automatic win
 * FIXED: Handle walkover vs walkover matches
 */
function shouldAutoAdvance(match) {
    if (!match || match.completed) return false;
    if (!match.player1 || !match.player2) return false;
    
    // Never auto-advance TBD vs anything (TBD = waiting for opponent)
    if (match.player1.name === 'TBD' || match.player2.name === 'TBD') {
        return false;
    }
    
    const p1IsWalkover = isWalkover(match.player1);
    const p2IsWalkover = isWalkover(match.player2);
    
    // Auto-advance Real vs Walkover OR Walkover vs Walkover
    return (p1IsWalkover && !p2IsWalkover) || (!p1IsWalkover && p2IsWalkover) || (p1IsWalkover && p2IsWalkover);
}

/**
 * PROCESS AUTO-ADVANCEMENT - Enhanced to handle walkover vs walkover
 */
function processAutoAdvancement(match) {
    if (!shouldAutoAdvance(match)) return false;
    
    const p1IsWalkover = isWalkover(match.player1);
    const p2IsWalkover = isWalkover(match.player2);
    
    let winnerPlayerNumber;
    
    if (p1IsWalkover && p2IsWalkover) {
        // Both are walkovers - pick player1 as winner arbitrarily
        winnerPlayerNumber = 1;
        console.log(`Auto-advancing walkover vs walkover: ${match.id} (${match.player1.name} vs ${match.player2.name}) - Player 1 wins`);
    } else if (p1IsWalkover && !p2IsWalkover) {
        // Player 2 wins
        winnerPlayerNumber = 2;
        console.log(`Auto-advancing: ${match.id} (${match.player1.name} vs ${match.player2.name}) - Player 2 wins`);
    } else if (!p1IsWalkover && p2IsWalkover) {
        // Player 1 wins
        winnerPlayerNumber = 1;
        console.log(`Auto-advancing: ${match.id} (${match.player1.name} vs ${match.player2.name}) - Player 1 wins`);
    } else {
        return false; // Should not reach here
    }
    
    // Mark as auto-advanced and complete
    match.autoAdvanced = true;
    return completeMatch(match.id, winnerPlayerNumber);
}

/**
 * PROCESS ALL AUTO-ADVANCEMENTS
 */
function processAutoAdvancements() {
    if (!matches || matches.length === 0) return;
    
    let foundAdvancement = true;
    let iterations = 0;
    const maxIterations = 10;
    
    console.log('Processing auto-advancements...');
    
    while (foundAdvancement && iterations < maxIterations) {
        foundAdvancement = false;
        iterations++;
        
        matches.forEach(match => {
            if (shouldAutoAdvance(match)) {
                // Determine automatic winner
                const p1IsWalkover = isWalkover(match.player1);
                const winnerPlayerNumber = p1IsWalkover ? 2 : 1;
                
                console.log(`Auto-advancing: ${match.id} (${match.player1.name} vs ${match.player2.name})`);
                
                // Mark as auto-advanced and complete
                match.autoAdvanced = true;
                completeMatch(match.id, winnerPlayerNumber);
                foundAdvancement = true;
            }
        });
        
        if (foundAdvancement) {
            console.log(`Auto-advancement iteration ${iterations} completed`);
        }
    }
    
    console.log(`Auto-advancement finished after ${iterations} iterations`);
}

/**
 * WINNER SELECTION - CLEAN VERSION (replaces all old selectWinner functions)
 */
function selectWinnerClean(matchId, playerNumber) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }
    
    // Can only select winner if match is active/live
    if (!match.active) {
        alert('Match must be active to select winner');
        return false;
    }
    
    const winner = playerNumber === 1 ? match.player1 : match.player2;
    
    // Cannot select walkover or TBD as winner
    if (isWalkover(winner) || winner.name === 'TBD') {
        alert('Cannot select walkover or TBD as winner');
        return false;
    }
    
    // Complete the match using ONLY our lookup table system
    const success = completeMatch(matchId, playerNumber);
    
    if (success) {
        // Re-render bracket
        if (typeof renderBracket === 'function') {
            renderBracket();
        }
        
        // Refresh lane dropdowns if available
        if (typeof refreshAllLaneDropdowns === 'function') {
            setTimeout(refreshAllLaneDropdowns, 100);
        }
    }
    
    return success;
}

/**
 * DEBUG FUNCTION: Show progression for a specific match
 */
function debugProgression(matchId) {
    if (!tournament || !tournament.bracketSize) {
        console.log('No tournament active');
        return;
    }
    
    const progression = MATCH_PROGRESSION[tournament.bracketSize];
    const rule = progression?.[matchId];
    
    if (rule) {
        console.log(`=== PROGRESSION FOR ${matchId} ===`);
        console.log(`Winner goes to: ${rule.winner?.[0]}.${rule.winner?.[1]}`);
        console.log(`Loser goes to: ${rule.loser?.[0]}.${rule.loser?.[1] || 'eliminated'}`);
    } else {
        console.log(`No progression rule for ${matchId}`);
    }
}

/**
 * DISABLE OLD PROGRESSION FUNCTIONS - Prevent conflicts with new system
 */
function disableOldProgressionSystem() {
    // Override old functions to prevent conflicts
    if (typeof window !== 'undefined') {
        window.advanceWinner = function() { 
            console.log('Old advanceWinner disabled - using new lookup system'); 
        };
        window.advanceBacksideWinner = function() { 
            console.log('Old advanceBacksideWinner disabled - using new lookup system'); 
        };
        window.dropFrontsideLoser = function() { 
            console.log('Old dropFrontsideLoser disabled - using new lookup system'); 
        };
        window.processAutoAdvancementForMatch = function() { 
            console.log('Old processAutoAdvancementForMatch disabled'); 
        };
        window.forceBacksideAutoAdvancement = function() { 
            console.log('Old forceBacksideAutoAdvancement disabled'); 
        };
    }
}

// Disable old system immediately when this file loads
disableOldProgressionSystem();

/**
 * CLEAN BRACKET GENERATION: Real players first, walkovers last, never walkover vs walkover
 */
function generateCleanBracket() {
    if (!tournament) {
        alert('Please create a tournament first');
        return false;
    }

    // Check if bracket already exists
    if (tournament.bracket && matches.length > 0) {
        alert('Tournament is already in progress! Use "Reset Tournament" to start over.');
        return false;
    }

    const paidPlayers = players.filter(p => p.paid);
    if (paidPlayers.length < 4) {
        alert('At least 4 paid players are required to generate an 8-player double-elimination tournament.');
        console.error('Bracket generation blocked: fewer than 4 paid players');
        return false;
    }

    // Determine bracket size
    let bracketSize;
    if (paidPlayers.length <= 8) bracketSize = 8;
    else if (paidPlayers.length <= 16) bracketSize = 16;
    else if (paidPlayers.length <= 32) bracketSize = 32;
    else bracketSize = 48;

    if (bracketSize === 8 && paidPlayers.length < 4) {
        alert('At least 4 paid players are required to generate an 8-player double-elimination tournament.');
        console.error('Bracket generation blocked for 8-player bracket: fewer than 4 paid players');
        return false;
    }

    // Create optimized bracket: real players first, walkovers strategically placed
    console.log(`Generating ${bracketSize}-player bracket for ${paidPlayers.length} players`);

    const bracket = createOptimizedBracketV2(paidPlayers, bracketSize);
    if (!bracket) {
        alert('Unable to generate a valid bracket without bye vs bye in Round 1. Please add more players or try again.');
        console.error('Bracket generation failed: createOptimizedBracketV2 returned null');
        return false;
    }

    if (!bracket) {
    alert('Unable to generate a valid bracket without bye vs bye in Round 1. Please add more players or try again.');
    console.error('Bracket generation failed: createOptimizedBracketV2 returned null');
    return false;
    }
    
    // Store bracket info
    tournament.bracket = bracket;
    tournament.bracketSize = bracketSize;
    tournament.status = 'active';

    // Generate all match structures with clean TBD placeholders
    generateAllMatches(bracket, bracketSize);
    
    // Process initial auto-advancements (real vs walkover)
    processAutoAdvancements();
    
    // Save and render
    if (typeof saveTournament === 'function') {
        saveTournament();
    }
    
    if (typeof renderBracket === 'function') {
        renderBracket();
    }
    
    console.log(`✓ Clean bracket generated: ${bracketSize} positions, ${paidPlayers.length} real players`);
    
    if (typeof showPage === 'function') {
        showPage('tournament');
    }
    
    return true;
}

/**
 * CREATE OPTIMIZED BRACKET: Two-pass seeding to avoid bye-vs-bye in FS Round 1
 * - Pass 1: Fill first seat of each FS-1 match (indices 0,2,4,...)
 * - Pass 2: Fill second seat of each FS-1 match (indices 1,3,5,...)
 * - Remaining slots become walkovers
 * Works for bracketSize 8, 16, 32
 */
function createOptimizedBracketV2(players, bracketSize) {
  // Defensive checks
  if (!Array.isArray(players)) {
    console.error('createOptimizedBracketV2: players must be an array');
    return null;
  }
  if (![8, 16, 32].includes(bracketSize)) {
    console.warn(`createOptimizedBracketV2: unexpected bracketSize=${bracketSize}; proceeding with two-pass seeding`);
  }

  const P = players.length;
  const K = bracketSize;
  const numWalkovers = Math.max(0, K - P);

  console.log(`Creating bracket: ${P} real players, ${numWalkovers} walkovers, size=${K}`);

  // Shuffle players to ensure perceived randomness
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  // Two-pass fill
  const bracket = new Array(K);

  // Pass 1: fill first seats (one real in every FS-1 match if P >= K/2)
  let idx = 0;
  for (let pos = 0; pos < K && idx < shuffledPlayers.length; pos += 2) {
    bracket[pos] = shuffledPlayers[idx++];
  }

  // Pass 2: fill second seats
  for (let pos = 1; pos < K && idx < shuffledPlayers.length; pos += 2) {
    bracket[pos] = shuffledPlayers[idx++];
  }

  // Fill remaining with walkovers
  for (let i = 0; i < K; i++) {
    if (!bracket[i]) {
      bracket[i] = createWalkoverPlayer(i);
    }
  }

  // Sanity validation: ensure no FS-1 bye-vs-bye
  const firstRoundMatches = K / 2;
  let invalidPairs = 0;
  for (let m = 0; m < firstRoundMatches; m++) {
    const a = bracket[m * 2];
    const b = bracket[m * 2 + 1];
    const aIsBye = isWalkover ? isWalkover(a) : a?.isBye === true || a?.name === 'Walkover';
    const bIsBye = isWalkover ? isWalkover(b) : b?.isBye === true || b?.name === 'Walkover';
    if (aIsBye && bIsBye) invalidPairs++;
  }

  if (invalidPairs > 0) {
    // This should never happen with two-pass + your upstream minimums
    console.error(`createOptimizedBracketV2: unexpected ${invalidPairs} bye-vs-bye pairs in FS-1`);
    return null;
  }

  console.log('✓ Two-pass seeding completed (no FS-1 bye-vs-bye)');
  return bracket;
}

/**
 * CREATE WALKOVER PLAYER OBJECT
 */
function createWalkoverPlayer(index) {
    return {
        id: `walkover-${index}`,
        name: 'Walkover',
        isBye: true
    };
}

/**
 * GENERATE ALL MATCHES WITH CLEAN TBD PLACEHOLDERS
 */
function generateAllMatches(bracket, bracketSize) {
    matches = []; // Clear existing matches
    
    const structure = calculateCleanBracketStructure(bracketSize);
    let matchId = 1;
    
    console.log('Generating frontside matches...');
    generateFrontsideMatches(bracket, structure, matchId);
    matchId = matches.length + 1;
    
    console.log('Generating backside matches...');
    generateBacksideMatches(structure, matchId);
    matchId = matches.length + 1;
    
    console.log('Generating final matches...');
    generateFinalMatches(matchId);
    
    console.log(`✓ Generated ${matches.length} matches total`);
}

/**
 * CALCULATE CLEAN BRACKET STRUCTURE (rounds and matches per round)
 */
function calculateCleanBracketStructure(bracketSize) {
    const frontsideRounds = Math.ceil(Math.log2(bracketSize));
    
    // Frontside structure
    const frontside = [];
    for (let round = 1; round <= frontsideRounds; round++) {
        const matchesInRound = Math.pow(2, frontsideRounds - round);
        frontside.push({
            round: round,
            matches: matchesInRound
        });
    }
    
    // Backside structure (hardcoded based on bracket size)
    let backside = [];
    if (bracketSize === 8) {
        backside = [
            { round: 1, matches: 2 },
            { round: 2, matches: 2 },
            { round: 3, matches: 1 }
        ];
    } else if (bracketSize === 16) {
        backside = [
            { round: 1, matches: 4 },
            { round: 2, matches: 4 },
            { round: 3, matches: 2 },
            { round: 4, matches: 2 },
            { round: 5, matches: 1 }
        ];
} else if (bracketSize === 32) {
    backside = [
        { round: 1, matches: 8 },
        { round: 2, matches: 8 },
        { round: 3, matches: 6 },
        { round: 4, matches: 4 },
        { round: 5, matches: 2 },
        { round: 6, matches: 1 } // The hump - only 1 match

    ];
}
    
    return { frontside, backside, frontsideRounds };
}

/**
 * GENERATE FRONTSIDE MATCHES
 */
function generateFrontsideMatches(bracket, structure, startId) {
    let matchId = startId;
    
    structure.frontside.forEach((roundInfo, roundIndex) => {
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            let player1, player2;
            
            if (roundIndex === 0) {
                // First round: use actual players from bracket
                const playerIndex = matchIndex * 2;
                player1 = bracket[playerIndex] || createTBDPlayer(`fs-1-${matchIndex}-1`);
                player2 = bracket[playerIndex + 1] || createTBDPlayer(`fs-1-${matchIndex}-2`);
            } else {
                // Later rounds: TBD players (winners from previous rounds)
                player1 = createTBDPlayer(`fs-${roundInfo.round}-${matchIndex}-1`);
                player2 = createTBDPlayer(`fs-${roundInfo.round}-${matchIndex}-2`);
            }
            
            const match = {
                id: `FS-${roundInfo.round}-${matchIndex + 1}`,
                numericId: matchId++,
                round: roundInfo.round,
                side: 'frontside',
                player1: player1,
                player2: player2,
                winner: null,
                loser: null,
                lane: null,
                legs: roundInfo.round === structure.frontsideRounds ? config.legs.semifinal : config.legs.regularRounds,
                referee: null,
                active: false,
                completed: false,
                positionInRound: matchIndex
            };
            
            matches.push(match);
        }
    });
}

/**
 * GENERATE BACKSIDE MATCHES
 */
function generateBacksideMatches(structure, startId) {
    let matchId = startId;
    
    structure.backside.forEach((roundInfo) => {
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            // All backside matches start with TBD players
            const player1 = createTBDPlayer(`bs-${roundInfo.round}-${matchIndex}-1`);
            const player2 = createTBDPlayer(`bs-${roundInfo.round}-${matchIndex}-2`);
	    const isLastBacksideRound = roundInfo.round === Math.max(...structure.backside.map(r => r.round));
            
            const match = {
                id: `BS-${roundInfo.round}-${matchIndex + 1}`,
                numericId: matchId++,
                round: roundInfo.round,
                side: 'backside',
                player1: player1,
                player2: player2,
                winner: null,
                loser: null,
                lane: null,
                legs: isLastBacksideRound ? config.legs.semifinal : config.legs.regularRounds,
                referee: null,
                active: false,
                completed: false,
                positionInRound: matchIndex
            };
            
            matches.push(match);
        }
    });
}

/**
 * GENERATE FINAL MATCHES
 */
function generateFinalMatches(startId) {
    // Backside Final
    const backsideFinal = {
        id: 'BS-FINAL',
        numericId: startId,
        round: 'final',
        side: 'backside-final',
        player1: createTBDPlayer('bs-final-1'),
        player2: createTBDPlayer('bs-final-2'),
        winner: null,
        loser: null,
        lane: null,
        legs: config.legs.backsideFinal,
        referee: null,
        active: false,
        completed: false
    };
    
    // Grand Final
    const grandFinal = {
        id: 'GRAND-FINAL',
        numericId: startId + 1,
        round: 'grand-final',
        side: 'grand-final',
        player1: createTBDPlayer('grand-final-1'),
        player2: createTBDPlayer('grand-final-2'),
        winner: null,
        loser: null,
        lane: null,
        legs: config.legs.grandFinal,
        referee: null,
        active: false,
        completed: false
    };
    
    matches.push(backsideFinal);
    matches.push(grandFinal);
}

/**
 * CREATE TBD PLAYER OBJECT
 */
function createTBDPlayer(id) {
    return {
        id: id,
        name: 'TBD'
    };
}

/**
 * TOGGLE MATCH ACTIVE STATE - Simple match activation/deactivation
 */
function toggleActive(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }
    
    const currentState = getMatchState(match);
    
    // Can only toggle between READY and LIVE states
    if (currentState === 'pending') {
        alert('Cannot start match: Players not yet determined');
        return false;
    }
    
    if (currentState === 'completed') {
        alert('Match is already completed');
        return false;
    }
    
    // Toggle active state
    match.active = !match.active;
    
    console.log(`Match ${matchId} ${match.active ? 'activated' : 'deactivated'}`);
    
    // Save and render
    if (typeof saveTournament === 'function') {
        saveTournament();
    }
    
    if (typeof renderBracket === 'function') {
        renderBracket();
    }
    
    return true;
}

/**
 * SIMPLE MATCH STATE GETTER - Determines current match state
 */
function getMatchState(match) {
    if (!match) return 'pending';
    
    if (match.completed) return 'completed';
    if (match.active) return 'live';
    
    // Check if both players are ready (not TBD or walkover)
    if (canMatchStart(match)) return 'ready';
    
    return 'pending';
}

/**
 * CHECK IF MATCH CAN START - Both players must be real
 */
function canMatchStart(match) {
    if (!match || !match.player1 || !match.player2) return false;
    
    const player1Valid = match.player1.name !== 'TBD' && !match.player1.isBye;
    const player2Valid = match.player2.name !== 'TBD' && !match.player2.isBye;
    
    return player1Valid && player2Valid;
}

/**
 * UPDATE MATCH LANE - Simple lane assignment
 */
function updateMatchLane(matchId, newLane) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }
    
    match.lane = newLane ? parseInt(newLane) : null;
    
    console.log(`Lane updated for ${matchId}: ${match.lane || 'none'}`);
    
    if (typeof saveTournament === 'function') {
        saveTournament();
    }
    
    return true;
}

/**
 * DEBUG: Show bracket generation results
 */
function debugBracketGeneration() {
    if (!tournament || !tournament.bracket) {
        console.log('No bracket generated yet');
    }
    
    console.log('=== BRACKET GENERATION DEBUG ===');
    console.log(`Bracket size: ${tournament.bracketSize}`);
    console.log(`Total matches: ${matches.length}`);
    
    // Show first round matches
    const firstRound = matches.filter(m => m.side === 'frontside' && m.round === 1);
    console.log(`First round matches: ${firstRound.length}`);
    
    firstRound.forEach(match => {
        const p1 = match.player1?.name || 'Empty';
        const p2 = match.player2?.name || 'Empty';
        const p1Type = isWalkover(match.player1) ? 'WALKOVER' : 'REAL';
        const p2Type = isWalkover(match.player2) ? 'WALKOVER' : 'REAL';
        
        console.log(`${match.id}: ${p1} (${p1Type}) vs ${p2} (${p2Type})`);
    });
    
    // Check for auto-advancement opportunities
    const autoAdvanceMatches = matches.filter(shouldAutoAdvance);
    console.log(`Matches ready for auto-advancement: ${autoAdvanceMatches.length}`);
}

// Make functions globally available and OVERRIDE old functions
if (typeof window !== 'undefined') {
    // NEW CLEAN FUNCTIONS
    window.advancePlayer = advancePlayer;
    window.completeMatch = completeMatch;
    window.selectWinnerClean = selectWinnerClean;
    window.processAutoAdvancements = processAutoAdvancements;
    window.debugProgression = debugProgression;
    window.generateCleanBracket = generateCleanBracket;
    window.debugBracketGeneration = debugBracketGeneration;
    window.toggleActive = toggleActive;
    window.getMatchState = getMatchState;
    window.updateMatchLane = updateMatchLane;
    window.MATCH_PROGRESSION = MATCH_PROGRESSION;
    
    // OVERRIDE OLD FUNCTIONS - Replace with clean versions
    window.selectWinner = selectWinnerClean;
    window.selectWinnerV2 = selectWinnerClean;
    window.selectWinnerWithValidation = selectWinnerClean;
    window.selectWinnerWithAutoAdvancement = selectWinnerClean;
    window.generateBracket = generateCleanBracket;
    
    console.log('✅ Clean match progression system loaded - old system disabled');
}
