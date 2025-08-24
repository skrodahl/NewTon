// bracket-generation.js - Tournament Bracket Generation and Logic

function generateBracket() {
    if (!tournament) {
        alert('Please create a tournament first');
        return;
    }

    // Check if bracket already exists (tournament in progress)
    if (tournament.bracket && matches.length > 0) {
        alert('Tournament is already in progress!\n\nTo start a new bracket, you must first reset the current tournament.\n\nGo to the Tournament page and use "Reset Tournament" to clear the current bracket and results.');
        return;
    }

    const paidPlayers = players.filter(p => p.paid);
    if (paidPlayers.length < 2) {
        alert('Need at least 2 paid players to generate bracket');
        return;
    }

    // Determine bracket size
    let bracketSize;
    if (paidPlayers.length <= 8) bracketSize = 8;
    else if (paidPlayers.length <= 16) bracketSize = 16;
    else if (paidPlayers.length <= 32) bracketSize = 32;
    else bracketSize = 48;

    // For 8-player bracket, we need at least 4 real players to ensure each first round match has at least one real player
    if (bracketSize === 8 && paidPlayers.length < 4) {
        alert('For an 8-player bracket, you need at least 4 paid players to ensure proper tournament flow.\n\nCurrently you have ' + paidPlayers.length + ' paid players.\n\nPlease add more players or mark more players as paid.');
        return;
    }

    // Create optimized bracket placement to avoid walkover vs walkover matches
    const bracket = createOptimizedBracket(paidPlayers, bracketSize);

    // Validate the bracket
    if (!validateBracket(bracket, bracketSize)) {
        alert('Bracket generation failed validation. Please try again.');
        return;
    }

    tournament.bracket = bracket;
    tournament.bracketSize = bracketSize;
    tournament.status = 'active';

    console.log('=== STEP 1: Generate Matches ===');
    generateMatches();
    
    console.log('=== STEP 2: Save Tournament ===');
    saveTournament();
    
    console.log('=== STEP 3: Debug Before Render ===');
    debugAutoAdvancement();
    
    console.log('=== STEP 4: Render Bracket ===');
    if (typeof renderBracket === 'function') {
        renderBracket();
    } else {
        console.error('renderBracket function not available');
    }
    
    console.log('=== STEP 5: Debug After Render ===');
    setTimeout(() => {
        console.log('=== POST-RENDER DEBUG ===');
        debugAutoAdvancement();
        
        // Force another auto-advancement check after render
        console.log('=== FORCE AUTO-ADVANCEMENT AFTER RENDER ===');
        processAllAutoAdvancements();
        
        // Re-render if changes were made
        setTimeout(() => {
            if (typeof renderBracket === 'function') {
                renderBracket();
            }
            console.log('=== FINAL DEBUG ===');
            debugAutoAdvancement();
        }, 100);
    }, 500);
    
    showPage('tournament');
    
    alert(`Bracket generated with ${bracketSize} positions for ${paidPlayers.length} players`);
}

