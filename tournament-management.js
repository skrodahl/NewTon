// tournament-management.js - Tournament Creation, Loading, and Management

let showingAllTournaments = false;

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
    if (typeof clearBracket === 'function') {
    clearBracket();
    }
    
    // Hide results section if visible
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
    resultsSection.style.display = 'none';
    }
    
    saveTournament();
    updateTournamentStatus();
    showPage('registration');
    // Ensure results table is populated by default
    if (typeof displayResults === 'function') {
    displayResults();
    }

    
    alert('New tournament created successfully! Start by adding players.');
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
    // Hide toggle button
    const toggleBtn = document.getElementById('toggleTournamentsBtn');
    if (toggleBtn) {
    toggleBtn.style.display = 'none';
    }
    return;
    }

    // Sort tournaments by creation timestamp (newest first)
    const sortedTournaments = tournaments.sort((a, b) => {
    if (a.created && b.created) {
    return new Date(b.created) - new Date(a.created);
    } else if (a.created) {
    return -1;
    } else if (b.created) {
    return 1;
    } else {
    const dateA = new Date(a.date + 'T00:00:00');
    const dateB = new Date(b.date + 'T00:00:00');
    return dateB - dateA;
    }
    });

    // Determine which tournaments to show
    const tournamentsToShow = showingAllTournaments ? 
    sortedTournaments : 
    sortedTournaments.slice(0, 5);

    const html = tournamentsToShow.map(t => {
    const isActiveTournament = tournament && tournament.id === t.id;
    return `
    <div style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px; ${isActiveTournament ? 'background: #e8f5e8;' : ''}">
    <div style="display: flex; justify-content: space-between; align-items: center;">
    <span>
    <strong>${t.name}</strong> (${t.date})
    ${isActiveTournament ? '<span style="color: #28a745; font-size: 12px; margin-left: 10px;">[ACTIVE]</span>' : ''}
    </span>
    <div>
    <button class="btn" style="padding: 5px 10px; font-size: 14px; margin-right: 5px;" onclick="loadSpecificTournament(${t.id})">Load</button>
    <button class="btn btn-danger" style="padding: 5px 8px; font-size: 12px;" onclick="deleteTournament(${t.id})">×</button>
    </div>
    </div>
    </div>
    `;
    }).join('');
    
    container.innerHTML = html;

    // Update the toggle button
    const toggleBtn = document.getElementById('toggleTournamentsBtn');
    if (toggleBtn) {
    if (tournaments.length <= 5) {
    toggleBtn.style.display = 'none';
    } else {
    toggleBtn.style.display = 'inline-block';
    toggleBtn.textContent = showingAllTournaments ? 'Show Recent' : 'Show All';
    }
    }
}

function toggleTournamentView() {
    showingAllTournaments = !showingAllTournaments;
    loadRecentTournaments();
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
    
    // Populate results table by default when a tournament is loaded
    if (typeof displayResults === 'function') {
    displayResults();
    }

    if (tournament.bracket && typeof renderBracket === 'function') {
    renderBracket();
    }
    
    showPage('registration');
}

function deleteTournament(tournamentId) {
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const tournamentToDelete = tournaments.find(t => t.id === tournamentId);
    
    if (!tournamentToDelete) {
    alert('Tournament not found.');
    return;
    }

    if (tournament && tournament.id === tournamentId) {
    alert('Cannot delete the currently active tournament.\n\nPlease create a new tournament or load a different one first.');
    return;
    }

    const confirmDelete = confirm(
    `⚠️ DELETE TOURNAMENT ⚠️\n\n` +
    `Are you sure you want to permanently delete:\n` +
    `"${tournamentToDelete.name}"\n\n` +
    `This action cannot be undone.`
    );

    if (!confirmDelete) {
    return;
    }

    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
    localStorage.setItem('dartsTournaments', JSON.stringify(updatedTournaments));

    loadRecentTournaments();
    alert(`Tournament "${tournamentToDelete.name}" has been deleted successfully.`);
}

function resetTournament() {
    if (!tournament || !tournament.bracket) {
    alert('No active tournament to reset.');
    return;
    }

    const tournamentName = tournament.name;
    const completedMatches = matches.filter(m => m.completed).length;
    const totalMatches = matches.length;
    
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

    const tournamentNameConfirm = prompt(
    `⚠️ FINAL CONFIRMATION ⚠️\n\n` +
    `To confirm the reset, please type the tournament name exactly:\n\n` +
    `"${tournamentName}"\n\n` +
    `Type the tournament name below:`
    );

    if (tournamentNameConfirm !== tournamentName) {
    if (tournamentNameConfirm !== null) {
    alert('Tournament name did not match. Reset cancelled for your protection.');
    }
    return;
    }

    matches = [];
    tournament.bracket = null;
    tournament.status = 'setup';

    players.forEach(player => {
    player.eliminated = false;
    player.placement = null;
    });

    saveTournament();
    if (typeof clearBracket === 'function') {
    clearBracket();
    }

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
    resultsSection.style.display = 'none';
    }

    alert(`Tournament "${tournamentName}" has been reset successfully.\n\nYou can now generate a new bracket on the Registration page.`);
}
