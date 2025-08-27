// walkover-advancement.js - Phase 3: Fixed Walkover Auto-Advancement System

/**
 * Hardcoded advancement rules for all bracket sizes
 * Format: matchId -> { winner: [targetMatchId, slot], loser: [targetMatchId, slot] }
 */
const ADVANCEMENT_RULES = {
    8: {
        // Frontside advancement
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-1', 'player2'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-2', 'player2'] },
        'FS-3-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },
        
        // Backside advancement
        'BS-1-1': { winner: ['BS-2-1', 'player1'] },
        'BS-1-2': { winner: ['BS-2-2', 'player1'] },
        'BS-2-1': { winner: ['BS-FINAL', 'player2'] },
        'BS-2-2': { winner: ['BS-FINAL', 'player2'] },
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] }
    },
    
    16: {
        // Frontside advancement
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-1-5': { winner: ['FS-2-3', 'player1'], loser: ['BS-1-3', 'player1'] },
        'FS-1-6': { winner: ['FS-2-3', 'player2'], loser: ['BS-1-3', 'player2'] },
        'FS-1-7': { winner: ['FS-2-4', 'player1'], loser: ['BS-1-4', 'player1'] },
        'FS-1-8': { winner: ['FS-2-4', 'player2'], loser: ['BS-1-4', 'player2'] },
        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-1', 'player1'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-2', 'player1'] },
        'FS-2-3': { winner: ['FS-3-2', 'player1'], loser: ['BS-2-3', 'player1'] },
        'FS-2-4': { winner: ['FS-3-2', 'player2'], loser: ['BS-2-4', 'player1'] },
        'FS-3-1': { winner: ['FS-4-1', 'player1'], loser: ['BS-3-1', 'player2'] },
        'FS-3-2': { winner: ['FS-4-1', 'player2'], loser: ['BS-3-2', 'player2'] },
        'FS-4-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },
        
        // Backside advancement
        'BS-1-1': { winner: ['BS-2-1', 'player2'] },
        'BS-1-2': { winner: ['BS-2-2', 'player2'] },
        'BS-1-3': { winner: ['BS-2-3', 'player2'] },
        'BS-1-4': { winner: ['BS-2-4', 'player2'] },
        'BS-2-1': { winner: ['BS-3-1', 'player1'] },
        'BS-2-2': { winner: ['BS-3-1', 'player1'] },
        'BS-2-3': { winner: ['BS-3-2', 'player1'] },
        'BS-2-4': { winner: ['BS-3-2', 'player1'] },
        'BS-3-1': { winner: ['BS-FINAL', 'player2'] },
        'BS-3-2': { winner: ['BS-FINAL', 'player2'] },
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] }
    },
    
    32: {
        // Frontside Round 1
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-1-5': { winner: ['FS-2-3', 'player1'], loser: ['BS-1-3', 'player1'] },
        'FS-1-6': { winner: ['FS-2-3', 'player2'], loser: ['BS-1-3', 'player2'] },
        'FS-1-7': { winner: ['FS-2-4', 'player1'], loser: ['BS-1-4', 'player1'] },
        'FS-1-8': { winner: ['FS-2-4', 'player2'], loser: ['BS-1-4', 'player2'] },
        'FS-1-9': { winner: ['FS-2-5', 'player1'], loser: ['BS-1-5', 'player1'] },
        'FS-1-10': { winner: ['FS-2-5', 'player2'], loser: ['BS-1-5', 'player2'] },
        'FS-1-11': { winner: ['FS-2-6', 'player1'], loser: ['BS-1-6', 'player1'] },
        'FS-1-12': { winner: ['FS-2-6', 'player2'], loser: ['BS-1-6', 'player2'] },
        'FS-1-13': { winner: ['FS-2-7', 'player1'], loser: ['BS-1-7', 'player1'] },
        'FS-1-14': { winner: ['FS-2-7', 'player2'], loser: ['BS-1-7', 'player2'] },
        'FS-1-15': { winner: ['FS-2-8', 'player1'], loser: ['BS-1-8', 'player1'] },
        'FS-1-16': { winner: ['FS-2-8', 'player2'], loser: ['BS-1-8', 'player2'] },
        
        // Frontside Round 2
        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-1', 'player1'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-2', 'player1'] },
        'FS-2-3': { winner: ['FS-3-2', 'player1'], loser: ['BS-2-3', 'player1'] },
        'FS-2-4': { winner: ['FS-3-2', 'player2'], loser: ['BS-2-4', 'player1'] },
        'FS-2-5': { winner: ['FS-3-3', 'player1'], loser: ['BS-2-5', 'player1'] },
        'FS-2-6': { winner: ['FS-3-3', 'player2'], loser: ['BS-2-6', 'player1'] },
        'FS-2-7': { winner: ['FS-3-4', 'player1'], loser: ['BS-2-7', 'player1'] },
        'FS-2-8': { winner: ['FS-3-4', 'player2'], loser: ['BS-2-8', 'player1'] },
        
        // Frontside Round 3
        'FS-3-1': { winner: ['FS-4-1', 'player1'], loser: ['BS-3-1', 'player2'] },
        'FS-3-2': { winner: ['FS-4-1', 'player2'], loser: ['BS-3-2', 'player2'] },
        'FS-3-3': { winner: ['FS-4-2', 'player1'], loser: ['BS-3-3', 'player2'] },
        'FS-3-4': { winner: ['FS-4-2', 'player2'], loser: ['BS-3-4', 'player2'] },
        
        // Frontside Round 4
        'FS-4-1': { winner: ['FS-5-1', 'player1'], loser: ['BS-4-1', 'player2'] },
        'FS-4-2': { winner: ['FS-5-1', 'player2'], loser: ['BS-4-2', 'player2'] },
        
        // Frontside Final
        'FS-5-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-5-1', 'player1'] },
        
        // Backside advancement (simplified - full rules would be extensive)
        'BS-1-1': { winner: ['BS-2-1', 'player2'] },
        'BS-1-2': { winner: ['BS-2-1', 'player2'] },
        'BS-1-3': { winner: ['BS-2-2', 'player2'] },
        'BS-1-4': { winner: ['BS-2-2', 'player2'] },
        'BS-1-5': { winner: ['BS-2-3', 'player2'] },
        'BS-1-6': { winner: ['BS-2-3', 'player2'] },
        'BS-1-7': { winner: ['BS-2-4', 'player2'] },
        'BS-1-8': { winner: ['BS-2-4', 'player2'] },
        
        'BS-2-1': { winner: ['BS-3-1', 'player1'] },
        'BS-2-2': { winner: ['BS-3-1', 'player1'] },
        'BS-2-3': { winner: ['BS-3-2', 'player1'] },
        'BS-2-4': { winner: ['BS-3-2', 'player1'] },
        
        'BS-3-1': { winner: ['BS-4-1', 'player1'] },
        'BS-3-2': { winner: ['BS-4-1', 'player1'] },
        'BS-3-3': { winner: ['BS-4-2', 'player1'] },
        'BS-3-4': { winner: ['BS-4-2', 'player1'] },
        
        'BS-4-1': { winner: ['BS-5-1', 'player2'] },
        'BS-4-2': { winner: ['BS-5-1', 'player2'] },
        
        'BS-5-1': { winner: ['BS-FINAL', 'player2'] },
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] }
    }
    
    // 48-player rules would be added here following the same pattern
};