function createOptimizedBracket(players, bracketSize) {
    const bracket = new Array(bracketSize);
    const numWalkovers = bracketSize - players.length;

    console.log(`Creating bracket: ${players.length} players, ${numWalkovers} walkovers, ${bracketSize} total positions`);

    // First, shuffle all real players randomly
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    // Calculate first round match pairs (0,1), (2,3), (4,5), etc.
    const firstRoundPairs = [];
    for (let i = 0; i < bracketSize; i += 2) {
        firstRoundPairs.push([i, i + 1]);
    }

    // Strategy: Distribute players to ensure each first round match has at least one real player
    let playerIndex = 0;
    let walkoverIndex = 0;

    // First pass: Place at least one real player in each pair
    for (let pairIndex = 0; pairIndex < firstRoundPairs.length && playerIndex < shuffledPlayers.length; pairIndex++) {
        const [pos1, pos2] = firstRoundPairs[pairIndex];
        
        // Always place a real player in pos1 if we have players left
        bracket[pos1] = shuffledPlayers[playerIndex];
        playerIndex++;
    }

    // Second pass: Fill remaining positions
    for (let pairIndex = 0; pairIndex < firstRoundPairs.length; pairIndex++) {
        const [pos1, pos2] = firstRoundPairs[pairIndex];
        
        // Check if pos2 is empty
        if (!bracket[pos2]) {
            if (playerIndex < shuffledPlayers.length) {
                // Place another real player if available
                bracket[pos2] = shuffledPlayers[playerIndex];
                playerIndex++;
            } else if (walkoverIndex < numWalkovers) {
                // Place a walkover if needed
                bracket[pos2] = { 
                    id: `walkover-${walkoverIndex}`, 
                    name: 'Walkover', 
                    isBye: true 
                };
                walkoverIndex++;
            }
        }
    }

    // Third pass: If we still have walkovers to place, find empty positions
    // but never create walkover vs walkover matches
    for (let i = 0; i < bracketSize && walkoverIndex < numWalkovers; i++) {
        if (!bracket[i]) {
            // Check if this position would create a walkover vs walkover match
            const pairPartner = (i % 2 === 0) ? i + 1 : i - 1;
            const partnerIsWalkover = bracket[pairPartner]?.isBye;
            
            if (!partnerIsWalkover) {
                bracket[i] = { 
                    id: `walkover-${walkoverIndex}`, 
                    name: 'Walkover', 
                    isBye: true 
                };
                walkoverIndex++;
            }
        }
    }

    console.log('Bracket generated successfully:', bracket.map((p, i) => `${i}: ${p?.name || 'EMPTY'}`));
    return bracket;
}

function validateBracket(bracket, bracketSize) {
    console.log('Validating bracket...');
    
    let issues = [];
    
    // Check for walkover vs walkover matches
    for (let i = 0; i < bracketSize; i += 2) {
        const player1 = bracket[i];
        const player2 = bracket[i + 1];
        const matchNumber = Math.floor(i/2) + 1;
        
        if (player1?.isBye && player2?.isBye) {
            issues.push(`Match ${matchNumber}: Both players are walkovers - ${player1?.name} vs ${player2?.name}`);
        }
        
        if ((!player1 || player1.isBye) && (!player2 || player2.isBye)) {
            if (!player1 && !player2) {
                issues.push(`Match ${matchNumber}: Both positions are empty`);
            } else {
                issues.push(`Match ${matchNumber}: No real players - ${player1?.name || 'EMPTY'} vs ${player2?.name || 'EMPTY'}`);
            }
        }
    }
    
    // Count real players and walkovers
    const realPlayers = bracket.filter(p => p && !p.isBye).length;
    const walkovers = bracket.filter(p => p && p.isBye).length;
    const emptySlots = bracket.filter(p => !p).length;
    
    console.log(`Bracket validation: ${realPlayers} real players, ${walkovers} walkovers, ${emptySlots} empty slots`);
    
    // Check if we have the right number of players
    const expectedWalkovers = bracketSize - realPlayers;
    if (walkovers + emptySlots !== expectedWalkovers) {
        issues.push(`Expected ${expectedWalkovers} walkovers/empty slots but found ${walkovers} walkovers + ${emptySlots} empty = ${walkovers + emptySlots}`);
    }
    
    if (issues.length > 0) {
        console.error('Bracket validation failed:', issues);
        return false;
    }
    
    console.log('Bracket validation passed!');
    return true;
}

function generateMatches() {
    matches = [];
    const bracket = tournament.bracket;
    const bracketSize = tournament.bracketSize;

    // Calculate bracket structure
    const structure = calculateBracketStructure(bracketSize);

    // Generate complete double elimination bracket
    generateCompleteBracket(bracket, structure);

    // Process all auto-advancements from walkovers - run this multiple times if needed
    processAllAutoAdvancements();
}

function processAllAutoAdvancements() {
    let iterations = 0;
    const maxIterations = 10;
    let foundAutoAdvancement;

    console.log('Starting comprehensive auto-advancement processing...');

    do {
        foundAutoAdvancement = false;
        iterations++;
        
        console.log(`Auto-advancement iteration ${iterations}`);

        // Check all matches for auto-advancement opportunities
        matches.forEach(match => {
            if (shouldAutoAdvanceMatch(match)) {
                autoAdvanceMatch(match);
                foundAutoAdvancement = true;
            }
        });

        // If we made changes, continue to next iteration
        if (foundAutoAdvancement) {
            console.log(`Iteration ${iterations}: Found auto-advancements, processing cascading effects...`);
            
            // Safety check to prevent infinite loops
            if (iterations >= maxIterations) {
                console.warn(`Reached maximum auto-advancement iterations (${maxIterations})`);
                break;
            }
        }
    } while (foundAutoAdvancement && iterations < maxIterations);

    console.log(`Auto-advancement processing complete after ${iterations} iterations`);
}

