// match-state-system.js - Phase 1: Core State Management System

// Match state definitions
const MATCH_STATES = {
    PENDING: 'pending',     // Not ready to play (missing players/TBD)
    READY: 'ready',         // Both players known, can be started
    LIVE: 'live',           // Currently being played
    COMPLETED: 'completed'  // Finished with winner
};

// State transition validation rules
const STATE_TRANSITIONS = {
    [MATCH_STATES.PENDING]: [MATCH_STATES.READY],
    [MATCH_STATES.READY]: [MATCH_STATES.LIVE],
    [MATCH_STATES.LIVE]: [MATCH_STATES.COMPLETED],
    [MATCH_STATES.COMPLETED]: [MATCH_STATES.LIVE] // For undo
};

/**
 * Get the current state of a match based on its properties
 */
function getMatchState(match) {
    if (!match) return MATCH_STATES.PENDING;
    
    // If match is completed, it's completed
    if (match.completed) {
        return MATCH_STATES.COMPLETED;
    }
    
    // If match is active/live, it's live
    if (match.active) {
        return MATCH_STATES.LIVE;
    }
    
    // Check if both players are real (not TBD/Walkover)
    if (canMatchStart(match)) {
        return MATCH_STATES.READY;
    }
    
    // Default to pending
    return MATCH_STATES.PENDING;
}

/**
 * Check if a match can start (both players are real)
 */
function canMatchStart(match) {
    if (!match || !match.player1 || !match.player2) return false;
    
    // Both players must exist and not be TBD or walkovers
    const player1Valid = match.player1.name !== 'TBD' && !match.player1.isBye;
    const player2Valid = match.player2.name !== 'TBD' && !match.player2.isBye;
    
    return player1Valid && player2Valid;
}

/**
 * Check if a state transition is valid
 */
function canTransitionTo(match, newState) {
    const currentState = getMatchState(match);
    const validTransitions = STATE_TRANSITIONS[currentState] || [];
    return validTransitions.includes(newState);
}

/**
 * Transition match to a new state with validation
 */
function transitionMatchState(match, newState) {
    if (!match) {
        console.error('Cannot transition null match');
        return false;
    }
    
    const currentState = getMatchState(match);
    
    if (!canTransitionTo(match, newState)) {
        console.error(`Invalid state transition: ${currentState} -> ${newState} for match ${match.id}`);
        return false;
    }
    
    // Apply the state change to match properties
    switch (newState) {
        case MATCH_STATES.PENDING:
            match.active = false;
            match.completed = false;
            break;
            
        case MATCH_STATES.READY:
            match.active = false;
            match.completed = false;
            break;
            
        case MATCH_STATES.LIVE:
            match.active = true;
            match.completed = false;
            break;
            
        case MATCH_STATES.COMPLETED:
            match.active = false;
            match.completed = true;
            break;
    }
    
    console.log(`Match ${match.id} transitioned: ${currentState} -> ${newState}`);
    return true;
}

/**
 * Enhanced winner selection with state validation
 */
function selectWinnerWithValidation(matchId, playerNumber) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    const currentState = getMatchState(match);
    
    // Can only select winner if match is LIVE
    if (currentState !== MATCH_STATES.LIVE) {
        alert(`Cannot select winner: Match must be LIVE (currently ${currentState})`);
        return false;
    }

    const winner = playerNumber === 1 ? match.player1 : match.player2;
    const loser = playerNumber === 1 ? match.player2 : match.player1;

    // Validate winner is not a bye/walkover
    if (!winner || winner.isBye || winner.name === 'TBD') {
        alert('Cannot select a bye or TBD player as winner');
        return false;
    }

    // Toggle winner selection - if clicking same player, clear the winner (undo)
    if (match.winner?.id === winner.id) {
        // Undo - transition back to LIVE
        match.winner = null;
        match.loser = null;
        transitionMatchState(match, MATCH_STATES.LIVE);
        
        // TODO: Implement reverse advancement logic in later phases
        console.log(`Winner cleared for match ${matchId} - undo functionality`);
        
    } else {
        // Set new winner and transition to COMPLETED
        match.winner = winner;
        match.loser = loser;
        transitionMatchState(match, MATCH_STATES.COMPLETED);

        console.log(`Winner selected: ${winner.name} defeats ${loser.name} in ${matchId}`);
        
        // TODO: Handle bracket progression logic in later phases
    }

    saveTournament();
    renderBracket();
    return true;
}

/**
 * Enhanced toggle active function with state management
 */
