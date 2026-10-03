// player-management.js - Player Operations and Statistics

// PLAYER LIST (Registry) - localStorage management
function getPlayerList() {
    const stored = localStorage.getItem('playerList');
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Failed to parse playerList — treating as empty:', e);
        return [];
    }
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
        if (typeof renderPlayerList === 'function') {
            renderPlayerList();
        }
    }
}

function removeFromPlayerList(playerName) {
    const playerList = getPlayerList();
    const filtered = playerList.filter(name => name.toLowerCase() !== playerName.toLowerCase());
    savePlayerList(filtered);
    console.log(`[Player List] Removed: ${playerName}`);

    // Update UI
    if (typeof renderPlayerList === 'function') {
        renderPlayerList();
    }
}

// TAB SWITCHING
// Update Registration Page Layout based on tournament state
function updateRegistrationPageLayout() {
    const playerListSection = document.getElementById('playerListSection');
    const tournamentResultsSection = document.getElementById('tournamentResultsSection');
    if (!playerListSection || !tournamentResultsSection) return;

    // Before the draw: players wide, payment and saved players beside them.
    // After it: the Leaderboard wide, payments locked.
    const tournamentStarted = !!(tournament && tournament.bracket && matches.length > 0);
    playerListSection.style.display = tournamentStarted ? 'none' : '';
    tournamentResultsSection.style.display = tournamentStarted ? '' : 'none';

    const cols = document.getElementById('registrationCols');
    if (cols) cols.classList.toggle('rg-running', tournamentStarted);
    const addRow = document.getElementById('playerAddRow');
    if (addRow) addRow.hidden = tournamentStarted || !tournament;
    const hint = document.getElementById('registrationPlayersHint');
    if (hint) hint.textContent = !tournament ? '' : tournamentStarted ? 'payments locked' : 'click a player to toggle paid';
    const subtitle = document.getElementById('registrationSubtitle');
    if (subtitle) {
        subtitle.textContent = !tournamentStarted ? 'Add the players, and mark who has paid.'
            : tournament.status === 'completed' ? 'The tournament is over. Click a player in the Leaderboard to correct statistics.'
            : 'The bracket is drawn: payments are locked, and the Leaderboard is live.';
    }
    updatePlayerCount();
}

/**
 * Fill the Registration page's next step: what to do now and the button for it. Before
 * the draw it follows the paid count against the formats' player limits; after it, the
 * matches still to play.
 * @returns {void}
 */
function renderRegistrationNext() {
    const title = document.getElementById('registrationNextTitle');
    const hint = document.getElementById('registrationNextHint');
    const btn = document.getElementById('registrationNextBtn');
    if (!title || !hint || !btn) return;

    const paid = players.filter(p => p.paid).length;
    const unpaid = players.length - paid;
    const started = !!(tournament && tournament.bracket && matches.length > 0);
    const formats = typeof getVisibleFormats === 'function' ? getVisibleFormats() : [];
    const minPlayers = formats.length ? Math.min(...formats.map(f => f.minPlayers)) : 4;
    const maxPlayers = formats.length ? Math.max(...formats.map(f => f.maxPlayers)) : 32;

    let text = ['Draw the bracket', `Only paid players go into the bracket. ${unpaid ? `${unpaid} still unpaid.` : 'Everyone has paid.'}`];
    let button = ['Open bracket →', "showPage('tournament')"];
    let enabled = true;
    if (!tournament) {
        text = ['No tournament loaded', 'Create or load one on the Setup page.'];
        button = ['Go to Setup →', "showPage('setup')"];
    } else if (started && tournament.status === 'completed') {
        text = ['Tournament completed', 'Final standings are in the Leaderboard.'];
    } else if (started) {
        const toGo = matches.filter(m => !m.completed).length;
        const live = matches.filter(m => getMatchState(m) === 'live').length;
        text = ['Run the matches', `${toGo} match${toGo === 1 ? '' : 'es'} to go${live ? `, ${live} being played now` : ''}.`];
    } else if (paid < minPlayers) {
        const needed = minPlayers - paid;
        text = [`Register at least ${minPlayers} paid players`, `${needed} more paid player${needed > 1 ? 's' : ''} needed before the draw.`];
        enabled = false;
    } else if (paid > maxPlayers) {
        text = ['Too many paid players', `A bracket holds at most ${maxPlayers} players, and ${paid} have paid.`];
        enabled = false;
    }

    title.textContent = text[0];
    hint.textContent = text[1];
    btn.textContent = button[0];
    btn.setAttribute('onclick', button[1]);
    btn.disabled = !enabled;
}

