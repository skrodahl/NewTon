// tournament-management.js - Config-Free Tournament Operations
// NEVER touches global config - only tournament-specific data

let showingAllTournaments = false;

// Helper function to clear tournament input fields
function clearTournamentFields() {
    const nameElement = document.getElementById('tournamentName');
    const dateElement = document.getElementById('tournamentDate');
    
    if (nameElement) nameElement.value = '';
    if (dateElement) {
        const today = new Date().toISOString().split('T')[0];
        dateElement.value = today;
    }
}

// UPDATE: Enhanced createTournament function with help integration
function createTournament() {
    const name = document.getElementById('tournamentName').value.trim();
    const date = document.getElementById('tournamentDate').value;

    if (!name || !date) {
        alert('Please enter both tournament name and date');
        return;
    }

    // Check for duplicate tournament with same name and date
    const existingTournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const duplicateTournament = existingTournaments.find(t => t.name === name && t.date === date);
    
    if (duplicateTournament) {
        alert(`A tournament named "${name}" on ${date} already exists.\n\nPlease choose a different name or date.`);
        // Clear fields after failed creation attempt
        clearTournamentFields();
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
        placements: {}
    };

    // Clear all existing tournament data for fresh start
    players = [];
    matches = [];
    localStorage.removeItem('undoneTransactions');

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

    // Reset date to today for next tournament creation
    setTodayDate();

    // Save tournament (but NOT config)
    saveTournamentOnly();
    updateTournamentStatus();

    // Refresh recent tournaments list to show the new tournament
    loadRecentTournaments();

    // Clear fields after successful creation
    clearTournamentFields();
    
    showPage('registration');

    // Ensure results table is populated
    if (typeof displayResults === 'function') {
        displayResults();
    }

    updateTournamentWatermark();

    alert('✓ New tournament created successfully! Start by adding players.');

    // HELP SYSTEM INTEGRATION
    if (typeof onTournamentCreated === 'function') {
        onTournamentCreated();
    }
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
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournament.name}_${tournament.date}.json`;
    link.click();

    console.log('✓ Tournament exported (config excluded)');
}

// SAVE TOURNAMENT ONLY - Never touches global config
function saveTournamentOnly(shouldLog = true) {
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

    if (shouldLog) {
        console.log('✓ Tournament saved (config unchanged)');
    }
}

// Simple debouncing to prevent save spam
let lastSaveTime = 0;
const SAVE_DEBOUNCE_MS = 100; // Wait 100ms between save logs

// WRAPPER FOR BACKWARD COMPATIBILITY  
function saveTournament() {
    const now = Date.now();
    const shouldLog = (now - lastSaveTime) > SAVE_DEBOUNCE_MS;
    
    saveTournamentOnly(shouldLog);
    
    if (shouldLog) {
        lastSaveTime = now;
    }
}

function updateTournamentStatus() {
    const statusDiv = document.getElementById('tournamentStatus');
    const headerStatusDiv = document.getElementById('headerTournamentStatus');

    if (tournament) {
        const statusText = `Tournament: <strong>${tournament.name}</strong> (${tournament.date})`;

        // Update main status div (in Setup page)
        if (statusDiv) {
            statusDiv.innerHTML = statusText;
            statusDiv.className = 'alert alert-success';
            statusDiv.style.display = 'block';
        }

        // Update header status div (NEW)
        if (headerStatusDiv) {
            headerStatusDiv.innerHTML = statusText;
        }
    } else {
        // No tournament
        if (statusDiv) {
            statusDiv.innerHTML = 'No active tournament';
            statusDiv.className = 'alert alert-info';
            statusDiv.style.display = 'block';
        }

        // Update header to show "None" (NEW)
        if (headerStatusDiv) {
            headerStatusDiv.innerHTML = 'Tournament: <strong>None</strong>';
        }
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
    console.log('DEBUG: selectedTournament object:', selectedTournament);
    console.log('DEBUG: selectedTournament.bracketSize:', selectedTournament.bracketSize);

    if (!selectedTournament) {
        alert('Tournament not found');
        return;
    }

    showLoadTournamentModal(id, selectedTournament);
}

function showLoadTournamentModal(tournamentId, selectedTournament) {
    // Store tournament info for later use
    window.selectedTournamentId = tournamentId;
    window.selectedTournamentData = selectedTournament;

    // Populate selected tournament details
    document.getElementById('loadTournamentName').textContent = selectedTournament.name;
    document.getElementById('loadTournamentDate').textContent = selectedTournament.date;

    const selectedCompletedMatches = (selectedTournament.matches || []).filter(m => m.completed).length;
    const selectedTotalMatches = (selectedTournament.matches || []).length;
    document.getElementById('loadMatchProgress').textContent = `${selectedCompletedMatches}/${selectedTotalMatches} matches completed`;
    document.getElementById('loadPlayerCount').textContent = `${(selectedTournament.players || []).length} registered`;

    // Show/hide current tournament section and update title
    const currentSection = document.getElementById('currentTournamentSection');
    const actionTitle = document.getElementById('loadActionTitle');

    if (tournament && tournament.name) {
        // Show current tournament details
        currentSection.style.display = 'block';
        actionTitle.textContent = 'This will be replaced with:';

        document.getElementById('currentTournamentName').textContent = tournament.name;
        document.getElementById('currentTournamentDate').textContent = tournament.date;

        const currentCompletedMatches = matches.filter(m => m.completed).length;
        const currentTotalMatches = matches.length;
        document.getElementById('currentMatchProgress').textContent = `${currentCompletedMatches}/${currentTotalMatches} matches completed`;
        document.getElementById('currentPlayerCount').textContent = `${players.length} registered`;
    } else {
        // No current tournament
        currentSection.style.display = 'none';
        actionTitle.textContent = 'You are about to load:';
    }

    // Show modal with Esc support
    pushDialog('loadTournamentModal', null, true);
}

function confirmLoadTournament() {
    console.log('🔄 confirmLoadTournament called');
    const selectedTournament = window.selectedTournamentData;
    console.log('📝 selectedTournament:', selectedTournament);

    if (!selectedTournament) {
        alert('Tournament data not found.');
        popDialog();
        return;
    }

    // Close modal first
    popDialog();

    // Continue with loading process
    continueLoadProcess(selectedTournament);
}

function continueLoadProcess(selectedTournament) {
    // Calculate bracketSize if missing (for older tournaments)
    let bracketSize = selectedTournament.bracketSize;
    if (!bracketSize && selectedTournament.bracket) {
        bracketSize = selectedTournament.bracket.length;
    }

    console.log('DEBUG: calculated bracketSize:', bracketSize);
    console.log('DEBUG: selectedTournament.bracket.length:', selectedTournament.bracket?.length);

    // Load ONLY tournament data - NEVER override global config
    tournament = {
        id: selectedTournament.id,
        name: selectedTournament.name,
        date: selectedTournament.date,
        created: selectedTournament.created,
        status: selectedTournament.status,
        bracket: selectedTournament.bracket,
        bracketSize: bracketSize,
        placements: selectedTournament.placements || {}
        // NO CONFIG loading - config stays global
    };

    console.log('DEBUG: tournament.bracketSize after assignment:', tournament.bracketSize);

    players = selectedTournament.players || [];
    matches = selectedTournament.matches || [];

    // Don't modify input fields when loading tournament - preserve user's work during navigation

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

    // CRITICAL FIX: Save the loaded tournament as current tournament
    localStorage.setItem('currentTournament', JSON.stringify(tournament));
    console.log(`✓ Set "${tournament.name}" as current tournament for persistence`);

    // Update Recent Tournaments display to show correct active tournament
    loadRecentTournaments();
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

    showDeleteTournamentModal(tournamentId, tournamentToDelete);
}

function showDeleteTournamentModal(tournamentId, tournamentToDelete) {
    // Store the tournament ID for later use
    window.tournamentToDeleteId = tournamentId;

    // Populate modal with tournament details
    document.getElementById('deleteTournamentName').textContent = tournamentToDelete.name;
    document.getElementById('deleteTournamentDate').textContent = tournamentToDelete.date;

    // Calculate players count
    const playerCount = tournamentToDelete.players ? tournamentToDelete.players.length : 0;
    document.getElementById('deleteTournamentPlayers').textContent = `${playerCount} players`;

    // Determine status
    let status = 'Setup';
    if (tournamentToDelete.bracket) {
        if (tournamentToDelete.matches && tournamentToDelete.matches.some(m => m.completed)) {
            status = 'In Progress';
        } else {
            status = 'Bracket Generated';
        }
    }
    document.getElementById('deleteTournamentStatus').textContent = status;

    // Show modal with Esc support
    pushDialog('deleteTournamentModal', null, true);
}

function confirmDeleteTournament() {
    const tournamentId = window.tournamentToDeleteId;
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const tournamentToDelete = tournaments.find(t => t.id === tournamentId);

    if (!tournamentToDelete) {
        alert('Tournament not found.');
        popDialog();
        return;
    }

    // Close modal first
    popDialog();

    // Delete the tournament
    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
    localStorage.setItem('dartsTournaments', JSON.stringify(updatedTournaments));

    loadRecentTournaments();
    alert(`✓ Tournament "${tournamentToDelete.name}" has been deleted successfully.`);
}

function showImportOverwriteModal(importedData) {
    // Store the imported data for later use
    window.importedTournamentData = importedData;

    // Populate modal with tournament details
    document.getElementById('importTournamentName').textContent = importedData.name;
    document.getElementById('importTournamentDate').textContent = importedData.date;

    // Show modal with Esc support
    pushDialog('importOverwriteModal', null, true);
}

function confirmOverwriteTournament() {
    const importedData = window.importedTournamentData;

    if (!importedData) {
        alert('Import data not found.');
        popDialog();
        return;
    }

    // Close modal first
    popDialog();

    // Continue with the import process (same logic as before)
    continueImportProcess(importedData);
}

function continueImportProcess(importedData) {
    try {
        // Calculate bracketSize if missing (for older exported tournaments)
        let bracketSize = importedData.bracketSize;
        if (!bracketSize && importedData.bracket) {
            bracketSize = importedData.bracket.length;
        }

        // Import ONLY tournament data - Strip any config contamination
        tournament = {
            id: importedData.id,
            name: importedData.name,
            date: importedData.date,
            created: importedData.created,
            status: importedData.status || 'setup',
            players: importedData.players || [],
            matches: importedData.matches || [],
            bracket: importedData.bracket || null,
            placements: importedData.placements || {},
            bracketSize: bracketSize
        };

        // Set global arrays
        players = tournament.players;
        matches = tournament.matches;

        // Save tournament (but not global config)
        saveTournamentOnly();

        // Debug: Verify what got saved
        const saved = JSON.parse(localStorage.getItem('currentTournament'));
        console.log(`✓ Saved tournament "${saved.name}" as current tournament`);

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

        // Show success with detailed info
        showImportStatus('success',
            `✓ Tournament "${tournament.name}" imported successfully! ` +
            `${players.length} players and ${matches.filter(m => m.completed).length} completed matches loaded.`
        );

        // Auto-switch to registration page
        setTimeout(() => {
            showPage('registration');
        }, 1500);

        // Update watermark
        updateTournamentWatermark();

        console.log('✓ Tournament imported (global config preserved)');
    } catch (error) {
        showImportStatus('error', 'Error importing tournament. Please check the file format.');
        console.error('Import error:', error);
    }
}

function showResetTournamentModal() {
    const tournamentName = tournament.name;
    const completedMatches = matches.filter(m => m.completed).length;
    const totalMatches = matches.length;

    // Populate modal with tournament details
    document.getElementById('resetTournamentName').textContent = tournamentName;
    document.getElementById('resetMatchProgress').textContent = `${completedMatches}/${totalMatches} matches completed`;
    document.getElementById('resetPlayerCount').textContent = players.length;

    // Clear and reset input field
    const input = document.getElementById('resetConfirmationInput');
    input.value = '';
    input.placeholder = `Type "${tournamentName}" exactly`;

    // Disable reset button initially
    document.getElementById('confirmResetBtn').disabled = true;

    // Remove any existing event listeners by cloning the input element
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    // Set up real-time validation on the clean input
    newInput.addEventListener('input', function() {
        const resetBtn = document.getElementById('confirmResetBtn');
        if (this.value === tournamentName) {
            resetBtn.disabled = false;
            resetBtn.style.background = 'rgba(180, 83, 9, 0.9)';
        } else {
            resetBtn.disabled = true;
            resetBtn.style.background = '#6c757d';
        }
    });

    // Add Enter key support
    newInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value === tournamentName) {
            confirmReset();
        }
    });

    // Focus input after modal shows
    setTimeout(() => {
        newInput.focus();
    }, 100);

    // Show modal with Esc support
    pushDialog('resetTournamentModal', null, true);
}

function confirmReset() {
    const input = document.getElementById('resetConfirmationInput');
    const tournamentName = tournament.name;

    if (input.value !== tournamentName) {
        alert('Tournament name did not match. Reset cancelled for your protection.');
        return;
    }

    // Close the modal first
    popDialog();

    // Reset tournament data only
    matches = [];
    tournament.bracket = null;
    tournament.status = 'setup';
    tournament.placements = {};
    localStorage.removeItem('tournamentHistory');
    localStorage.removeItem('undoneTransactions');

    players.forEach(player => {
        player.eliminated = false;
        player.placement = null;
        // Clear player statistics
        player.stats = { shortLegs: [], highOuts: [], tons: 0, oneEighties: 0 };
    });

    saveTournamentOnly(); // Save tournament but not config

    if (typeof clearBracket === 'function') {
        clearBracket();
    }

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }

    // Refresh the results display after reset (with delay to ensure DOM updates)
    if (typeof displayResults === 'function') {
        setTimeout(() => {
            displayResults();
        }, 100);
    }

    // Refresh Match Controls if it's open to show new SETUP state
    if (document.getElementById('matchCommandCenterModal') &&
        document.getElementById('matchCommandCenterModal').style.display === 'flex' &&
        typeof showMatchCommandCenter === 'function') {
        setTimeout(() => {
            showMatchCommandCenter();
        }, 100);
    }

    alert(`✓ Tournament "${tournamentName}" has been reset successfully.\n\nYou can now generate a new bracket using Match Controls.`);
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

    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            processImportedTournament(importedData);
        } catch (error) {
            showImportStatus('error', 'Invalid JSON file. Please check the file format.');
            console.error('JSON parse error:', error);
        }
    };

    reader.onerror = function () {
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
        showImportOverwriteModal(importedData);
        return; // Exit here, modal will handle the decision
    }

    // No existing tournament, proceed with import
    continueImportProcess(importedData);
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
        if (tournament) {
            watermark.innerHTML = `Tournament: <strong>${tournament.name}</strong> - ${tournament.date}`;
        } else {
            watermark.innerHTML = 'Tournament: <strong>None</strong>';
        }
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.showResetTournamentModal = showResetTournamentModal;
    window.confirmReset = confirmReset;
    window.showDeleteTournamentModal = showDeleteTournamentModal;
    window.confirmDeleteTournament = confirmDeleteTournament;
    window.showImportOverwriteModal = showImportOverwriteModal;
    window.confirmOverwriteTournament = confirmOverwriteTournament;
    window.showLoadTournamentModal = showLoadTournamentModal;
    window.confirmLoadTournament = confirmLoadTournament;
}
