// clean-bracket-rendering.js - Modernized rendering using lookup tables

// Zoom and pan variables
let zoomLevel = 0.6;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };

function initializeBracketControls() {
    const viewport = document.getElementById('bracketViewport');
    if (viewport) {
        viewport.addEventListener('wheel', handleZoom);
        viewport.addEventListener('mousedown', startDrag);
        viewport.addEventListener('mousemove', handleDrag);
        viewport.addEventListener('mouseup', endDrag);
        viewport.addEventListener('mouseleave', endDrag);
    }
}

function renderBracket() {
    const canvas = document.getElementById('bracketCanvas');
    if (!canvas) return;

    if (!tournament || !tournament.bracket) {
        document.getElementById('bracketMatches').innerHTML = '<p style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333;">No bracket generated yet</p>';
        return;
    }

    clearBracket();

    // UPDATE UNDO BUTTON STATE
    updateUndoButtonState();

    renderCleanBracket();
}

function clearBracket() {
    const matchesContainer = document.getElementById('bracketMatches');
    const linesContainer = document.getElementById('bracketLines');

    if (matchesContainer) {
        matchesContainer.innerHTML = '';
    }
    if (linesContainer) {
        linesContainer.innerHTML = '';
    }
}

function renderCleanBracket() {
    const bracketSize = tournament.bracketSize;

    // Get structure from our lookup tables instead of calculating
    const structure = getStructureFromLookupTables(bracketSize);

    // Define grid parameters
    const grid = {
        matchWidth: 200,
        matchHeight: 100,
        horizontalSpacing: 65,
        verticalSpacing: 60,
        canvasWidth: 3000,
        canvasHeight: 1200,
        centerX: 1500,
        centerY: 600,
        centerBuffer: 50
    };

    // Render all bracket sections
    renderFrontsideMatches(structure.frontside, grid);
    renderBacksideMatches(structure.backside, grid);
    renderFinalMatches(grid);

    // Add titles
    renderTitles(grid);
}

/**
 * GET STRUCTURE FROM LOOKUP TABLES
 * Extract bracket structure directly from our MATCH_PROGRESSION lookup tables
 */
function getStructureFromLookupTables(bracketSize) {
    if (!MATCH_PROGRESSION[bracketSize]) {
        console.error(`No progression rules for ${bracketSize}-player bracket`);
        return { frontside: [], backside: [] };
    }

    const progression = MATCH_PROGRESSION[bracketSize];
    const frontside = [];
    const backside = [];

    // Extract frontside structure from lookup table
    let frontsideRound = 1;
    while (true) {
        const roundMatches = Object.keys(progression).filter(id =>
            id.startsWith('FS-') && id.includes(`-${frontsideRound}-`)
        );

        if (roundMatches.length === 0) break;

        frontside.push({
            round: frontsideRound,
            matches: roundMatches.length
        });

        frontsideRound++;
    }

    // Extract backside structure from lookup table
    let backsideRound = 1;
    while (true) {
        const roundMatches = Object.keys(progression).filter(id =>
            id.startsWith('BS-') &&
            id.includes(`-${backsideRound}-`) &&
            !id.includes('FINAL')
        );

        if (roundMatches.length === 0) break;

        backside.push({
            round: backsideRound,
            matches: roundMatches.length
        });

        backsideRound++;
    }

    console.log(`Structure from lookup: Frontside ${frontside.length} rounds, Backside ${backside.length} rounds`);
    return { frontside, backside };
}

function renderFrontsideMatches(frontsideStructure, grid) {
    frontsideStructure.forEach((roundInfo, roundIndex) => {
        const frontsideMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === roundInfo.round
        );

        // Position: Center flowing RIGHT
        const roundX = grid.centerX + grid.centerBuffer + roundIndex * (grid.matchWidth + grid.horizontalSpacing);

        if (frontsideMatches.length === 1) {
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderMatch(frontsideMatches[0], roundX, matchY, 'frontside', roundIndex);
        } else {
            const totalNeededHeight = frontsideMatches.length * grid.matchHeight + (frontsideMatches.length - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);

            frontsideMatches.forEach((match, matchIndex) => {
                const matchY = startY + matchIndex * (grid.matchHeight + grid.verticalSpacing);
                renderMatch(match, roundX, matchY, 'frontside', roundIndex);
            });
        }
    });
}