function shouldAutoAdvanceMatch(match) {
    // Don't process already completed matches
    if (match.completed) {
        return false;
    }

    // Both players must be defined (not TBD)
    if (!match.player1 || !match.player2 || 
        match.player1.name === 'TBD' || match.player2.name === 'TBD') {
        return false;
    }

    // Check if exactly one player is a bye/walkover
    const player1IsBye = isPlayerBye(match.player1);
    const player2IsBye = isPlayerBye(match.player2);

    // We can auto-advance if exactly one player is a bye
    return (player1IsBye && !player2IsBye) || (!player1IsBye && player2IsBye);
}

function isPlayerBye(player) {
    if (!player) return false;
    return player.isBye === true || 
           player.name === 'Walkover' || 
           player.name === 'BYE' ||
           (player.id && player.id.toString().startsWith('walkover-')) ||
           (player.id && player.id.toString().startsWith('bye-'));
}

function autoAdvanceMatch(match) {
    const player1IsBye = isPlayerBye(match.player1);
    const player2IsBye = isPlayerBye(match.player2);

    if (player1IsBye && player2IsBye) {
        console.error(`ERROR: Both players are byes in match ${match.id}! This should not happen.`);
        // Emergency fallback - advance the first player
        match.winner = match.player1;
        match.completed = true;
        match.autoAdvanced = true;
        advanceWinner(match);
        return;
    }

    let winner, loser;
    
    if (player1IsBye && !player2IsBye) {
        winner = match.player2;
        loser = match.player1;
    } else if (player2IsBye && !player1IsBye) {
        winner = match.player1;
        loser = match.player2;
    } else {
        // Neither is a bye, shouldn't auto-advance
        return;
    }

    console.log(`Auto-advancing ${winner.name} in match ${match.id} (opponent: ${loser.name})`);
    
    match.winner = winner;
    match.loser = loser;
    match.completed = true;
    match.autoAdvanced = true;
    
    // Advance the winner to the next round
    advanceWinner(match);
}

function calculateBracketStructure(bracketSize) {
    const frontsideRounds = Math.ceil(Math.log2(bracketSize));

    // CORRECTED: Double elimination backside structure
    // For 8 players: 3 frontside rounds, so 2 backside rounds (not 4!)
    const backsideRounds = frontsideRounds - 1;

    // Calculate matches per round for frontside (unchanged)
    const frontsideStructure = [];
    for (let round = 1; round <= frontsideRounds; round++) {
        const matchesInRound = Math.pow(2, frontsideRounds - round);
        frontsideStructure.push({
            round: round,
            matches: matchesInRound,
            isLast: round === frontsideRounds
        });
    }

    // CORRECTED: Calculate matches per round for backside
    const backsideStructure = [];
    for (let round = 1; round <= backsideRounds; round++) {
        let matchesInRound;

        if (round === 1) {
            // First backside round: receives first round losers
            // For 8-player bracket: 4 first round matches = 4 losers
            // But we have walkovers, so we need 2 matches for the real losers
            matchesInRound = Math.pow(2, frontsideRounds - 2);
        } else {
            // Later rounds: winners from previous backside round merge with frontside losers
            matchesInRound = Math.pow(2, frontsideRounds - round - 1);
        }

        matchesInRound = Math.max(1, matchesInRound);
        backsideStructure.push({
            round: round,
            matches: matchesInRound,
            receivesFromFrontside: round === 1 || round % 2 === 0 // Simplified
        });
    }

    return {
        frontside: frontsideStructure,
        backside: backsideStructure,
        frontsideRounds: frontsideRounds,
        backsideRounds: backsideRounds
    };
}

function generateCompleteBracket(bracket, structure) {
    let matchId = 1;

    // Generate frontside matches
    generateFrontsideMatches(bracket, structure, matchId);
    matchId = matches.length + 1;

    // Generate backside matches
    generateBacksideMatches(structure, matchId);
    matchId = matches.length + 1;

    // Generate final matches
    generateFinalMatches(matchId);
}

