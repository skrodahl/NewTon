// match-progression.js - Match Progression and Results Logic

function selectWinner(matchId, playerNumber) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const winner = playerNumber === 1 ? match.player1 : match.player2;
    const loser = playerNumber === 1 ? match.player2 : match.player1;

    if (winner.isBye || winner.name === 'TBD') return;

    // Toggle winner selection - if clicking same player, clear the winner
    if (match.winner?.id === winner.id) {
        match.winner = null;
        match.loser = null;
        match.completed = false;
        // TODO: Implement reverse advancement logic
    } else {
        // Set new winner
        match.winner = winner;
        match.loser = loser;
        match.completed = true;
        match.active = false;

        // Handle bracket progression logic
        advanceWinner(match);
    }

    saveTournament();
    renderBracket();
}

function advanceWinner(completedMatch) {
    const winner = completedMatch.winner;
    const loser = completedMatch.loser;

    if (!winner) return;

    // Handle different bracket advancement scenarios
    if (completedMatch.side === 'frontside') {
        advanceFrontsideWinner(completedMatch, winner);
        if (loser && !loser.isBye) {
            dropFrontsideLoser(completedMatch, loser);
        }
    } else if (completedMatch.side === 'backside') {
        advanceBacksideWinner(completedMatch, winner);
        if (loser && !loser.isBye) {
            eliminateBacksideLoser(completedMatch, loser);
        }
    } else if (completedMatch.side === 'backside-final') {
        advanceBacksideFinalWinner(completedMatch, winner);
    } else if (completedMatch.side === 'grand-final') {
        crownChampion(completedMatch, winner);
    }

    // Check if the advanced match now has a walkover and needs auto-advancement
    checkForAutoAdvancement();
}

function advanceFrontsideWinner(completedMatch, winner) {
    // Find next frontside match
    const currentRound = completedMatch.round;
    const nextRound = currentRound + 1;
    const positionInRound = completedMatch.positionInRound;
    const nextPosition = Math.floor(positionInRound / 2);

    const nextMatch = matches.find(m =>
        m.side === 'frontside' &&
        m.round === nextRound &&
        m.positionInRound === nextPosition
    );

    if (nextMatch) {
        // Determine if this winner goes to player1 or player2 slot
        const slot = (positionInRound % 2 === 0) ? 'player1' : 'player2';
        nextMatch[slot] = winner;
    } else {
        // This is the frontside champion
        const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');
        if (grandFinal) {
            grandFinal.player1 = winner;
        }
    }
}

function dropFrontsideLoser(completedMatch, loser) {
    // Calculate which backside round should receive this loser
    const frontsideRound = completedMatch.round;

    // Simplified logic - needs refinement based on exact double elimination rules
    let targetBacksideRound;
    if (frontsideRound === 1) {
        targetBacksideRound = 1; // First round losers go to backside round 1
    } else {
        targetBacksideRound = (frontsideRound - 1) * 2; // Approximate
    }

    // Find available slot in target backside round
    const targetMatches = matches.filter(m =>
        m.side === 'backside' &&
        m.round === targetBacksideRound &&
        (m.player1.name === 'TBD' || m.player2.name === 'TBD')
    );

    if (targetMatches.length > 0) {
        const targetMatch = targetMatches[0];
        if (targetMatch.player1.name === 'TBD') {
            targetMatch.player1 = loser;
        } else if (targetMatch.player2.name === 'TBD') {
            targetMatch.player2 = loser;
        }
    }
}

function advanceBacksideWinner(completedMatch, winner) {
    // Find next backside match
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
    } else {
        // This might be the backside champion
        const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
        if (backsideFinal) {
            backsideFinal.player2 = winner; // Backside winner
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
    displayResults();
}

function assignPlacement(player) {
    // Simple placement logic - could be more sophisticated
    const eliminatedCount = players.filter(p => p.eliminated).length;
    player.placement = eliminatedCount;
}