function renderBacksideMatches(backsideStructure, grid) {
    backsideStructure.forEach((roundInfo, roundIndex) => {
        const backsideMatches = matches.filter(m =>
            m.side === 'backside' && m.round === roundInfo.round
        );

        if (backsideMatches.length === 0) return;

        // Position: Center flowing LEFT
        const roundX = grid.centerX - grid.centerBuffer - (roundIndex + 1) * (grid.matchWidth + grid.horizontalSpacing);

        if (backsideMatches.length === 1) {
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderMatch(backsideMatches[0], roundX, matchY, 'backside', roundIndex);
        } else {
            const totalNeededHeight = backsideMatches.length * grid.matchHeight + (backsideMatches.length - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);

            backsideMatches.forEach((match, matchIndex) => {
                const matchY = startY + matchIndex * (grid.matchHeight + grid.verticalSpacing);
                renderMatch(match, roundX, matchY, 'backside', roundIndex);
            });
        }
    });
}

function renderFinalMatches(grid) {
    const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
    const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');

    // Position finals to the FAR RIGHT
    const finalsX = grid.centerX + grid.centerBuffer + 4 * (grid.matchWidth + grid.horizontalSpacing) + 1.5 * grid.matchWidth;
    const backsideFinalY = grid.centerY - 80;
    const grandFinalY = grid.centerY + 80;

    if (backsideFinal) {
        renderMatch(backsideFinal, finalsX, backsideFinalY, 'final', 0);
    }

    if (grandFinal) {
        renderMatch(grandFinal, finalsX, grandFinalY, 'grand-final', 0);
    }
}

function renderMatch(match, x, y, section, roundIndex) {
    const matchElement = document.createElement('div');

    // Get match state
    const matchState = getMatchState(match);
    let stateClass = 'bracket-match';

    switch (matchState) {
        case 'pending':
            stateClass += ' match-pending';
            break;
        case 'ready':
            stateClass += ' match-ready';
            break;
        case 'live':
            stateClass += ' match-live active';
            break;
        case 'completed':
            stateClass += ' match-completed completed';
            break;
    }

    // Enhanced styling based on match importance
    if (match.id === 'GRAND-FINAL') {
        stateClass += ' grand-final-match';
    } else if (match.id === 'BS-FINAL') {
        stateClass += ' backside-final-match';
    } else if (section === 'frontside' && roundIndex >= 2) {
        stateClass += ' important-match';
    }

    matchElement.className = stateClass;
    matchElement.style.left = x + 'px';
    matchElement.style.top = y + 'px';
    matchElement.id = `bracket-match-${match.id}`;

    // Add round indicator
    let roundIndicator = '';
    if (section === 'frontside') {
        roundIndicator = `<span class="round-indicator">R${match.round}</span>`;
    } else if (section === 'backside') {
        roundIndicator = `<span class="round-indicator backside">B${match.round}</span>`;
    } else if (match.id === 'BS-FINAL') {
        roundIndicator = `<span class="round-indicator final">BS FINAL</span>`;
    } else if (match.id === 'GRAND-FINAL') {
        roundIndicator = `<span class="round-indicator grand">GRAND FINAL</span>`;
    }

    // Get button properties
    const buttonText = getMatchButtonText(matchState);
    const buttonDisabled = matchState === 'pending' || matchState === 'completed';
    const buttonColor = matchState === 'live' ? '#ff6b35' :
        matchState === 'completed' ? '#28a745' :
            matchState === 'pending' ? '#6c757d' : '#ddd';
    const buttonTextColor = matchState === 'live' || matchState === 'completed' ? 'white' : 'black';

    // Simplified lane options (basic 1-10 lanes)
    const laneOptions = Array.from({ length: 10 }, (_, i) => i + 1).map(lane =>
        `<option value="${lane}" ${match.lane === lane ? 'selected' : ''}>${lane}</option>`
    ).join('');

    matchElement.innerHTML = `
        <div class="match-header">
            <span>${match.id}</span>
            ${roundIndicator}
            <span class="match-info">
                L<select onchange="updateMatchLane('${match.id}', this.value)" 
                         style="background: white; border: 1px solid #ddd; font-size: 11px; width: 40px; padding: 2px;">
                    <option value="">No</option>
                    ${laneOptions}
                </select> | Bo${match.legs}
            </span>
        </div>
        <div class="match-players">
            <div class="match-player ${match.player1?.isBye ? 'bye' : 'first-throw'} ${match.winner?.id === match.player1?.id ? 'winner' : ''}"
                 onclick="${getPlayerClickHandler(match, 1, matchState)}">
                <span class="player-name-short">${getPlayerDisplayName(match.player1)}</span>
                ${match.winner?.id === match.player1?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
            <div class="match-player ${match.player2?.isBye ? 'bye' : ''} ${match.winner?.id === match.player2?.id ? 'winner' : ''}"
                 onclick="${getPlayerClickHandler(match, 2, matchState)}">
                <span class="player-name-short">${getPlayerDisplayName(match.player2)}</span>
                ${match.winner?.id === match.player2?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
        </div>
	<div class="match-controls">
    	    <span style="font-size: 9px; color: #666;">
        	    Ref: <select onchange="updateMatchReferee('${match.id}', this.value)" 
                     style="background: white; border: 1px solid #ddd; font-size: 9px; width: 60px; padding: 1px;">
            	    ${generateRefereeOptions(match.referee)}
        	    </select>
    	    </span>
    	    <button onclick="${getButtonClickHandler(matchState, match.id)}" 
            	    style="font-size: 9px; padding: 3px 6px; border: none; border-radius: 3px; 
                   	    background: ${buttonColor}; color: ${buttonTextColor}; 
                   	    ${buttonDisabled ? 'opacity: 0.6; cursor: not-allowed;' : 'cursor: pointer;'}"
            	    ${buttonDisabled ? 'disabled' : ''}>
        	    ${buttonText}
    	    </button>
	</div>
    `;

    document.getElementById('bracketMatches').appendChild(matchElement);
}

