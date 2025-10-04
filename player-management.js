// player-management.js - Player Operations and Statistics

// PLAYER LIST (Registry) - localStorage management
function getPlayerList() {
    const stored = localStorage.getItem('playerList');
    return stored ? JSON.parse(stored) : [];
}

function savePlayerList(playerList) {
    localStorage.setItem('playerList', JSON.stringify(playerList));
}

function addToPlayerList(playerName) {
    const playerList = getPlayerList();
    const normalizedName = playerName.trim();

    // Case-insensitive duplicate check
    const exists = playerList.some(name => name.toLowerCase() === normalizedName.toLowerCase());

    if (!exists) {
        playerList.push(normalizedName);
        savePlayerList(playerList);
        console.log(`[Player List] Added: ${normalizedName}`);

        // Update UI if Player List tab is visible
        if (typeof renderPlayerListTab === 'function') {
            renderPlayerListTab();
        }
    }
}

function removeFromPlayerList(playerName) {
    const playerList = getPlayerList();
    const filtered = playerList.filter(name => name.toLowerCase() !== playerName.toLowerCase());
    savePlayerList(filtered);
    console.log(`[Player List] Removed: ${playerName}`);

    // Update UI
    if (typeof renderPlayerListTab === 'function') {
        renderPlayerListTab();
    }
}

// TAB SWITCHING
function switchRegistrationTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.registration-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    const tournamentTab = document.getElementById('tournamentTab');
    const playerListTab = document.getElementById('playerListTab');

    if (tabName === 'tournament') {
        tournamentTab.classList.add('active');
        tournamentTab.style.display = 'block';
        playerListTab.classList.remove('active');
        playerListTab.style.display = 'none';
    } else {
        playerListTab.classList.add('active');
        playerListTab.style.display = 'block';
        tournamentTab.classList.remove('active');
        tournamentTab.style.display = 'none';

        // Render Player List when switching to it
        renderPlayerListTab();
    }
}

