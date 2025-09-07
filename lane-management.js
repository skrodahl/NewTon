// lane-management.js - Phase 2: Lane Management System

// Add lane configuration to global config
if (typeof config !== 'undefined') {
    config.lanes = config.lanes || {
        maxLanes: 4,           // Maximum number of lanes available
        requireLaneForStart: false  // Whether to require lane before starting match
    };
}

/**
 * Get all lanes that are currently in use by LIVE matches
 */
function getUsedLanes() {
    if (!matches || matches.length === 0) return [];
    
    const usedLanes = [];
    matches.forEach(match => {
        // Only LIVE matches hold their lanes
        if (match.lane && getMatchState && getMatchState(match) === 'live') {
            usedLanes.push(parseInt(match.lane));
        }
    });
    
    return usedLanes;
}

/**
 * Get available lanes for a specific match (excluding its current lane)
 */
function getAvailableLanes(excludeMatchId) {
    const maxLanes = config.lanes?.maxLanes || 10;
    const usedLanes = getUsedLanes();
    
    // If we're updating an existing match, don't count its current lane as used
    if (excludeMatchId) {
        const currentMatch = matches.find(m => m.id === excludeMatchId);
        if (currentMatch && currentMatch.lane) {
            const currentLane = parseInt(currentMatch.lane);
            const index = usedLanes.indexOf(currentLane);
            if (index > -1) {
                usedLanes.splice(index, 1);
            }
        }
    }
    
    // Generate list of available lanes
    const availableLanes = [];
    for (let i = 1; i <= maxLanes; i++) {
        if (!usedLanes.includes(i)) {
            availableLanes.push(i);
        }
    }
    
    return availableLanes;
}

/**
 * Check if a specific lane is currently in use
 */
function isLaneInUse(laneNumber, excludeMatchId = null) {
    const usedLanes = getUsedLanes();
    const lane = parseInt(laneNumber);
    
    // If we're checking for a specific match, don't count its current lane
    if (excludeMatchId) {
        const currentMatch = matches.find(m => m.id === excludeMatchId);
        if (currentMatch && parseInt(currentMatch.lane) === lane) {
            return false; // Don't consider this match's own lane as "in use"
        }
    }
    
    return usedLanes.includes(lane);
}

/**
 * Validate lane assignments across all matches
 */
function validateLaneAssignments() {
    if (!matches || matches.length === 0) return { valid: true, conflicts: [] };
    
    const laneMap = new Map();
    const conflicts = [];
    
    matches.forEach(match => {
        if (match.lane && getMatchState && getMatchState(match) === 'live') {
            const lane = parseInt(match.lane);
            
            if (laneMap.has(lane)) {
                conflicts.push({
                    lane: lane,
                    matches: [laneMap.get(lane), match.id]
                });
            } else {
                laneMap.set(lane, match.id);
            }
        }
    });
    
    return {
        valid: conflicts.length === 0,
        conflicts: conflicts
    };
}

/**
 * Generate lane dropdown options HTML
 */
function generateLaneOptions(currentMatchId, currentLane = null) {
    const availableLanes = getAvailableLanes(currentMatchId);
    const maxLanes = config.lanes?.maxLanes || 10;
    
    let options = '<option value="">No lane</option>';
    
    for (let i = 1; i <= maxLanes; i++) {
        const isAvailable = availableLanes.includes(i);
        const isCurrent = currentLane && parseInt(currentLane) === i;
        
        // Show current lane even if it would normally be "in use"
        if (isAvailable || isCurrent) {
            const selected = isCurrent ? 'selected' : '';
            options += `<option value="${i}" ${selected}>${i}</option>`;
        } else {
            // Show unavailable lanes as disabled for reference
            options += `<option value="${i}" disabled style="color: #ccc;">${i} (in use)</option>`;
        }
    }
    
    return options;
}

/**
 * Refresh lane dropdowns for all visible matches
 */
function refreshAllLaneDropdowns() {
    if (!matches || matches.length === 0) return;
    
    matches.forEach(match => {
        const matchElement = document.getElementById(`bracket-match-${match.id}`);
        if (matchElement) {
            const dropdown = matchElement.querySelector('select[onchange*="updateMatchLane"]');
            if (dropdown) {
                const currentValue = dropdown.value;
                dropdown.innerHTML = generateLaneOptions(match.id, match.lane);
                
                // Maintain selection if still valid
                if (dropdown.querySelector(`option[value="${currentValue}"]`)) {
                    dropdown.value = currentValue;
                }
            }
        }
    });
}

/**
 * Enhanced toggle active with lane validation
 */
