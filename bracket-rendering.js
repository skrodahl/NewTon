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
        matchWidth: 280,
        matchHeight: 150,
        horizontalSpacing: 65,
        verticalSpacing: 60,
        canvasWidth: 3000,
        canvasHeight: 1200,
        centerX: 500,
        centerY: 500,
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

/**
 * NEW: Get all matches that are in a state where they can be redone.
 * @returns {Set<string>} A set of match IDs that are redoable.
 */
function getRedoableMatches() {
    const undone = getUndoneTransactions();
    const redoable = new Set();

    if (undone.length === 0) {
        return redoable;
    }

    undone.forEach(transaction => {
        if (transaction && transaction.beforeState && transaction.beforeState.matches) {
            const match = matches.find(m => m.id === transaction.matchId);
            if (match && !match.completed) {
                const beforeMatch = transaction.beforeState.matches.find(m => m.id === transaction.matchId);
                if (beforeMatch && match.player1 && match.player2 &&
                    beforeMatch.player1.id === match.player1.id &&
                    beforeMatch.player2.id === match.player2.id) {
                    redoable.add(transaction.matchId);
                }
            }
        }
    });

    return redoable;
}

/**
 * NEW: Handle the redo button click.
 * @param {string} matchId The ID of the match to redo.
 */
function handleRedoClick(matchId) {
    const undone = getUndoneTransactions();
    const transactionToRedo = undone.find(t => t.matchId === matchId);

    if (!transactionToRedo) {
        alert('Could not find the match in the undone history to redo.');
        return;
    }

    if (!transactionToRedo.winner) {
        alert('The transaction to redo is corrupted and cannot be processed.');
        return;
    }

    const beforeMatch = transactionToRedo.beforeState.matches.find(m => m.id === matchId);
    if (!beforeMatch) {
        alert('Could not find the match in the before state of the transaction.');
        return;
    }

    // Re-complete the match with the original outcome
    const winner = transactionToRedo.winner;
    const winnerPlayerNumber = winner.id === beforeMatch.player1.id ? 1 : 2;
    
    completeMatch(matchId, winnerPlayerNumber, beforeMatch.finalScore?.winnerLegs, beforeMatch.finalScore?.loserLegs);

    // Remove from undone transactions and add back to history
    const newUndone = undone.filter(t => t.id !== transactionToRedo.id);
    saveUndoneTransactions(newUndone);

    const history = getTournamentHistory();
    history.unshift(transactionToRedo);
    localStorage.setItem('tournamentHistory', JSON.stringify(history));

    refreshTournamentUI();
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
    const buttonColor = matchState === 'live' ? '#ff6b35' : '#28a745';
    const buttonTextColor = 'white';

    // Lane options
    const laneOptions = generateLaneOptions(match.id, match.lane);

    // --- START: Surgical Undo UI Logic ---
    const isUndoable = isMatchUndoable(match.id);
    const player1WinnerClass = match.winner?.id === match.player1?.id ? 'winner' : '';
    const player2WinnerClass = match.winner?.id === match.player2?.id ? 'winner' : '';
    const player1UndoableClass = player1WinnerClass && isUndoable ? 'undoable' : '';
    const player2UndoableClass = player2WinnerClass && isUndoable ? 'undoable' : '';

    const player1ClickHandler = player1UndoableClass ? `handleSurgicalUndo('${match.id}')` : getPlayerClickHandler(match, 1, matchState);
    const player2ClickHandler = player2UndoableClass ? `handleSurgicalUndo('${match.id}')` : getPlayerClickHandler(match, 2, matchState);

    const winnerCheck1 = player1WinnerClass ? `<span class="winner-check"><span class="checkmark">✓</span><span class="undo-icon">↺</span></span>` : '';
    const winnerCheck2 = player2WinnerClass ? `<span class="winner-check"><span class="checkmark">✓</span><span class="undo-icon">↺</span></span>` : '';

    // --- START: Redo UI Logic ---
    //const redoableMatches = getRedoableMatches();
    //const isRedoable = redoableMatches.has(match.id);
    let redoButton = '';
    //if (isRedoable) {
    //    redoButton = `<button onclick="handleRedoClick('${match.id}')" class="btn btn-sm btn-info" style="margin-left: 5px;">Redo</button>`;
    //}
    // --- END: Redo UI Logic ---

    matchElement.innerHTML = `
        <div class="match-header">
            <span>${match.id}</span>
            ${roundIndicator}
            <span class="match-info">
                L: <select onchange="updateMatchLane('${match.id}', this.value)" 
                    onfocus="refreshLaneDropdown('${match.id}')"
                    style="background: white; border: 1px solid #ddd; font-size: 12px; width: 50px; padding: 2px;">
                    <option value="">No</option>
                    ${laneOptions}
                </select> | Bo${match.legs}
            </span>
        </div>
        <div class="match-players">
            <div class="match-player ${match.player1?.isBye ? 'bye' : 'first-throw'} ${player1WinnerClass} ${player1UndoableClass}"
                 onclick="${player1ClickHandler}">
                <span class="player-name-short">${getPlayerDisplayName(match.player1)}</span>
                ${winnerCheck1}
            </div>
            <div class="match-player ${match.player2?.isBye ? 'bye' : ''} ${player2WinnerClass} ${player2UndoableClass}"
                 onclick="${player2ClickHandler}">
                <span class="player-name-short">${getPlayerDisplayName(match.player2)}</span>
                ${winnerCheck2}
            </div>
        </div>
	<div class="match-controls">
    	    <span style="font-size: 11px; color: #666;">
        	    Ref: <select onchange="updateMatchReferee('${match.id}', this.value)" 
                onfocus="refreshRefereeDropdown('${match.id}')"
                style="background: white; border: 1px solid #ddd; font-size: 11px; width: 185px; padding: 1px;">
            	    ${generateRefereeOptionsWithConflicts(match.id, match.referee)}
        	    </select>
    	    </span>
    	    <button onclick="${getButtonClickHandler(matchState, match.id)}" 
            	    style="font-size: 9px; padding: 3px 6px; border: none; border-radius: 3px; 
                   	    background: ${buttonColor}; color: ${buttonTextColor}; 
                   	    ${buttonDisabled ? 'opacity: 0.6; cursor: not-allowed;' : 'cursor: pointer;'}"
            	    ${buttonDisabled ? 'disabled' : ''}>
        	    ${buttonText}
    	    </button>
            ${redoButton}
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
    // Don't start drag if clicking on interactive elements
    if (e.target.closest('.bracket-match button') ||
        e.target.closest('.bracket-match select') ||
        e.target.closest('.bracket-controls')) {
        return;
    }

    isDragging = true;
    dragStart.x = e.clientX - panOffset.x;
    dragStart.y = e.clientY - panOffset.y;
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    // Ensure we're in dragging mode
    document.body.style.cursor = 'grabbing';
}

function handleDrag(e) {
    if (!isDragging) return;
    panOffset.x = e.clientX - dragStart.x;
    panOffset.y = e.clientY - dragStart.y;
    updateCanvasTransform();
}

function endDrag() {
    isDragging = false;
    document.body.style.cursor = 'grab';
}

// --- START: Functions for Referee and Lane Management ---

function getAssignedReferees(excludeMatchId = null) {
    if (!matches || matches.length === 0) return [];
    const assignedReferees = [];
    matches.forEach(match => {
        if (excludeMatchId && match.id === excludeMatchId) return;
        if (match.referee && !match.completed) {
            assignedReferees.push(parseInt(match.referee));
        }
    });
    return assignedReferees;
}

function getPlayersInLiveMatches(excludeMatchId = null) {
    if (!matches || matches.length === 0) return [];
    const playersInLiveMatches = [];
    matches.forEach(match => {
        if (excludeMatchId && match.id === excludeMatchId) return;
        if (getMatchState(match) === 'live') {
            if (match.player1 && match.player1.id && !match.player1.isBye) {
                playersInLiveMatches.push(parseInt(match.player1.id));
            }
            if (match.player2 && match.player2.id && !match.player2.isBye) {
                playersInLiveMatches.push(parseInt(match.player2.id));
            }
        }
    });
    return playersInLiveMatches;
}

function isPlayerAvailableAsReferee(playerId, excludeMatchId = null) {
    const assignedReferees = getAssignedReferees(excludeMatchId);
    const playersInLiveMatches = getPlayersInLiveMatches(excludeMatchId);
    const playerIdInt = parseInt(playerId);
    return !assignedReferees.includes(playerIdInt) && !playersInLiveMatches.includes(playerIdInt);
}

function updateMatchReferee(matchId, refereeId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return false;

    if (!refereeId) {
        match.referee = null;
        saveTournament();
        return true;
    }

    const currentRefereeId = match.referee;
    if (refereeId !== currentRefereeId && !isPlayerAvailableAsReferee(refereeId, matchId)) {
        alert('This referee is already assigned to another match or currently playing.');
        const dropdown = document.querySelector(`#bracket-match-${matchId} select[onchange*="updateMatchReferee"]`);
        if (dropdown) dropdown.value = currentRefereeId || '';
        return false;
    }

    match.referee = refereeId ? parseInt(refereeId) : null;
    saveTournament();
    refreshAllRefereeDropdowns();
    return true;
}