// RENDER PLAYER LIST TAB
function renderPlayerListTab() {
    const playerList = getPlayerList();
    const container = document.getElementById('playerListContainer');
    const countSpan = document.getElementById('playerListCount');

    // Update count
    countSpan.textContent = `Player List (${playerList.length})`;

    // Check if no players
    if (playerList.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">No players yet. Add players above to build your list.</p>';
        return;
    }

    // Sort player list alphabetically (case-insensitive)
    const sortedPlayerList = [...playerList].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // Get current tournament players for comparison
    const tournamentPlayerNames = players.map(p => p.name.toLowerCase());

    // Render player list items
    const html = sortedPlayerList.map(playerName => {
        const isInTournament = tournamentPlayerNames.includes(playerName.toLowerCase());
        const itemClass = isInTournament ? 'player-list-item in-tournament' : 'player-list-item';

        let buttons;
        if (isInTournament) {
            // Show remove button
            buttons = `<button class="player-list-remove-btn" onclick="removePlayerFromTournament('${playerName}')">- Remove</button>`;
        } else {
            // Show add and delete buttons
            buttons = `
                <button class="player-list-add-btn" onclick="addPlayerFromList('${playerName}')">+ Add</button>
                <button class="player-list-delete-btn" onclick="deleteFromPlayerList('${playerName}')">× Delete</button>
            `;
        }

        return `
            <div class="${itemClass}">
                <div class="player-list-item-name">
                    ${isInTournament ? '<span class="checkmark">✓</span>' : ''}
                    <span>${playerName}</span>
                </div>
                <div class="player-list-item-actions">
                    ${buttons}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// ADD PLAYER FROM PLAYER LIST TO TOURNAMENT
function addPlayerFromList(playerName) {
    // Check if tournament is in progress
    if (tournament && tournament.bracket && matches.length > 0) {
        showTournamentProgressWarning();
        return;
    }

    // Check if player already in tournament
    if (players.find(p => p.name.toLowerCase() === playerName.toLowerCase())) {
        alert('Player already in tournament');
        return;
    }

    // Add player to tournament
    const player = {
        id: Date.now(),
        name: playerName,
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

    updatePlayersDisplay();
    updatePlayerCount();
    saveTournament();
    updateResultsTable();

    // Re-render Player List to show updated state
    renderPlayerListTab();

    console.log(`[Player List] Added ${playerName} to tournament from Player List`);
}

// REMOVE PLAYER FROM TOURNAMENT (via Player List tab)
function removePlayerFromTournament(playerName) {
    const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!player) return;

    // Use existing removePlayer function
    removePlayer(player.id);

    // Re-render Player List to show updated state
    renderPlayerListTab();
}

// DELETE FROM PLAYER LIST
function deleteFromPlayerList(playerName) {
    if (!confirm(`Delete "${playerName}" from Player List?\n\nThis will NOT remove them from the current tournament.`)) {
        return;
    }

    removeFromPlayerList(playerName);
}

// IMPORT PLAYER LIST FROM FILE
function importPlayerListFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileContent = await file.text();
            const data = JSON.parse(fileContent);

            // Check if file contains playerList
            if (!data.playerList || !Array.isArray(data.playerList) || data.playerList.length === 0) {
                alert('This file doesn\'t contain a Player List.');
                return;
            }

            const importedList = data.playerList;
            const currentList = getPlayerList();

            // Show import dialog
            showImportPlayerListDialog(importedList, currentList);

        } catch (error) {
            console.error('Error importing Player List:', error);
            alert('Error reading file. Please check the file format.');
        }
    };

    input.click();
}

// SHOW IMPORT PLAYER LIST DIALOG
function showImportPlayerListDialog(importedList, currentList) {
    // Calculate new players
    const currentNamesLower = currentList.map(n => n.toLowerCase());
    const newPlayers = importedList.filter(name => !currentNamesLower.includes(name.toLowerCase()));

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Import Player List</h3>
            <p>Found <strong>${importedList.length}</strong> players in this file.</p>
            <p>Your current Player List has <strong>${currentList.length}</strong> players.</p>
            <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 10px;">
                    <input type="radio" name="importMode" value="merge" checked>
                    Add new players only (merge - adds ${newPlayers.length} new players)
                </label>
                <label style="display: block;">
                    <input type="radio" name="importMode" value="replace">
                    Replace entire Player List
                </label>
            </div>
            <div style="text-align: right; margin-top: 20px;">
                <button class="btn" onclick="closeImportDialog()">Cancel</button>
                <button class="btn btn-success" onclick="confirmImportPlayerList()">Import</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Store data for import confirmation
    window._importPlayerListData = {
        importedList: importedList,
        modal: modal
    };
}

// CONFIRM IMPORT PLAYER LIST
function confirmImportPlayerList() {
    const data = window._importPlayerListData;
    if (!data) return;

    const mode = document.querySelector('input[name="importMode"]:checked').value;
    const importedList = data.importedList;

    if (mode === 'replace') {
        // Replace entire list
        savePlayerList(importedList);
        console.log(`[Player List] Replaced with ${importedList.length} players`);
    } else {
        // Merge - add new players only
        const currentList = getPlayerList();
        const currentNamesLower = currentList.map(n => n.toLowerCase());
        const newPlayers = importedList.filter(name => !currentNamesLower.includes(name.toLowerCase()));

        const mergedList = [...currentList, ...newPlayers];
        savePlayerList(mergedList);
        console.log(`[Player List] Merged - added ${newPlayers.length} new players`);
    }

    // Close dialog and refresh UI
    closeImportDialog();
    renderPlayerListTab();
    alert('✓ Player List imported successfully!');
}

// CLOSE IMPORT DIALOG
function closeImportDialog() {
    const data = window._importPlayerListData;
    if (data && data.modal) {
        data.modal.remove();
    }
    delete window._importPlayerListData;
}

// UPDATE: Enhanced addPlayer function with help integration
function addPlayer() {
    // Check if tournament is in progress (bracket exists)
    if (tournament && tournament.bracket && matches.length > 0) {
        showTournamentProgressWarning();
        return;
    }
    
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

    // Auto-add to Player List
    addToPlayerList(name);

    updatePlayersDisplay();
    updatePlayerCount();
    saveTournament();
    updateResultsTable();

    // HELP SYSTEM INTEGRATION
    const paidPlayers = players.filter(p => p.paid).length;
    if (paidPlayers === 4 && !tournament.bracket && typeof showHelpHint === 'function') {
        showHelpHint('You now have enough players to generate a bracket! Go to Tournament page.', 4000);
    } else if (paidPlayers < 4 && typeof showHelpHint === 'function') {
        const needed = 4 - paidPlayers;
        showHelpHint(`Need ${needed} more paid player${needed > 1 ? 's' : ''} to generate bracket.`, 3000);
    }
}

function removePlayer(playerId) {
    // Check if tournament is in progress (bracket exists)
    if (tournament && tournament.bracket && matches.length > 0) {
        showTournamentProgressWarning();
        return;
    }
    
    if (confirm('Are you sure you want to remove this player?')) {
        players = players.filter(p => p.id !== playerId);
        updatePlayersDisplay();
        updatePlayerCount();
        saveTournament();
        updateResultsTable();
    }
}

// UPDATE: Enhanced player paid toggle with help integration
function togglePaid(playerId) {
    // Prevent changes if tournament is active or completed
    if (tournament && (tournament.status === 'active' || tournament.status === 'completed')) {
        showTournamentProgressWarning();
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (player) {
        player.paid = !player.paid;
        updatePlayersDisplay();
        updatePlayerCount();
        saveTournament();
        updateResultsTable();

        // HELP SYSTEM INTEGRATION
        const paidPlayers = players.filter(p => p.paid).length;
        if (paidPlayers === 4 && !tournament.bracket && typeof showHelpHint === 'function') {
            showHelpHint('Great! You now have 4 paid players. Ready to generate bracket!', 4000);
        }
    }
}

function openStatsModal(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    currentStatsPlayer = player;
    document.getElementById('statsPlayerName').textContent = `${player.name} - Statistics`;

    // Clear input fields when opening modal
    document.getElementById('statsShortLegDarts').value = '';
    document.getElementById('statsHighOut').value = '';

    // Convert old format to new format if needed
    if (typeof player.stats.shortLegs === 'number') {
        player.stats.shortLegs = [];
    }

    // Update counters instead of input values
    updateStatsCounters();
    updateShortLegsList();
    updateHighOutsList();

    // Use dialog stack to show modal with automatic parent hiding/restoration
    pushDialog('statsModal', null, true); // No restore function needed - this is a leaf dialog
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

    // Remove these lines - no longer needed:
    // currentStatsPlayer.stats.tons = parseInt(document.getElementById('statsTons').value) || 0;
    // currentStatsPlayer.stats.oneEighties = parseInt(document.getElementById('stats180s').value) || 0;

    updatePlayersDisplay();
    // Call saveTournament if it exists, otherwise just continue
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    // Refresh the results table dynamically
    if (typeof updateResultsTable === 'function') {
        updateResultsTable();

        // Also update the statistics table if the statistics modal is open
        const statisticsModal = document.getElementById('statisticsModal');
        if (statisticsModal && statisticsModal.style.display !== 'none') {
            updateResultsTable('statisticsTableBody');
        }
    }

    closeStatsModal();
}

// Simple fallback functions to prevent errors
function safeSaveTournament() {
    if (typeof saveTournament === 'function') {
        saveTournament();
    }
}

function closeStatsModal() {
    currentStatsPlayer = null;
    popDialog(); // Use dialog stack to close and restore parent
}

function updatePlayersDisplay() {
    const container = document.getElementById('playersContainer');
    
    if (players.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No players added yet</p>';
        return;
    }

    // Sort players alphabetically by name (case-insensitive, first character)
    const sortedPlayers = [...players].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return nameA.localeCompare(nameB);
    });

 const html = sortedPlayers.map(player => `
    <div class="player-card ${player.paid ? 'paid' : 'unpaid'}" onclick="togglePaid(${player.id})">
        <div class="player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-status">${player.paid ? 'Paid' : 'Unpaid'}</div>
        </div>
        <div class="player-actions">
            <button class="btn-small btn-danger" onclick="event.stopPropagation(); removePlayer(${player.id})">×</button>
        </div>
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

function addShortLeg() {
    const darts = parseInt(document.getElementById('statsShortLegDarts').value);
    if (!darts || darts < 9 || darts > 21) {
        alert('Please enter valid dart count (9-21)');
        return;
    }

    if (!Array.isArray(currentStatsPlayer.stats.shortLegs)) {
        currentStatsPlayer.stats.shortLegs = [];
    }

    currentStatsPlayer.stats.shortLegs.push(darts);
    document.getElementById('statsShortLegDarts').value = '';
    updateShortLegsList();
}

function updateShortLegsList() {
    const container = document.getElementById('shortLegsList');
    if (!currentStatsPlayer || !Array.isArray(currentStatsPlayer.stats.shortLegs)) {
        container.innerHTML = '';
        return;
    }

    const html = currentStatsPlayer.stats.shortLegs.map((darts, index) => `
        <span style="background: #f8f9fa; padding: 5px 10px; margin: 2px; border-radius: 3px; display: inline-block;">
            ${darts} <button onclick="removeShortLeg(${index})" style="background: none; border: none; color: red; cursor: pointer;">×</button>
        </span>
    `).join('');

    container.innerHTML = `<div style="margin-top: 10px;"><strong>Short Legs:</strong><br>${html}</div>`;
}

function removeShortLeg(index) {
    if (currentStatsPlayer && Array.isArray(currentStatsPlayer.stats.shortLegs)) {
        currentStatsPlayer.stats.shortLegs.splice(index, 1);
        updateShortLegsList();
    }
}

function increment180s() {
    if (!currentStatsPlayer) return;
    currentStatsPlayer.stats.oneEighties = (currentStatsPlayer.stats.oneEighties || 0) + 1;
    updateStatsCounters();
}

function decrement180s() {
    if (!currentStatsPlayer) return;
    const current = currentStatsPlayer.stats.oneEighties || 0;
    if (current > 0) {
        currentStatsPlayer.stats.oneEighties = current - 1;
        updateStatsCounters();
    }
}

function incrementTons() {
    if (!currentStatsPlayer) return;
    currentStatsPlayer.stats.tons = (currentStatsPlayer.stats.tons || 0) + 1;
    updateStatsCounters();
}

function decrementTons() {
    if (!currentStatsPlayer) return;
    const current = currentStatsPlayer.stats.tons || 0;
    if (current > 0) {
        currentStatsPlayer.stats.tons = current - 1;
        updateStatsCounters();
    }
}

function updateStatsCounters() {
    const current180s = currentStatsPlayer?.stats.oneEighties || 0;
    const currentTons = currentStatsPlayer?.stats.tons || 0;
    
    document.getElementById('current180sCount').textContent = `Current: ${current180s}`;
    document.getElementById('currentTonsCount').textContent = `Current: ${currentTons}`;
}