function renderTitles(grid) {
    // Remove any existing titles and watermark
    document.querySelectorAll('.bracket-title').forEach(title => title.remove());
    const existingWatermark = document.getElementById('tournament-watermark');
    if (existingWatermark) {
        existingWatermark.remove();
    }

    const frontsideTitle = document.createElement('div');
    frontsideTitle.className = 'bracket-title front';
    // frontsideTitle.textContent = 'FRONTSIDE';
    
    const backsideTitle = document.createElement('div');
    backsideTitle.className = 'bracket-title back';
    // backsideTitle.textContent = 'BACKSIDE';
    
    const finalsTitle = document.createElement('div');
    finalsTitle.className = 'bracket-title finals';
    // finalsTitle.textContent = 'FINALS';

    // Position titles
    const titleY = 100;
    
    frontsideTitle.style.position = 'absolute';
    frontsideTitle.style.left = (grid.centerX + grid.centerBuffer + 100) + 'px';
    frontsideTitle.style.top = titleY + 'px';
    
    backsideTitle.style.position = 'absolute';
    backsideTitle.style.left = (grid.centerX - grid.centerBuffer - 300) + 'px';
    backsideTitle.style.top = titleY + 'px';
    
    const finalsX = grid.centerX + grid.centerBuffer + 4 * (grid.matchWidth + grid.horizontalSpacing);
    finalsTitle.style.position = 'absolute';
    finalsTitle.style.left = (finalsX + 320) + 'px';
    finalsTitle.style.top = titleY + 'px';
    finalsTitle.style.fontSize = '28px';
    finalsTitle.style.color = '#ff6b35';

    // Watermark at bottom center
    const watermark = document.createElement('div');
    watermark.id = 'tournament-watermark';
    watermark.textContent = 'NewTon DC Tournament Manager';
    watermark.style.position = 'absolute';
    watermark.style.left = (grid.centerX - 150) + 'px';
    watermark.style.bottom = '30px';
    watermark.style.fontSize = '16px';
    watermark.style.color = 'rgba(17,24,39,0.3)';
    watermark.style.letterSpacing = '1px';
    watermark.style.pointerEvents = 'none';

    document.getElementById('bracketCanvas').appendChild(frontsideTitle);
    document.getElementById('bracketCanvas').appendChild(backsideTitle);
    document.getElementById('bracketCanvas').appendChild(finalsTitle);
    document.getElementById('bracketCanvas').appendChild(watermark);
}

// HELPER FUNCTIONS

function getMatchState(match) {
    if (!match) return 'pending';

    if (match.completed) return 'completed';
    if (match.active) return 'live';

    // Check if both players are ready
    if (canMatchStart && canMatchStart(match)) return 'ready';

    return 'pending';
}

function canMatchStart(match) {
    if (!match || !match.player1 || !match.player2) return false;

    const player1Valid = match.player1.name !== 'TBD' && !match.player1.isBye;
    const player2Valid = match.player2.name !== 'TBD' && !match.player2.isBye;

    return player1Valid && player2Valid;
}

function getMatchButtonText(matchState) {
    switch (matchState) {
        case 'pending': return 'Waiting';
        case 'ready': return 'Start';
        case 'live': return 'LIVE';
        case 'completed': return 'Done';
        default: return 'Unknown';
    }
}