function generateFrontsideMatches(bracket, structure, startId) {
    let matchId = startId;

    structure.frontside.forEach((roundInfo, roundIndex) => {
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            let player1, player2;

            if (roundIndex === 0) {
                // First round: use actual players from bracket
                const playerIndex = matchIndex * 2;
                player1 = bracket[playerIndex] || null;
                player2 = bracket[playerIndex + 1] || null;
                
                // Handle empty positions (should be rare with new logic)
                if (!player1 && !player2) {
                    // Skip this match entirely if both positions are empty
                    continue;
                }
                
                // Convert null to a proper BYE object for cleaner handling
                if (!player1) {
                    player1 = { name: 'BYE', id: `bye-${playerIndex}`, isBye: true };
                }
                if (!player2) {
                    player2 = { name: 'BYE', id: `bye-${playerIndex + 1}`, isBye: true };
                }
            } else {
                // Later rounds: TBD players from previous matches
                player1 = { name: 'TBD', id: `fs-${roundInfo.round}-${matchIndex}-1` };
                player2 = { name: 'TBD', id: `fs-${roundInfo.round}-${matchIndex}-2` };
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
                lane: matchIndex + 1,
                legs: roundInfo.isLast ? config.legs.semifinal : config.legs.round1,
                referee: null,
                active: false,
                completed: false,
                positionInRound: matchIndex,
                gridPosition: {
                    side: 'frontside',
                    round: roundInfo.round,
                    position: matchIndex
                }
            };

            matches.push(match);
        }
    });
}

function generateBacksideMatches(structure, startId) {
    let matchId = startId;

    structure.backside.forEach((roundInfo, roundIndex) => {
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            
            // For first round of backside, we want to set up matches that will receive losers
            // Each first round backside match should have one slot for a frontside loser
            // and one slot for a walkover (so the loser auto-advances)
            
            let player1, player2;
            
            if (roundInfo.round === 1) {
                // First backside round: Set up for frontside losers + walkovers
                player1 = { name: 'TBD', id: `bs-${roundInfo.round}-${matchIndex}-1` }; // Will receive frontside loser
                player2 = { 
                    id: `bs-walkover-${matchIndex}`, 
                    name: 'Walkover', 
                    isBye: true 
                }; // Walkover so loser auto-advances
            } else {
                // Later rounds: Normal TBD setup
                player1 = { name: 'TBD', id: `bs-${roundInfo.round}-${matchIndex}-1` };
                player2 = { name: 'TBD', id: `bs-${roundInfo.round}-${matchIndex}-2` };
            }

            const match = {
                id: `BS-${roundInfo.round}-${matchIndex + 1}`,
                numericId: matchId++,
                round: roundInfo.round,
                side: 'backside',
                player1: player1,
                player2: player2,
                winner: null,
                loser: null,
                lane: matchIndex + 1,
                legs: config.legs.round1,
                referee: null,
                active: false,
                completed: false,
                positionInRound: matchIndex,
                receivesFromFrontside: roundInfo.receivesFromFrontside,
                gridPosition: {
                    side: 'backside',
                    round: roundInfo.round,
                    position: matchIndex
                }
            };

            matches.push(match);
        }
    });
}

function generateFinalMatches(startId) {
    // Backside Final (if needed)
    const backsideFinal = {
        id: 'BS-FINAL',
        numericId: startId,
        round: 'backside-final',
        side: 'backside-final',
        player1: { name: 'Frontside Runner-up', id: 'fs-runnerup' },
        player2: { name: 'Backside Winner', id: 'bs-winner' },
        winner: null,
        loser: null,
        lane: 1,
        legs: config.legs.semifinal,
        referee: null,
        active: false,
        completed: false,
        gridPosition: {
            side: 'backside-final',
            round: 1,
            position: 0
        }
    };

    // Grand Final
    const grandFinal = {
        id: 'GRAND-FINAL',
        numericId: startId + 1,
        round: 'grand-final',
        side: 'grand-final',
        player1: { name: 'Frontside Winner', id: 'fs-champion' },
        player2: { name: 'Backside Champion', id: 'bs-champion' },
        winner: null,
        loser: null,
        lane: 1,
        legs: config.legs.final,
        referee: null,
        active: false,
        completed: false,
        gridPosition: {
            side: 'grand-final',
            round: 1,
            position: 0
        }
    };

    matches.push(backsideFinal);
    matches.push(grandFinal);
}

