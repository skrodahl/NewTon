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
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-2', 'player2'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-1', 'player2'] },
        'FS-3-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },

        // === BACKSIDE ===
        'BS-1-1': { winner: ['BS-2-1', 'player1'] },
        'BS-1-2': { winner: ['BS-2-2', 'player1'] },
        'BS-2-1': { winner: ['BS-3-1', 'player1'] },
        'BS-2-2': { winner: ['BS-3-1', 'player2'] },
        'BS-3-1': { winner: ['BS-FINAL', 'player2'] },
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] },

        // Grand Final: FS champion vs BS champion
        // Winner = 1st place, Loser = 2nd place
        'GRAND-FINAL': {} // Tournament complete
    },

    16: {
        // === FRONTSIDE ===
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-1-5': { winner: ['FS-2-3', 'player1'], loser: ['BS-1-3', 'player1'] },
        'FS-1-6': { winner: ['FS-2-3', 'player2'], loser: ['BS-1-3', 'player2'] },
        'FS-1-7': { winner: ['FS-2-4', 'player1'], loser: ['BS-1-4', 'player1'] },
        'FS-1-8': { winner: ['FS-2-4', 'player2'], loser: ['BS-1-4', 'player2'] },

        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-3', 'player2'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-4', 'player2'] },
        'FS-2-3': { winner: ['FS-3-2', 'player1'], loser: ['BS-2-1', 'player2'] },
        'FS-2-4': { winner: ['FS-3-2', 'player2'], loser: ['BS-2-2', 'player2'] },

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
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] },

        // Grand Final: FS champion vs BS champion
        // Winner = 1st place, Loser = 2nd place
        'GRAND-FINAL': {} // Tournament complete
    },

    32: {
        // === FRONTSIDE MATCHES ===

        // Round 1 (16 matches: FS-1-1 through FS-1-16)
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

        // Round 2 (8 matches: FS-2-1 through FS-2-8)  
        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-5', 'player2'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-6', 'player2'] },
        'FS-2-3': { winner: ['FS-3-2', 'player1'], loser: ['BS-2-7', 'player2'] },
        'FS-2-4': { winner: ['FS-3-2', 'player2'], loser: ['BS-2-8', 'player2'] },
        'FS-2-5': { winner: ['FS-3-3', 'player1'], loser: ['BS-2-1', 'player2'] },
        'FS-2-6': { winner: ['FS-3-3', 'player2'], loser: ['BS-2-2', 'player2'] },
        'FS-2-7': { winner: ['FS-3-4', 'player1'], loser: ['BS-2-3', 'player2'] },
        'FS-2-8': { winner: ['FS-3-4', 'player2'], loser: ['BS-2-4', 'player2'] },

        // Round 3 (4 matches: FS-3-1 through FS-3-4)
        'FS-3-1': { winner: ['FS-4-1', 'player1'], loser: ['BS-4-2', 'player2'] },
        'FS-3-2': { winner: ['FS-4-1', 'player2'], loser: ['BS-4-1', 'player2'] },
        'FS-3-3': { winner: ['FS-4-2', 'player1'], loser: ['BS-4-4', 'player2'] },
        'FS-3-4': { winner: ['FS-4-2', 'player2'], loser: ['BS-4-3', 'player2'] },

        // Round 4 (2 matches: FS-4-1 through FS-4-2)
        'FS-4-1': { winner: ['FS-5-1', 'player1'], loser: ['BS-6-2', 'player2'] },
        'FS-4-2': { winner: ['FS-5-1', 'player2'], loser: ['BS-6-1', 'player2'] },

        // Round 5 (1 match: FS-5-1) - Frontside Final
        'FS-5-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },

        // === BACKSIDE MATCHES ===

        // Round 1 (8 matches: BS-1-1 through BS-1-8)
        // FS-R1 losers compete, losers eliminated
        // Losers gets 25th-32nd place
        'BS-1-1': { winner: ['BS-2-1', 'player1'] },
        'BS-1-2': { winner: ['BS-2-2', 'player1'] },
        'BS-1-3': { winner: ['BS-2-3', 'player1'] },
        'BS-1-4': { winner: ['BS-2-4', 'player1'] },
        'BS-1-5': { winner: ['BS-2-5', 'player1'] },
        'BS-1-6': { winner: ['BS-2-6', 'player1'] },
        'BS-1-7': { winner: ['BS-2-7', 'player1'] },
        'BS-1-8': { winner: ['BS-2-8', 'player1'] },

        // Round 2 (8 matches: BS-2-1 through BS-2-8)
        // BS-R1 winners meet FS-R2 losers, losers eliminated
        // Losers gets 17th-24th place
        'BS-2-1': { winner: ['BS-3-1', 'player1'] },
        'BS-2-2': { winner: ['BS-3-1', 'player2'] },
        'BS-2-3': { winner: ['BS-3-2', 'player1'] },
        'BS-2-4': { winner: ['BS-3-2', 'player2'] },
        'BS-2-5': { winner: ['BS-3-3', 'player1'] },
        'BS-2-6': { winner: ['BS-3-3', 'player2'] },
        'BS-2-7': { winner: ['BS-3-4', 'player1'] },
        'BS-2-8': { winner: ['BS-3-4', 'player2'] },

        // Round 3 (4 matches: BS-3-1 through BS-3-4)
        // Only backside winners, no frontside input, losers eliminated
        // Losers gets 13th-16tth place
        'BS-3-1': { winner: ['BS-4-1', 'player1'] },
        'BS-3-2': { winner: ['BS-4-2', 'player1'] },
        'BS-3-3': { winner: ['BS-4-3', 'player1'] },
        'BS-3-4': { winner: ['BS-4-4', 'player1'] },

        // Round 4 (4 matches: BS-4-1 through BS-4-4)
        // BS-R3 winners meet FS-R3 losers, losers eliminated
        // Losers gets 9th-12th place
        'BS-4-1': { winner: ['BS-5-1', 'player1'] },
        'BS-4-2': { winner: ['BS-5-1', 'player2'] },
        'BS-4-3': { winner: ['BS-5-2', 'player1'] },
        'BS-4-4': { winner: ['BS-5-2', 'player2'] },

        // Round 5 (2 matches: BS-5-1 through BS-5-2)
        // Only backside winners, no frontside input, losers eliminated
        // Losers gets 7th-8th place
        'BS-5-1': { winner: ['BS-6-1', 'player1'] },
        'BS-5-2': { winner: ['BS-6-2', 'player1'] },

        // Round 6 (2 matches: BS-6-1 through BS-6-2)
        // BS-R5 winners meet FS-R4 losers, losers eliminated
        // Losers gets 5th-6th place
        'BS-6-1': { winner: ['BS-7-1', 'player1'] },
        'BS-6-2': { winner: ['BS-7-1', 'player2'] },

        // Round 7 (1 matches: BS-7-1) - Backside final
        // Only backside winners, no frontside input, losers eliminated
        // Loser gets 4th place
        'BS-7-1': { winner: ['BS-FINAL', 'player2'] },

        // === FINAL MATCHES ===

        // Backside Final: FS-5-1 loser vs BS-7-1 winner
        // Loser gets 3rd place
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] },

        // Grand Final: FS champion vs BS champion
        // Winner = 1st place, Loser = 2nd place
        'GRAND-FINAL': {} // Tournament complete
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
        // No further progression (e.g., GRAND-FINAL)  just stop silently
        return true;
    }


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
        } else {
            console.error(`Target match ${targetMatchId} not found for loser`);
        }
    }

    return true;
}

/* SIMPLE MATCH COMPLETION: Sets winner/loser and advances using lookup table
 * MODIFIED: Now saves to history before making changes
 */
