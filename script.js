// Global variables
let tournament = null;
let players = [];
let matches = [];
let config = {
    points: {
        participation: 1,
        first: 3,
        second: 2,
        third: 1,
        highOut: 1,
        ton: 1,
        oneEighty: 1
    },
    legs: {
        round1: 3,
        round2: 3,
        semifinal: 5,
        final: 5
    }
};
let currentStatsPlayer = null;
let zoomLevel = 0.6;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadConfiguration();
    loadRecentTournaments();
    setupEventListeners();
    setTodayDate();
});

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tournamentDate').value = today;
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });

    // Enter key handlers
    document.getElementById('playerName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });

    // Auto-save configuration
    ['participationPoints', 'firstPlacePoints', 'secondPlacePoints', 'thirdPlacePoints', 
     'highOutPoints', 'tonPoints', 'oneEightyPoints'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                const key = id.replace('Points', '').replace('oneEighty', 'oneEighty');
                config.points[key] = parseInt(this.value);
                saveConfiguration();
            });
        }
    });

    // Bracket zoom and pan controls
    const viewport = document.getElementById('bracketViewport');
    if (viewport) {
        viewport.addEventListener('wheel', handleZoom);
        viewport.addEventListener('mousedown', startDrag);
        viewport.addEventListener('mousemove', handleDrag);
        viewport.addEventListener('mouseup', endDrag);
        viewport.addEventListener('mouseleave', endDrag);
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
}

// TOURNAMENT MANAGEMENT
function createTournament() {
    const name = document.getElementById('tournamentName').value.trim();
    const date = document.getElementById('tournamentDate').value;
    
    if (!name || !date) {
        alert('Please enter both tournament name and date');
        return;
    }

    tournament = {
        id: Date.now(),
        name: name,
        date: date,
        created: new Date().toISOString(),
        status: 'setup',
        players: [],
        matches: [],
        bracket: null
    };

    players = [];
    matches = [];
    
    saveTournament();
    updateTournamentStatus();
    showPage('registration');
    
    alert('Tournament created successfully!');
}

function loadTournament() {
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    if (tournaments.length === 0) {
        alert('No tournaments found');
        return;
    }

    const tournamentList = tournaments.map(t => 
        `${t.id}: ${t.name} (${t.date})`
    ).join('\n');
    
    const selectedId = prompt('Select tournament by ID:\n' + tournamentList);
    if (!selectedId) return;

    const selectedTournament = tournaments.find(t => t.id == selectedId);
    if (!selectedTournament) {
        alert('Tournament not found');
        return;
    }

    tournament = selectedTournament;
    players = tournament.players || [];
    matches = tournament.matches || [];
    
    document.getElementById('tournamentName').value = tournament.name;
    document.getElementById('tournamentDate').value = tournament.date;
    
    updateTournamentStatus();
    updatePlayersDisplay();
    updatePlayerCount();
    
    if (tournament.bracket) {
        renderBracket();
    }
    
    showPage('registration');
    alert('Tournament loaded successfully!');
}