function getPlayerDisplayName(player) {
    if (!player) return 'TBD';
    if (player.name === 'TBD') return 'TBD';
    if (player.isBye) return 'Walkover';
    return player.name || 'Unknown';
}

function getPlayerClickHandler(match, playerNumber, matchState) {
    if (matchState === 'live') {
        return `selectWinner('${match.id}', ${playerNumber})`;
    }
    return '';
}

function getButtonClickHandler(matchState, matchId) {
    if (matchState === 'pending' || matchState === 'completed') {
        return '';
    }

    const functionName = typeof toggleActiveWithValidation !== 'undefined' ?
        'toggleActiveWithValidation' : 'toggleActive';
    return `${functionName}('${matchId}')`;
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

// UNDO SYSTEM FUNCTIONS

/**
 * Get the most recent OPERATOR-COMPLETED history entry (skip walkovers)
 */
function getLastOperatorHistoryEntry() {
    const history = getTournamentHistory();

    // Find first entry that's a real player vs real player match
    for (const entry of history) {
        const description = entry.description;
        // Skip any matches involving walkovers or TBD players
        if (!description.includes('Walkover') && !description.includes('TBD')) {
            return entry;
        }
    }

    return null;
}

/**
 * Check if undo is available for operator actions only
 */
function canUndoOperatorAction() {
    return getLastOperatorHistoryEntry() !== null;
}

/**
 * Update undo button state based on OPERATOR history availability
 */
function updateUndoButtonState() {
    const undoBtn = document.getElementById('undoBtn');
    if (!undoBtn) return; // Button doesn't exist yet

    const canUndoNow = canUndoOperatorAction();
    const lastEntry = getLastOperatorHistoryEntry();

    if (canUndoNow && lastEntry) {
        undoBtn.disabled = false;
        undoBtn.style.opacity = '1';
        undoBtn.style.cursor = 'pointer';
        undoBtn.title = `Undo: ${lastEntry.description}`;
    } else {
        undoBtn.disabled = true;
        undoBtn.style.opacity = '0.6';
        undoBtn.style.cursor = 'not-allowed';
        undoBtn.title = 'No operator matches to undo';
    }
}

/**
 * Handle undo button click - COMPLETE IMPLEMENTATION
 */
function handleUndoClick() {
    const lastEntry = getLastOperatorHistoryEntry();

    if (!lastEntry) {
        alert('No operator matches available to undo');
        return;
    }

    // Show confirmation dialog
    const confirmMessage =
        `Undo Last Match\n\n` +
        `Match: ${lastEntry.description}\n` +
        `Completed: ${new Date(lastEntry.timestamp).toLocaleTimeString()}\n\n` +
        `⚠️ This will restore the tournament to its previous state\n\n` +
        `Are you sure?`;

    if (!confirm(confirmMessage)) {
        console.log('Undo cancelled by user');
        return;
    }

    // Perform the restore
    const success = restoreFromHistory(lastEntry);

    if (success) {
        console.log(`✓ Successfully undid: ${lastEntry.description}`);

        // Show success feedback
        alert(`✓ Undid: ${lastEntry.description}\n\nTournament restored to previous state.`);
    } else {
        console.error('Failed to restore from history');
        alert('❌ Failed to restore tournament state. Please try again.');
    }
}

/**
 * Restore tournament to a specific history state
 */
function restoreFromHistory(historyEntry) {
    try {
        console.log(`Restoring tournament from: ${historyEntry.description}`);

        // Validate history entry structure
        if (!historyEntry.state || !historyEntry.state.tournament || !historyEntry.state.players || !historyEntry.state.matches) {
            console.error('Invalid history entry structure');
            return false;
        }

        // Restore global state variables
        tournament = JSON.parse(JSON.stringify(historyEntry.state.tournament));
        players = JSON.parse(JSON.stringify(historyEntry.state.players));
        matches = JSON.parse(JSON.stringify(historyEntry.state.matches));

        console.log(`✓ Restored state: ${matches.filter(m => m.completed).length} completed matches`);

        // Remove the restored entry from history (it's now the current state)
        removeLastHistoryEntry();

        // Save current state to localStorage
        if (typeof saveTournament === 'function') {
            saveTournament();
        }

        // Refresh all UI components
        refreshTournamentUI();

        return true;

    } catch (error) {
        console.error('Error during restore operation:', error);
        return false;
    }
}

/**
 * Remove the most recent history entry (after successful restore)
 */
function removeLastHistoryEntry() {
    try {
        let history = getTournamentHistory();

        if (history.length > 0) {
            // Remove the first entry (most recent)
            history.shift();

            // Save updated history
            localStorage.setItem('tournamentHistory', JSON.stringify(history));

            console.log(`✓ Removed restored entry from history (${history.length} entries remaining)`);
        }
    } catch (error) {
        console.error('Error removing history entry:', error);
    }
}

/**
 * Refresh all tournament UI components after restore
 */
function refreshTournamentUI() {
    console.log('Refreshing tournament UI after restore...');

    try {
        // Update tournament status display
        if (typeof updateTournamentStatus === 'function') {
            updateTournamentStatus();
        }

        // Update players display and count
        if (typeof updatePlayersDisplay === 'function') {
            updatePlayersDisplay();
        }
        if (typeof updatePlayerCount === 'function') {
            updatePlayerCount();
        }

        // Re-render the bracket
        if (typeof renderBracket === 'function') {
            renderBracket();
        }

        // Update results table
        if (typeof displayResults === 'function') {
            displayResults();
        }

        // Refresh lane dropdowns if available
        if (typeof refreshAllLaneDropdowns === 'function') {
            setTimeout(refreshAllLaneDropdowns, 100);
        }

        console.log('✓ UI refresh completed');

    } catch (error) {
        console.error('Error during UI refresh:', error);
    }
}

/**
 * Generate referee dropdown options from all players
 */
function generateRefereeOptions(currentRefereeId = null) {
    let options = '<option value="">None</option>';

    if (typeof players !== 'undefined' && Array.isArray(players)) {
        const paidPlayers = players.filter(player => player.paid);
        paidPlayers.forEach(player => {
            const selected = currentRefereeId && String(currentRefereeId) === String(player.id) ? 'selected' : '';
            const playerName = player.name.length > 8 ? player.name.substring(0, 8) + '...' : player.name;
            options += `<option value="${player.id}" ${selected}>${playerName}</option>`;
        });
    }

    return options;
}

/**
 * Update match referee assignment
 */
function updateMatchReferee(matchId, refereeId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    // Set referee ID (null if "None" selected)
    match.referee = refereeId ? parseInt(refereeId) : null;

    console.log(`Referee updated for ${matchId}: ${match.referee ? `Player ${refereeId}` : 'None'}`);

    // Save tournament if function exists
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    return true;
}

/**
 * Show tournament match details summary
 */
function showMatchDetails() {
    if (!matches || matches.length === 0) {
        alert('No matches available to show details for.');
        return;
    }

    const activeMatches = matches.filter(m => getMatchState(m) === 'live');
    const readyMatches = matches.filter(m => getMatchState(m) === 'ready');

    let details = '';

    // Show Live matches first (most important)
    if (activeMatches.length > 0) {
        details += `Live:\n`;
        activeMatches.forEach(match => {
            const lane = match.lane ? ` (Lane ${match.lane})` : '';
            details += `• ${match.id}: ${match.player1?.name} vs ${match.player2?.name}${lane}\n`;
        });
        details += '\n';
    }

    // Show Ready to start matches
    if (readyMatches.length > 0) {
        details += `Ready to start:\n`;
        readyMatches.forEach(match => {
            details += `• ${match.id}: ${match.player1?.name} vs ${match.player2?.name}\n`;
        });
        details += '\n';
    }

    // If no actionable matches, show summary
    if (activeMatches.length === 0 && readyMatches.length === 0) {
        const completedMatches = matches.filter(m => m.completed);
        const pendingMatches = matches.length - completedMatches.length;

        details = `No matches currently active or ready.\n\n`;
        details += `Completed: ${completedMatches.length}\n`;
        details += `Pending: ${pendingMatches}`;
    } else {
        // Remove trailing newline
        details = details.trim();
    }

    alert(details);
}


// Make functions globally available
if (typeof window !== 'undefined') {
    window.updateUndoButtonState = updateUndoButtonState;
    window.handleUndoClick = handleUndoClick;
    window.getLastOperatorHistoryEntry = getLastOperatorHistoryEntry;
    window.canUndoOperatorAction = canUndoOperatorAction;
    window.restoreFromHistory = restoreFromHistory;
    window.removeLastHistoryEntry = removeLastHistoryEntry;
    window.refreshTournamentUI = refreshTournamentUI;
    window.generateRefereeOptions = generateRefereeOptions;
    window.updateMatchReferee = updateMatchReferee;
    window.showMatchDetails = showMatchDetails;
}