// UPDATE: Enhanced completeMatch with help integration for first match
function completeMatch(matchId, winnerPlayerNumber, winnerLegs = 0, loserLegs = 0, completionType = 'MANUAL') {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error('Match ' + matchId + ' not found');
        return false;
    }

    const winner = winnerPlayerNumber === 1 ? match.player1 : match.player2;
    const loser = winnerPlayerNumber === 1 ? match.player2 : match.player1;

    if (!winner || !loser) {
        console.error('Invalid player selection');
        return false;
    }

    // --- START TRANSACTION LOGIC ---
    // Skip transaction creation during rebuild to prevent corruption
    if (!window.rebuildInProgress) {
        // Capture current state BEFORE making any changes
        const beforeMatchesState = JSON.parse(JSON.stringify(matches));

        const transaction = {
            id: `tx_${Date.now()}`,
            type: 'COMPLETE_MATCH',
            completionType: completionType,
            description: `${matchId}: ${winner.name} defeats ${loser.name}`,
            timestamp: new Date().toISOString(),
            matchId: matchId,
            winner: winner,
            loser: loser,
            beforeState: {
                matches: beforeMatchesState,
                tournament: JSON.parse(JSON.stringify(tournament)) // Save tournament state
            }
        };
        saveTransaction(transaction);
    }
    // --- END TRANSACTION LOGIC ---

    // Apply changes to the current state
    match.winner = winner;
    match.loser = loser;
    match.completed = true;
    match.active = false;
    match.completedAt = Date.now(); // Add completion timestamp
    if (winnerLegs > 0 || loserLegs > 0) {
        match.finalScore = { winnerLegs, loserLegs, winnerId: winner.id, loserId: loser.id };
    }

    const success = advancePlayer(matchId, winner, loser);

    if (success) {

        saveTournament();
        if (typeof updateResultsTable === 'function') updateResultsTable();
        if (typeof updateMatchHistory === 'function') updateMatchHistory();

        // Calculate live rankings after every match completion (reuse existing logic)
        // Only calculate rankings during normal play, not during rebuild or auto-advancement processing
        if (!window.rebuildInProgress && !window.processingAutoAdvancements) {
            try {
                calculateAllRankings();
                if (typeof saveTournament === 'function') saveTournament(); // Save updated rankings
                if (typeof updateResultsTable === 'function') updateResultsTable(); // Refresh Registration page results
            } catch (e) {
                console.warn('Could not calculate live rankings:', e);
            }
        }

        // Grand Final completion hook: set placements and complete tournament
        try {
            if (matchId === 'GRAND-FINAL') {
                console.log('🏆 Grand Final completed - calculating all rankings...');

                // Clear any existing placements
                tournament.placements = {};

                // 1st and 2nd place (Grand Final)
                tournament.placements[String(winner.id)] = 1;
                tournament.placements[String(loser.id)] = 2;

                // 3rd place (BS-FINAL loser)
                const bsFinal = matches.find(m => m.id === 'BS-FINAL');
                if (bsFinal && bsFinal.completed && bsFinal.loser && bsFinal.loser.id) {
                    tournament.placements[String(bsFinal.loser.id)] = 3;
                }

                // Calculate remaining rankings based on bracket size
                calculateAllRankings();

                tournament.status = 'completed';

                console.log(`✓ Tournament completed with full rankings — Grand Final: ${winner.name} defeats ${loser.name}`);

                if (typeof saveTournament === 'function') saveTournament();
                if (typeof updateMatchHistory === 'function') updateMatchHistory();

                // Proactively refresh results UI after completion
                if (typeof displayResults === 'function') {
                    try {
                        displayResults();

                        // HELP SYSTEM INTEGRATION - Tournament completed
                        if (typeof showHelpHint === 'function') {
                            showHelpHint(`🏆 Tournament completed! ${winner.name} wins. Check results in Match Controls or on Registration page.`, 8000);
                        }
                    } catch (e) {
                        console.warn('displayResults failed after completion', e);
                    }
                }
            }
        } catch (e) {
            console.error('Grand-final completion error', { matchId, winner, loser, error: e });
        }

        // Skip auto-advancements during rebuild to prevent transaction corruption
        if (!window.rebuildInProgress) {
            processAutoAdvancements();
        }
        return true;
    } else {
        console.error(`Failed to advance players from ${matchId}`);
        // Here we should ideally roll back the transaction, but for now we'll log an error
        return false;
    }
}

/**
 * NEW: Get all downstream matches affected by a given match's outcome.
 * @param {string} matchId The starting match ID.
 * @param {number} bracketSize The size of the tournament bracket.
 * @returns {Set<string>} A set of all downstream match IDs.
 */
function getDownstreamMatches(matchId, bracketSize) {
    const progression = MATCH_PROGRESSION[bracketSize];
    if (!progression) return new Set();

    const downstream = new Set();
    const queue = [matchId];
    const visited = new Set();

    while (queue.length > 0) {
        const currentMatchId = queue.shift();
        if (visited.has(currentMatchId)) {
            continue;
        }
        visited.add(currentMatchId);

        const rule = progression[currentMatchId];
        if (rule) {
            if (rule.winner) {
                const winnerDest = rule.winner[0];
                const winnerDestMatch = matches.find(m => m.id === winnerDest);
                if (winnerDestMatch && winnerDestMatch.completed && !downstream.has(winnerDest)) {
                    downstream.add(winnerDest);
                    queue.push(winnerDest);
                }
            }
            if (rule.loser) {
                const loserDest = rule.loser[0];
                const loserDestMatch = matches.find(m => m.id === loserDest);
                if (loserDestMatch && loserDestMatch.completed && !downstream.has(loserDest)) {
                    downstream.add(loserDest);
                    queue.push(loserDest);
                }
            }
        }
    }

    return downstream;
}

/**
 * CALCULATE ALL RANKINGS - Called only when tournament is completed
 * Determines 4th place and beyond for all bracket sizes
 */
function calculateAllRankings() {
    if (!tournament || !tournament.bracketSize) {
        console.error('Cannot calculate rankings: missing tournament or bracket size');
        return;
    }

    const bracketSize = tournament.bracketSize;
    console.log(`Calculating rankings for ${bracketSize}-player bracket...`);

    if (bracketSize === 8) {
        calculate8PlayerRankings();
    } else if (bracketSize === 16) {
        calculate16PlayerRankings();
    } else if (bracketSize === 32) {
        calculate32PlayerRankings();
    } else {
        console.warn(`Ranking calculation not implemented for ${bracketSize}-player bracket`);
    }

    console.log('Final tournament placements:', tournament.placements);
}

/**
 * CALCULATE 8-PLAYER RANKINGS
 */
function calculate8PlayerRankings() {
    console.log('Calculating 8-player rankings...');

    // 4th place: BS-3-1 loser
    const bs31 = matches.find(m => m.id === 'BS-3-1');
    if (bs31?.completed && bs31.loser?.id) {
        tournament.placements[String(bs31.loser.id)] = 4;
        console.log(`4th place: ${bs31.loser.name}`);
    }

    // 5th-6th place: BS-2-1 and BS-2-2 losers  
    const bs21 = matches.find(m => m.id === 'BS-2-1');
    const bs22 = matches.find(m => m.id === 'BS-2-2');

    if (bs21?.completed && bs21.loser?.id) {
        tournament.placements[String(bs21.loser.id)] = 5; // Will display as "5th-6th"
        console.log(`5th-6th place: ${bs21.loser.name}`);
    }
    if (bs22?.completed && bs22.loser?.id) {
        tournament.placements[String(bs22.loser.id)] = 5; // Same rank for tie
        console.log(`5th-6th place: ${bs22.loser.name}`);
    }

    // 7th-8th place: BS-1-1 and BS-1-2 losers
    const bs11 = matches.find(m => m.id === 'BS-1-1');
    const bs12 = matches.find(m => m.id === 'BS-1-2');

    if (bs11?.completed && bs11.loser?.id) {
        tournament.placements[String(bs11.loser.id)] = 7; // Will display as "7th-8th"
        console.log(`7th-8th place: ${bs11.loser.name}`);
    }
    if (bs12?.completed && bs12.loser?.id) {
        tournament.placements[String(bs12.loser.id)] = 7; // Same rank for tie
        console.log(`7th-8th place: ${bs12.loser.name}`);
    }

    console.log('✓ 8-player rankings calculated');
}

/**
 * CALCULATE 16-PLAYER RANKINGS
 */
