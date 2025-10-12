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
        playerList: getPlayerList(), // Include Player List backup
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

// Upload tournament file to server (bonus feature - file picker based)
async function uploadTournamentFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Read file content
        const fileContent = await file.text();
        const tournamentData = JSON.parse(fileContent);

        const filename = file.name;

        const response = await fetch('/api/upload-tournament.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: filename,
                data: tournamentData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
            return;
        }

        const result = await response.json();
        alert(`✓ Tournament uploaded to server successfully!\n\n${filename}`);

        // Reload tournament list to show newly uploaded tournament
        if (typeof loadRecentTournaments === 'function') {
            loadRecentTournaments();
        }

        // Clear file input
        event.target.value = '';

    } catch (error) {
        console.error('Error uploading tournament:', error);
        alert('Error uploading tournament to server: ' + error.message);
    }
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
        readOnly: tournament.readOnly, // ✅ Fixed: Include readOnly flag
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

    // Update CAD-style information box whenever tournament is saved
    if (typeof updateTournamentWatermark === 'function') {
        updateTournamentWatermark();
    }

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

// SHARED TOURNAMENTS (SERVER FEATURE)
// Attempts to load tournaments from server - fails silently if not available
async function loadSharedTournaments() {
    console.log('[Shared Tournaments] Attempting to load from server...');
    try {
        const response = await fetch('/api/list-tournaments.php', {
            method: 'GET',
            cache: 'no-cache'
        });

        console.log('[Shared Tournaments] Response status:', response.status);

        if (!response.ok) {
            console.log('[Shared Tournaments] Server endpoint not available (status:', response.status, ')');
            return null;
        }

        const data = await response.json();
        console.log('[Shared Tournaments] Data received:', data);

        // If successful, show the upload button
        const uploadBtn = document.getElementById('uploadToServerBtn');
        console.log('[Shared Tournaments] Upload button element:', uploadBtn);
        if (uploadBtn) {
            uploadBtn.style.display = 'inline-block';
            console.log('[Shared Tournaments] Upload button shown');
        }

        console.log('[Shared Tournaments] Returning', data.tournaments?.length || 0, 'tournaments');
        return data.tournaments || [];

    } catch (error) {
        console.log('[Shared Tournaments] Error:', error.message);
        return null;
    }
}