function exportTournament() {
    if (!tournament) {
        alert('No active tournament to export');
        return;
    }

    const dataStr = JSON.stringify(tournament, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournament.name}_${tournament.date}.json`;
    link.click();
}

function saveTournament() {
    if (!tournament) return;

    tournament.players = players;
    tournament.matches = matches;
    tournament.lastSaved = new Date().toISOString();

    let tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const index = tournaments.findIndex(t => t.id === tournament.id);
    
    if (index >= 0) {
        tournaments[index] = tournament;
    } else {
        tournaments.push(tournament);
    }
    
    localStorage.setItem('dartsTournaments', JSON.stringify(tournaments));
    localStorage.setItem('currentTournament', JSON.stringify(tournament));
}

function updateTournamentStatus() {
    const statusDiv = document.getElementById('tournamentStatus');
    if (tournament) {
        statusDiv.innerHTML = `Active Tournament: <strong>${tournament.name}</strong> (${tournament.date})`;
        statusDiv.className = 'alert alert-success';
        statusDiv.style.display = 'block';
    } else {
        statusDiv.innerHTML = 'No active tournament';
        statusDiv.className = 'alert alert-info';
        statusDiv.style.display = 'block';
    }
}

function loadRecentTournaments() {
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const container = document.getElementById('recentTournaments');
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p>No tournaments found</p>';
        return;
    }

    const html = tournaments.slice(-5).reverse().map(t => `
        <div style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
            <strong>${t.name}</strong> (${t.date}) 
            <button class="btn" style="padding: 5px 10px; font-size: 14px;" onclick="loadSpecificTournament(${t.id})">Load</button>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function loadSpecificTournament(id) {
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const selectedTournament = tournaments.find(t => t.id === id);
    
    if (!selectedTournament) {
        alert('Tournament not found');
        return;
    }

    tournament = selectedTournament;
    players = tournament.players || [];
    matches = tournament.matches || [];
    
    document.getElementById('tournamentName').value = tournament.name;
    document.getElementById('tournamentDate').value = tournament.date;
    
    updateTournamentStatus();
    updatePlayersDisplay();
    updatePlayerCount();
    
    if (tournament.bracket) {
        renderBracket();
    }
    
    showPage('registration');
}

// PLAYER MANAGEMENT
function addPlayer() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a player name');
        return;
    }

    if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Player already exists');
        return;
    }

    const player = {
        id: Date.now(),
        name: name,
        paid: false,
        stats: {
            shortLegs: 0,
            highOuts: [],
            tons: 0,
            oneEighties: 0
        },
        placement: null,
        eliminated: false
    };

    players.push(player);
    nameInput.value = '';
    
    updatePlayersDisplay();
    updatePlayerCount();
    saveTournament();
}

function removePlayer(playerId) {
    if (confirm('Are you sure you want to remove this player?')) {
        players = players.filter(p => p.id !== playerId);
        updatePlayersDisplay();
        updatePlayerCount();
        saveTournament();
    }
}

function togglePaid(playerId) {
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.paid = !player.paid;
        updatePlayersDisplay();
        updatePlayerCount();
        saveTournament();
    }
}

function openStatsModal(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    currentStatsPlayer = player;
    document.getElementById('statsPlayerName').textContent = `${player.name} - Statistics`;
    document.getElementById('statsShortLegs').value = player.stats.shortLegs || 0;
    document.getElementById('statsTons').value = player.stats.tons || 0;
    document.getElementById('stats180s').value = player.stats.oneEighties || 0;
    
    updateHighOutsList();
    document.getElementById('statsModal').style.display = 'block';
}

function addHighOut() {
    const score = parseInt(document.getElementById('statsHighOut').value);
    if (!score || score < 101 || score > 170) {
        alert('Please enter a valid high out score (101-170)');
        return;
    }

    if (!currentStatsPlayer.stats.highOuts) {
        currentStatsPlayer.stats.highOuts = [];
    }

    currentStatsPlayer.stats.highOuts.push(score);
    document.getElementById('statsHighOut').value = '';
    updateHighOutsList();
}

function updateHighOutsList() {
    const container = document.getElementById('highOutsList');
    if (!currentStatsPlayer || !currentStatsPlayer.stats.highOuts) {
        container.innerHTML = '';
        return;
    }

    const html = currentStatsPlayer.stats.highOuts.map((score, index) => `
        <span style="background: #f8f9fa; padding: 5px 10px; margin: 2px; border-radius: 3px; display: inline-block;">
            ${score} <button onclick="removeHighOut(${index})" style="background: none; border: none; color: red; cursor: pointer;">×</button>
        </span>
    `).join('');
    
    container.innerHTML = `<div style="margin-top: 10px;"><strong>High Outs:</strong><br>${html}</div>`;
}

function removeHighOut(index) {
    if (currentStatsPlayer && currentStatsPlayer.stats.highOuts) {
        currentStatsPlayer.stats.highOuts.splice(index, 1);
        updateHighOutsList();
    }
}

function saveStats() {
    if (!currentStatsPlayer) return;

    currentStatsPlayer.stats.shortLegs = parseInt(document.getElementById('statsShortLegs').value) || 0;
    currentStatsPlayer.stats.tons = parseInt(document.getElementById('statsTons').value) || 0;
    currentStatsPlayer.stats.oneEighties = parseInt(document.getElementById('stats180s').value) || 0;

    updatePlayersDisplay();
    saveTournament();
    closeStatsModal();
}

function closeStatsModal() {
    document.getElementById('statsModal').style.display = 'none';
    currentStatsPlayer = null;
}