function calculate16PlayerRankings() {
    console.log('Calculating 16-player rankings...');

    // 4th place: BS-5-1 loser
    const bs51 = matches.find(m => m.id === 'BS-5-1');
    if (bs51?.completed && bs51.loser?.id) {
        tournament.placements[String(bs51.loser.id)] = 4;
        console.log(`4th place: ${bs51.loser.name}`);
    }

    // 5th-6th place: BS-4-1 and BS-4-2 losers
    const bs41 = matches.find(m => m.id === 'BS-4-1');
    const bs42 = matches.find(m => m.id === 'BS-4-2');

    if (bs41?.completed && bs41.loser?.id) {
        tournament.placements[String(bs41.loser.id)] = 5;
        console.log(`5th-6th place: ${bs41.loser.name}`);
    }
    if (bs42?.completed && bs42.loser?.id) {
        tournament.placements[String(bs42.loser.id)] = 5;
        console.log(`5th-6th place: ${bs42.loser.name}`);
    }

    // 7th-8th place: BS-3-1 and BS-3-2 losers
    const bs31 = matches.find(m => m.id === 'BS-3-1');
    const bs32 = matches.find(m => m.id === 'BS-3-2');

    if (bs31?.completed && bs31.loser?.id) {
        tournament.placements[String(bs31.loser.id)] = 7;
        console.log(`7th-8th place: ${bs31.loser.name}`);
    }
    if (bs32?.completed && bs32.loser?.id) {
        tournament.placements[String(bs32.loser.id)] = 7;
        console.log(`7th-8th place: ${bs32.loser.name}`);
    }

    // 9th-12th place: BS-2-1 to BS-2-4 losers
    const bs2Matches = ['BS-2-1', 'BS-2-2', 'BS-2-3', 'BS-2-4'];
    bs2Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 9; // All get rank 9 for "9th-12th"
            console.log(`9th-12th place: ${match.loser.name}`);
        }
    });

    // 13th-16th place: BS-1-1 to BS-1-4 losers
    const bs1Matches = ['BS-1-1', 'BS-1-2', 'BS-1-3', 'BS-1-4'];
    bs1Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 13; // All get rank 13 for "13th-16th"
            console.log(`13th-16th place: ${match.loser.name}`);
        }
    });

    console.log('✓ 16-player rankings calculated');
}

/**
 * CALCULATE 32-PLAYER RANKINGS
 */
function calculate32PlayerRankings() {
    console.log('Calculating 32-player rankings...');

    // 4th place: BS-7-1 loser
    const bs71 = matches.find(m => m.id === 'BS-7-1');
    if (bs71?.completed && bs71.loser?.id) {
        tournament.placements[String(bs71.loser.id)] = 4;
        console.log(`4th place: ${bs71.loser.name}`);
    }

    // 5th-6th place: BS-6-1 and BS-6-2 losers
    const bs61 = matches.find(m => m.id === 'BS-6-1');
    const bs62 = matches.find(m => m.id === 'BS-6-2');

    if (bs61?.completed && bs61.loser?.id) {
        tournament.placements[String(bs61.loser.id)] = 5;
        console.log(`5th-6th place: ${bs61.loser.name}`);
    }
    if (bs62?.completed && bs62.loser?.id) {
        tournament.placements[String(bs62.loser.id)] = 5;
        console.log(`5th-6th place: ${bs62.loser.name}`);
    }

    // 7th-8th place: BS-5-1 and BS-5-2 losers
    const bs51 = matches.find(m => m.id === 'BS-5-1');
    const bs52 = matches.find(m => m.id === 'BS-5-2');

    if (bs51?.completed && bs51.loser?.id) {
        tournament.placements[String(bs51.loser.id)] = 7;
        console.log(`7th-8th place: ${bs51.loser.name}`);
    }
    if (bs52?.completed && bs52.loser?.id) {
        tournament.placements[String(bs52.loser.id)] = 7;
        console.log(`7th-8th place: ${bs52.loser.name}`);
    }

    // 9th-12th place: BS-4-1 to BS-4-4 losers
    const bs4Matches = ['BS-4-1', 'BS-4-2', 'BS-4-3', 'BS-4-4'];
    bs4Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 9; // All get rank 9 for "9th-12th"
            console.log(`9th-12th place: ${match.loser.name}`);
        }
    });

    // 13th-16th place: BS-3-1 to BS-3-4 losers
    const bs3Matches = ['BS-3-1', 'BS-3-2', 'BS-3-3', 'BS-3-4'];
    bs3Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 13; // All get rank 13 for "13th-16th"
            console.log(`13th-16th place: ${match.loser.name}`);
        }
    });

    // 17th-24th place: BS-2-1 to BS-2-8 losers
    const bs2Matches = ['BS-2-1', 'BS-2-2', 'BS-2-3', 'BS-2-4', 'BS-2-5', 'BS-2-6', 'BS-2-7', 'BS-2-8'];
    bs2Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 17; // All get rank 17 for "17th-24th"
            console.log(`17th-24th place: ${match.loser.name}`);
        }
    });

    // 25th-32nd place: BS-1-1 to BS-1-8 losers
    const bs1Matches = ['BS-1-1', 'BS-1-2', 'BS-1-3', 'BS-1-4', 'BS-1-5', 'BS-1-6', 'BS-1-7', 'BS-1-8'];
    bs1Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 25; // All get rank 25 for "25th-32nd"
            console.log(`25th-32nd place: ${match.loser.name}`);
        }
    });

    console.log('✓ 32-player rankings calculated');
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
    return completeMatch(match.id, winnerPlayerNumber, 0, 0, 'AUTO');
}

/**
 * PROCESS ALL AUTO-ADVANCEMENTS
 */
function processAutoAdvancements() {
    if (!matches || matches.length === 0) return;

    // Skip auto-advancements during rebuild to prevent transaction corruption
    if (window.rebuildInProgress || window.autoAdvancementsDisabled) {
        console.log('🚫 processAutoAdvancements blocked during rebuild');
        return;
    }

    // Prevent recursive calls to avoid infinite loops
    if (window.processingAutoAdvancements) {
        console.log('🚫 processAutoAdvancements already running, skipping to prevent infinite loop');
        console.log('⚠️ Flag state check - processingAutoAdvancements:', window.processingAutoAdvancements);
        return;
    }

    // DEBUG: Log what triggered this auto-advancement
    console.log('⚡ processAutoAdvancements called - stack trace:', new Error().stack.substring(0, 500));

    // Set flag to prevent recursive calls
    window.processingAutoAdvancements = true;

    try {
        let foundAdvancement = true;
        let iterations = 0;
        const maxIterations = 10;

        const autoAdvancedMatches = [];

        while (foundAdvancement && iterations < maxIterations) {
            foundAdvancement = false;
            iterations++;

            matches.forEach(match => {
                if (shouldAutoAdvance(match)) {
                    // Determine automatic winner
                    const p1IsWalkover = isWalkover(match.player1);
                    const winnerPlayerNumber = p1IsWalkover ? 2 : 1;

                    // Mark as auto-advanced and complete
                    match.autoAdvanced = true;
                    autoAdvancedMatches.push(match.id);
                    completeMatch(match.id, winnerPlayerNumber, 0, 0, 'AUTO');
                    foundAdvancement = true;
                }
            });
        }

        if (autoAdvancedMatches.length > 0) {
            console.log(`Auto-advanced: ${autoAdvancedMatches.join(', ')} (${autoAdvancedMatches.length} matches)`);
        }
    } finally {
        // Always clear flag, even if function exits early
        console.log('🧹 Clearing processingAutoAdvancements flag');
        window.processingAutoAdvancements = false;
    }
}

/**
 * DEBUGGING: Reset stuck flags (can be called from browser console)
 */
function resetAutoAdvancementFlags() {
    console.log('🔧 Resetting auto-advancement flags');
    window.processingAutoAdvancements = false;
    window.rebuildInProgress = false;
    window.autoAdvancementsDisabled = false;
    console.log('✅ Flags reset');
}