// Enhanced version of advanceWinner - this ensures proper cascading of auto-advancements
function advanceWinner(completedMatch) {
    const winner = completedMatch.winner;
    const loser = completedMatch.loser;

    if (!winner) return;

    console.log(`Advancing winner: ${winner.name} from match ${completedMatch.id}`);

    // Handle different bracket advancement scenarios
    if (completedMatch.side === 'frontside') {
        advanceFrontsideWinner(completedMatch, winner);
        if (loser && !isPlayerBye(loser)) {
            dropFrontsideLoser(completedMatch, loser);
        }
    } else if (completedMatch.side === 'backside') {
        advanceBacksideWinner(completedMatch, winner);
        if (loser && !isPlayerBye(loser)) {
            eliminateBacksideLoser(completedMatch, loser);
        }
    } else if (completedMatch.side === 'backside-final') {
        advanceBacksideFinalWinner(completedMatch, winner);
    } else if (completedMatch.side === 'grand-final') {
        crownChampion(completedMatch, winner);
    }
}

function advanceFrontsideWinner(completedMatch, winner) {
    const currentRound = completedMatch.round;
    const nextRound = currentRound + 1;
    const positionInRound = completedMatch.positionInRound;
    const nextPosition = Math.floor(positionInRound / 2);

    console.log(`Advancing frontside winner ${winner.name} from round ${currentRound} position ${positionInRound}`);

    const nextMatch = matches.find(m =>
        m.side === 'frontside' &&
        m.round === nextRound &&
        m.positionInRound === nextPosition
    );

    if (nextMatch) {
        // Determine if this winner goes to player1 or player2 slot
        const slot = (positionInRound % 2 === 0) ? 'player1' : 'player2';
        nextMatch[slot] = winner;
        
        console.log(`✓ Placed ${winner.name} in ${nextMatch.id} as ${slot}`);
    } else {
        // This is the frontside champion - check if it's the final
        const frontsideRounds = Math.ceil(Math.log2(tournament.bracketSize));
        const isFrontsideFinal = currentRound === frontsideRounds;
        
        if (isFrontsideFinal) {
            console.log(`${winner.name} won the frontside final - advancing to Grand Final`);
            const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');
            if (grandFinal) {
                grandFinal.player1 = winner;
                console.log(`✓ ${winner.name} placed in Grand Final as frontside champion`);
            }
        } else {
            // Semi-final or earlier winner
            const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');
            if (grandFinal) {
                grandFinal.player1 = winner;
                console.log(`✓ ${winner.name} advanced to Grand Final as frontside champion`);
            }
        }
    }
}

// Enhanced backside winner advancement
function advanceBacksideWinner(completedMatch, winner) {
    const currentRound = completedMatch.round;
    const nextRound = currentRound + 1;
    const positionInRound = completedMatch.positionInRound;
    const nextPosition = Math.floor(positionInRound / 2);

    const nextMatch = matches.find(m =>
        m.side === 'backside' &&
        m.round === nextRound &&
        m.positionInRound === nextPosition
    );

    if (nextMatch) {
        const slot = (positionInRound % 2 === 0) ? 'player1' : 'player2';
        nextMatch[slot] = winner;
        
        console.log(`Placed ${winner.name} in backside ${nextMatch.id} as ${slot}`);
    } else {
        // Check if this is the backside champion
        const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
        if (backsideFinal && backsideFinal.player2?.name === 'TBD') {
            backsideFinal.player2 = winner; // Backside winner
            console.log(`${winner.name} advanced to Backside Final as backside champion`);
        }
    }
}