function updatePlayersDisplay() {
    const container = document.getElementById('playersContainer');
    
    if (players.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No players added yet</p>';
        return;
    }

    const html = players.map(player => `
        <div class="player-card ${player.paid ? 'paid' : ''}">
            <div class="player-header">
                <span class="player-name">${player.name}</span>
                <div>
                    <label style="margin-right: 10px;">
                        <input type="checkbox" class="paid-checkbox" ${player.paid ? 'checked' : ''} 
                               onchange="togglePaid(${player.id})"> Paid
                    </label>
                    <button onclick="removePlayer(${player.id})" style="background: #dc3545; color: white; border: none; border-radius: 3px; padding: 5px 8px; cursor: pointer;">×</button>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <span>Short Legs:</span>
                    <span>${player.stats.shortLegs || 0}</span>
                </div>
                <div class="stat-item">
                    <span>High Outs:</span>
                    <span>${(player.stats.highOuts || []).length}</span>
                </div>
                <div class="stat-item">
                    <span>Tons:</span>
                    <span>${player.stats.tons || 0}</span>
                </div>
                <div class="stat-item">
                    <span>180s:</span>
                    <span>${player.stats.oneEighties || 0}</span>
                </div>
            </div>
            <button class="btn" style="width: 100%; margin-top: 10px; padding: 8px;" onclick="openStatsModal(${player.id})">
                Edit Statistics
            </button>
        </div>
    `).join('');

    container.innerHTML = html;
}

function updatePlayerCount() {
    const totalPlayers = players.length;
    const paidPlayers = players.filter(p => p.paid).length;
    
    document.getElementById('playerCount').textContent = totalPlayers;
    document.getElementById('paidCount').textContent = paidPlayers;
}

function clearAllPlayers() {
    if (confirm('Are you sure you want to remove all players? This cannot be undone.')) {
        players = [];
        updatePlayersDisplay();
        updatePlayerCount();
        saveTournament();
    }
}