// Make it globally available for debugging
if (typeof window !== 'undefined') {
    window.resetAutoAdvancementFlags = resetAutoAdvancementFlags;
}

/**
 * WINNER SELECTION
 */
function selectWinnerClean(matchId, playerNumber) {
    return validateAndShowWinnerDialog(matchId, playerNumber);
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
        window.advanceWinner = function () {
            console.log('Old advanceWinner disabled - using new lookup system');
        };
        window.advanceBacksideWinner = function () {
            console.log('Old advanceBacksideWinner disabled - using new lookup system');
        };
        window.dropFrontsideLoser = function () {
            console.log('Old dropFrontsideLoser disabled - using new lookup system');
        };
        window.processAutoAdvancementForMatch = function () {
            console.log('Old processAutoAdvancementForMatch disabled');
        };
        window.forceBacksideAutoAdvancement = function () {
            console.log('Old forceBacksideAutoAdvancement disabled');
        };
    }
}

// Disable old system immediately when this file loads
disableOldProgressionSystem();

/**
 * CLEAN BRACKET GENERATION: Real players first, walkovers last, never walkover vs walkover
 */
// UPDATE: Enhanced generateCleanBracket with help integration
function generateCleanBracket() {
    if (!tournament) {
        alert('Please create a tournament first');
        return false;
    }

    // Check if bracket already exists
    if (tournament.bracket && matches.length > 0) {
        showTournamentProgressWarning();
        return false;
    }

    const paidPlayers = players.filter(p => p.paid);
    if (paidPlayers.length < 4) {
        alert('At least 4 paid players are required to generate an 8-player double-elimination tournament.');
        console.error('Bracket generation blocked: fewer than 4 paid players');

        // HELP SYSTEM INTEGRATION
        if (typeof showHelpHint === 'function') {
            showHelpHint('Need at least 4 paid players to generate bracket. Add more players on Registration page.', 5000);
        }
        return false;
    }

    // Determine bracket size
    let bracketSize;
    if (paidPlayers.length <= 8) bracketSize = 8;
    else if (paidPlayers.length <= 16) bracketSize = 16;
    else if (paidPlayers.length <= 32) bracketSize = 32;
    else bracketSize = 48;

    if (paidPlayers.length < 4) {
        alert('At least 4 paid players are required to generate a double-elimination tournament.');
        console.error('Bracket generation blocked: fewer than 4 paid players');
        return false;
    }

    if (paidPlayers.length > 32) {
        alert('Maximum 32 paid players supported. Please remove some players to generate bracket.');
        console.error('Bracket generation blocked: more than 32 paid players');
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

    // Store bracket info
    tournament.bracket = bracket;
    tournament.bracketSize = bracketSize;
    tournament.status = 'active';

    // Generate all match structures with clean TBD placeholders
    generateAllMatches(bracket, bracketSize);

    // Process initial auto-advancements (real vs walkover)
    // Skip during rebuild to prevent transaction corruption
    if (!window.rebuildInProgress) {
        processAutoAdvancements();
    }

    // Save and render
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    if (typeof renderBracket === 'function') {
        renderBracket();
    }

    console.log(`✓ Clean bracket generated: ${bracketSize} positions, ${paidPlayers.length} real players`);

    // Refresh results table immediately after bracket generation
    if (typeof displayResults === 'function') {
        displayResults();
    }

    // Refresh Match Controls if it's open to show new ACTIVE state
    const modal = document.getElementById('matchCommandCenterModal');
    if (modal &&
        (modal.style.display === 'flex' || modal.style.display === 'block') &&
        typeof showMatchCommandCenter === 'function') {
        setTimeout(() => {
            showMatchCommandCenter();
        }, 100);
    }

    if (typeof showPage === 'function') {
        showPage('tournament');
    }

    // HELP SYSTEM INTEGRATION
    if (typeof onBracketGenerated === 'function') {
        onBracketGenerated();
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
            { round: 3, matches: 4 },
            { round: 4, matches: 4 },
            { round: 5, matches: 2 },
            { round: 6, matches: 2 },
            { round: 7, matches: 1 }

        ];
    }

    return { frontside, backside, frontsideRounds };
}

/**
 * GENERATE FRONTSIDE MATCHES
 */