function toggleActiveWithLaneValidation(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    const currentState = getMatchState ? getMatchState(match) : 'unknown';
    
    // Use existing validation first
    if (typeof toggleActiveWithValidation === 'function') {
        const stateChangeSuccessful = toggleActiveWithValidation(matchId);
        if (!stateChangeSuccessful) {
            return false;
        }
    }
    
    const newState = getMatchState ? getMatchState(match) : 'unknown';
    
    // If transitioning to LIVE, check lane assignment
    if (newState === 'live' && config.lanes?.requireLaneForStart && !match.lane) {
        alert('Warning: No lane assigned to this match');
        // Continue anyway since requireLaneForStart is false by default
    }
    
    // If transitioning to LIVE, check for lane conflicts
    if (newState === 'live' && match.lane && isLaneInUse(match.lane, matchId)) {
        alert(`Warning: Lane ${match.lane} is already in use by another match`);
    }
    
    // Refresh dropdowns when match state changes
    setTimeout(() => {
        refreshAllLaneDropdowns();
        refreshAllRefereeDropdowns();
    }, 100);
    
    return true;
}

/**
 * Show current lane usage summary
 */
function showLaneUsage() {
    const usedLanes = getUsedLanes();
    const maxLanes = config.lanes?.maxLanes || 10;
    const validation = validateLaneAssignments();
    
    let message = `Lane Usage Summary:\n`;
    message += `Available lanes: 1-${maxLanes}\n`;
    message += `Currently in use: ${usedLanes.length > 0 ? usedLanes.join(', ') : 'None'}\n`;
    message += `Available: ${maxLanes - usedLanes.length}\n\n`;
    
    if (!validation.valid) {
        message += `⚠️ CONFLICTS DETECTED:\n`;
        validation.conflicts.forEach(conflict => {
            message += `Lane ${conflict.lane}: Used by ${conflict.matches.join(', ')}\n`;
        });
    } else {
        message += `✅ No lane conflicts detected`;
    }
    
    alert(message);
}

/**
 * Update lane configuration (called from config page)
 */
function updateLaneConfiguration() {
    const maxLanes = parseInt(document.getElementById('maxLanes')?.value) || 10;
    const requireLane = document.getElementById('requireLaneForStart')?.checked || false;
    
    config.lanes = {
        maxLanes: maxLanes,
        requireLaneForStart: requireLane
    };
    
    // Save configuration
    if (typeof saveConfiguration === 'function') {
        saveConfiguration();
    } else {
        localStorage.setItem('dartsConfig', JSON.stringify(config));
    }
    
    console.log('Lane configuration updated:', config.lanes);
    
    // Refresh all lane dropdowns with new max
    setTimeout(() => {
        refreshAllLaneDropdowns();
    }, 100);
    
    return true;
}

// Debug function for lane management
function debugLaneManagement() {
    console.log('=== LANE MANAGEMENT DEBUG ===');
    console.log('Max lanes:', config.lanes?.maxLanes || 10);
    console.log('Require lane for start:', config.lanes?.requireLaneForStart || false);
    console.log('Used lanes:', getUsedLanes());
    console.log('Lane validation:', validateLaneAssignments());
    
    // Show lane assignments for all matches
    matches.forEach(match => {
        const state = getMatchState ? getMatchState(match) : 'unknown';
        console.log(`${match.id}: Lane ${match.lane || 'none'} | State: ${state}`);
    });
}

/**
 * Get all referees currently assigned to matches (excluding specified match)
 */
function getAssignedReferees(excludeMatchId = null) {
    if (!matches || matches.length === 0) return [];
    
    const assignedReferees = [];
    matches.forEach(match => {
        // Skip the match we're updating
        if (excludeMatchId && match.id === excludeMatchId) return;
        
        // Only count referees assigned to matches that exist and have a referee
        if (match.referee) {
            assignedReferees.push(parseInt(match.referee));
        }
    });
    
    return assignedReferees;
}

/**
 * Get all players currently in LIVE matches (excluding specified match)
 */
function getPlayersInLiveMatches(excludeMatchId = null) {
    if (!matches || matches.length === 0) return [];
    
    const playersInLiveMatches = [];
    matches.forEach(match => {
        // Skip the match we're updating
        if (excludeMatchId && match.id === excludeMatchId) return;
        
        // Only check LIVE matches
        if (getMatchState && getMatchState(match) === 'live') {
            if (match.player1 && match.player1.id && !match.player1.isBye && match.player1.name !== 'TBD') {
                playersInLiveMatches.push(parseInt(match.player1.id));
            }
            if (match.player2 && match.player2.id && !match.player2.isBye && match.player2.name !== 'TBD') {
                playersInLiveMatches.push(parseInt(match.player2.id));
            }
        }
    });
    
    return playersInLiveMatches;
}