/**
 * FIXED: Check if a player is a walkover/bye
 * TBD players are NEVER byes - they represent future players or waiting opponents
 */
function isPlayerWalkover(player) {
    if (!player) return true;  // No player = bye
    
    // Only actual walkover/bye players should trigger auto-advancement
    return player.isBye === true || 
           player.name === 'Walkover' || 
           player.name === 'BYE' ||
           (player.id && player.id.toString().startsWith('walkover-')) ||
           (player.id && player.id.toString().startsWith('bye-'));
    
    // CRITICAL FIX: TBD players are NEVER treated as byes
    // TBD means "To Be Determined" - represents a future player, not a walkover
}

/**
 * Check if a match should auto-advance due to walkover
 * FIXED: Only auto-advance against actual walkovers, never against TBD players
 */
function shouldAutoAdvanceMatch(match) {
    if (!match || match.completed) return false;
    
    // Both players must be defined
    if (!match.player1 || !match.player2) return false;
    
    // NEVER auto-advance TBD vs TBD matches - they need real players
    if (match.player1.name === 'TBD' && match.player2.name === 'TBD') {
        return false;
    }
    
    // NEVER auto-advance Real Player vs TBD - TBD represents a future opponent
    if (match.player1.name === 'TBD' || match.player2.name === 'TBD') {
        return false;
    }
    
    // Only auto-advance if exactly one player is an actual walkover/bye
    const player1IsWalkover = isPlayerWalkover(match.player1);
    const player2IsWalkover = isPlayerWalkover(match.player2);
    
    const shouldAdvance = (player1IsWalkover && !player2IsWalkover) || 
                         (!player1IsWalkover && player2IsWalkover);
    
    if (shouldAdvance) {
        console.log(`Auto-advancing match ${match.id}: ${match.player1.name} vs ${match.player2.name}`);
    }
    
    return shouldAdvance;
}