// BRACKET GENERATION
function generateBracket() {
    if (!tournament) {
        alert('Please create a tournament first');
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

    // Shuffle players randomly
    const shuffledPlayers = [...paidPlayers].sort(() => Math.random() - 0.5);

    // Create optimized bracket placement to avoid walkover vs walkover matches
    const bracket = createOptimizedBracket(shuffledPlayers, bracketSize);

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

    // First, place all real players
    for (let i = 0; i < players.length; i++) {
        bracket[i] = players[i];
    }

    // Calculate first round match pairs (0,1), (2,3), (4,5), etc.
    const firstRoundPairs = [];
    for (let i = 0; i < bracketSize; i += 2) {
        firstRoundPairs.push([i, i + 1]);
    }

    // Strategy: Place walkovers only in positions where they won't face another walkover
    let walkoverCount = 0;

    for (let pairIndex = 0; pairIndex < firstRoundPairs.length && walkoverCount < numWalkovers; pairIndex++) {
        const [pos1, pos2] = firstRoundPairs[pairIndex];

        // Check if this pair has at least one real player
        const hasPlayer1 = bracket[pos1] && !bracket[pos1].isBye;
        const hasPlayer2 = bracket[pos2] && !bracket[pos2].isBye;

        // If both positions are empty, place one real player and one walkover
        if (!hasPlayer1 && !hasPlayer2) {
            if (walkoverCount < numWalkovers) {
                bracket[pos2] = { id: `walkover-${walkoverCount}`, name: 'Walkover', isBye: true };
                walkoverCount++;
            }
        }
        // If one position has a real player and the other is empty, place walkover there
        else if (hasPlayer1 && !hasPlayer2 && walkoverCount < numWalkovers) {
            bracket[pos2] = { id: `walkover-${walkoverCount}`, name: 'Walkover', isBye: true };
            walkoverCount++;
        }
        else if (!hasPlayer1 && hasPlayer2 && walkoverCount < numWalkovers) {
            bracket[pos1] = { id: `walkover-${walkoverCount}`, name: 'Walkover', isBye: true };
            walkoverCount++;
        }
    }

    // Fill any remaining empty positions with walkovers (this handles edge cases)
    for (let i = 0; i < bracketSize && walkoverCount < numWalkovers; i++) {
        if (!bracket[i]) {
            bracket[i] = { id: `walkover-${walkoverCount}`, name: 'Walkover', isBye: true };
            walkoverCount++;
        }
    }

    return bracket;
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
                // First round: use actual players
                const playerIndex = matchIndex * 2;
                player1 = bracket[playerIndex] || { name: 'BYE', id: `bye-${playerIndex}`, isBye: true };
                player2 = bracket[playerIndex + 1] || { name: 'BYE', id: `bye-${playerIndex + 1}`, isBye: true };
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
            if (player1.isBye && !player2.isBye) {
                match.winner = player2;
                match.completed = true;
                match.autoAdvanced = true;
            } else if (player2.isBye && !player1.isBye) {
                match.winner = player1;
                match.completed = true;
                match.autoAdvanced = true;
            } else if (player1.isBye && player2.isBye) {
                // This should never happen with our new logic, but handle it
                match.winner = { name: 'Walkover', id: `auto-walkover-${matchId}`, isBye: true };
                match.completed = true;
                match.autoAdvanced = true;
            }

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
    // Check all incomplete matches for walkover situations
    let foundAutoAdvancement = false;

    matches.forEach(match => {
        if (!match.completed &&
            match.player1 && match.player2 &&
            match.player1.name !== 'TBD' && match.player2.name !== 'TBD') {

            // Check if one player is a walkover/bye
            if (match.player1.isBye && !match.player2.isBye) {
                match.winner = match.player2;
                match.completed = true;
                match.autoAdvanced = true;
                foundAutoAdvancement = true;
                advanceWinner(match);
            } else if (match.player2.isBye && !match.player1.isBye) {
                match.winner = match.player1;
                match.completed = true;
                match.autoAdvanced = true;
                foundAutoAdvancement = true;
                advanceWinner(match);
            } else if (match.player1.isBye && match.player2.isBye) {
                // Both are walkovers - advance a walkover (this should be rare)
                match.winner = match.player1;
                match.completed = true;
                match.autoAdvanced = true;
                foundAutoAdvancement = true;
                advanceWinner(match);
            }
        }
    });

    // If we found any auto-advancements, check again for new situations
    if (foundAutoAdvancement) {
        setTimeout(() => checkForAutoAdvancement(), 100);
    }
}

// MATCH PROGRESSION LOGIC
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

// BRACKET RENDERING SYSTEM
function renderBracket() {
    const canvas = document.getElementById('bracketCanvas');
    if (!canvas) return;

    if (!tournament || !tournament.bracket) {
        document.getElementById('bracketMatches').innerHTML = '<p style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333;">No bracket generated yet</p>';
        return;
    }

    clearBracket();
    renderCompleteDoubleElimination();
}

function clearBracket() {
    document.getElementById('bracketMatches').innerHTML = '';
    document.getElementById('bracketLines').innerHTML = '';
}

function renderCompleteDoubleElimination() {
    const bracketSize = tournament.bracketSize;
    const structure = calculateBracketStructure(bracketSize);

    // Define grid parameters
    const grid = {
        matchWidth: 180,
        matchHeight: 80,
        horizontalSpacing: 100,
        verticalSpacing: 60,
        canvasWidth: 3000,
        canvasHeight: 1200,
        centerX: 1500,
        centerY: 600,
        centerBuffer: 250
    };

    // Render all bracket sections
    renderFrontsideGrid(structure.frontside, grid);
    renderBacksideGrid(structure.backside, grid);
    renderFinalGrid(grid);
    renderAllConnections(structure, grid);
}

function renderFrontsideGrid(frontsideStructure, grid) {
    frontsideStructure.forEach((roundInfo, roundIndex) => {
        const frontsideMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === roundInfo.round
        );

        // Position: Center flowing RIGHT with buffer zone
        const roundX = grid.centerX + grid.centerBuffer + roundIndex * (grid.matchWidth + grid.horizontalSpacing);

        if (frontsideMatches.length === 1) {
            // Final/semi-final match - center it vertically
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderGridMatch(frontsideMatches[0], roundX, matchY);
        } else {
            // Multiple matches - use generous spacing
            const totalNeededHeight = frontsideMatches.length * grid.matchHeight + (frontsideMatches.length - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);

            frontsideMatches.forEach((match, matchIndex) => {
                const matchY = startY + matchIndex * (grid.matchHeight + grid.verticalSpacing);
                renderGridMatch(match, roundX, matchY);
            });
        }
    });
}

