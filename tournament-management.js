// tournament-management.js - Tournament Creation, Loading, and Management

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

    // Clear all existing data for a fresh start
    players = [];
    matches = [];
    
    // Clear the UI
    updatePlayersDisplay();
    updatePlayerCount();
    clearBracket();
    
    // Hide results section if visible
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    saveTournament();
    updateTournamentStatus();
    showPage('registration');
    
    alert('New tournament created successfully! Start by adding players.');
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

function resetTournament() {
    if (!tournament || !tournament.bracket) {
        alert('No active tournament to reset.');
        return;
    }

    // More conscious reset process
    const tournamentName = tournament.name;
    const completedMatches = matches.filter(m => m.completed).length;
    const totalMatches = matches.length;
    
    // First confirmation with tournament details
    const confirmMessage = `⚠️ RESET TOURNAMENT WARNING ⚠️\n\n` +
        `Tournament: "${tournamentName}"\n` +
        `Progress: ${completedMatches}/${totalMatches} matches completed\n` +
        `Players: ${players.length} registered\n\n` +
        `This will permanently delete:\n` +
        `• All match results\n` +
        `• All bracket progress\n` +
        `• All tournament standings\n\n` +
        `Are you sure you want to continue?`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // Second confirmation - requires typing tournament name
    const tournamentNameConfirm = prompt(
        `⚠️ FINAL CONFIRMATION ⚠️\n\n` +
        `To confirm the reset, please type the tournament name exactly:\n\n` +
        `"${tournamentName}"\n\n` +
        `Type the tournament name below:`
    );

    if (tournamentNameConfirm !== tournamentName) {
        if (tournamentNameConfirm !== null) { // User didn't cancel
            alert('Tournament name did not match. Reset cancelled for your protection.');
        }
        return;
    }

    // Perform the reset
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

    alert(`Tournament "${tournamentName}" has been reset successfully.\n\nYou can now generate a new bracket on the Registration page.`);
}