/**
 * Auto-advance a match with walkover
 */
function autoAdvanceMatch(match) {
    if (!shouldAutoAdvanceMatch(match)) return false;
    
    const player1IsWalkover = isPlayerWalkover(match.player1);
    const player2IsWalkover = isPlayerWalkover(match.player2);
    
    let winner, loser;
    
    if (player1IsWalkover && !player2IsWalkover) {
        winner = match.player2;
        loser = match.player1;
    } else if (player2IsWalkover && !player1IsWalkover) {
        winner = match.player1;
        loser = match.player2;
    } else {
        return false; // Should not happen with fixed logic
    }
    
    console.log(`Auto-advancing ${winner.name} in ${match.id} (defeated ${loser.name})`);
    
    // Set match as completed with auto-advancement flag
    match.winner = winner;
    match.loser = loser;
    match.completed = true;
    match.autoAdvanced = true;
    
    // Process advancement using hardcoded rules or new bracket-specific advancement
    processMatchAdvancement(match);
    
    return true;
}

/**
 * Process match advancement - connects to the bracket-specific advancement system
 */
function processMatchAdvancement(completedMatch) {
    console.log('Processing advancement for', completedMatch.id);
    
    if (completedMatch.side === 'frontside') {
        // Use the advanceWinner function from bracket-generation.js
        if (typeof advanceWinner === 'function') {
            advanceWinner(completedMatch);
        } else {
            console.error('advanceWinner function not found');
        }
    } else if (completedMatch.side === 'backside') {
        // Use the advanceBacksideWinner function from bracket-generation.js
        if (typeof advanceBacksideWinner === 'function') {
            advanceBacksideWinner(completedMatch, completedMatch.winner);
        } else {
            console.error('advanceBacksideWinner function not found');
        }
    } else if (completedMatch.side === 'backside-final') {
        // Handle backside final advancement
        if (typeof advanceBacksideFinalWinner === 'function') {
            advanceBacksideFinalWinner(completedMatch, completedMatch.winner);
        }
    } else if (completedMatch.side === 'grand-final') {
        // Handle grand final
        if (typeof crownChampion === 'function') {
            crownChampion(completedMatch, completedMatch.winner);
        }
    }
}

/**
 * Process all possible auto-advancements in the tournament
 */