function refreshAllRefereeDropdowns() {
    if (!matches) return;
    matches.forEach(match => {
        const matchElement = document.getElementById(`bracket-match-${match.id}`);
        if (matchElement) {
            const dropdown = matchElement.querySelector('select[onchange*="updateMatchReferee"]');
            if (dropdown) {
                const currentValue = dropdown.value;
                dropdown.innerHTML = generateRefereeOptionsWithConflicts(match.id, match.referee);
                if (dropdown.querySelector(`option[value="${currentValue}"]`)) {
                    dropdown.value = currentValue;
                }
            }
        }
    });
}

function refreshRefereeDropdown(matchId) {
    const matchElement = document.getElementById(`bracket-match-${matchId}`);
    if (!matchElement) return;
    const dropdown = matchElement.querySelector('select[onchange*="updateMatchReferee"]');
    if (!dropdown) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    const currentValue = dropdown.value;
    dropdown.innerHTML = generateRefereeOptionsWithConflicts(matchId, match.referee);
    if (dropdown.querySelector(`option[value="${currentValue}"]`)) {
        dropdown.value = currentValue;
    } else {
        dropdown.value = match.referee || '';
    }
}

function showMatchDetails() {
    if (!matches || matches.length === 0) {
        alert('No matches available to show details for.');
        return;
    }
    const activeMatches = matches.filter(m => getMatchState(m) === 'live');
    const readyMatches = matches.filter(m => getMatchState(m) === 'ready');
    let details = '';
    if (activeMatches.length > 0) {
        details += `Live:\n`;
        activeMatches.forEach(match => {
            const refereeName = match.referee ? (players.find(p => p.id == match.referee)?.name || 'Unknown') : 'None';
            let info = match.lane ? ` (Lane ${match.lane}, Ref: ${refereeName})` : ` (No lane, Ref: ${refereeName})`;
            details += `• ${match.id}: ${match.player1?.name} vs ${match.player2?.name}${info}\n`;
        });
        details += '\n';
    }
    if (readyMatches.length > 0) {
        details += `Ready to start:\n`;
        readyMatches.forEach(match => {
            const refereeName = match.referee ? (players.find(p => p.id == match.referee)?.name || 'Unknown') : 'None';
            let info = match.lane ? ` (Lane ${match.lane}, Ref: ${refereeName})` : ` (No lane, Ref: ${refereeName})`;
            details += `• ${match.id}: ${match.player1?.name} vs ${match.player2?.name}${info}\n`;
        });
        details += '\n';
    }
    if (activeMatches.length === 0 && readyMatches.length === 0) {
        const completedMatches = matches.filter(m => m.completed);
        const pendingMatches = matches.length - completedMatches.length;
        details = `No matches currently active or ready.\n\nCompleted: ${completedMatches.length}\nPending: ${pendingMatches}`;
    } else {
        details = details.trim();
    }
    alert(details);
}