/**
 * Fill the Registration page's Saved players: the saved names not in this tournament, as
 * chips. Click a name to add the player; × deletes the name from the saved list.
 * @returns {void}
 */
function renderPlayerList() {
    const playerList = getPlayerList();
    const container = document.getElementById('playerListContainer');
    const countSpan = document.getElementById('playerListCount');
    if (!container) return;

    const tournamentPlayerNames = new Set(players.map(p => p.name.toLowerCase()));
    const availablePlayers = playerList
        .filter(name => !tournamentPlayerNames.has(name.toLowerCase()))
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    if (countSpan) countSpan.textContent = availablePlayers.length ? `${availablePlayers.length} not in this tournament` : '';

    if (playerList.length === 0) {
        container.innerHTML = '<div class="st-empty"><span>No saved players yet. Everyone you add is saved here for next time.</span></div>';
        return;
    }
    if (availablePlayers.length === 0) {
        container.innerHTML = '<div class="st-empty"><span>Everyone on the list is in the tournament.</span></div>';
        return;
    }

    // Per-render lookup: click handlers reference entries by numeric index so a
    // player's name is never passed through an inline handler string. (HTML-escaping
    // a name does not make it safe inside onclick="fn('…')" — see escapeHtml note.)
    const cardActions = [];
    const canAdd = !!tournament;
    container.innerHTML = availablePlayers.map(name => {
        const idx = cardActions.push({ name }) - 1;
        const safe = escapeHtml(name);
        return `<span class="rg-chip"><button type="button" class="rg-chip-add" data-pl-idx="${idx}"${canAdd ? ` title="Add ${safe} to the tournament"` : ' disabled'}>${safe}</button><button type="button" class="rg-chip-del" data-pl-delete="${idx}" title="Delete ${safe} from saved players" aria-label="Delete ${safe} from saved players">×</button></span>`;
    }).join('');

    // One delegated click listener (attached once). Reads the numeric index from the
    // clicked button and dispatches via the current render's lookup — no user text is
    // ever placed in an inline handler.
    renderPlayerList._cardActions = cardActions;
    if (!container._plDelegated) {
        container._plDelegated = true;
        container.addEventListener('click', (e) => {
            const actions = renderPlayerList._cardActions || [];
            const delBtn = e.target.closest('[data-pl-delete]');
            if (delBtn) {
                const entry = actions[parseInt(delBtn.getAttribute('data-pl-delete'), 10)];
                if (entry) deleteFromPlayerList(entry.name);
                return;
            }
            const addBtn = e.target.closest('[data-pl-idx]');
            if (!addBtn || addBtn.disabled) return;
            const entry = actions[parseInt(addBtn.getAttribute('data-pl-idx'), 10)];
            if (entry) addPlayerFromList(entry.name);
        });
    }
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
        paid: config && config.ui && config.ui.defaultPaid ? true : false,
        stats: {
            shortLegs: [],
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
    renderPlayerList();

    console.log(`[Player List] Added ${playerName} to tournament from Player List`);
}

// DELETE FROM PLAYER LIST
function deleteFromPlayerList(playerName) {
    if (!confirm(`Remove "${playerName}" from Saved Players?\n\nThis permanently deletes them from your saved players list.`)) {
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

            // Keep only valid, non-empty string names — a single number/object would brick
            // renderPlayerList() at name.toLowerCase() and leave Registration broken.
            const importedList = data.playerList.filter(n => typeof n === 'string' && n.trim());

            if (importedList.length === 0) {
                alert('This file doesn\'t contain any valid player names.');
                return;
            }

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
    renderPlayerList();
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

/**
 * Adds a new player to the tournament from form input.
 * Blocked if tournament bracket already exists.
 *
 * @returns {void}
 *
 * @description
 * - Reads player name from DOM input element
 * - Validates name is not empty and not duplicate
 * - Creates player object with default stats and unpaid status
 * - Auto-adds to Saved Players list
 * - Updates UI and saves tournament
 */
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
        paid: config && config.ui && config.ui.defaultPaid ? true : false,
        stats: {
            shortLegs: [],
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

    // Re-render Player List to show updated state
    renderPlayerList();

}

/**
 * Removes a player from the tournament by ID.
 * Blocked if tournament bracket already exists.
 *
 * @param {number} playerId - The player ID to remove
 * @returns {void}
 *
 * @description
 * - Filters player from global players array
 * - Updates UI displays and saves tournament
 * - Re-renders Player List
 */
function removePlayer(playerId) {
    // Check if tournament is in progress (bracket exists)
    if (tournament && tournament.bracket && matches.length > 0) {
        showTournamentProgressWarning();
        return;
    }

    players = players.filter(p => p.id !== playerId);
    updatePlayersDisplay();
    updatePlayerCount();
    saveTournament();
    updateResultsTable();

    // Re-render Player List to show updated state
    renderPlayerList();
}

/**
 * Toggles a player's paid status.
 * Blocked if tournament is active or completed.
 *
 * @param {number} playerId - The player ID to toggle
 * @returns {void}
 *
 * @description
 * - Flips player.paid boolean value
 * - Updates UI displays and saves tournament
 * - Re-renders Player List with new sort order
 * - Shows help hint when 4 players are paid
 */
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

        // Re-render Player List to show updated payment status and re-sort
        renderPlayerList();

    }
}

function openStatsModal(playerId) {
    // Silent early return for read-only tournaments - clicking does nothing
    if (tournament && tournament.readOnly) {
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    currentStatsPlayer = player;
    document.getElementById('statsPlayerName').textContent = `Edit ${player.name}'s statistics`;

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
    container.replaceChildren();
    if (!currentStatsPlayer || !Array.isArray(currentStatsPlayer.stats.highOuts)) return;

    currentStatsPlayer.stats.highOuts.forEach((score, index) => {
        container.appendChild(_buildStatListItem(score, () => removeHighOut(index)));
    });
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

function closeStatsModal() {
    currentStatsPlayer = null;
    popDialog(); // Use dialog stack to close and restore parent
}

function updatePlayersDisplay() {
    const container = document.getElementById('playersContainer');
    if (!container) return;

    const tournamentStarted = !!(tournament && tournament.bracket && matches.length > 0);
    const lateRegBtn = document.getElementById('lateRegBtnContainer');
    if (lateRegBtn) {
        lateRegBtn.innerHTML = tournamentStarted
            ? '<span>Someone arrived after the draw?</span><button type="button" class="st-link" onclick="showLateRegInfoModal()">Player arrived late?</button>'
            : '';
    }

    if (players.length === 0) {
        container.innerHTML = `<div class="st-empty st-small"><span>${tournament ? 'No players yet. Add them above, or from Saved players.' : 'No tournament loaded.'}</span></div>`;
        return;
    }

    // Alphabetical (case-insensitive). Before the draw a row toggles paid and an unpaid
    // player can be removed; after it the list is locked, so rows get neither.
    const sortedPlayers = [...players].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    container.innerHTML = sortedPlayers.map(player => {
        const pill = player.paid
            ? (tournamentStarted ? '' : '<span class="rg-paid rg-yes">Paid</span>')
            : '<span class="rg-paid rg-no">Unpaid</span>';
        const removeButton = !player.paid && !tournamentStarted
            ? `<button type="button" class="rg-x" title="Remove ${escapeHtml(player.name)}" aria-label="Remove ${escapeHtml(player.name)}" onclick="event.stopPropagation(); removePlayer(${player.id})">×</button>`
            : '';
        const toggle = tournamentStarted ? '' : ` onclick="togglePaid(${player.id})" title="Click to mark ${player.paid ? 'unpaid' : 'paid'}"`;
        return `<div class="rg-prow"${toggle}><span class="rg-name">${escapeHtml(player.name)}</span><span class="rg-right">${pill}${removeButton}</span></div>`;
    }).join('');
}

function showLateRegInfoModal() {
    const developerMode = isDeveloperMode();

    const firstPara = document.getElementById('lateRegInfoFirstPara');
    if (firstPara) {
        firstPara.innerHTML = developerMode
            ? 'To register a late arrival, open the <strong>Developer Console</strong> from the <strong>Console</strong> link in the Tournament Bracket header.'
            : 'To register a late arrival, enable the <strong>Developer Console</strong> in <strong>Global Settings</strong>, then open it from the <strong>Console</strong> link in the Tournament Bracket header.';
    }

    pushDialog('lateRegInfoModal', null, true);
}

/**
 * Update the Registration page's Players / Paid / Unpaid counts and its next step.
 * Called whenever players or their payments change, and when the page is shown.
 * @returns {void}
 */
function updatePlayerCount() {
    const totalPlayers = players.length;
    const paidPlayers = players.filter(p => p.paid).length;
    const total = document.getElementById('playerCount');
    const paid = document.getElementById('paidCount');
    const unpaid = document.getElementById('unpaidCount');
    if (total) total.textContent = totalPlayers;
    if (paid) paid.textContent = paidPlayers;
    if (unpaid) {
        unpaid.textContent = totalPlayers - paidPlayers;
        unpaid.classList.toggle('rg-warn', totalPlayers > paidPlayers);
    }
    renderRegistrationNext();
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
    container.replaceChildren();
    if (!currentStatsPlayer || !Array.isArray(currentStatsPlayer.stats.shortLegs)) return;

    currentStatsPlayer.stats.shortLegs.forEach((darts, index) => {
        container.appendChild(_buildStatListItem(darts, () => removeShortLeg(index)));
    });
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

function incrementLollipops() {
    if (!currentStatsPlayer) return;
    currentStatsPlayer.stats.lollipops = (currentStatsPlayer.stats.lollipops || 0) + 1;
    updateStatsCounters();
}

function decrementLollipops() {
    if (!currentStatsPlayer) return;
    const current = currentStatsPlayer.stats.lollipops || 0;
    if (current > 0) {
        currentStatsPlayer.stats.lollipops = current - 1;
        updateStatsCounters();
    }
}

function updateStatsCounters() {
    const current180s = currentStatsPlayer?.stats.oneEighties || 0;
    const currentTons = currentStatsPlayer?.stats.tons || 0;
    const currentLollipops = currentStatsPlayer?.stats.lollipops || 0;

    document.getElementById('current180sCount').textContent = current180s;
    document.getElementById('currentTonsCount').textContent = currentTons;
    document.getElementById('currentLollipopsCount').textContent = currentLollipops;
}

/**
 * Build a chip-style list item. The whole chip is a button — click anywhere
 * on it to remove. Hover turns red to signal the destructive action.
 */
function _buildStatListItem(value, onRemove) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'stat-list-item';
    chip.title = 'Click to remove';
    chip.onclick = onRemove;

    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    chip.appendChild(valueSpan);

    const xSpan = document.createElement('span');
    xSpan.className = 'stat-list-item__x';
    xSpan.textContent = '×';
    chip.appendChild(xSpan);

    return chip;
}