async function loadRecentTournaments() {
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const container = document.getElementById('recentTournaments');

    // Try to load shared tournaments from server
    const sharedTournaments = await loadSharedTournaments();

    // Build HTML sections
    let htmlSections = [];

    // Shared Tournaments Section (if available)
    if (sharedTournaments && sharedTournaments.length > 0) {
        // Sort by date (newest first)
        const sortedShared = sharedTournaments.sort((a, b) => {
            const dateA = new Date(a.date + 'T00:00:00');
            const dateB = new Date(b.date + 'T00:00:00');
            return dateB - dateA;
        });

        const sharedHtml = sortedShared.map(t => {
            const playerCount = t.players || '?';
            const allowDelete = config.server && config.server.allowSharedTournamentDelete;
            const deleteButton = allowDelete
                ? `<button class="btn btn-danger" style="padding: 5px 8px; font-size: 12px;" onclick="deleteSharedTournament('${t.filename}')">×</button>`
                : '';
            return `
                <div style="padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; background: #f0f8ff;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>
                            <strong>${t.name}</strong> (${t.date}) - ${playerCount}p
                        </span>
                        <div>
                            <button class="btn" style="padding: 5px 10px; font-size: 14px; margin-right: 5px;" onclick="loadSharedTournament('${t.filename}')">Load</button>
                            ${deleteButton}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        htmlSections.push(`
            <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #555;">Shared Tournaments</h3>
            ${sharedHtml}
        `);
    }

    // Local Tournaments Section
    if (tournaments.length === 0 && !sharedTournaments) {
        container.innerHTML = '<p>No tournaments found</p>';
        const toggleBtn = document.getElementById('toggleTournamentsBtn');
        if (toggleBtn) {
            toggleBtn.style.display = 'none';
        }
        return;
    }

    if (tournaments.length > 0) {
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

        const localHtml = tournamentsToShow.map(t => {
            const isActiveTournament = tournament && tournament.id === t.id;
            return `
                <div style="padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; ${isActiveTournament ? 'background: #e8f5e8;' : ''}">
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

        const headerText = sharedTournaments && sharedTournaments.length > 0 ?
            '<h3 style="margin-top: 20px; margin-bottom: 10px; font-size: 16px; color: #555;">My Tournaments</h3>' :
            '';

        htmlSections.push(`
            ${headerText}
            ${localHtml}
        `);

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

    container.innerHTML = htmlSections.join('');
}

function toggleTournamentView() {
    showingAllTournaments = !showingAllTournaments;
    loadRecentTournaments();
}

// Load shared tournament from server
async function loadSharedTournament(filename) {
    try {
        const response = await fetch(`/tournaments/${filename}`, {
            method: 'GET',
            cache: 'no-cache'
        });

        if (!response.ok) {
            alert('Failed to load shared tournament');
            return;
        }

        const tournamentData = await response.json();

        // Continue with same import logic as local tournaments
        continueImportProcess(tournamentData, filename);

    } catch (error) {
        console.error('Error loading shared tournament:', error);
        alert('Error loading shared tournament');
    }
}

// Delete shared tournament from server
async function deleteSharedTournament(filename) {
    if (!confirm(`Delete "${filename}" from server?\n\nThis cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete-tournament.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: filename })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(`Delete failed: ${errorData.error || 'Unknown error'}`);
            return;
        }

        const result = await response.json();
        alert(`✓ Tournament deleted from server`);

        // Reload tournament list
        if (typeof loadRecentTournaments === 'function') {
            loadRecentTournaments();
        }

    } catch (error) {
        console.error('Error deleting shared tournament:', error);
        alert('Error deleting tournament from server: ' + error.message);
    }
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
        players: selectedTournament.players || [],
        matches: selectedTournament.matches || [],
        bracket: selectedTournament.bracket,
        bracketSize: bracketSize,
        placements: selectedTournament.placements || {},
        readOnly: (selectedTournament.status === 'completed') // Read-only for completed tournaments
        // NO CONFIG loading - config stays global
    };

    console.log('DEBUG: tournament.bracketSize after assignment:', tournament.bracketSize);

    // Set global arrays from tournament object
    players = tournament.players;
    matches = tournament.matches;

    // Save tournament to ensure proper persistence
    saveTournamentOnly();

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
            bracketSize: bracketSize,
            readOnly: (importedData.status === 'completed') // Read-only for completed imports
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
        updateTournamentWatermark();
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
            resetBtn.style.background = '#fef3c7';
        } else {
            resetBtn.disabled = true;
            resetBtn.style.background = '';
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
    tournament.readOnly = false; // Clear read-only flag (escape hatch)
    localStorage.removeItem('tournamentHistory');
    localStorage.removeItem('undoneTransactions');

    // Reset bracket rendering flag for proper zoom/pan on new bracket
    if (typeof initialBracketRender !== 'undefined') {
        initialBracketRender = true;
    }

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
        // Get current tournament data from localStorage
        const currentTournamentData = localStorage.getItem('currentTournament');
        let tournament = null;

        if (currentTournamentData) {
            try {
                tournament = JSON.parse(currentTournamentData);
            } catch (e) {
                console.warn('Could not parse current tournament data');
            }
        }

        if (tournament) {
            // Truncate tournament name if needed
            const truncatedName = tournament.name.length > 38
                ? tournament.name.substring(0, 35) + "..."
                : tournament.name;

            // Calculate tournament statistics
            const players = tournament.players || [];
            const paidPlayers = players.filter(p => p.paid);
            const playerCount = paidPlayers.length;
            const bracketSize = tournament.bracketSize || 8;

            // Calculate total matches (excluding BYEs)
            const matches = tournament.matches || [];
            const realMatches = matches.filter(match =>
                match.player1 !== 'BYE' && match.player2 !== 'BYE'
            );
            const matchCount = realMatches.length;

            // Calculate completed matches
            const completedMatches = realMatches.filter(match => match.completed);
            const completedCount = completedMatches.length;

            // Determine tournament status using built-in tournament.status property
            let status = 'SETUP';  // default fallback
            if (tournament.status === 'setup') {
                status = 'SETUP';
            } else if (tournament.status === 'active') {
                status = 'ACTIVE';
            } else if (tournament.status === 'completed') {
                status = 'COMPLETE';
            }

            // Determine format display text
            let formatText = ` COMPLETED MATCHES: ${completedCount}`;
            if (tournament.status === 'completed') {
                // Find winner (1st place) from tournament.placements
                let winner = null;
                if (tournament.placements) {
                    // Find player ID with placement 1
                    const winnerID = Object.keys(tournament.placements).find(playerID =>
                        tournament.placements[playerID] === 1
                    );
                    if (winnerID) {
                        winner = players.find(p => String(p.id) === winnerID);
                    }
                }

                if (winner) {
                    const nameParts = winner.name.trim().split(' ');
                    let firstName = nameParts[0].toUpperCase();
                    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0].toUpperCase() : '';

                    // Truncate first name if needed to fit " WINNER: NAME L." in ~25 chars
                    // " WINNER: " = 9 chars, " L." = 3 chars, so 13 chars max for first name
                    if (lastInitial && firstName.length > 13) {
                        firstName = firstName.substring(0, 13);
                    } else if (!lastInitial && firstName.length > 16) {
                        // Single name gets more space
                        firstName = firstName.substring(0, 16);
                    }

                    const displayName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
                    formatText = ` WINNER: ${displayName}`;
                } else {
                    // Fallback if no winner found
                    formatText = `TOURNAMENT COMPLETE`;
                }
            }

            // Get app version
            const version = window.APP_VERSION || 'v2.0.3';

            // Check if developer mode is enabled (read directly from localStorage)
            const developerMode = (() => {
                try {
                    const savedConfig = localStorage.getItem('dartsConfig');
                    if (savedConfig) {
                        const parsed = JSON.parse(savedConfig);
                        return parsed.ui && parsed.ui.developerMode;
                    }
                } catch (e) {}
                return false;
            })();
            const versionStyle = developerMode ? 'cursor: pointer;' : '';
            const versionClick = developerMode ? 'onclick="openAnalyticsModal()"' : '';

            watermark.innerHTML = `
                <div class="cad-header"> ${truncatedName}</div>
                <div class="cad-grid">
                    <div class="cad-cell cad-format">${formatText}</div>
                    <div class="cad-cell cad-players">
                        <div>${playerCount}</div>
                        <div>PLAYERS</div>
                    </div>
                    <div class="cad-cell cad-bracket">${bracketSize}-BRACKET</div>
                    <div class="cad-cell cad-matches">${matchCount} MATCHES</div>
                    <div class="cad-cell cad-date">${tournament.date}</div>
                    <div class="cad-cell cad-version" style="${versionStyle}" ${versionClick}>v${version}</div>
                </div>
                <div class="cad-status">${status}</div>
            `;
        } else {
            // Check if developer mode is enabled (read directly from localStorage)
            const developerMode = (() => {
                try {
                    const savedConfig = localStorage.getItem('dartsConfig');
                    if (savedConfig) {
                        const parsed = JSON.parse(savedConfig);
                        return parsed.ui && parsed.ui.developerMode;
                    }
                } catch (e) {}
                return false;
            })();
            const versionStyle = developerMode ? 'cursor: pointer;' : '';
            const versionClick = developerMode ? 'onclick="openAnalyticsModal()"' : '';

            watermark.innerHTML = `
                <div class="cad-header">NO TOURNAMENT</div>
                <div class="cad-grid">
                    <div class="cad-cell cad-format">-</div>
                    <div class="cad-cell cad-players">
                        <div>0</div>
                        <div>PLAYERS</div>
                    </div>
                    <div class="cad-cell cad-bracket">-</div>
                    <div class="cad-cell cad-matches">-</div>
                    <div class="cad-cell cad-date">-</div>
                    <div class="cad-cell cad-version" style="${versionStyle}" ${versionClick}>v${window.APP_VERSION || '2.0.3'}</div>
                </div>
                <div class="cad-status">SETUP</div>
            `;
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