/**
 * Generate referee dropdown options with conflict detection (replaces existing function)
 */
function generateRefereeOptionsWithConflicts(currentMatchId, currentRefereeId = null) {
    let options = '<option value="">None</option>';

    if (typeof players !== 'undefined' && Array.isArray(players)) {
        // Get paid players and sort alphabetically
        const paidPlayers = players.filter(player => player.paid);
        const sortedPlayers = paidPlayers.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // Get conflict information
        const assignedReferees = getAssignedReferees(currentMatchId);
        const playersInLiveMatches = getPlayersInLiveMatches(currentMatchId);

        sortedPlayers.forEach(player => {
            const playerId = parseInt(player.id);
            const isCurrentReferee = currentRefereeId && playerId === parseInt(currentRefereeId);
            const isAssignedElsewhere = assignedReferees.includes(playerId);
            const isInLiveMatch = playersInLiveMatches.includes(playerId);
            
            // Always allow current referee to stay selected
            if (isCurrentReferee || (!isAssignedElsewhere && !isInLiveMatch)) {
                const selected = isCurrentReferee ? 'selected' : '';
                const playerName = player.name.length > 10 ? player.name.substring(0, 10) + '...' : player.name;
                options += `<option value="${player.id}" ${selected}>${playerName}</option>`;
            } else {
                // Show unavailable players as disabled with reason
                const playerName = player.name.length > 10 ? player.name.substring(0, 10) + '...' : player.name;
                let reason = '';
                if (isAssignedElsewhere) reason = ' (assigned)';
                else if (isInLiveMatch) reason = ' (playing)';
                
                options += `<option value="${player.id}" disabled style="color: #ccc;">${playerName}${reason}</option>`;
            }
        });
    }

    return options;
}

/**
 * Enhanced match lane update function with conflict checking
 */
function updateMatchLaneWithValidation(matchId, newLane) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }
    
    const lane = newLane ? parseInt(newLane) : null;
    
    // If removing lane assignment, just clear it
    if (!lane) {
        match.lane = null;
        saveTournament();
        return true;
    }
    
    // Check for conflicts with other LIVE matches
    if (isLaneInUse(lane, matchId)) {
        alert(`Lane ${lane} is already in use by another LIVE match`);
        
        // Reset dropdown to previous value
        const dropdown = document.querySelector(`#bracket-match-${matchId} select[onchange*="updateMatchLane"]`);
        if (dropdown) {
            dropdown.value = match.lane || '';
        }
        
        return false;
    }
    
    // Update the lane
    const oldLane = match.lane;
    match.lane = lane;
    
    console.log(`Lane updated for ${matchId}: ${oldLane} → ${lane}`);
    
    // Save and refresh UI
    saveTournament();
    
    // Refresh lane dropdowns for all matches to show updated availability
    refreshAllLaneDropdowns();
    
    return true;
}

/**
 * Check if a player is available as referee for a specific match
 */
function isPlayerAvailableAsReferee(playerId, excludeMatchId = null) {
    const assignedReferees = getAssignedReferees(excludeMatchId);
    const playersInLiveMatches = getPlayersInLiveMatches(excludeMatchId);
    
    const playerIdInt = parseInt(playerId);
    
    return !assignedReferees.includes(playerIdInt) && !playersInLiveMatches.includes(playerIdInt);
}

/**
 * Refresh referee dropdowns for all visible matches
 */
function refreshAllRefereeDropdowns() {
    if (!matches || matches.length === 0) return;
    
    matches.forEach(match => {
        const matchElement = document.getElementById(`bracket-match-${match.id}`);
        if (matchElement) {
            const dropdown = matchElement.querySelector('select[onchange*="updateMatchReferee"]');
            if (dropdown) {
                const currentValue = dropdown.value;
                dropdown.innerHTML = generateRefereeOptionsWithConflicts(match.id, match.referee);
                
                // Maintain selection if still valid
                if (dropdown.querySelector(`option[value="${currentValue}"]`)) {
                    dropdown.value = currentValue;
                }
            }
        }
    });
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.getAvailableLanes = getAvailableLanes;
    window.isLaneInUse = isLaneInUse;
    window.updateMatchLaneWithValidation = updateMatchLaneWithValidation;
    window.toggleActiveWithLaneValidation = toggleActiveWithLaneValidation;
    window.showLaneUsage = showLaneUsage;
    window.updateLaneConfiguration = updateLaneConfiguration;
    window.debugLaneManagement = debugLaneManagement;
    window.refreshAllLaneDropdowns = refreshAllLaneDropdowns;
    window.generateRefereeOptionsWithConflicts = generateRefereeOptionsWithConflicts;
}
