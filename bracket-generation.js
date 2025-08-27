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

    // Generate complete double elimination bracket with proper walkover handling
    generateCompleteBracketWithWalkovers(bracket, structure);

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

function generateCompleteBracketWithWalkovers(bracket, structure) {
    let matchId = 1;

    // Generate frontside matches
    generateFrontsideMatches(bracket, structure, matchId);
    matchId = matches.length + 1;

    // Generate backside matches with proper walkover pre-population
    generateBacksideMatchesWithWalkovers(bracket, structure, matchId);
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

function generateBacksideMatchesWithWalkovers(bracket, structure, startId) {
    let matchId = startId;

    structure.backside.forEach((roundInfo, roundIndex) => {
        console.log(`Generating backside round ${roundInfo.round} with ${roundInfo.matches} matches`);
        
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            
            let player1, player2;
            
            // CRITICAL FIX: Pre-populate backside matches based on frontside walkover analysis
            if (roundInfo.round === 1) {
                // Round 1: Direct frontside R1 losers
                const { p1, p2 } = getBacksideRound1Players(bracket, matchIndex);
                player1 = p1;
                player2 = p2;
            } else if (roundInfo.round === 2) {
                // Round 2: Mix of BS R1 winners + FS R2 losers
                const { p1, p2 } = getBacksideRound2Players(bracket, matchIndex, structure.frontside[1]?.matches || 0);
                player1 = p1;
                player2 = p2;
            } else {
                // Higher rounds: Standard TBD players
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
            console.log(`Created backside match: ${match.id} (${player1?.name} vs ${player2?.name})`);
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
    const positionInRound = completedMatch.positionInRound;
    
    console.log(`Advancing backside winner ${winner.name} from ${completedMatch.id} (round ${currentRound})`);

    if (currentRound === 1) {
        // BS Round 1 winners go to BS Round 2
        let targetMatch;
        
        if (completedMatch.id === 'BS-1-1') {
            targetMatch = matches.find(m => m.id === 'BS-2-1');
            if (targetMatch) {
                targetMatch.player1 = winner;
                console.log(`✓ Placed ${winner.name} in BS-2-1 as player1`);
            }
        } else if (completedMatch.id === 'BS-1-2') {
            targetMatch = matches.find(m => m.id === 'BS-2-2');
            if (targetMatch) {
                targetMatch.player1 = winner;
                console.log(`✓ Placed ${winner.name} in BS-2-2 as player1`);
            }
        }
        
        if (targetMatch && typeof processAutoAdvancementForMatch === 'function') {
            processAutoAdvancementForMatch(targetMatch);
        }
        
    } else if (currentRound === 2) {
        // BS Round 2 winners go to BS-3-1
        let targetMatch = matches.find(m => m.id === 'BS-3-1');
        if (targetMatch) {
            if (completedMatch.id === 'BS-2-1') {
                targetMatch.player1 = winner;
                console.log(`✓ ${winner.name} from BS-2-1 placed in BS-3-1 as player1`);
            } else if (completedMatch.id === 'BS-2-2') {
                targetMatch.player2 = winner;
                console.log(`✓ ${winner.name} from BS-2-2 placed in BS-3-1 as player2`);
            }
            
            if (typeof processAutoAdvancementForMatch === 'function') {
                processAutoAdvancementForMatch(targetMatch);
            }
        }
        
    } else if (currentRound === 3) {
        // BS Round 3 winner goes to BS-FINAL
        let targetMatch = matches.find(m => m.id === 'BS-FINAL');
        if (targetMatch) {
            targetMatch.player2 = winner;
            console.log(`✓ ${winner.name} advanced to BS-FINAL as backside champion`);
            if (typeof processAutoAdvancementForMatch === 'function') {
                processAutoAdvancementForMatch(targetMatch);
            }
        }
    }
    
    // Re-render bracket to show changes
    if (typeof renderBracket === 'function') {
        renderBracket();
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
    
    // FIXED LOGIC FOR 8-PLAYER DOUBLE ELIMINATION:
    // Round 1 losers → Backside Round 1 (BS-1-1, BS-1-2)
    // Round 2 losers → Backside Round 2 (BS-2-1, BS-2-2) BUT they should meet BS-1 winners
    
    if (frontsideRound === 1) {
        // First round losers go to backside round 1 (this was already correct)
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
                processAutoAdvancementForMatch(match);
                return;
            } else if (match.player2.name === 'TBD') {
                match.player2 = loser;
                console.log(`✓ Placed ${loser.name} in ${match.id} as player2`);
                processAutoAdvancementForMatch(match);
                return;
            }
        }
        
        console.error(`ERROR: No available slots in backside round 1 for ${loser.name}`);
        
    } else if (frontsideRound === 2) {
        // FIXED: Second round losers should go to backside round 2
        // But they should be placed to meet the winners from backside round 1
        console.log(`${loser.name} lost in frontside round 2, going to backside round 2`);
        
        // For 8-player bracket:
        // - BS-2-1 should have: loser from FS-2-1 vs winner from BS-1-1
        // - BS-2-2 should have: loser from FS-2-2 vs winner from BS-1-2
        
        let targetBacksideMatch;
        
        if (completedMatch.id === 'FS-2-1') {
            // Loser from FS-2-1 goes to BS-2-1 as player1 (to meet BS-1-1 winner as player2)
            targetBacksideMatch = matches.find(m => m.id === 'BS-2-1');
            if (targetBacksideMatch) {
                targetBacksideMatch.player1 = loser;
                console.log(`✓ Placed ${loser.name} in BS-2-1 as player1 (will meet BS-1-1 winner)`);
            }
        } else if (completedMatch.id === 'FS-2-2') {
            // Loser from FS-2-2 goes to BS-2-2 as player1 (to meet BS-1-2 winner as player2)
            targetBacksideMatch = matches.find(m => m.id === 'BS-2-2');
            if (targetBacksideMatch) {
                targetBacksideMatch.player1 = loser;
                console.log(`✓ Placed ${loser.name} in BS-2-2 as player1 (will meet BS-1-2 winner)`);
            }
        } else {
            console.error(`ERROR: Unexpected frontside round 2 match: ${completedMatch.id}`);
            return;
        }
        
        if (targetBacksideMatch) {
            // Check for auto-advancement after placing loser
            processAutoAdvancementForMatch(targetBacksideMatch);
        } else {
            console.error(`ERROR: Target backside match not found for ${loser.name}`);
        }
        
    } else {
        // Handle other rounds (for larger brackets)
        const targetBacksideRound = getBacksideTargetRound(frontsideRound, tournament.bracketSize);
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

// Helper function to determine which backside round should receive frontside losers
function getBacksideTargetRound(frontsideRound, bracketSize) {
    // This is based on double elimination tournament structure
    // The exact logic depends on the bracket size and round
    
    if (bracketSize === 8) {
        switch (frontsideRound) {
            case 1: return 1;  // FS R1 losers → BS R1
            case 2: return 2;  // FS R2 losers → BS R2
            default: return frontsideRound; // Fallback
        }
    } else if (bracketSize === 16) {
        switch (frontsideRound) {
            case 1: return 1;  // FS R1 losers → BS R1
            case 2: return 2;  // FS R2 losers → BS R2 (meet BS R1 winners)
            case 3: return 3;  // FS R3 losers → BS R3 (meet BS R2 winners)
            default: return frontsideRound; // Fallback
        }
    } else if (bracketSize === 32) {
        // More complex logic for 32-player brackets
        switch (frontsideRound) {
            case 1: return 1;
            case 2: return 2;
            case 3: return 4;  // FS R3 losers go to BS R4 (meet BS R3 winners)
            case 4: return 6;  // FS R4 losers go to BS R6
            default: return frontsideRound + 1; // Approximate fallback
        }
    }
    
    // Default fallback
    return frontsideRound;
}

// Enhanced debug function for backside progression
function debugBacksideProgression() {
    console.log('=== BACKSIDE PROGRESSION DEBUG ===');
    
    const backsideMatches = matches.filter(m => m.side === 'backside');
    backsideMatches.forEach(match => {
        console.log(`\n--- ${match.id} (Round ${match.round}) ---`);
        console.log('Player1:', match.player1?.name || 'Empty');
        console.log('Player2:', match.player2?.name || 'Empty');
        console.log('Winner:', match.winner?.name || 'None');
        console.log('Completed:', match.completed);
        console.log('Can auto-advance:', shouldAutoAdvanceMatch(match));
    });
    
    // Show BS-FINAL status
    const bsFinal = matches.find(m => m.id === 'BS-FINAL');
    if (bsFinal) {
        console.log(`\n--- BS-FINAL ---`);
        console.log('Player1 (FS runner-up):', bsFinal.player1?.name || 'TBD');
        console.log('Player2 (BS champion):', bsFinal.player2?.name || 'TBD');
        console.log('Winner:', bsFinal.winner?.name || 'None');
    }
}

/**
 * CRITICAL FUNCTION: Determine correct players for backside round 1 matches
 * Based on which frontside R1 matches have walkovers
 */
function getBacksideRound1Players(bracket, matchIndex) {
    const bracketSize = bracket.length;
    
    if (bracketSize === 8) {
        // 8-player: BS-1-1 gets FS-1-1+FS-1-2 losers, BS-1-2 gets FS-1-3+FS-1-4 losers
        if (matchIndex === 0) {
            // BS-1-1: FS-1-1 and FS-1-2 losers
            const fs11Loser = getFrontsideLoserType(bracket, 0, 1); // positions 0,1
            const fs12Loser = getFrontsideLoserType(bracket, 2, 3); // positions 2,3
            return { p1: fs11Loser, p2: fs12Loser };
        } else if (matchIndex === 1) {
            // BS-1-2: FS-1-3 and FS-1-4 losers
            const fs13Loser = getFrontsideLoserType(bracket, 4, 5); // positions 4,5
            const fs14Loser = getFrontsideLoserType(bracket, 6, 7); // positions 6,7
            return { p1: fs13Loser, p2: fs14Loser };
        }
    } else if (bracketSize === 16) {
        // 16-player: 4 backside R1 matches, each gets 2 frontside R1 losers
        const startPos = matchIndex * 4;
        const loser1 = getFrontsideLoserType(bracket, startPos, startPos + 1);
        const loser2 = getFrontsideLoserType(bracket, startPos + 2, startPos + 3);
        return { p1: loser1, p2: loser2 };
    } else if (bracketSize === 32) {
        // 32-player: 8 backside R1 matches, each gets 2 frontside R1 losers
        const startPos = matchIndex * 4;
        const loser1 = getFrontsideLoserType(bracket, startPos, startPos + 1);
        const loser2 = getFrontsideLoserType(bracket, startPos + 2, startPos + 3);
        return { p1: loser1, p2: loser2 };
    } else if (bracketSize === 48) {
        // 48-player: 12 backside R1 matches, each gets 2 frontside R1 losers
        const startPos = matchIndex * 4;
        const loser1 = getFrontsideLoserType(bracket, startPos, startPos + 1);
        const loser2 = getFrontsideLoserType(bracket, startPos + 2, startPos + 3);
        return { p1: loser1, p2: loser2 };
    }
    
    // Fallback
    return {
        p1: { name: 'TBD', id: `bs-1-${matchIndex}-1` },
        p2: { name: 'TBD', id: `bs-1-${matchIndex}-2` }
    };
}

/**
 * CRITICAL FUNCTION: Determine correct players for backside round 2 matches
 * Mix of backside R1 winners (TBD) + frontside R2 losers
 */
function getBacksideRound2Players(bracket, matchIndex, frontsideR2Matches) {
    // Player1: Winner from backside R1 (always TBD at generation time)
    const p1 = { name: 'TBD', id: `bs-2-${matchIndex}-1` };
    
    // Player2: Loser from frontside R2 (or walkover if FS R2 had walkovers)
    let p2;
    
    if (matchIndex < frontsideR2Matches) {
        // This backside R2 match receives a frontside R2 loser
        // Check if the corresponding frontside R2 match would have walkovers
        p2 = getFrontsideR2LoserType(bracket, matchIndex);
    } else {
        // No corresponding frontside R2 match
        p2 = { name: 'TBD', id: `bs-2-${matchIndex}-2` };
    }
    
    return { p1, p2 };
}

/**
 * Determine what type of loser a frontside R1 match will produce
 * Returns either TBD (real player loser) or Walkover (walkover loser)
 */
function getFrontsideLoserType(bracket, pos1, pos2) {
    const player1 = bracket[pos1];
    const player2 = bracket[pos2];
    
    // If both are walkovers, this should not happen (bracket validation should catch this)
    if ((!player1 || player1.isBye) && (!player2 || player2.isBye)) {
        console.warn(`Both players are walkovers at positions ${pos1}, ${pos2}`);
        return { name: 'Walkover', id: `walkover-loser-${pos1}-${pos2}`, isBye: true };
    }
    
    // If one is walkover, the loser will be the walkover
    if (!player1 || player1.isBye) {
        return { name: 'Walkover', id: `walkover-loser-${pos1}`, isBye: true };
    }
    if (!player2 || player2.isBye) {
        return { name: 'Walkover', id: `walkover-loser-${pos2}`, isBye: true };
    }
    
    // Both are real players, loser will be TBD (determined later)
    return { name: 'TBD', id: `fs-1-loser-${pos1}-${pos2}` };
}

/**
 * Determine what type of loser a frontside R2 match will produce
 * This is more complex as it depends on R1 results
 */
/**
 * Determine what type of loser a frontside R2 match will produce
 * This analyzes the R1 results to see if R2 match involves walkovers
 */
function getFrontsideR2LoserType(bracket, r2MatchIndex) {
    const bracketSize = bracket.length;
    
    if (bracketSize === 8) {
        if (r2MatchIndex === 1) {
            // FS-2-2: Check FS-1-3 and FS-1-4 for walkovers
            const fs13HasWalkover = hasWalkover(bracket, 4, 5); // positions 4,5 (FS-1-3)
            const fs14HasWalkover = hasWalkover(bracket, 6, 7); // positions 6,7 (FS-1-4)
            
            // If either source match had a walkover, the R2 loser will be a walkover
            if (fs13HasWalkover || fs14HasWalkover) {
                return { name: 'Walkover', id: `fs-2-walkover-loser-${r2MatchIndex}`, isBye: true };
            }
        }
    }
    
    // Default: assume real player loser
    return { name: 'TBD', id: `fs-2-loser-${r2MatchIndex}` };
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

/**
 * Determine what type of loser a frontside R2 match will produce
 * This analyzes the R1 results to see if R2 match involves walkovers
 */
function getFrontsideR2LoserType(bracket, r2MatchIndex) {
    const bracketSize = bracket.length;
    
    if (bracketSize === 8) {
        // FS-2-1 gets winners from FS-1-1 and FS-1-2
        // FS-2-2 gets winners from FS-1-3 and FS-1-4
        
        if (r2MatchIndex === 0) {
            // FS-2-1: Check FS-1-1 and FS-1-2
            const fs11HasWalkover = hasWalkover(bracket, 0, 1); // positions 0,1
            const fs12HasWalkover = hasWalkover(bracket, 2, 3); // positions 2,3
            
            // If either source match had a walkover, the R2 loser could be a walkover
            if (fs11HasWalkover || fs12HasWalkover) {
                return { name: 'Walkover', id: `fs-2-walkover-loser-${r2MatchIndex}`, isBye: true };
            }
        } else if (r2MatchIndex === 1) {
            // FS-2-2: Check FS-1-3 and FS-1-4  
            const fs13HasWalkover = hasWalkover(bracket, 4, 5); // positions 4,5
            const fs14HasWalkover = hasWalkover(bracket, 6, 7); // positions 6,7
            
            // If either source match had a walkover, the R2 loser could be a walkover
            if (fs13HasWalkover || fs14HasWalkover) {
                return { name: 'Walkover', id: `fs-2-walkover-loser-${r2MatchIndex}`, isBye: true };
            }
        }
    }
    
    // For other bracket sizes or if no walkovers, assume real player loser
    return { name: 'TBD', id: `fs-2-loser-${r2MatchIndex}` };
}

/**
 * Helper function to check if a frontside R1 match has a walkover
 */
function hasWalkover(bracket, pos1, pos2) {
    const player1 = bracket[pos1];
    const player2 = bracket[pos2];
    
    return (!player1 || player1.isBye) || (!player2 || player2.isBye);
}