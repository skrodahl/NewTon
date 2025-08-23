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

    generateMatches();
    saveTournament();
    renderBracket();
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

    // Process all auto-advancements from walkovers
    checkForAutoAdvancement();
}

function calculateBracketStructure(bracketSize) {
    const frontsideRounds = Math.ceil(Math.log2(bracketSize));

    // Double elimination backside structure
    const backsideRounds = (frontsideRounds - 1) * 2;

    // Calculate matches per round for frontside
    const frontsideStructure = [];
    for (let round = 1; round <= frontsideRounds; round++) {
        const matchesInRound = Math.pow(2, frontsideRounds - round);
        frontsideStructure.push({
            round: round,
            matches: matchesInRound,
            isLast: round === frontsideRounds
        });
    }

    // Calculate matches per round for backside
    const backsideStructure = [];
    for (let round = 1; round <= backsideRounds; round++) {
        let matchesInRound;

        if (round === 1) {
            // First backside round: half of first frontside losers
            matchesInRound = Math.pow(2, frontsideRounds - 2);
        } else if (round % 2 === 0) {
            // Even rounds: merge with frontside losers
            const frontsideRoundLosers = Math.floor((round / 2) + 1);
            matchesInRound = Math.pow(2, frontsideRounds - frontsideRoundLosers - 1);
        } else {
            // Odd rounds: advance backside winners
            matchesInRound = Math.pow(2, frontsideRounds - Math.ceil(round / 2) - 1);
        }

        matchesInRound = Math.max(1, matchesInRound);
        backsideStructure.push({
            round: round,
            matches: matchesInRound,
            receivesFromFrontside: round % 2 === 0
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

            // Auto-complete matches with walkovers/byes
            // Only auto-advance if exactly one player is a bye/walkover
            if ((player1.isBye || player1.name === 'BYE') && !(player2.isBye || player2.name === 'BYE')) {
                match.winner = player2;
                match.completed = true;
                match.autoAdvanced = true;
                console.log(`Auto-advancing ${player2.name} in match ${match.id} (opponent is bye/walkover)`);
            } else if ((player2.isBye || player2.name === 'BYE') && !(player1.isBye || player1.name === 'BYE')) {
                match.winner = player1;
                match.completed = true;
                match.autoAdvanced = true;
                console.log(`Auto-advancing ${player1.name} in match ${match.id} (opponent is bye/walkover)`);
            }
            // Note: We should never have both players as byes with the new logic

            matches.push(match);
        }
    });
}

function generateBacksideMatches(structure, startId) {
    let matchId = startId;

    structure.backside.forEach((roundInfo, roundIndex) => {
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            const match = {
                id: `BS-${roundInfo.round}-${matchIndex + 1}`,
                numericId: matchId++,
                round: roundInfo.round,
                side: 'backside',
                player1: { name: 'TBD', id: `bs-${roundInfo.round}-${matchIndex}-1` },
                player2: { name: 'TBD', id: `bs-${roundInfo.round}-${matchIndex}-2` },
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

function checkForAutoAdvancement() {
    let foundAutoAdvancement = false;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    console.log('Checking for auto-advancements...');

    matches.forEach(match => {
        if (!match.completed &&
            match.player1 && match.player2 &&
            match.player1.name !== 'TBD' && match.player2.name !== 'TBD') {

            // Check if one player is a walkover/bye
            const player1IsBye = match.player1.isBye || match.player1.name === 'BYE';
            const player2IsBye = match.player2.isBye || match.player2.name === 'BYE';

            if (player1IsBye && !player2IsBye) {
                match.winner = match.player2;
                match.completed = true;
                match.autoAdvanced = true;
                foundAutoAdvancement = true;
                console.log(`Auto-advancing ${match.player2.name} in ${match.id} (vs walkover)`);
                advanceWinner(match);
            } else if (player2IsBye && !player1IsBye) {
                match.winner = match.player1;
                match.completed = true;
                match.autoAdvanced = true;
                foundAutoAdvancement = true;
                console.log(`Auto-advancing ${match.player1.name} in ${match.id} (vs walkover)`);
                advanceWinner(match);
            } else if (player1IsBye && player2IsBye) {
                // This should NEVER happen with our new logic
                console.error(`ERROR: Both players are byes in match ${match.id}! This should not occur.`);
                // Emergency fallback - advance the first bye
                match.winner = match.player1;
                match.completed = true;
                match.autoAdvanced = true;
                foundAutoAdvancement = true;
                advanceWinner(match);
            }
        }
    });

    // If we found any auto-advancements, check again for new situations (but limit iterations)
    if (foundAutoAdvancement && iterations < maxIterations) {
        iterations++;
        setTimeout(() => {
            console.log(`Iteration ${iterations}: Found auto-advancements, checking again...`);
            checkForAutoAdvancement();
        }, 100);
    } else if (iterations >= maxIterations) {
        console.warn('Maximum auto-advancement iterations reached');
    } else {
        console.log('Auto-advancement check complete');
    }
}
