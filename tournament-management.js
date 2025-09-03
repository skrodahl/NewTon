// tournament-management.js - Config-Free Tournament Operations
// NEVER touches global config - only tournament-specific data

let showingAllTournaments = false;

function createTournament() {
    const name = document.getElementById('tournamentName').value.trim();
    const date = document.getElementById('tournamentDate').value;
    
    if (!name || !date) {
        alert('Please enter both tournament name and date');
        return;
    }

    // CREATE CLEAN TOURNAMENT OBJECT - No config contamination
    tournament = {
        id: Date.now(),
        name: name,
        date: date,
        created: new Date().toISOString(),
        status: 'setup',
        players: [],
        matches: [],
        bracket: null,
        placements: {} // Only tournament-specific placement data
        // NO CONFIG DATA HERE - Config is always global
    };

    // Clear all existing tournament data for fresh start
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
    
    // Save tournament (but NOT config)
    saveTournamentOnly();
    updateTournamentStatus();
    showPage('registration');
    
    // Ensure results table is populated
    if (typeof displayResults === 'function') {
        displayResults();
    }

    updateTournamentWatermark();
    
    alert('✓ New tournament created successfully! Start by adding players.');
}

function exportTournament() {
    if (!tournament) {
        alert('No active tournament to export');
        return;
    }

    // Export ONLY tournament data, never global config
    const tournamentData = {
        ...tournament,
        players: players,
        matches: matches,
        exportedAt: new Date().toISOString()
        // NO CONFIG DATA in export
    };

    const dataStr = JSON.stringify(tournamentData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournament.name}_${tournament.date}.json`;
    link.click();
    
    console.log('✓ Tournament exported (config excluded)');
}

// SAVE TOURNAMENT ONLY - Never touches global config
function saveTournamentOnly() {
    if (!tournament) return;

    // Build clean tournament object with current data
    const tournamentToSave = {
        id: tournament.id,
        name: tournament.name,
        date: tournament.date,
        created: tournament.created,
        status: tournament.status,
        players: players, // Tournament-specific player data
        matches: matches, // Tournament-specific match data
        bracket: tournament.bracket,
        bracketSize: tournament.bracketSize, // ✅ Fixed: Include bracketSize
        placements: tournament.placements || {},
        lastSaved: new Date().toISOString()
        // NO CONFIG DATA - Config stays global
    };

    // Save to tournaments list
    let tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const index = tournaments.findIndex(t => t.id === tournament.id);
    
    if (index >= 0) {
        tournaments[index] = tournamentToSave;
    } else {
        tournaments.push(tournamentToSave);
    }
    
    localStorage.setItem('dartsTournaments', JSON.stringify(tournaments));
    localStorage.setItem('currentTournament', JSON.stringify(tournamentToSave));
    
    console.log('✓ Tournament saved (config unchanged)');
}

// WRAPPER FOR BACKWARD COMPATIBILITY
function saveTournament() {
    saveTournamentOnly();
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
    updateTournamentWatermark();
}

function loadRecentTournaments() {
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const container = document.getElementById('recentTournaments');
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p>No tournaments found</p>';
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

// LOAD TOURNAMENT - Never touches global config
function loadSpecificTournament(id) {
    console.log(`🔄 Loading tournament ${id} (config will stay global)...`);
    
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const selectedTournament = tournaments.find(t => t.id === id);
    
    if (!selectedTournament) {
        alert('Tournament not found');
        return;
    }

    // Load ONLY tournament data - NEVER override global config
    tournament = {
        id: selectedTournament.id,
        name: selectedTournament.name,
        date: selectedTournament.date,
        created: selectedTournament.created,
        status: selectedTournament.status,
        bracket: selectedTournament.bracket,
        placements: selectedTournament.placements || {}
        // NO CONFIG loading - config stays global
    };
    
    players = selectedTournament.players || [];
    matches = selectedTournament.matches || [];
    
    // Update UI with tournament data
    document.getElementById('tournamentName').value = tournament.name;
    document.getElementById('tournamentDate').value = tournament.date;
    
    updateTournamentStatus();
    updatePlayersDisplay();
    updatePlayerCount();
    updateTournamentWatermark();
    
    // Display results with current global config
    if (typeof displayResults === 'function') {
        displayResults();
    }

    if (tournament.bracket && typeof renderBracket === 'function') {
        renderBracket();
    }
    
    showPage('registration');
    console.log('✓ Tournament loaded (global config preserved)');
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
    alert(`✓ Tournament "${tournamentToDelete.name}" has been deleted successfully.`);
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

    // Reset tournament data only
    matches = [];
    tournament.bracket = null;
    tournament.status = 'setup';
    tournament.placements = {};

    players.forEach(player => {
        player.eliminated = false;
        player.placement = null;
    });

    saveTournamentOnly(); // Save tournament but not config
    
    if (typeof clearBracket === 'function') {
        clearBracket();
    }

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }

    alert(`✓ Tournament "${tournamentName}" has been reset successfully.\n\nYou can now generate a new bracket on the Tournament page.`);
}

function importTournament(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset file input for future imports
    event.target.value = '';

    if (!file.name.endsWith('.json')) {
        showImportStatus('error', 'Please select a valid JSON file');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            processImportedTournament(importedData);
        } catch (error) {
            showImportStatus('error', 'Invalid JSON file. Please check the file format.');
            console.error('JSON parse error:', error);
        }
    };

    reader.onerror = function() {
        showImportStatus('error', 'Error reading file. Please try again.');
    };

    reader.readAsText(file);
}

// PROCESS IMPORTED TOURNAMENT - Strip any config contamination
function processImportedTournament(importedData) {
    console.log('📥 Processing imported tournament (stripping any config data)...');
    
    const validation = validateTournamentData(importedData);
    if (!validation.valid) {
        showImportStatus('error', `Invalid tournament data: ${validation.error}`);
        return;
    }

    // Check if tournament already exists
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const existingTournament = tournaments.find(t => t.id === importedData.id);

    if (existingTournament) {
        const overwrite = confirm(
            `Tournament "${importedData.name}" (${importedData.date}) already exists.\n\n` +
            `Do you want to overwrite it with the imported version?`
        );
        
        if (!overwrite) {
            showImportStatus('warning', 'Import cancelled by user');
            return;
        }
    }

    try {
        // Import ONLY tournament data - Strip any config contamination
        tournament = {
            id: importedData.id,
            name: importedData.name,
            date: importedData.date,
            created: importedData.created || new Date().toISOString(),
            status: importedData.status || 'setup',
            bracket: importedData.bracket || null,
            placements: importedData.placements || {}
            // NO CONFIG DATA imported - global config stays intact
        };
        
        players = importedData.players || [];
        matches = importedData.matches || [];

        // Update UI fields
        document.getElementById('tournamentName').value = tournament.name;
        document.getElementById('tournamentDate').value = tournament.date;

        // Save to localStorage
        saveTournamentOnly(); // Save tournament only, not config

        // Update displays
        updateTournamentStatus();
        updatePlayersDisplay();
        updatePlayerCount();
        loadRecentTournaments();

        // Render bracket if exists
        if (tournament.bracket && typeof renderBracket === 'function') {
            renderBracket();
        }

        // Display results using global config
        if (typeof displayResults === 'function') {
            displayResults();
        }

        showImportStatus('success', 
            `✓ Tournament "${tournament.name}" imported successfully! ` +
            `${players.length} players and ${matches.filter(m => m.completed).length} completed matches loaded.`
        );

        // Auto-switch to registration page
        setTimeout(() => {
            showPage('registration');
        }, 1500);

        console.log('✓ Tournament imported (global config preserved)');

    } catch (error) {
        showImportStatus('error', 'Error importing tournament data. Please try again.');
        console.error('Import error:', error);
    }
}

function validateTournamentData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Data must be a valid tournament object' };
    }

    if (!data.name || typeof data.name !== 'string') {
        return { valid: false, error: 'Tournament name is required' };
    }

    if (!data.date || typeof data.date !== 'string') {
        return { valid: false, error: 'Tournament date is required' };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
        return { valid: false, error: 'Tournament date must be in YYYY-MM-DD format' };
    }

    // Ensure ID exists (generate if missing)
    if (!data.id) {
        data.id = Date.now();
        console.warn('Generated new ID for imported tournament:', data.id);
    }

    // Validate players array
    if (data.players && !Array.isArray(data.players)) {
        return { valid: false, error: 'Players must be an array' };
    }

    // Validate matches array
    if (data.matches && !Array.isArray(data.matches)) {
        return { valid: false, error: 'Matches must be an array' };
    }

    // Set default values for missing optional fields
    if (!data.status) data.status = 'setup';
    if (!data.players) data.players = [];
    if (!data.matches) data.matches = [];
    if (!data.created) data.created = new Date().toISOString();

    // Validate each player has required fields
    if (data.players.length > 0) {
        for (let i = 0; i < data.players.length; i++) {
            const player = data.players[i];
            if (!player.name || !player.id) {
                return { valid: false, error: `Player ${i + 1} is missing required fields (name, id)` };
            }
            
            // Set default player values
            if (typeof player.paid === 'undefined') player.paid = false;
            if (!player.stats) player.stats = { shortLegs: [], highOuts: [], tons: 0, oneEighties: 0 };
        }
    }

    return { valid: true };
}

function showImportStatus(type, message) {
    const statusDiv = document.getElementById('importStatus');
    if (!statusDiv) return;

    // Set styling based on type
    statusDiv.className = `alert alert-${type}`;
    statusDiv.innerHTML = message;
    statusDiv.style.display = 'block';

    // Auto-hide success/warning messages after 5 seconds
    if (type === 'success' || type === 'warning') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

function updateTournamentWatermark() {
    const watermark = document.getElementById('watermark-right');
    if (watermark) {
        watermark.textContent = tournament?.name || 'No Tournament';
    }
}