function renderBacksideGrid(backsideStructure, grid) {
    backsideStructure.forEach((roundInfo, roundIndex) => {
        const backsideMatches = matches.filter(m =>
            m.side === 'backside' && m.round === roundInfo.round
        );

        // Position: Center flowing LEFT with buffer zone
        const roundX = grid.centerX - grid.centerBuffer - roundIndex * (grid.matchWidth + grid.horizontalSpacing);

        if (backsideMatches.length === 1) {
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderGridMatch(backsideMatches[0], roundX, matchY);
        } else {
            const totalNeededHeight = backsideMatches.length * grid.matchHeight + (backsideMatches.length - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);

            backsideMatches.forEach((match, matchIndex) => {
                const matchY = startY + matchIndex * (grid.matchHeight + grid.verticalSpacing);
                renderGridMatch(match, roundX, matchY);
            });
        }
    });
}

function renderFinalGrid(grid) {
    const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
    const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');

    const finalY = grid.centerY + 350;

    if (backsideFinal) {
        renderGridMatch(backsideFinal, grid.centerX - 150, finalY);
    }

    if (grandFinal) {
        renderGridMatch(grandFinal, grid.centerX - (grid.matchWidth / 2), finalY + 150);
    }
}

function renderGridMatch(match, x, y) {
    const matchElement = document.createElement('div');
    matchElement.className = `bracket-match ${match.active ? 'active' : ''} ${match.completed ? 'completed' : ''}`;
    matchElement.style.left = x + 'px';
    matchElement.style.top = y + 'px';
    matchElement.id = `bracket-match-${match.id}`;

    const availableReferees = getAvailableReferees(match.id);
    const refereeOptions = availableReferees.map(ref =>
        `<option value="${ref.id}" ${match.referee?.id === ref.id ? 'selected' : ''}>${ref.name}</option>`
    ).join('');

    matchElement.innerHTML = `
        <div class="match-header">
            <span>${match.id}</span>
            <span class="match-info">
                L<select onchange="updateMatchLane('${match.id}', this.value)" style="background: white; border: 1px solid #ddd; font-size: 11px; width: 40px; padding: 2px;">
                    ${Array.from({length: 10}, (_, i) => i + 1).map(lane =>
                        `<option value="${lane}" ${match.lane === lane ? 'selected' : ''}>${lane}</option>`
                    ).join('')}
                </select> | Bo${match.legs}
            </span>
        </div>
        <div class="match-players">
            <div class="match-player ${match.player1?.isBye ? 'bye' : 'first-throw'} ${match.winner?.id === match.player1?.id ? 'winner' : ''}"
                 onclick="${match.player1?.isBye ? '' : `selectWinner('${match.id}', 1)`}">
                <span class="player-name-short">${match.player1?.name || 'TBD'}</span>
                ${match.winner?.id === match.player1?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
            <div class="match-player ${match.player2?.isBye ? 'bye' : ''} ${match.winner?.id === match.player2?.id ? 'winner' : ''}"
                 onclick="${match.player2?.isBye ? '' : `selectWinner('${match.id}', 2)`}">
                <span class="player-name-short">${match.player2?.name || 'TBD'}</span>
                ${match.winner?.id === match.player2?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
        </div>
        <div class="match-controls">
            <select onchange="updateReferee('${match.id}', this.value)" style="font-size: 11px; max-width: 80px; padding: 2px; background: white; border: 1px solid #ddd;">
                <option value="">No ref</option>
                ${refereeOptions}
            </select>
            <button onclick="toggleActive('${match.id}')" style="font-size: 8px; padding: 2px 4px; border: none; border-radius: 2px; background: ${match.active ? '#ff6b35' : '#ddd'}; color: ${match.active ? 'white' : 'black'};">
                ${match.active ? 'LIVE' : 'Start'}
            </button>
        </div>
    `;

    document.getElementById('bracketMatches').appendChild(matchElement);
}

function renderAllConnections(structure, grid) {
    document.getElementById('bracketLines').innerHTML = '';
    drawFrontsideConnections(structure.frontside, grid);
    drawBacksideConnections(structure.backside, grid);
    drawLoserDropConnections(structure, grid);
    drawFinalConnections(grid);
}

function drawFrontsideConnections(frontsideStructure, grid) {
    for (let roundIndex = 0; roundIndex < frontsideStructure.length - 1; roundIndex++) {
        const currentRound = frontsideStructure[roundIndex];
        const nextRound = frontsideStructure[roundIndex + 1];

        const currentMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === currentRound.round
        );
        const nextMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === nextRound.round
        );

        for (let i = 0; i < nextMatches.length; i++) {
            const match1 = currentMatches[i * 2];
            const match2 = currentMatches[i * 2 + 1];
            const nextMatch = nextMatches[i];

            if (match1 && match2 && nextMatch) {
                drawTournamentConnection(match1.id, match2.id, nextMatch.id);
            }
        }
    }
}