// --- END: Functions for Referee and Lane Management ---


// UNDO SYSTEM FUNCTIONS - Refactored for Transactional History






/**
 * Refresh all tournament UI components after a state change (like undo).
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
 * Generate referee dropdown options with conflict detection.
 */
function generateRefereeOptionsWithConflicts(currentMatchId, currentRefereeId = null) {
    let options = '<option value="">None</option>';

    if (typeof players !== 'undefined' && Array.isArray(players)) {
        const paidPlayers = players.filter(player => player.paid);
        const sortedPlayers = paidPlayers.sort((a, b) => a.name.localeCompare(b.name));

        const assignedReferees = getAssignedReferees(currentMatchId);
        const playersInLiveMatches = getPlayersInLiveMatches(currentMatchId);

        sortedPlayers.forEach(player => {
            const playerId = parseInt(player.id);
            const isCurrentReferee = currentRefereeId && playerId === parseInt(currentRefereeId);
            const isAssignedElsewhere = assignedReferees.includes(playerId);
            const isInLiveMatch = playersInLiveMatches.includes(playerId);

            if (isCurrentReferee || (!isAssignedElsewhere && !isInLiveMatch)) {
                const selected = isCurrentReferee ? 'selected' : '';
                options += `<option value="${player.id}" ${selected}>${player.name}</option>`;
            } else {
                let reason = isAssignedElsewhere ? ' (assigned)' : ' (playing)';
                options += `<option value="${player.id}" disabled style="color: #ccc;">${player.name}${reason}</option>`;
            }
        });
    }

    return options;
}