function processAllAutoAdvancements() {
    if (!matches || matches.length === 0) return;
    
    let foundAdvancement = true;
    let iterations = 0;
    const maxIterations = 20; // Prevent infinite loops
    
    console.log('Starting auto-advancement processing...');
    
    while (foundAdvancement && iterations < maxIterations) {
        foundAdvancement = false;
        iterations++;
        
        // Check all matches for auto-advancement opportunities
        matches.forEach(match => {
            if (shouldAutoAdvanceMatch(match)) {
                autoAdvanceMatch(match);
                foundAdvancement = true;
            }
        });
        
        if (foundAdvancement) {
            console.log(`Auto-advancement iteration ${iterations} completed`);
        }
    }
    
    if (iterations >= maxIterations) {
        console.warn('Auto-advancement stopped after maximum iterations');
    } else {
        console.log(`Auto-advancement completed after ${iterations} iterations`);
    }
}

/**
 * Enhanced match completion that triggers auto-advancement
 */
function completeMatchWithAdvancement(matchId, winnerPlayerNumber) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return false;
    
    // Validate using existing state system
    const currentState = getMatchState ? getMatchState(match) : 'unknown';
    if (currentState !== 'live') {
        console.error(`Cannot complete match ${matchId}: not in live state (${currentState})`);
        return false;
    }
    
    const winner = winnerPlayerNumber === 1 ? match.player1 : match.player2;
    const loser = winnerPlayerNumber === 1 ? match.player2 : match.player1;
    
    if (isPlayerWalkover(winner)) {
        console.error('Cannot select walkover as winner');
        return false;
    }
    
    // Complete the match
    match.winner = winner;
    match.loser = loser;
    match.completed = true;
    match.autoAdvanced = false; // Manual completion
    
    // Transition to completed state
    if (typeof transitionMatchState === 'function') {
        transitionMatchState(match, 'completed');
    }
    
    console.log(`Match ${matchId} completed: ${winner.name} defeats ${loser.name}`);
    
    // Process advancement
    processMatchAdvancement(match);
    
    // Trigger cascading auto-advancements (only against actual walkovers)
    processAllAutoAdvancements();
    
    return true;
}

/**
 * Debug function for auto-advancement system
 */
function debugAutoAdvancement() {
    console.log('=== AUTO-ADVANCEMENT DEBUG ===');
    
    if (!matches || matches.length === 0) {
        console.log('No matches found');
        return;
    }
    
    const bracketSize = tournament?.bracketSize || 8;
    console.log(`Bracket size: ${bracketSize}`);
    console.log(`Total matches: ${matches.length}`);
    
    // Check for auto-advancement opportunities
    let autoAdvanceable = 0;
    let completed = 0;
    let autoCompleted = 0;
    let waitingForOpponent = 0;
    
    matches.forEach(match => {
        if (match.completed) {
            completed++;
            if (match.autoAdvanced) {
                autoCompleted++;
            }
        } else if (shouldAutoAdvanceMatch(match)) {
            autoAdvanceable++;
            console.log(`Can auto-advance: ${match.id} (${match.player1?.name} vs ${match.player2?.name})`);
        } else if ((match.player1?.name === 'TBD') !== (match.player2?.name === 'TBD')) {
            // One TBD, one real player = waiting for opponent
            waitingForOpponent++;
            const waitingPlayer = match.player1?.name === 'TBD' ? match.player2?.name : match.player1?.name;
            console.log(`Waiting for opponent: ${match.id} (${waitingPlayer} vs TBD)`);
        }
    });
    
    console.log(`Completed matches: ${completed} (${autoCompleted} auto-advanced)`);
    console.log(`Matches ready for auto-advancement: ${autoAdvanceable}`);
    console.log(`Matches waiting for opponents: ${waitingForOpponent}`);
    
    return {
        bracketSize,
        totalMatches: matches.length,
        completed,
        autoCompleted,
        autoAdvanceable,
        waitingForOpponent
    };
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.isPlayerWalkover = isPlayerWalkover;
    window.shouldAutoAdvanceMatch = shouldAutoAdvanceMatch;
    window.autoAdvanceMatch = autoAdvanceMatch;
    window.processAllAutoAdvancements = processAllAutoAdvancements;
    window.completeMatchWithAdvancement = completeMatchWithAdvancement;
    window.debugAutoAdvancement = debugAutoAdvancement;
    window.processMatchAdvancement = processMatchAdvancement;
}