function drawBacksideConnections(backsideStructure, grid) {
    for (let roundIndex = 0; roundIndex < backsideStructure.length - 1; roundIndex++) {
        const currentRound = backsideStructure[roundIndex];
        const nextRound = backsideStructure[roundIndex + 1];

        const currentMatches = matches.filter(m =>
            m.side === 'backside' && m.round === currentRound.round
        );
        const nextMatches = matches.filter(m =>
            m.side === 'backside' && m.round === nextRound.round
        );

        currentMatches.forEach((currentMatch, index) => {
            const nextMatch = nextMatches[Math.floor(index / 2)];
            if (nextMatch) {
                drawSimpleConnection(currentMatch.id, nextMatch.id);
            }
        });
    }
}

function drawLoserDropConnections(structure, grid) {
    structure.frontside.forEach((frontsideRound, index) => {
        if (index === structure.frontside.length - 1) return;

        const frontsideMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === frontsideRound.round
        );

        const targetBacksideRound = index * 2 + 2;
        const backsideMatches = matches.filter(m =>
            m.side === 'backside' && m.round === targetBacksideRound
        );

        frontsideMatches.forEach((fsMatch, fsIndex) => {
            const bsMatch = backsideMatches[Math.floor(fsIndex / 2)];
            if (bsMatch) {
                drawLoserDropLine(fsMatch.id, bsMatch.id);
            }
        });
    });
}

function drawFinalConnections(grid) {
    const frontsideWinnerMatch = matches.find(m =>
        m.side === 'frontside' && m.round === Math.max(...matches.filter(m => m.side === 'frontside').map(m => m.round))
    );
    const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');

    if (frontsideWinnerMatch && grandFinal) {
        drawSimpleConnection(frontsideWinnerMatch.id, grandFinal.id);
    }

    const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
    if (backsideFinal && grandFinal) {
        drawSimpleConnection(backsideFinal.id, grandFinal.id);
    }
}

function drawTournamentConnection(match1Id, match2Id, nextMatchId) {
    const match1Element = document.getElementById(`bracket-match-${match1Id}`);
    const match2Element = document.getElementById(`bracket-match-${match2Id}`);
    const nextMatchElement = document.getElementById(`bracket-match-${nextMatchId}`);

    if (!match1Element || !match2Element || !nextMatchElement) return;

    const canvasRect = document.getElementById('bracketCanvas').getBoundingClientRect();

    const match1Rect = match1Element.getBoundingClientRect();
    const match2Rect = match2Element.getBoundingClientRect();
    const nextMatchRect = nextMatchElement.getBoundingClientRect();

    const match1Y = match1Rect.top - canvasRect.top + match1Rect.height / 2;
    const match2Y = match2Rect.top - canvasRect.top + match2Rect.height / 2;
    const nextMatchY = nextMatchRect.top - canvasRect.top + nextMatchRect.height / 2;
    const match1X = match1Rect.left - canvasRect.left + match1Rect.width;
    const nextMatchX = nextMatchRect.left - canvasRect.left;

    const connectorX = match1X + 40;

    createLine(match1X, match1Y, connectorX, match1Y);
    createLine(match1X, match2Y, connectorX, match2Y);
    createLine(connectorX, Math.min(match1Y, match2Y), connectorX, Math.max(match1Y, match2Y));
    createLine(connectorX, (match1Y + match2Y) / 2, nextMatchX, nextMatchY);
}

function drawSimpleConnection(fromMatchId, toMatchId) {
    const fromElement = document.getElementById(`bracket-match-${fromMatchId}`);
    const toElement = document.getElementById(`bracket-match-${toMatchId}`);

    if (!fromElement || !toElement) return;

    const canvasRect = document.getElementById('bracketCanvas').getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const fromX = fromRect.left - canvasRect.left + fromRect.width;
    const fromY = fromRect.top - canvasRect.top + fromRect.height / 2;
    const toX = toRect.left - canvasRect.left;
    const toY = toRect.top - canvasRect.top + toRect.height / 2;

    createLine(fromX, fromY, toX, toY);
}

