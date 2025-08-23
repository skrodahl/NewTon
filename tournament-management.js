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

let showingAllTournaments = false;

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

    // Sort tournaments by creation timestamp (newest first) - this includes time
    const sortedTournaments = tournaments.sort((a, b) => {
        // Use created timestamp if available, fall back to date comparison
        if (a.created && b.created) {
            return new Date(b.created) - new Date(a.created); // Newest first
        } else if (a.created) {
            return -1; // a is newer (has timestamp)
        } else if (b.created) {
            return 1; // b is newer (has timestamp)
        } else {
            // Fall back to date comparison for older tournaments without created timestamp
            const dateA = new Date(a.date + 'T00:00:00');
            const dateB = new Date(b.date + 'T00:00:00');
            return dateB - dateA; // Newest first
        }
    });

    // Determine which tournaments to show
    const tournamentsToShow = showingAllTournaments ? 
        sortedTournaments : // All tournaments, newest first
        sortedTournaments.slice(0, 5); // First 5 tournaments (newest)

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

    // Update the toggle button text and visibility
    const toggleBtn = document.getElementById('toggleTournamentsBtn');
    if (toggleBtn) {
        if (tournaments.length <= 5) {
            // Hide button if we have 5 or fewer tournaments
            toggleBtn.style.display = 'none';
        } else {
            // Show button if we have more than 5 tournaments
            toggleBtn.style.display = 'inline-block';
            toggleBtn.textContent = showingAllTournaments ? 'Show Recent' : 'Show All';
        }
    }

    console.log(`Loaded tournaments: ${tournaments.length} total, showing ${tournamentsToShow.length}, toggle button: ${tournaments.length > 5 ? 'visible' : 'hidden'}`);
}

function toggleTournamentView() {
    showingAllTournaments = !showingAllTournaments;
    loadRecentTournaments();
}

function deleteTournament(tournamentId) {
    // Find the tournament to get its name
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const tournamentToDelete = tournaments.find(t => t.id === tournamentId);
    
    if (!tournamentToDelete) {
        alert('Tournament not found.');
        return;
    }

    // Check if trying to delete the currently active tournament
    if (tournament && tournament.id === tournamentId) {
        alert('Cannot delete the currently active tournament.\n\nPlease create a new tournament or load a different one first.');
        return;
    }

    // Confirmation dialog
    const confirmDelete = confirm(
        `⚠️ DELETE TOURNAMENT ⚠️\n\n` +
        `Are you sure you want to permanently delete:\n` +
        `"${tournamentToDelete.name}"\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmDelete) {
        return;
    }

    // Remove the tournament and save back
    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
    localStorage.setItem('dartsTournaments', JSON.stringify(updatedTournaments));

    // Refresh the display
    loadRecentTournaments();

    alert(`Tournament "${tournamentToDelete.name}" has been deleted successfully.`);
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