function generateFrontsideMatches(bracket, structure, startId) {
    let numericId = startId;

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

            // Determine leg count based on match type
            let legCount;
            const matchId = `FS-${roundInfo.round}-${matchIndex + 1}`;

            if (isFrontsideSemifinal(matchId, tournament.bracketSize)) {
                legCount = config.legs.frontsideSemifinal;
            } else {
                legCount = config.legs.regularRounds;
            }

            const match = {
                id: matchId,
                numericId: numericId++,
                round: roundInfo.round,
                side: 'frontside',
                player1: player1,
                player2: player2,
                winner: null,
                loser: null,
                lane: null,
                legs: legCount,
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
    let numericId = startId;

    structure.backside.forEach((roundInfo) => {
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            // All backside matches start with TBD players
            const player1 = createTBDPlayer(`bs-${roundInfo.round}-${matchIndex}-1`);
            const player2 = createTBDPlayer(`bs-${roundInfo.round}-${matchIndex}-2`);

            // Determine leg count based on match type
            let legCount;
            const matchId = `BS-${roundInfo.round}-${matchIndex + 1}`;

            if (isBacksideSemifinal(matchId, tournament.bracketSize)) {
                legCount = config.legs.backsideSemifinal;
            } else {
                legCount = config.legs.regularRounds;
            }

            const match = {
                id: matchId,
                numericId: numericId++,
                round: roundInfo.round,
                side: 'backside',
                player1: player1,
                player2: player2,
                winner: null,
                loser: null,
                lane: null,
                legs: legCount,
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

    // Capture state before change for transaction
    const wasActive = match.active;

    // Toggle active state
    match.active = !match.active;

    console.log(`Match ${matchId} ${match.active ? 'activated' : 'deactivated'}`);

    // Create transaction for match state change
    if (!window.rebuildInProgress) {
        const transaction = {
            id: `tx_${Date.now()}`,
            type: match.active ? 'START_MATCH' : 'STOP_MATCH',
            description: `${matchId}: ${match.active ? 'Started' : 'Stopped'}`,
            timestamp: new Date().toISOString(),
            matchId: matchId,
            beforeState: { active: wasActive },
            afterState: { active: match.active }
        };

        saveTransaction(transaction);
    }

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

    // Capture state before change for transaction
    const oldLane = match.lane;
    const parsedNewLane = newLane ? parseInt(newLane) : null;

    match.lane = parsedNewLane;

    console.log(`Lane updated for ${matchId}: ${match.lane || 'none'}`);

    // Create transaction for lane assignment
    if (!window.rebuildInProgress) {
        const transaction = {
            id: `tx_${Date.now()}`,
            type: 'ASSIGN_LANE',
            description: `${matchId}: Lane ${parsedNewLane ? `assigned to ${parsedNewLane}` : 'cleared'}`,
            timestamp: new Date().toISOString(),
            matchId: matchId,
            beforeState: { lane: oldLane },
            afterState: { lane: parsedNewLane }
        };

        saveTransaction(transaction);
    }

    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    // Refresh all lane dropdowns to update conflict detection
    if (typeof refreshAllLaneDropdowns === 'function') {
        refreshAllLaneDropdowns();
    }

    // Refresh tournament bracket to show updated lane
    if (typeof renderBracket === 'function') {
        renderBracket();
    }

    // Refresh Match Controls if it's open
    if (document.getElementById('matchCommandCenterModal') &&
        document.getElementById('matchCommandCenterModal').style.display === 'flex' &&
        typeof showMatchCommandCenter === 'function') {
        // Preserve scroll position
        const modalContent = document.querySelector('.cc-modal-content');
        const scrollTop = modalContent ? modalContent.scrollTop : 0;
        setTimeout(() => {
            showMatchCommandCenter();
            if (modalContent) {
                modalContent.scrollTop = scrollTop;
            }
        }, 200);
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

/**
 * Enhanced showWinnerConfirmation with proper leg score validation
 * Replaces the existing function in clean-match-progression.js
 */
function showWinnerConfirmation(matchId, winner, loser, onConfirm) {
    const modal = document.getElementById('winnerConfirmModal');
    const message = document.getElementById('winnerConfirmMessage');
    const cancelBtn = document.getElementById('winnerConfirmCancel');
    const confirmBtn = document.getElementById('winnerConfirmOK');

    if (!modal || !message || !cancelBtn || !confirmBtn) {
        console.error('Winner confirmation modal elements not found');
        return false;
    }

    // Get progression information for this match
    let progressionInfo = '';
    if (tournament.bracketSize && MATCH_PROGRESSION[tournament.bracketSize]) {
        const progression = MATCH_PROGRESSION[tournament.bracketSize][matchId];
        if (progression) {
            progressionInfo += '<div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #065f46;">';
            progressionInfo += '<div style="font-weight: 600; color: #065f46; margin-bottom: 5px;">Match Progression:</div>';
            
            // Winner advancement
            if (progression.winner) {
                progressionInfo += `<div style="color: #065f46;">✓ <strong>${winner.name}</strong> advances to <strong>${progression.winner[0]}</strong></div>`;
            } else {
                progressionInfo += `<div style="color: #065f46;">✓ <strong>${winner.name}</strong> wins the tournament!</div>`;
            }
            
            // Loser advancement or elimination
            if (progression.loser) {
                progressionInfo += `<div style="color: #dc2626;">• <strong>${loser.name}</strong> moves to <strong>${progression.loser[0]}</strong></div>`;
            } else {
                progressionInfo += `<div style="color: #dc2626;">• <strong>${loser.name}</strong> is eliminated</div>`;
            }
            
            progressionInfo += '</div>';
        }
    }

    // Set message content with clickable player names and progression info
    message.innerHTML = `
        Declare <strong><span class="clickable-player-name" onclick="openStatsModal(${winner.id})" style="cursor: pointer; text-decoration: underline; color: #065f46;">${winner.name}</span></strong> as the WINNER<br>
        against <strong><span class="clickable-player-name" onclick="openStatsModal(${loser.id})" style="cursor: pointer; text-decoration: underline; color: #065f46;">${loser.name}</span></strong> in match <strong>${matchId}</strong>
        <br><br>
        <small style="color: #6b7280; font-style: italic;">💡 Click player names to edit their statistics</small>
        ${progressionInfo}
        Please confirm the winner, or press "Cancel":
    `;

    // Populate leg score fields
    const match = matches.find(m => m.id === matchId);
    const winnerNameSpan = document.getElementById('winnerNameForLegs');
    const loserNameSpan = document.getElementById('loserNameForLegs');
    const winnerLegsInput = document.getElementById('winnerLegs');
    const loserLegsInput = document.getElementById('loserLegs');
    const validationMessage = document.getElementById('legValidationMessage');

    if (winnerNameSpan) winnerNameSpan.textContent = winner.name;
    if (loserNameSpan) loserNameSpan.textContent = loser.name;

    // Pre-fill winner legs based on match format
    if (winnerLegsInput && match) {
        const matchLegs = match.legs || 3;
        const minToWin = Math.ceil(matchLegs / 2);
        winnerLegsInput.value = minToWin;
        winnerLegsInput.max = matchLegs;
    }

    // Set up loser legs
    if (loserLegsInput) {
        loserLegsInput.value = 0;
        if (match) {
            loserLegsInput.max = match.legs - 1 || 2; // Max legs loser can have
        }
    }

    // Clear any existing validation message
    if (validationMessage) {
        validationMessage.style.display = 'none';
    }

    // Use dialog stack to show modal
    pushDialog('winnerConfirmModal', () => showWinnerConfirmation(matchId, winner, loser, onConfirm));

    // Focus cancel button by default
    setTimeout(() => {
        cancelBtn.focus();
        cancelBtn.style.boxShadow = '0 0 0 3px rgba(108, 117, 125, 0.3)';
        cancelBtn.style.transform = 'scale(1.05)';
    }, 100);

    // Add real-time validation to input fields
    const validateInputs = () => {
        const winnerLegs = parseInt(winnerLegsInput?.value) || 0;
        const loserLegs = parseInt(loserLegsInput?.value) || 0;
        const matchLegs = match?.legs || 3;

        return validateLegScores(winnerLegs, loserLegs, matchLegs);
    };

    // Add input event listeners for real-time validation
    if (winnerLegsInput) {
        winnerLegsInput.addEventListener('input', () => {
            const validation = validateInputs();
            updateValidationDisplay(validation);
            confirmBtn.disabled = !validation.valid;
        });
    }

    if (loserLegsInput) {
        loserLegsInput.addEventListener('input', () => {
            const validation = validateInputs();
            updateValidationDisplay(validation);
            confirmBtn.disabled = !validation.valid;
        });
    }

    // Handle button clicks
    const handleCancel = () => {
        console.log(`Winner selection cancelled for match ${matchId}`);
        cleanup();
        popDialog(); // Use dialog stack to close and restore parent

        // Clear flag
        if (window.commandCenterWasOpen) {
            window.commandCenterWasOpen = false;
        }
    };

    const handleConfirm = () => {
        const winnerLegs = parseInt(winnerLegsInput?.value) || 0;
        const loserLegs = parseInt(loserLegsInput?.value) || 0;
        const matchLegs = match?.legs || 3;

        // Final validation before confirming
        const validation = validateLegScores(winnerLegs, loserLegs, matchLegs);

        if (!validation.valid) {
            showValidationError(validation.error);
            return;
        }

        console.log(`Winner confirmed for match ${matchId}: ${winner.name} (${winnerLegs}-${loserLegs})`);

        onConfirm(winnerLegs, loserLegs);
        cleanup();
        popDialog(); // Use dialog stack to close and restore parent

        // Clear flag
        if (window.commandCenterWasOpen) {
            window.commandCenterWasOpen = false;
        }
    };

    const cleanup = () => {
        // Reset button styles
        cancelBtn.style.boxShadow = '';
        cancelBtn.style.transform = '';

        // Remove event listeners
        cancelBtn.removeEventListener('click', handleCancel);
        confirmBtn.removeEventListener('click', handleConfirm);
        document.removeEventListener('keydown', handleKeyPress);

        // Remove input listeners
        if (winnerLegsInput) {
            winnerLegsInput.removeEventListener('input', validateInputs);
        }
        if (loserLegsInput) {
            loserLegsInput.removeEventListener('input', validateInputs);
        }

        // Clear validation message
        if (validationMessage) {
            validationMessage.style.display = 'none';
        }

        // Re-enable confirm button
        confirmBtn.disabled = false;
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter') {
            // Only confirm if validation passes
            const validation = validateInputs();
            if (validation.valid) {
                handleConfirm();
            }
        }
    };

    // Remove any existing event listeners first (in case this is a restoration)
    if (modal._cancelHandler) {
        cancelBtn.removeEventListener('click', modal._cancelHandler);
    }
    if (modal._confirmHandler) {
        confirmBtn.removeEventListener('click', modal._confirmHandler);
    }
    if (modal._keyHandler) {
        document.removeEventListener('keydown', modal._keyHandler);
    }

    // Store handlers on modal for cleanup
    modal._cancelHandler = handleCancel;
    modal._confirmHandler = handleConfirm;
    modal._keyHandler = handleKeyPress;

    // Add event listeners
    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
    document.addEventListener('keydown', handleKeyPress);

    // Initial validation
    const initialValidation = validateInputs();
    updateValidationDisplay(initialValidation);
    confirmBtn.disabled = !initialValidation.valid;

    return true;
}

/**
 * Validate leg scores with comprehensive rules
 */
function validateLegScores(winnerLegs, loserLegs, matchLegs) {
    // Basic number validation
    if (isNaN(winnerLegs) || isNaN(loserLegs)) {
        return { valid: false, error: 'Please enter valid numbers for both leg counts' };
    }

    if (winnerLegs < 0 || loserLegs < 0) {
        return { valid: false, error: 'Leg counts cannot be negative' };
    }

    // Winner must have more legs than loser (core requirement)
    if (winnerLegs <= loserLegs) {
        return { valid: false, error: 'Winner must have more legs than loser' };
    }

    // Optional: Check if it makes sense for the match format
    const minToWin = Math.ceil(matchLegs / 2);
    if (winnerLegs < minToWin) {
        return {
            valid: false,
            error: `Winner needs at least ${minToWin} legs to win a best-of-${matchLegs} match`
        };
    }

    // Optional: Check if total legs is reasonable (not enforced strictly)
    const totalLegs = winnerLegs + loserLegs;
    if (totalLegs > matchLegs + 2) {
        return {
            valid: false,
            error: `Total legs (${totalLegs}) seems high for a best-of-${matchLegs} match. Maximum expected: ${matchLegs + 2}`
        };
    }

    // Check if loser has too many legs (can't exceed what's possible)
    const maxLoserLegs = matchLegs - 1; // In Bo5, max loser can have is 4 legs
    if (loserLegs > maxLoserLegs) {
        return {
            valid: false,
            error: `Loser cannot have more than ${maxLoserLegs} legs in a best-of-${matchLegs} match`
        };
    }

    return { valid: true, error: null };
}

/**
 * Update validation display in the modal
 */
function updateValidationDisplay(validation) {
    let validationMessage = document.getElementById('legValidationMessage');

    // Create validation message element if it doesn't exist
    if (!validationMessage) {
        const legScoresSection = document.getElementById('legScoresSection');
        if (legScoresSection) {
            validationMessage = document.createElement('div');
            validationMessage.id = 'legValidationMessage';
            validationMessage.style.marginTop = '10px';
            validationMessage.style.padding = '8px 12px';
            validationMessage.style.borderRadius = '4px';
            validationMessage.style.fontSize = '14px';
            validationMessage.style.fontWeight = '500';
            legScoresSection.appendChild(validationMessage);
        }
    }

    if (validationMessage) {
        if (validation.valid) {
            validationMessage.style.display = 'none';
        } else {
            validationMessage.style.display = 'block';
            validationMessage.style.background = '#fff5f5';
            validationMessage.style.color = '#dc2626';
            validationMessage.style.border = '1px solid #fecaca';
            validationMessage.textContent = validation.error;
        }
    }
}

/**
 * Show validation error as alert (fallback)
 */
function showValidationError(error) {
    alert('❌ Invalid leg scores:\n\n' + error);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.showWinnerConfirmation = showWinnerConfirmation;
    window.validateLegScores = validateLegScores;
    window.updateValidationDisplay = updateValidationDisplay;
    window.showValidationError = showValidationError;
}
// TOURNAMENT HISTORY MANAGEMENT (TRANSACTIONAL)

const MAX_HISTORY_ENTRIES = 50; // Keep last 50 states

/**
 * NEW: Save a single transaction to the history log.
 * @param {object} transaction The transaction object to save.
 */
function saveTransaction(transaction) {
    if (!tournament) return;
    let history = getTournamentHistory();
    history.unshift(transaction); // Add to the beginning

    if (history.length > MAX_HISTORY_ENTRIES) {
        history = history.slice(0, MAX_HISTORY_ENTRIES);
    }

    localStorage.setItem('tournamentHistory', JSON.stringify(history));
}

/**
 * Get tournament history from localStorage.
 * Also handles clearing old snapshot-based history.
 */
function getTournamentHistory() {
    try {
        const historyData = localStorage.getItem('tournamentHistory');
        if (!historyData || historyData === 'undefined') { // Add check for "undefined"
            return [];
        }

        const history = JSON.parse(historyData);
        // Check if history is in the old snapshot format and clear it if so
        if (history.length > 0 && history[0].state && history[0].state.matches) {
            console.warn('Old history format detected. Clearing history for new transactional system.');
            clearTournamentHistory();
            return [];
        }
        return history;
    } catch (error) {
        console.error('Error loading tournament history:', error);
        return [];
    }
}

/**
 * Clear tournament history.
 */
function clearTournamentHistory() {
    localStorage.removeItem('tournamentHistory');
    console.log('✓ Tournament history cleared');
}

/**
 * Get undone transactions from localStorage.
 * @returns {Array} An array of undone transaction objects.
 */
function getUndoneTransactions() {
    try {
        const undoneData = localStorage.getItem('undoneTransactions');
        return undoneData ? JSON.parse(undoneData) : [];
    } catch (error) {
        console.error('Error loading undone transactions:', error);
        return [];
    }
}

/**
 * Save undone transactions to localStorage.
 * @param {Array} undoneTransactions An array of undone transaction objects.
 */
function saveUndoneTransactions(undoneTransactions) {
    localStorage.setItem('undoneTransactions', JSON.stringify(undoneTransactions));
}

/**
 * NEW: Undoes a single transaction.
 * @param {string} transactionId The ID of the transaction to undo.
 */
function undoTransaction(transactionId) {
    return undoTransactions([transactionId]);
}

/**
 * NEW: Undoes a list of transactions.
 * @param {Array<string>} transactionIds The IDs of the transactions to undo.
 */
function undoTransactions(transactionIds) {
    if (!transactionIds || transactionIds.length === 0) {
        return false;
    }

    // Check if tournament is read-only (imported completed tournament)
    if (tournament && tournament.readOnly) {
        alert('Completed tournament: Read-only - Use Reset Tournament to modify');
        return false;
    }

    const history = getTournamentHistory();
    const undone = getUndoneTransactions();

    const transactionsToUndo = history.filter(t => transactionIds.includes(t.id))
                                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (transactionsToUndo.length === 0) {
        return false;
    }

    // Track matches that have been cleared by downstream cleanup
    const clearedMatches = new Set();
    
    // Process each transaction to undo
    transactionsToUndo.forEach(transaction => {
        if (transaction.beforeState.matches) {
            // 1. Restore the original match state EXACTLY as it was
            // FIXED: Don't restore auto-advanced matches that were cleared by downstream cleanup
            const affectedMatch = transaction.beforeState.matches.find(m => m.id === transaction.matchId);
            if (affectedMatch && !clearedMatches.has(transaction.matchId)) {
                const matchIndex = matches.findIndex(m => m.id === transaction.matchId);
                if (matchIndex !== -1) {
                    console.log(`DEBUG: Restoring match ${transaction.matchId} to original state`);
                    matches[matchIndex] = JSON.parse(JSON.stringify(affectedMatch));
                } else {
                    console.log(`DEBUG: Skipping restoration of cleared match ${transaction.matchId}`);
                }
            }

            // 2. Clear downstream effects using progression rules
            if (tournament.bracketSize && MATCH_PROGRESSION[tournament.bracketSize]) {
                const progression = MATCH_PROGRESSION[tournament.bracketSize][transaction.matchId];
                if (progression && transaction.winner && transaction.loser) {
                    const winnerId = transaction.winner.id;
                    const loserId = transaction.loser.id;

                    // Clear winner from their destination
                    if (progression.winner) {
                        const [targetMatchId, slot] = progression.winner;
                        const targetMatch = matches.find(m => m.id === targetMatchId);
                        console.log(`DEBUG: Looking for winner ${transaction.winner.name} in ${targetMatchId}.${slot}, found:`, targetMatch ? targetMatch[slot] : 'no match');
                        
                        // FIXED: Match by name instead of ID, since auto-advancement creates new IDs
                        if (targetMatch && targetMatch[slot] && targetMatch[slot].name === transaction.winner.name) {
                            // Get the current player ID (may be different from original due to auto-advancement)  
                            const currentPlayerId = targetMatch[slot].id;
                            console.log(`DEBUG: Clearing winner ${transaction.winner.name} (current ID: ${currentPlayerId}) from ${targetMatchId}`);
                            clearPlayerFromDownstream(currentPlayerId, targetMatchId);
                            // Mark this match as cleared so it won't be restored later
                            clearedMatches.add(targetMatchId);
                            // Then clear the immediate slot
                            targetMatch[slot] = { id: `${targetMatchId}-${slot}`, name: 'TBD' };
                        } else {
                            console.log(`DEBUG: Winner ${transaction.winner.name} NOT found in ${targetMatchId}.${slot}`);
                        }
                    }

                    // Clear loser from their destination
                    if (progression.loser) {
                        const [targetMatchId, slot] = progression.loser;
                        const targetMatch = matches.find(m => m.id === targetMatchId);
                        console.log(`DEBUG: Looking for loser ${transaction.loser.name} in ${targetMatchId}.${slot}, found:`, targetMatch ? targetMatch[slot] : 'no match');
                        
                        // FIXED: Match by name instead of ID, since auto-advancement creates new IDs
                        if (targetMatch && targetMatch[slot] && targetMatch[slot].name === transaction.loser.name) {
                            // Get the current player ID (may be different from original due to auto-advancement)
                            const currentPlayerId = targetMatch[slot].id;
                            console.log(`DEBUG: Clearing loser ${transaction.loser.name} (current ID: ${currentPlayerId}) from ${targetMatchId}`);
                            clearPlayerFromDownstream(currentPlayerId, targetMatchId);
                            // Mark this match as cleared so it won't be restored later
                            clearedMatches.add(targetMatchId);
                            // Then clear the immediate slot
                            targetMatch[slot] = { id: `${targetMatchId}-${slot}`, name: 'TBD' };
                        } else {
                            console.log(`DEBUG: Loser ${transaction.loser.name} NOT found in ${targetMatchId}.${slot} (expected from FS-2-1 undo)`);
                        }
                    }
                }
            }
        }
    });

    // Move undone transactions to the undone list
    transactionsToUndo.forEach(t => undone.unshift(t));
    saveUndoneTransactions(undone);

    // Remove undone transactions from the history
    const newHistory = history.filter(t => !transactionIds.includes(t.id));
    localStorage.setItem('tournamentHistory', JSON.stringify(newHistory));

    // FIXED: Clear tournament completion state when undoing GRAND-FINAL
    const isUndoingGrandFinal = transactionsToUndo.some(t => t.matchId === 'GRAND-FINAL');
    if (isUndoingGrandFinal) {
        clearTournamentCompletionState();
    }

    // Save and refresh
    saveTournament();
    
    // FIXED: Refresh results table after clearing tournament state
    if (isUndoingGrandFinal && typeof updateResultsTable === 'function') {
        console.log('🔄 Refreshing results table after GRAND-FINAL undo');
        updateResultsTable();
    }
    
    // DEBUG: Show tournament state after undo
    if (isUndoingGrandFinal) {
        console.log('DEBUG: Tournament state after GRAND-FINAL undo:');
        console.log(`- Status: ${tournament.status}`);
        console.log(`- Placements: ${Object.keys(tournament.placements || {}).length} entries`);
        console.log(`- Players with placement: ${players.filter(p => p.placement).length}`);
    }
    
    if (typeof refreshTournamentUI === 'function') {
        refreshTournamentUI();
    }

    console.log(`✓ ${transactionIds.length} transactions undone.`);
    return true;
}

/**
 * Helper function to clear tournament completion state
 * Called when undoing GRAND-FINAL to revert tournament back to active state
 */
function clearTournamentCompletionState() {
    console.log('🔄 Clearing tournament completion state (GRAND-FINAL undo)');
    
    // Clear tournament placements
    if (tournament.placements) {
        const placementCount = Object.keys(tournament.placements).length;
        tournament.placements = {};
        console.log(`Cleared ${placementCount} tournament placements`);
    }
    
    // Reset tournament status
    if (tournament.status === 'completed') {
        tournament.status = 'active';
        console.log('Reset tournament status from "completed" to "active"');
    }
    
    // Clear all player placement properties
    let clearedPlacements = 0;
    players.forEach(player => {
        if (player.placement) {
            player.placement = null;
            clearedPlacements++;
        }
    });
    console.log(`Cleared ${clearedPlacements} player placement properties`);
    
    console.log('✓ Tournament completion state cleared');
}

/**
 * Helper function to check if a match has any walkover players
 */
function hasWalkoverPlayer(match) {
    return isWalkover(match.player1) || isWalkover(match.player2);
}

// Helper function to recursively clear a player from downstream matches
function clearPlayerFromDownstream(playerId, currentMatchId) {
    const currentMatch = matches.find(m => m.id === currentMatchId);
    if (!currentMatch) return;

    console.log(`Clearing player ${playerId} from match ${currentMatchId}`);

    // If match has TBD players, it cannot be LIVE
    if ((currentMatch.player1?.name === 'TBD' || currentMatch.player2?.name === 'TBD') && currentMatch.active) {
        currentMatch.active = false;
    }

    // Check if this player is in this match at all
    const player1Match = currentMatch.player1 && currentMatch.player1.id === playerId;
    const player2Match = currentMatch.player2 && currentMatch.player2.id === playerId;
    
    if (!player1Match && !player2Match) {
        console.log(`Player ${playerId} not found in match ${currentMatchId}`);
        return;
    }

    // If this match was completed (auto or manual), clear it and continue downstream
    if (currentMatch.completed) {
        console.log(`Clearing completed match ${currentMatchId}`);
        
        // Continue clearing downstream BEFORE we clear this match
        if (tournament.bracketSize && MATCH_PROGRESSION[tournament.bracketSize]) {
            const progression = MATCH_PROGRESSION[tournament.bracketSize][currentMatchId];
            if (progression) {
                if (progression.winner) {
                    const [nextMatchId, slot] = progression.winner;
                    const nextMatch = matches.find(m => m.id === nextMatchId);
                    if (nextMatch && nextMatch[slot] && nextMatch[slot].id === playerId) {
                        clearPlayerFromDownstream(playerId, nextMatchId);
                        nextMatch[slot] = { id: `${nextMatchId}-${slot}`, name: 'TBD' };
                    }
                }
                if (progression.loser) {
                    const [nextMatchId, slot] = progression.loser;
                    const nextMatch = matches.find(m => m.id === nextMatchId);
                    if (nextMatch && nextMatch[slot] && nextMatch[slot].id === playerId) {
                        clearPlayerFromDownstream(playerId, nextMatchId);
                        nextMatch[slot] = { id: `${nextMatchId}-${slot}`, name: 'TBD' };
                    }
                }
            }
        }
        
        // Now clear this match
        currentMatch.completed = false;
        currentMatch.winner = null;
        currentMatch.loser = null;
        currentMatch.active = false;
        currentMatch.autoAdvanced = false;
    }
    
    // FIXED: Handle walkover matches - remove real players completely, leaving only walkovers
    if (currentMatch.autoAdvanced || hasWalkoverPlayer(currentMatch)) {
        console.log(`Match ${currentMatchId} has walkover - removing real player completely`);
        
        // For auto-advanced walkover matches, remove the real player and leave only walkovers/TBD
        // This prevents the match from auto-advancing again
        if (player1Match && !isWalkover(currentMatch.player1)) {
            // Removing a real player - replace with TBD so match can't auto-advance
            currentMatch.player1 = { id: `${currentMatchId}-player1`, name: 'TBD' };
            console.log(`Removed real player ${playerId} from player1 slot in ${currentMatchId}, replaced with TBD`);
            console.log(`DEBUG: Match ${currentMatchId} is now: ${currentMatch.player1.name} vs ${currentMatch.player2.name}`);
        } else if (player2Match && !isWalkover(currentMatch.player2)) {
            // Removing a real player - replace with TBD so match can't auto-advance  
            currentMatch.player2 = { id: `${currentMatchId}-player2`, name: 'TBD' };
            console.log(`Removed real player ${playerId} from player2 slot in ${currentMatchId}, replaced with TBD`);
            console.log(`DEBUG: Match ${currentMatchId} is now: ${currentMatch.player1.name} vs ${currentMatch.player2.name}`);
        }
        // If removing a walkover player, just leave it (shouldn't happen in practice)
    } else {
        // For normal matches, clear to TBD as usual
        if (player1Match) {
            currentMatch.player1 = { id: `${currentMatchId}-player1`, name: 'TBD' };
            console.log(`Cleared player ${playerId} from player1 slot in ${currentMatchId}`);
        }
        if (player2Match) {
            currentMatch.player2 = { id: `${currentMatchId}-player2`, name: 'TBD' };
            console.log(`Cleared player ${playerId} from player2 slot in ${currentMatchId}`);
        }
    }
}

/**
 * Debug function to show current history
 */
function debugHistory() {
    const history = getTournamentHistory();
    console.log('=== TOURNAMENT HISTORY ===');
    console.log(`Total entries: ${history.length}`);

    history.forEach((entry, index) => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        console.log(`${index + 1}. [${time}] ${entry.description}`);
    });

    if (history.length === 0) {
        console.log('No history entries found');
    }
}

/**
 * Open stats modal from winner confirmation dialog with proper z-index handling
 */
function openStatsModalFromConfirmation(playerId, matchId) {
    // Temporarily hide the winner confirmation modal
    const winnerModal = document.getElementById('winnerConfirmModal');
    if (winnerModal) {
        winnerModal.style.display = 'none';
    }

    // Open stats modal
    openStatsModal(playerId);

    // Override the stats modal close function to return to winner confirmation
    const originalClose = window.closeStatsModal;
    window.closeStatsModal = function () {
        // Call original close function
        if (originalClose) {
            originalClose();
        }

        // Show winner confirmation modal again
        if (winnerModal) {
            winnerModal.style.display = 'block';
        }

        // Restore original close function
        window.closeStatsModal = originalClose;
    };
}

// NEW: Enhanced match state detection with help suggestions
function detectMatchIssues() {
    if (!matches || matches.length === 0) return;

    const readyMatches = matches.filter(m => getMatchState && getMatchState(m) === 'ready').length;
    const liveMatches = matches.filter(m => getMatchState && getMatchState(m) === 'live').length;

    // Help suggestions based on match states
    /*
    if (readyMatches > 0 && liveMatches === 0 && typeof showHelpHint === 'function') {
        setTimeout(() => {
            showHelpHint(`${readyMatches} match${readyMatches > 1 ? 'es' : ''} ready to start. Click "Start" to begin.`);
        }, 2000);
    } */

    if (liveMatches > 3 && typeof showHelpHint === 'function') {
        setTimeout(() => {
            showHelpHint('Many matches are live. Consider using lanes to organize dartboards.');
        }, 1000);
    }
}

// NEW: Help system integration for common user actions
function onPageChange(newPageId) {
    // Trigger contextual help suggestions when switching pages
    if (typeof triggerContextualHelp === 'function') {
        setTimeout(() => {
            triggerContextualHelp();
        }, 1000);
    }

    // Page-specific help triggers
    if (newPageId === 'tournament' && tournament && tournament.bracket) {
        setTimeout(() => {
            detectMatchIssues();
        }, 1500);
    }
}

// NEW: Validation helper for leg scores in winner confirmation
function validateAndShowWinnerDialog(matchId, playerNumber) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    // Can only select winner if match is active/live
    if (!match.active) {
        alert('Match must be active to select winner');

        // HELP SYSTEM INTEGRATION
        if (typeof showHelpHint === 'function') {
            showHelpHint('Click "Start" button first to activate the match before selecting winner.');
        }
        return false;
    }

    const winner = playerNumber === 1 ? match.player1 : match.player2;
    const loser = playerNumber === 1 ? match.player2 : match.player1;

    // Cannot select walkover or TBD as winner
    if (isWalkover(winner) || winner.name === 'TBD') {
        alert('Cannot select walkover or TBD as winner');
        return false;
    }

    // Show enhanced confirmation dialog with validation
    if (config.ui && config.ui.confirmWinnerSelection) {
        return showWinnerConfirmation(matchId, winner, loser, (winnerLegs, loserLegs) => {
            // This callback runs if user confirms with validated leg scores
            const success = completeMatch(matchId, playerNumber, winnerLegs, loserLegs);

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
        });
    }

    // If no confirmation needed, complete match normally with no leg scores
    const success = completeMatch(matchId, playerNumber, 0, 0);

    if (success) {
        // Re-render bracket
        if (typeof renderBracket === 'function') {
            renderBracket();
        }

        // Refresh lane dropdowns if available
        if (typeof refreshAllLaneDropdowns === 'function') {
            setTimeout(refreshAllLaneDropdowns, 100);
        }

        // Refresh Match Controls if it's open to show updated match state
        const modal = document.getElementById('matchCommandCenterModal');
        if (modal &&
            (modal.style.display === 'flex' || modal.style.display === 'block') &&
            typeof showMatchCommandCenter === 'function') {
            setTimeout(() => {
                showMatchCommandCenter();
            }, 100);
        }

        // If Command Center was open when completion was initiated, reopen it after completion
        if (window.commandCenterWasOpen && typeof showMatchCommandCenter === 'function') {
            setTimeout(() => {
                showMatchCommandCenter();
                window.commandCenterWasOpen = false; // Clear flag
            }, 500); // Same delay as confirmation path
        }
    }

    return success;
}

// NEW: Error handling with help suggestions
function handleBracketGenerationError() {
    if (typeof showHelpHint === 'function') {
        if (!tournament) {
            showHelpHint('Create a tournament first on the Setup page.');
        } else if (players.filter(p => p.paid).length < 4) {
            showHelpHint('Add at least 4 paid players before generating bracket.');
        } else if (tournament.bracket) {
            showHelpHint('Tournament already has a bracket. Use "Reset Tournament" to start over.');
        }
    }
}

/**
 * Check if a match is a frontside semifinal
 */
function isFrontsideSemifinal(matchId, bracketSize) {
    const frontsideSemifinals = {
        8: 'FS-3-1',
        16: 'FS-4-1',
        32: 'FS-5-1'
    };

    return frontsideSemifinals[bracketSize] === matchId;
}

/**
 * Check if a match is a backside semifinal
 */
function isBacksideSemifinal(matchId, bracketSize) {
    const backsideSemifinals = {
        8: 'BS-3-1',
        16: 'BS-5-1',
        32: 'BS-7-1'
    };

    return backsideSemifinals[bracketSize] === matchId;
}

/**
 * Show tournament in progress warning modal
 * Replaces browser alert with user-friendly modal dialog
 */
function showTournamentProgressWarning() {
    // Use dialog stack to show modal with Esc support
    pushDialog('tournamentProgressModal', null, true);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    // Transactional History System
    window.saveTransaction = saveTransaction;
    window.undoTransaction = undoTransaction;
    window.undoTransactions = undoTransactions;
    window.getTournamentHistory = getTournamentHistory;
    window.clearTournamentHistory = clearTournamentHistory;
    window.debugHistory = debugHistory;
    window.getUndoneTransactions = getUndoneTransactions;
    window.saveUndoneTransactions = saveUndoneTransactions;

    // Original Functions (unchanged)
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
    window.selectWinner = selectWinnerClean;
    window.selectWinnerV2 = selectWinnerClean;
    window.selectWinnerWithValidation = selectWinnerClean;
    window.selectWinnerWithAutoAdvancement = selectWinnerClean;
    window.generateBracket = generateCleanBracket;
    window.showWinnerConfirmation = showWinnerConfirmation;
    window.validateLegScores = validateLegScores;
    window.updateValidationDisplay = updateValidationDisplay;
    window.showValidationError = showValidationError;
    window.openStatsModalFromConfirmation = openStatsModalFromConfirmation;
    window.detectMatchIssues = detectMatchIssues;
    window.onPageChange = onPageChange;
    window.handleBracketGenerationError = handleBracketGenerationError;
    window.isFrontsideSemifinal = isFrontsideSemifinal;
    window.isBacksideSemifinal = isBacksideSemifinal;
    window.calculateAllRankings = calculateAllRankings;
    window.calculate8PlayerRankings = calculate8PlayerRankings;
    window.getDownstreamMatches = getDownstreamMatches;
    window.isWalkover = isWalkover;
    window.showTournamentProgressWarning = showTournamentProgressWarning;
}