function drawLoserDropLine(fromMatchId, toMatchId) {
    const fromElement = document.getElementById(`bracket-match-${fromMatchId}`);
    const toElement = document.getElementById(`bracket-match-${toMatchId}`);

    if (!fromElement || !toElement) return;

    const canvasRect = document.getElementById('bracketCanvas').getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const fromX = fromRect.left - canvasRect.left + fromRect.width / 2;
    const fromY = fromRect.top - canvasRect.top + fromRect.height;
    const toX = toRect.left - canvasRect.left + toRect.width / 2;
    const toY = toRect.top - canvasRect.top;

    const line = document.createElement('div');
    line.className = 'bracket-line';
    line.style.position = 'absolute';
    line.style.background = '#ff6b35';

    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    line.style.width = length + 'px';
    line.style.height = '0px';
    line.style.borderBottom = '2px dashed #ff6b35';
    line.style.left = fromX + 'px';
    line.style.top = fromY + 'px';
    line.style.transformOrigin = '0 0';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.zIndex = '1';

    document.getElementById('bracketLines').appendChild(line);
}

function createLine(x1, y1, x2, y2) {
    const line = document.createElement('div');
    line.className = 'bracket-line';
    line.style.position = 'absolute';
    line.style.background = '#333333';
    line.style.zIndex = '1';

    if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
        line.style.left = Math.min(x1, x2) + 'px';
        line.style.top = y1 + 'px';
        line.style.width = Math.abs(x2 - x1) + 'px';
        line.style.height = '3px';
    } else {
        line.style.left = x1 + 'px';
        line.style.top = Math.min(y1, y2) + 'px';
        line.style.width = '3px';
        line.style.height = Math.abs(y2 - y1) + 'px';
    }

    document.getElementById('bracketLines').appendChild(line);
}

// TOURNAMENT CONTROLS AND UTILITIES
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

function resetTournament() {
    if (confirm('Are you sure you want to reset the tournament? This will clear all matches and results.')) {
        matches = [];
        tournament.bracket = null;
        tournament.status = 'setup';

        players.forEach(player => {
            player.eliminated = false;
            player.placement = null;
        });

        saveTournament();
        clearBracket();

        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }

        alert('Tournament reset successfully');
    }
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

// ZOOM AND PAN FUNCTIONALITY
function handleZoom(e) {
    e.preventDefault();

    const viewport = document.getElementById('bracketViewport');
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const canvasMouseX = (mouseX - panOffset.x) / zoomLevel;
    const canvasMouseY = (mouseY - panOffset.y) / zoomLevel;

    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.max(0.3, Math.min(2, zoomLevel + delta));

    if (newZoom !== zoomLevel) {
        panOffset.x = mouseX - canvasMouseX * newZoom;
        panOffset.y = mouseY - canvasMouseY * newZoom;
        zoomLevel = newZoom;
        updateCanvasTransform();
    }
}

function zoomIn() {
    const viewport = document.getElementById('bracketViewport');
    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;

    const canvasCenterX = (centerX - panOffset.x) / zoomLevel;
    const canvasCenterY = (centerY - panOffset.y) / zoomLevel;

    zoomLevel = Math.min(2, zoomLevel + 0.1);

    panOffset.x = centerX - canvasCenterX * zoomLevel;
    panOffset.y = centerY - canvasCenterY * zoomLevel;

    updateCanvasTransform();
}

function zoomOut() {
    const viewport = document.getElementById('bracketViewport');
    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;

    const canvasCenterX = (centerX - panOffset.x) / zoomLevel;
    const canvasCenterY = (centerY - panOffset.y) / zoomLevel;

    zoomLevel = Math.max(0.3, zoomLevel - 0.1);

    panOffset.x = centerX - canvasCenterX * zoomLevel;
    panOffset.y = centerY - canvasCenterY * zoomLevel;

    updateCanvasTransform();
}

function resetZoom() {
    zoomLevel = 0.6;
    panOffset = { x: 0, y: 0 };
    updateCanvasTransform();
}

function updateCanvasTransform() {
    const canvas = document.getElementById('bracketCanvas');
    if (canvas) {
        canvas.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
    }
}

function startDrag(e) {
    if (e.target.closest('.bracket-match')) return;
    isDragging = true;
    dragStart.x = e.clientX - panOffset.x;
    dragStart.y = e.clientY - panOffset.y;
    e.preventDefault();
}

