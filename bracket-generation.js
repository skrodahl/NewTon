// bracket-generation.js - Tournament Bracket Generation and Logic


function getMaxBacksideRounds(playerCount) {
    // Hardcoded values based on double_elimination_all.md
    if (playerCount <= 8) return 3;   // 3 backside rounds + BS-FINAL
    if (playerCount <= 16) return 4;  // 4 backside rounds + BS-FINAL  
    if (playerCount <= 32) return 8;  // 8 backside rounds + BS-FINAL
    return 10; // 48+ players: 10 backside rounds + BS-FINAL
}

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

    // Both players must be defined (not null/undefined)
    if (!match.player1 || !match.player2) {
        return false;
    }
    
    // IMPORTANT: Allow TBD vs Real Player matches to auto-advance
    // But NOT TBD vs TBD matches
    if (match.player1.name === 'TBD' && match.player2.name === 'TBD') {
        return false; // Both TBD, can't auto-advance
    }

    // Check if exactly one player is a bye/walkover/TBD
    const player1IsBye = isPlayerBye(match.player1);
    const player2IsBye = isPlayerBye(match.player2);

    // We can auto-advance if exactly one player is a bye/TBD
    const shouldAdvance = (player1IsBye && !player2IsBye) || (!player1IsBye && player2IsBye);
    
    if (shouldAdvance) {
        console.log(`Match ${match.id} should auto-advance: ${match.player1.name} vs ${match.player2.name}`);
    }
    
    return shouldAdvance;
}