function dropFrontsideLoser(completedMatch, loser) {
    console.log(`Dropping frontside loser: ${loser.name} from match ${completedMatch.id}`);
    
    const frontsideRounds = Math.ceil(Math.log2(tournament.bracketSize));
    const isFrontsideFinal = completedMatch.round === frontsideRounds;
    
    if (isFrontsideFinal) {
        // SPECIAL CASE: Frontside final loser goes directly to BS-FINAL
        console.log(`${loser.name} lost the frontside final - going to BS-FINAL`);
        const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
        if (backsideFinal) {
            // CRITICAL FIX: Replace the entire player object, not just assign reference
            backsideFinal.player1 = {
                id: loser.id,
                name: loser.name,  // Use the actual player name
                paid: loser.paid,
                stats: loser.stats,
                placement: loser.placement,
                eliminated: loser.eliminated
            };
            console.log(`✓ ${loser.name} placed in BS-FINAL as frontside runner-up with actual name`);
        }
        return; // Exit early - don't use normal backside drop logic
    }
    
    // NORMAL CASE: Earlier round losers use the existing logic (unchanged)
    const frontsideRound = completedMatch.round;
    const matchPositionInRound = completedMatch.positionInRound;
    
    let targetBacksideRound;
    
    if (frontsideRound === 1) {
        targetBacksideRound = 1;
        
        const targetBacksideMatch = matches.find(m =>
            m.side === 'backside' &&
            m.round === targetBacksideRound &&
            m.positionInRound === matchPositionInRound
        );
        
        if (targetBacksideMatch) {
            if (targetBacksideMatch.player1.name === 'TBD') {
                targetBacksideMatch.player1 = loser;
                console.log(`✓ Placed ${loser.name} in ${targetBacksideMatch.id} as player1`);
            } else if (targetBacksideMatch.player2.name === 'TBD') {
                targetBacksideMatch.player2 = loser;
                console.log(`✓ Placed ${loser.name} in ${targetBacksideMatch.id} as player2`);
            } else {
                console.error(`ERROR: No available slot in ${targetBacksideMatch.id} for ${loser.name}`);
            }
        } else {
            console.error(`ERROR: Could not find target backside match for ${loser.name}`);
        }
    } else {
        // Semi-final and other round losers
        targetBacksideRound = (frontsideRound - 1) * 2;
        
        const targetMatches = matches.filter(m =>
            m.side === 'backside' &&
            m.round === targetBacksideRound &&
            (m.player1.name === 'TBD' || m.player2.name === 'TBD')
        );

        if (targetMatches.length > 0) {
            const targetMatch = targetMatches[0];
            if (targetMatch.player1.name === 'TBD') {
                targetMatch.player1 = loser;
                console.log(`✓ Placed ${loser.name} in ${targetMatch.id} as player1`);
            } else if (targetMatch.player2.name === 'TBD') {
                targetMatch.player2 = loser;
                console.log(`✓ Placed ${loser.name} in ${targetMatch.id} as player2`);
            }
        } else {
            console.error(`ERROR: No available slots in backside round ${targetBacksideRound} for ${loser.name}`);
        }
    }
}

function eliminateBacksideLoser(completedMatch, loser) {
    // Mark player as eliminated
    const player = players.find(p => p.id === loser.id);
    if (player) {
        player.eliminated = true;
        // Assign placement based on current tournament state
        assignPlacement(player);
    }
}

function advanceBacksideFinalWinner(completedMatch, winner) {
    const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');
    if (grandFinal) {
        grandFinal.player2 = winner; // Backside champion to grand final
    }
}

function crownChampion(completedMatch, winner) {
    const loser = completedMatch.loser;

    // Assign final placements
    const winnerPlayer = players.find(p => p.id === winner.id);
    const loserPlayer = players.find(p => p.id === loser.id);

    if (winnerPlayer) {
        winnerPlayer.placement = 1;
    }
    if (loserPlayer) {
        loserPlayer.placement = 2;
    }

    // Tournament is complete
    tournament.status = 'completed';
    if (typeof displayResults === 'function') {
        displayResults();
    }
}

function assignPlacement(player) {
    // Simple placement logic - could be more sophisticated
    const eliminatedCount = players.filter(p => p.eliminated).length;
    player.placement = eliminatedCount;
}

// Legacy function for compatibility
function checkForAutoAdvancement() {
    // This function is now just a wrapper for the more comprehensive version
    processAllAutoAdvancements();
}