function handleDrag(e) {
    if (!isDragging) return;
    panOffset.x = e.clientX - dragStart.x;
    panOffset.y = e.clientY - dragStart.y;
    updateCanvasTransform();
}

function endDrag() {
    isDragging = false;
}

// RESULTS AND CONFIGURATION
function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        updateResultsTable();
    }
}

function updateResultsTable() {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    const sortedPlayers = [...players].sort((a, b) => {
        if (a.placement && b.placement) {
            return a.placement - b.placement;
        }
        if (a.placement) return -1;
        if (b.placement) return 1;
        return 0;
    });

    tbody.innerHTML = sortedPlayers.map(player => {
        const points = calculatePlayerPoints(player);
        return `
            <tr>
                <td>${player.placement || 'TBD'}</td>
                <td>${player.name}</td>
                <td>${points}</td>
                <td>${player.stats.shortLegs || 0}</td>
                <td>${(player.stats.highOuts || []).length}</td>
                <td>${player.stats.tons || 0}</td>
                <td>${player.stats.oneEighties || 0}</td>
            </tr>
        `;
    }).join('');
}

function calculatePlayerPoints(player) {
    let points = 0;

    points += config.points.participation;

    if (player.placement === 1) {
        points += config.points.first;
    } else if (player.placement === 2) {
        points += config.points.second;
    } else if (player.placement === 3) {
        points += config.points.third;
    }

    points += (player.stats.highOuts || []).length * config.points.highOut;
    points += (player.stats.tons || 0) * config.points.ton;
    points += (player.stats.oneEighties || 0) * config.points.oneEighty;

    return points;
}

function loadConfiguration() {
    const savedConfig = localStorage.getItem('dartsConfig');
    if (savedConfig) {
        config = JSON.parse(savedConfig);

        document.getElementById('participationPoints').value = config.points.participation;
        document.getElementById('firstPlacePoints').value = config.points.first;
        document.getElementById('secondPlacePoints').value = config.points.second;
        document.getElementById('thirdPlacePoints').value = config.points.third;
        document.getElementById('highOutPoints').value = config.points.highOut;
        document.getElementById('tonPoints').value = config.points.ton;
        document.getElementById('oneEightyPoints').value = config.points.oneEighty;

        document.getElementById('round1Legs').value = config.legs.round1;
        document.getElementById('round2Legs').value = config.legs.round2;
        document.getElementById('semifinalLegs').value = config.legs.semifinal;
        document.getElementById('finalLegs').value = config.legs.final;
    }
}

function saveConfiguration() {
    config.points.participation = parseInt(document.getElementById('participationPoints').value);
    config.points.first = parseInt(document.getElementById('firstPlacePoints').value);
    config.points.second = parseInt(document.getElementById('secondPlacePoints').value);
    config.points.third = parseInt(document.getElementById('thirdPlacePoints').value);
    config.points.highOut = parseInt(document.getElementById('highOutPoints').value);
    config.points.ton = parseInt(document.getElementById('tonPoints').value);
    config.points.oneEighty = parseInt(document.getElementById('oneEightyPoints').value);

    config.legs.round1 = parseInt(document.getElementById('round1Legs').value);
    config.legs.round2 = parseInt(document.getElementById('round2Legs').value);
    config.legs.semifinal = parseInt(document.getElementById('semifinalLegs').value);
    config.legs.final = parseInt(document.getElementById('finalLegs').value);

    localStorage.setItem('dartsConfig', JSON.stringify(config));
    alert('Configuration saved successfully!');
}

// AUTO-LOAD CURRENT TOURNAMENT ON PAGE LOAD
window.addEventListener('load', function() {
    const currentTournament = localStorage.getItem('currentTournament');
    if (currentTournament) {
        try {
            tournament = JSON.parse(currentTournament);
            players = tournament.players || [];
            matches = tournament.matches || [];

            if (tournament.name && tournament.date) {
                document.getElementById('tournamentName').value = tournament.name;
                document.getElementById('tournamentDate').value = tournament.date;
                updateTournamentStatus();
                updatePlayersDisplay();
                updatePlayerCount();

                if (tournament.bracket && matches.length > 0) {
                    renderBracket();
                }

                if (tournament.status === 'completed') {
                    displayResults();
                }
            }
        } catch (e) {
            console.error('Error loading current tournament:', e);
        }
    }
});
