// tournament-controls.js - Tournament Controls and Utilities

function updateMatchLane(matchId, newLane) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    match.lane = parseInt(newLane);
    saveTournament();
}

function updateReferee(matchId, refereeId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (refereeId === '') {
        match.referee = null;
    } else {
        const referee = players.find(p => p.id == refereeId);
        match.referee = referee || null;
    }

    saveTournament();
    renderBracket();
}

function getAvailableReferees(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return [];

    return players.filter(player =>
        !player.eliminated &&
        player.paid &&
        player.id !== match.player1?.id &&
        player.id !== match.player2?.id &&
        !player.isBye &&
        player.name !== 'TBD'
    );
}

function toggleActive(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    match.active = !match.active;
    saveTournament();
    renderBracket();
}

function autoAssignReferees() {
    const activeMatches = matches.filter(m =>
        !m.completed &&
        (m.player1.name !== 'TBD' && m.player2.name !== 'TBD') &&
        !m.referee
    );

    if (activeMatches.length === 0) {
        alert('No matches need referee assignment');
        return;
    }

    const eliminatedRefs = players.filter(p => p.eliminated && p.paid);
    const activeRefs = players.filter(p => !p.eliminated && p.paid);
    const availableRefs = [...eliminatedRefs, ...activeRefs];

    let refIndex = 0;
    activeMatches.forEach(match => {
        const availableForMatch = availableRefs.filter(ref =>
            ref.id !== match.player1.id &&
            ref.id !== match.player2.id
        );

        if (availableForMatch.length > 0) {
            match.referee = availableForMatch[refIndex % availableForMatch.length];
            refIndex++;
        }
    });

    saveTournament();
    renderBracket();
    alert(`Assigned referees to ${activeMatches.filter(m => m.referee).length} matches`);
}

function showMatchDetails() {
    const activeMatches = matches.filter(m => m.active);
    const upcomingMatches = matches.filter(m =>
        !m.completed &&
        m.player1.name !== 'TBD' &&
        m.player2.name !== 'TBD'
    );

    let details = `Active Matches: ${activeMatches.length}\n`;
    details += `Upcoming Matches: ${upcomingMatches.length}\n`;
    details += `Completed Matches: ${matches.filter(m => m.completed).length}\n\n`;

    if (activeMatches.length > 0) {
        details += 'Active Matches:\n';
        activeMatches.forEach(match => {
            details += `${match.id}: ${match.player1.name} vs ${match.player2.name} (Lane ${match.lane})\n`;
        });
    }

    alert(details);
}