function isPlayerBye(player) {
    if (!player) return false;
    
    // Regular byes and walkovers
    if (player.isBye === true || 
        player.name === 'Walkover' || 
        player.name === 'BYE' ||
        (player.id && player.id.toString().startsWith('walkover-')) ||
        (player.id && player.id.toString().startsWith('bye-'))) {
        return true;
    }
    
    // CRITICAL FIX: Only treat TBD as bye in BACKSIDE matches
    // Frontside TBD players represent future winners, not byes
    if (player.name === 'TBD' && player.id && player.id.toString().startsWith('bs-')) {
        return true; // Backside TBD players are effectively byes
    }
    
    // Frontside TBD players (fs-X-X-X) should NOT be treated as byes
    // They represent winners from previous rounds
    return false;
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
    const backsideRounds = getMaxBacksideRounds(bracketSize);

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

    // HARDCODED structures based on double_elimination_all.md
    const backsideStructure = [];
    
    if (bracketSize === 8) {
        // 8-player pattern from reference document:
        // R1: BS-1-1, BS-1-2 (2 matches) - losers from FS-1-1/FS-1-2 vs FS-1-3/FS-1-4
        // R2: BS-2-1, BS-2-2 (2 matches) - BS-1 winners vs losers from FS-2-1/FS-2-2
        // R3: BS-3-1 (1 match) - BS-2-1 winner vs BS-2-2 winner
        backsideStructure.push({ round: 1, matches: 2, receivesFromFrontside: true });
        backsideStructure.push({ round: 2, matches: 2, receivesFromFrontside: true });
        backsideStructure.push({ round: 3, matches: 1, receivesFromFrontside: false });
    } 
    else if (bracketSize === 16) {
        // 16-player pattern from reference document:
        // R1: BS-1-1 to BS-1-4 (4 matches) - frontside R1 losers
        // R2: BS-2-1, BS-2-2 (2 matches) - BS-1 winners vs frontside R2 losers  
        // R3: BS-3-1, BS-3-2 (2 matches) - BS-2 winners vs frontside R3 losers
        // R4: BS-4-1 (1 match) - BS-3-1 winner vs BS-3-2 winner
        backsideStructure.push({ round: 1, matches: 4, receivesFromFrontside: true });
        backsideStructure.push({ round: 2, matches: 2, receivesFromFrontside: true });
        backsideStructure.push({ round: 3, matches: 2, receivesFromFrontside: false });
        backsideStructure.push({ round: 4, matches: 1, receivesFromFrontside: false });
    }
    else if (bracketSize === 32) {
        backsideStructure.push({ round: 1, matches: 8, receivesFromFrontside: true });
        backsideStructure.push({ round: 2, matches: 4, receivesFromFrontside: true });
        backsideStructure.push({ round: 3, matches: 2, receivesFromFrontside: false });
        backsideStructure.push({ round: 4, matches: 2, receivesFromFrontside: true });
        backsideStructure.push({ round: 5, matches: 1, receivesFromFrontside: false });
        backsideStructure.push({ round: 6, matches: 1, receivesFromFrontside: true });
        backsideStructure.push({ round: 7, matches: 1, receivesFromFrontside: true });
        backsideStructure.push({ round: 8, matches: 1, receivesFromFrontside: false });
    }
    else if (bracketSize === 48) {
        // 48-player pattern (6 frontside rounds: 24→12→6→3→2→1)
        // Note: 48 players requires special handling as it's not a power of 2
        // Using 48-player bracket structure (similar to 32 but extended)
        backsideStructure.push({ round: 1, matches: 12, receivesFromFrontside: true }); // FS R1 losers
        backsideStructure.push({ round: 2, matches: 6, receivesFromFrontside: true });  // BS R1 winners vs FS R2 losers
        backsideStructure.push({ round: 3, matches: 6, receivesFromFrontside: false }); // BS R2 winners fight
        backsideStructure.push({ round: 4, matches: 3, receivesFromFrontside: true });  // BS R3 winners vs FS R3 losers
        backsideStructure.push({ round: 5, matches: 3, receivesFromFrontside: false }); // BS R4 winners fight
        backsideStructure.push({ round: 6, matches: 2, receivesFromFrontside: true });  // BS R5 winners vs FS R4 losers
        backsideStructure.push({ round: 7, matches: 2, receivesFromFrontside: false }); // BS R6 winners fight
        backsideStructure.push({ round: 8, matches: 1, receivesFromFrontside: true });  // BS R7 winners vs FS R5 losers
        backsideStructure.push({ round: 9, matches: 1, receivesFromFrontside: false }); // BS R8 winner fights
        backsideStructure.push({ round: 10, matches: 1, receivesFromFrontside: false }); // Final backside match
    }

    console.log('=== HARDCODED BRACKET STRUCTURE ===');
    console.log(`Bracket size: ${bracketSize}, Frontside rounds: ${frontsideRounds}, Backside rounds: ${backsideRounds}`);
    console.log('Backside structure:', backsideStructure);

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
        console.log(`Generating backside round ${roundInfo.round} with ${roundInfo.matches} matches`);
        
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            
            let player1, player2;
            
            // ALL backside matches should start with TBD players
            // The frontside losers will be placed into these TBD slots
            // No walkovers should be pre-placed in backside matches
            
            player1 = { name: 'TBD', id: `bs-${roundInfo.round}-${matchIndex}-1` };
            player2 = { name: 'TBD', id: `bs-${roundInfo.round}-${matchIndex}-2` };

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
            console.log(`Created backside match: ${match.id}`);
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

// Modified advanceWinner function that calls the force function
function advanceWinner(completedMatch) {
    const winner = completedMatch.winner;
    const loser = completedMatch.loser;

    if (!winner) return;

    console.log(`Advancing winner: ${winner.name} from match ${completedMatch.id}`);

    // Handle different bracket advancement scenarios
    if (completedMatch.side === 'frontside') {
        advanceFrontsideWinner(completedMatch, winner);
        
        // CRITICAL FIX: Always drop frontside losers (unless it's a bye)
        if (loser && !isPlayerBye(loser)) {
            dropFrontsideLoser(completedMatch, loser);
            
            // FORCE CHECK: After dropping loser, force check all backside matches
            setTimeout(() => {
                forceBacksideAutoAdvancement();
                
                // Re-render bracket to show changes
                if (typeof renderBracket === 'function') {
                    renderBracket();
                }
            }, 100);
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
    const frontsideRound = completedMatch.round;
    const isFrontsideFinal = frontsideRound === frontsideRounds;
    
    if (isFrontsideFinal) {
        // SPECIAL CASE: Frontside final loser goes directly to BS-FINAL
        console.log(`${loser.name} lost the frontside final - going to BS-FINAL`);
        const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
        if (backsideFinal) {
            backsideFinal.player1 = {
                id: loser.id,
                name: loser.name,
                paid: loser.paid,
                stats: loser.stats,
                placement: loser.placement,
                eliminated: loser.eliminated
            };
            console.log(`✓ ${loser.name} placed in BS-FINAL as frontside runner-up`);
        }
        return; // Exit early
    }
    
    // CORRECT LOGIC FOR 8-PLAYER DOUBLE ELIMINATION:
    // Round 1 losers → Backside Round 1
    // Round 2 losers → Backside Round 2 (to play against R1 backside winners)
    // Round 3 (final) loser → BS-FINAL (handled above)
    
    if (frontsideRound === 1) {
        // First round losers go to backside round 1
        console.log(`${loser.name} lost in frontside round 1, going to backside round 1`);
        
        // Find available backside round 1 matches
        const backsideRound1Matches = matches.filter(m =>
            m.side === 'backside' && 
            m.round === 1 &&
            (m.player1.name === 'TBD' || m.player2.name === 'TBD')
        ).sort((a, b) => a.positionInRound - b.positionInRound);
        
        // Find the first available slot
        for (let match of backsideRound1Matches) {
            if (match.player1.name === 'TBD') {
                match.player1 = loser;
                console.log(`✓ Placed ${loser.name} in ${match.id} as player1`);
                
                // CRITICAL: Check for auto-advancement after placing loser
                processAutoAdvancementForMatch(match);
                return;
            } else if (match.player2.name === 'TBD') {
                match.player2 = loser;
                console.log(`✓ Placed ${loser.name} in ${match.id} as player2`);
                
                // CRITICAL: Check for auto-advancement after placing loser
                processAutoAdvancementForMatch(match);
                return;
            }
        }
        
        console.error(`ERROR: No available slots in backside round 1 for ${loser.name}`);
        
    } else if (frontsideRound === 2) {
        // Second round losers go to backside round 2
        console.log(`${loser.name} lost in frontside round 2, going to backside round 2`);
        
        // Find available backside round 2 matches
        const backsideRound2Matches = matches.filter(m =>
            m.side === 'backside' && 
            m.round === 2 &&
            (m.player1.name === 'TBD' || m.player2.name === 'TBD')
        ).sort((a, b) => a.positionInRound - b.positionInRound);
        
        // Find the first available slot
        for (let match of backsideRound2Matches) {
            if (match.player1.name === 'TBD') {
                match.player1 = loser;
                console.log(`✓ Placed ${loser.name} in ${match.id} as player1`);
                
                // CRITICAL: Check for auto-advancement after placing loser
                processAutoAdvancementForMatch(match);
                return;
            } else if (match.player2.name === 'TBD') {
                match.player2 = loser;
                console.log(`✓ Placed ${loser.name} in ${match.id} as player2`);
                
                // CRITICAL: Check for auto-advancement after placing loser
                processAutoAdvancementForMatch(match);
                return;
            }
        }
        
        console.error(`ERROR: No available slots in backside round 2 for ${loser.name}`);
        
    } else {
        // Handle other rounds (shouldn't happen in 8-player bracket, but just in case)
        const targetBacksideRound = frontsideRound;
        console.log(`${loser.name} lost in frontside round ${frontsideRound}, going to backside round ${targetBacksideRound}`);
        
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
            
            // CRITICAL: Check for auto-advancement after placing loser
            processAutoAdvancementForMatch(targetMatch);
        } else {
            console.error(`ERROR: No available slots in backside round ${targetBacksideRound} for ${loser.name}`);
        }
    }
}

// New helper function to process auto-advancement for a specific match
function processAutoAdvancementForMatch(match) {
    if (shouldAutoAdvanceMatch(match)) {
        console.log(`Auto-advancing match ${match.id} after placing loser`);
        autoAdvanceMatch(match);
        
        // Process any cascading auto-advancements
        processAllAutoAdvancements();
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

// DEBUGGING FUNCTION: Call this to see current bracket state
function debugBracketState() {
    console.log('=== BRACKET STATE DEBUG ===');
    
    // Show all frontside matches
    const frontsideMatches = matches.filter(m => m.side === 'frontside');
    console.log('FRONTSIDE MATCHES:');
    frontsideMatches.forEach(match => {
        console.log(`${match.id}: ${match.player1?.name} vs ${match.player2?.name} | Winner: ${match.winner?.name || 'None'} | Completed: ${match.completed}`);
    });
    
    // Show all backside matches
    const backsideMatches = matches.filter(m => m.side === 'backside');
    console.log('BACKSIDE MATCHES:');
    backsideMatches.forEach(match => {
        console.log(`${match.id}: ${match.player1?.name} vs ${match.player2?.name} | Winner: ${match.winner?.name || 'None'} | Completed: ${match.completed}`);
    });
    
    // Show finals
    const finals = matches.filter(m => m.id === 'BS-FINAL' || m.id === 'GRAND-FINAL');
    console.log('FINALS:');
    finals.forEach(match => {
        console.log(`${match.id}: ${match.player1?.name} vs ${match.player2?.name} | Winner: ${match.winner?.name || 'None'} | Completed: ${match.completed}`);
    });
}

function forceBacksideAutoAdvancement() {
    console.log('=== FORCING BACKSIDE AUTO-ADVANCEMENT CHECK ===');
    
    const backsideMatches = matches.filter(m => 
        m.side === 'backside' && 
        !m.completed &&
        (m.player1.name === 'TBD' || m.player2.name === 'TBD') &&
        m.player1.name !== 'TBD' || m.player2.name !== 'TBD' // At least one is not TBD
    );
    
    console.log(`Found ${backsideMatches.length} backside matches that should auto-advance`);
    
    backsideMatches.forEach(match => {
        console.log(`Processing match ${match.id}: ${match.player1.name} vs ${match.player2.name}`);
        
        if (shouldAutoAdvanceMatch(match)) {
            console.log(`Auto-advancing match ${match.id}`);
            autoAdvanceMatch(match);
        }
    });
    
    // Process any cascading effects
    processAllAutoAdvancements();
}

function debugBacksideMatches() {
    console.log('=== BACKSIDE MATCHES DEBUG ===');
    
    const backsideMatches = matches.filter(m => m.side === 'backside');
    backsideMatches.forEach(match => {
        console.log(`\n--- Match ${match.id} ---`);
        console.log('Player1:', match.player1);
        console.log('Player2:', match.player2);
        console.log('Player1 is bye?', isPlayerBye(match.player1));
        console.log('Player2 is bye?', isPlayerBye(match.player2));
        console.log('Should auto-advance?', shouldAutoAdvanceMatch(match));
        console.log('Match completed?', match.completed);
        console.log('Match winner:', match.winner);
        
        // Check specifically for TBD
        if (match.player1.name === 'TBD' || match.player2.name === 'TBD') {
            console.log('*** HAS TBD PLAYER - SHOULD AUTO ADVANCE ***');
        }
    });
}

/**
 * Enhanced generateMatches function that triggers auto-advancement
 */
function generateMatchesWithAutoAdvancement() {
    // Use existing generateMatches logic
    generateMatches();
    
    console.log('Matches generated, processing auto-advancements...');
    
    // Process all auto-advancements after bracket generation
    if (typeof processAllAutoAdvancements === 'function') {
        processAllAutoAdvancements();
        
        // Save tournament after auto-advancement
        saveTournament();
        
        console.log('Auto-advancement processing complete');
    } else {
        console.warn('Auto-advancement system not available');
    }
}

/**
 * Enhanced generateBracket function
 */
function generateBracketWithAutoAdvancement() {
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
    generateMatchesWithAutoAdvancement(); // Use enhanced version
    
    console.log('=== STEP 2: Save Tournament ===');
    saveTournament();
    
    console.log('=== STEP 3: Render Bracket ===');
    if (typeof renderBracket === 'function') {
        renderBracket();
    } else {
        console.error('renderBracket function not available');
    }
    
    showPage('tournament');
    
    // Show auto-advancement summary
    if (typeof debugAutoAdvancement === 'function') {
        const summary = debugAutoAdvancement();
        alert(`Bracket generated with ${bracketSize} positions for ${paidPlayers.length} players\n\nAuto-advancement summary:\n- ${summary.autoCompleted} matches auto-completed\n- ${summary.completed} total matches completed`);
    } else {
        alert(`Bracket generated with ${bracketSize} positions for ${paidPlayers.length} players`);
    }
}