// Make functions globally available
if (typeof window !== 'undefined') {
    
    window.refreshTournamentUI = refreshTournamentUI;

    // Original functions needed by HTML
    window.showMatchDetails = showMatchDetails;
    window.updateMatchReferee = updateMatchReferee;
    window.generateRefereeOptionsWithConflicts = generateRefereeOptionsWithConflicts;
    window.refreshRefereeDropdown = refreshRefereeDropdown;
    window.getAssignedReferees = getAssignedReferees;
    window.getPlayersInLiveMatches = getPlayersInLiveMatches;
    window.isPlayerAvailableAsReferee = isPlayerAvailableAsReferee;
    window.getRedoableMatches = getRedoableMatches;
    window.handleRedoClick = handleRedoClick;
}

// --- START: Surgical Undo Implementation ---

function isMatchUndoable(matchId) {
    const history = getTournamentHistory();
    if (history.length === 0) return false;

    const match = matches.find(m => m.id === matchId);
    if (!match || (match.player1 && isWalkover(match.player1)) || (match.player2 && isWalkover(match.player2))) {
        return false;
    }

    // Check if match has a transaction in history
    const hasTransaction = history.some(t => t.matchId === matchId);
    if (!hasTransaction) return false;

    // Check ALL immediate downstream matches (both sides)
    if (tournament.bracketSize && MATCH_PROGRESSION[tournament.bracketSize]) {
        const progression = MATCH_PROGRESSION[tournament.bracketSize][matchId];
        if (progression) {
            // Check if winner's destination is completed
            if (progression.winner) {
                const [targetMatchId] = progression.winner;
                const targetMatch = matches.find(m => m.id === targetMatchId);
                if (targetMatch && targetMatch.completed) {
                    return false;
                }
            }
            
            // Check if loser's destination is completed
            if (progression.loser) {
                const [targetMatchId] = progression.loser;
                const targetMatch = matches.find(m => m.id === targetMatchId);
                if (targetMatch && targetMatch.completed) {
                    return false;
                }
            }
        }
    }

    return true;
}

function handleSurgicalUndo(matchId) {
    const history = getTournamentHistory();
    const transaction = history.find(t => t.matchId === matchId);

    if (!transaction) {
        alert('Could not find the match in the history to undo.');
        return;
    }

    const downstreamMatches = getDownstreamMatches(matchId, tournament.bracketSize);
    const affectedMatches = new Set([matchId, ...downstreamMatches]);

    const transactionsToUndo = history.filter(t => affectedMatches.has(t.matchId));

    if (transactionsToUndo.length === 0) {
        alert('No undoable transactions found for this match and its downstream dependencies.');
        return;
    }
    
    let confirmMessage = `This will undo the selected match and all of its ${downstreamMatches.size} downstream match(es).

 The following matches will be undone:
 - ${matchId}`;
    
    downstreamMatches.forEach(affectedMatch => {
        confirmMessage += `
 - ${affectedMatch}`;
    });

    confirmMessage += `

Are you sure?`;

    if (confirm(confirmMessage)) {
        const transactionIdsToUndo = transactionsToUndo.map(t => t.id);
        if (typeof undoTransactions === 'function') {
            undoTransactions(transactionIdsToUndo);
        }
    }
}

// --- END: Surgical Undo Implementation ---


// UNDO SYSTEM FUNCTIONS - Refactored for Transactional History