// Debug functions
function debugAutoAdvancement() {
    console.log('=== DEBUG AUTO-ADVANCEMENT ===');
    console.log('Total matches:', matches.length);
    
    // Check first round matches specifically
    const firstRoundMatches = matches.filter(m => m.side === 'frontside' && m.round === 1);
    console.log('First round frontside matches:', firstRoundMatches.length);
    
    firstRoundMatches.forEach((match, index) => {
        console.log(`\n--- Match ${match.id} ---`);
        console.log('Player1:', match.player1);
        console.log('Player2:', match.player2);
        console.log('Player1 is bye?', isPlayerBye(match.player1));
        console.log('Player2 is bye?', isPlayerBye(match.player2));
        console.log('Should auto-advance?', shouldAutoAdvanceMatch(match));
        console.log('Match completed?', match.completed);
        console.log('Match winner:', match.winner);
    });
    
    return {
        totalMatches: matches.length,
        firstRoundMatches: firstRoundMatches,
        completedMatches: matches.filter(m => m.completed),
        autoAdvancedMatches: matches.filter(m => m.autoAdvanced)
    };
}

// Test function to manually trigger auto-advancement
function testAutoAdvancement() {
    console.log('=== MANUAL AUTO-ADVANCEMENT TEST ===');
    
    if (!matches || matches.length === 0) {
        console.log('No matches found. Generate a bracket first.');
        return;
    }
    
    // Find matches that should auto-advance
    const candidateMatches = matches.filter(shouldAutoAdvanceMatch);
    console.log('Matches that should auto-advance:', candidateMatches.length);
    
    candidateMatches.forEach(match => {
        console.log(`Processing match ${match.id}: ${match.player1.name} vs ${match.player2.name}`);
        autoAdvanceMatch(match);
    });
    
    // Save and re-render
    if (typeof saveTournament === 'function') {
        saveTournament();
    }
    if (typeof renderBracket === 'function') {
        renderBracket();
    }
    
    console.log('Auto-advancement test complete');
}

// Test function to check bracket state
function checkBracketState() {
    console.log('=== BRACKET STATE CHECK ===');
    
    if (!tournament || !tournament.bracket) {
        console.log('No bracket generated');
        return;
    }
    
    console.log('Tournament bracket:', tournament.bracket);
    console.log('Total matches:', matches.length);
    
    const byMatches = matches.filter(m => 
        isPlayerBye(m.player1) || isPlayerBye(m.player2)
    );
    console.log('Matches with byes:', byMatches.length);
    
    const completedMatches = matches.filter(m => m.completed);
    console.log('Completed matches:', completedMatches.length);
    
    const autoAdvancedMatches = matches.filter(m => m.autoAdvanced);
    console.log('Auto-advanced matches:', autoAdvancedMatches.length);
    
    // Check if any DOM elements exist
    const bracketMatches = document.querySelectorAll('.bracket-match');
    console.log('Rendered bracket matches in DOM:', bracketMatches.length);
    
    return {
        tournament,
        matches: matches.length,
        byMatches: byMatches.length,
        completed: completedMatches.length,
        autoAdvanced: autoAdvancedMatches.length,
        domMatches: bracketMatches.length
    };
}
function debugBacksideStructure() {
    if (!tournament || !tournament.bracketSize) {
        console.log('No tournament found');
        return;
    }
    
    const structure = calculateBracketStructure(tournament.bracketSize);
    
    console.log('=== BACKSIDE STRUCTURE DEBUG ===');
    console.log(`Bracket size: ${tournament.bracketSize}`);
    console.log(`Frontside rounds: ${structure.frontsideRounds}`);
    console.log(`Backside rounds: ${structure.backsideRounds}`);
    
    console.log('\nBackside structure (what should exist):');
    structure.backside.forEach((round, index) => {
        console.log(`Round ${round.round}: ${round.matches} matches (receives from frontside: ${round.receivesFromFrontside})`);
    });
    
    console.log('\nActual backside matches (what was created):');
    const backsideMatches = matches.filter(m => m.side === 'backside');
    backsideMatches.forEach(match => {
        console.log(`${match.id}: Round ${match.round}, Position ${match.positionInRound}`);
    });
    
    console.log('\nMatches per round (actual):');
    for (let round = 1; round <= 4; round++) {
        const roundMatches = matches.filter(m => m.side === 'backside' && m.round === round);
        if (roundMatches.length > 0) {
            console.log(`Round ${round}: ${roundMatches.length} matches`);
        }
    }
    
    return {
        structure: structure.backside,
        actualMatches: backsideMatches,
        summary: `Expected ${structure.backside.length} rounds, found ${backsideMatches.length} matches`
    };
}