function toggleActiveWithValidation(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    const currentState = getMatchState(match);
    
    if (currentState === MATCH_STATES.PENDING) {
        alert('Cannot start match: Players not yet determined');
        return false;
    }
    
    if (currentState === MATCH_STATES.COMPLETED) {
        alert('Match is already completed');
        return false;
    }

    // Toggle between READY and LIVE
    if (currentState === MATCH_STATES.READY) {
        // TODO: Add lane validation warning in Phase 2
        transitionMatchState(match, MATCH_STATES.LIVE);
    } else if (currentState === MATCH_STATES.LIVE) {
        transitionMatchState(match, MATCH_STATES.READY);
    }

    saveTournament();
    renderBracket();
    return true;
}

/**
 * Get CSS classes for match based on state
 */
function getMatchStateClasses(match) {
    const state = getMatchState(match);
    const classes = ['bracket-match'];
    
    switch (state) {
        case MATCH_STATES.PENDING:
            classes.push('match-pending');
            break;
        case MATCH_STATES.READY:
            classes.push('match-ready');
            break;
        case MATCH_STATES.LIVE:
            classes.push('match-live', 'active');
            break;
        case MATCH_STATES.COMPLETED:
            classes.push('match-completed', 'completed');
            break;
    }
    
    return classes.join(' ');
}

/**
 * Get button text based on match state
 */
function getMatchButtonText(match) {
    const state = getMatchState(match);
    
    switch (state) {
        case MATCH_STATES.PENDING:
            return 'Waiting';
        case MATCH_STATES.READY:
            return 'Start';
        case MATCH_STATES.LIVE:
            return 'LIVE';
        case MATCH_STATES.COMPLETED:
            return 'Done';
        default:
            return 'Unknown';
    }
}

/**
 * Check if winner selection should be enabled for a match
 */
function canSelectWinner(match, playerNumber) {
    const state = getMatchState(match);
    
    if (state !== MATCH_STATES.LIVE) {
        return false;
    }
    
    const player = playerNumber === 1 ? match.player1 : match.player2;
    return player && !player.isBye && player.name !== 'TBD';
}

/**
 * Debug function to show all match states
 */
function debugMatchStates() {
    console.log('=== MATCH STATES DEBUG ===');
    matches.forEach(match => {
        const state = getMatchState(match);
        console.log(`${match.id}: ${state} | P1: ${match.player1?.name} | P2: ${match.player2?.name} | Winner: ${match.winner?.name || 'None'}`);
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MATCH_STATES,
        getMatchState,
        canTransitionTo,
        transitionMatchState,
        selectWinnerWithValidation,
        toggleActiveWithValidation,
        getMatchStateClasses,
        getMatchButtonText,
        canSelectWinner,
        canMatchStart,
        debugMatchStates
    };
}

// Make debug function globally available
window.debugMatchStates = debugMatchStates;

/**
 * Enhanced winner selection with auto-advancement
 */
function selectWinnerWithAutoAdvancement(matchId, playerNumber) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    const currentState = getMatchState(match);
    
    // Can only select winner if match is LIVE
    if (currentState !== 'live') {
        alert(`Cannot select winner: Match must be LIVE (currently ${currentState})`);
        return false;
    }

    const winner = playerNumber === 1 ? match.player1 : match.player2;
    const loser = playerNumber === 1 ? match.player2 : match.player1;

    // Validate winner is not a bye/walkover
    if (!winner || (typeof isPlayerWalkover === 'function' && isPlayerWalkover(winner))) {
        alert('Cannot select a bye or TBD player as winner');
        return false;
    }

    // Toggle winner selection - if clicking same player, clear the winner (undo)
    if (match.winner?.id === winner.id) {
        // Undo - this will be handled in Phase 6
        console.log('Undo functionality - Phase 6 implementation needed');
        alert('Undo functionality will be implemented in Phase 6');
        return false;
        
    } else {
        // Complete match with advancement
        if (typeof completeMatchWithAdvancement === 'function') {
            const success = completeMatchWithAdvancement(matchId, playerNumber);
            
            if (success) {
                saveTournament();
                
                // Refresh bracket display
                if (typeof renderBracket === 'function') {
                    renderBracket();
                }
                
                // Refresh lane dropdowns if available
                if (typeof refreshAllLaneDropdowns === 'function') {
                    setTimeout(refreshAllLaneDropdowns, 100);
                }
                
                return true;
            }
        } else {
            // Fallback to old system
            match.winner = winner;
            match.loser = loser;
            match.completed = true;
            transitionMatchState(match, 'completed');
            
            console.log(`Winner selected: ${winner.name} defeats ${loser.name} in ${matchId}`);
            
            saveTournament();
            renderBracket();
        }
    }

    return false;
}