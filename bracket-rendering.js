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
        horizontalSpacing: 25,
        verticalSpacing: 15,
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

    // Capture state before change for transaction
    const oldReferee = match.referee;

    if (!refereeId) {
        match.referee = null;

        // Create transaction for referee clearing
        if (!window.rebuildInProgress && typeof saveTransaction === 'function') {
            const transaction = {
                id: `tx_${Date.now()}`,
                type: 'ASSIGN_REFEREE',
                description: `${matchId}: Referee cleared`,
                timestamp: new Date().toISOString(),
                matchId: matchId,
                beforeState: { referee: oldReferee },
                afterState: { referee: null }
            };

            saveTransaction(transaction);
        }

        saveTournament();

        // Refresh tournament bracket to show updated referee
        if (typeof renderBracket === 'function') {
            renderBracket();
        }

        // Refresh Match Controls if it's open
        if (document.getElementById('matchCommandCenterModal') &&
            document.getElementById('matchCommandCenterModal').style.display === 'flex' &&
            typeof showMatchCommandCenter === 'function') {
            // Preserve scroll position
            const modalContent = document.querySelector('.cc-modal-content');
            const scrollTop = modalContent ? modalContent.scrollTop : 0;
            setTimeout(() => {
                showMatchCommandCenter();
                if (modalContent) {
                    modalContent.scrollTop = scrollTop;
                }
            }, 200);
        }

        return true;
    }

    const currentRefereeId = match.referee;
    if (refereeId !== currentRefereeId && !isPlayerAvailableAsReferee(refereeId, matchId)) {
        alert('This referee is already assigned to another match or currently playing.');
        const dropdown = document.querySelector(`#bracket-match-${matchId} select[onchange*="updateMatchReferee"]`);
        if (dropdown) dropdown.value = currentRefereeId || '';
        return false;
    }

    const parsedRefereeId = refereeId ? parseInt(refereeId) : null;
    match.referee = parsedRefereeId;

    // Create transaction for referee assignment
    if (!window.rebuildInProgress && typeof saveTransaction === 'function') {
        const transaction = {
            id: `tx_${Date.now()}`,
            type: 'ASSIGN_REFEREE',
            description: `${matchId}: Referee assigned to player ${parsedRefereeId}`,
            timestamp: new Date().toISOString(),
            matchId: matchId,
            beforeState: { referee: oldReferee },
            afterState: { referee: parsedRefereeId }
        };

        saveTransaction(transaction);
    }

    saveTournament();
    refreshAllRefereeDropdowns();

    // Refresh tournament bracket to show updated referee
    if (typeof renderBracket === 'function') {
        renderBracket();
    }

    // Refresh Match Controls if it's open
    if (document.getElementById('matchCommandCenterModal') &&
        document.getElementById('matchCommandCenterModal').style.display === 'flex' &&
        typeof showMatchCommandCenter === 'function') {
        // Preserve scroll position
        const modalContent = document.querySelector('.cc-modal-content');
        const scrollTop = modalContent ? modalContent.scrollTop : 0;
        setTimeout(() => {
            showMatchCommandCenter();
            if (modalContent) {
                modalContent.scrollTop = scrollTop;
            }
        }, 200);
    }

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
        showMatchDetailsModal('No matches available to show details for.');
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
    showMatchDetailsModal(details);
}

function showMatchDetailsModal(message) {
    const modal = document.getElementById('matchDetailsModal');
    const messageDiv = document.getElementById('matchDetailsMessage');
    const okBtn = document.getElementById('matchDetailsOK');
    
    if (!modal || !messageDiv || !okBtn) {
        console.error('Match details modal elements not found');
        alert(message); // Fallback to alert
        return;
    }
    
    messageDiv.textContent = message;
    modal.style.display = 'flex';
    
    // Focus the OK button
    setTimeout(() => okBtn.focus(), 100);
    
    // Set up event handlers
    const closeModal = () => {
        modal.style.display = 'none';
        okBtn.onclick = null; // Clean up
    };
    
    okBtn.onclick = closeModal;
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function showUndoConfirmationModal(message, onConfirm, onCancel = null) {
    const modal = document.getElementById('undoConfirmModal');
    const messageDiv = document.getElementById('undoConfirmMessage');
    const cancelBtn = document.getElementById('undoConfirmCancel');
    const confirmBtn = document.getElementById('undoConfirmOK');
    
    if (!modal || !messageDiv || !cancelBtn || !confirmBtn) {
        console.error('Undo confirmation modal elements not found');
        if (confirm(message)) onConfirm(); // Fallback to confirm
        return;
    }
    
    messageDiv.innerHTML = message;
    modal.style.display = 'flex';
    
    // Focus the Cancel button (default selection)
    setTimeout(() => {
        cancelBtn.focus();
        cancelBtn.style.boxShadow = '0 0 0 3px rgba(108, 117, 125, 0.3)';
        cancelBtn.style.transform = 'scale(1.05)';
    }, 100);
    
    // Set up event handlers
    const closeModal = () => {
        modal.style.display = 'none';
        cancelBtn.onclick = null; // Clean up
        confirmBtn.onclick = null;
    };
    
    cancelBtn.onclick = () => {
        closeModal();
        if (onCancel) onCancel();
    };
    confirmBtn.onclick = () => {
        closeModal();
        onConfirm();
    };
    
    // Close on Escape key (same as Cancel)
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// --- END: Functions for Referee and Lane Management ---


// UNDO SYSTEM FUNCTIONS - Refactored for Transactional History






/**
 * Refresh all tournament UI components after a state change (like undo).
 */
function refreshTournamentUI() {
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

        // Force re-render bracket
        if (typeof renderBracket === 'function') {
            renderBracket();
        }

        // Update match states  
        if (typeof updateAllMatchStates === 'function') {
            updateAllMatchStates();
        }

        // Update results table
        if (typeof displayResults === 'function') {
            displayResults();
        }

        // Refresh lane dropdowns if available
        if (typeof refreshAllLaneDropdowns === 'function') {
            setTimeout(refreshAllLaneDropdowns, 100);
        }

        // Save tournament
        if (typeof saveCurrentTournament === 'function') {
            saveCurrentTournament();
        }

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
    if (!match) {
        return false;
    }

    // Only MANUAL transactions can be undone (not AUTO walkover matches)
    const manualTransaction = history.find(t => t.matchId === matchId && t.completionType === 'MANUAL');
    if (!manualTransaction) {
        return false; // No MANUAL transaction found for this match
    }

    // Check downstream matches - block undo if any downstream match was completed via MANUAL transaction
    if (tournament.bracketSize && MATCH_PROGRESSION[tournament.bracketSize]) {
        const progression = MATCH_PROGRESSION[tournament.bracketSize][matchId];
        if (progression) {
            // Check if winner's destination has a MANUAL completion
            if (progression.winner) {
                const [targetMatchId] = progression.winner;
                const targetMatch = matches.find(m => m.id === targetMatchId);
                if (targetMatch && targetMatch.completed) {
                    const targetTransaction = history.find(t => t.matchId === targetMatchId);
                    if (targetTransaction && targetTransaction.completionType === 'MANUAL') {
                        return false; // Blocked by MANUAL downstream match
                    }
                }
            }

            // Check if loser's destination has a MANUAL completion
            if (progression.loser) {
                const [targetMatchId] = progression.loser;
                const targetMatch = matches.find(m => m.id === targetMatchId);
                if (targetMatch && targetMatch.completed) {
                    const targetTransaction = history.find(t => t.matchId === targetMatchId);
                    if (targetTransaction && targetTransaction.completionType === 'MANUAL') {
                        return false; // Blocked by MANUAL downstream match
                    }
                }
            }
        }
    }

    return true; // Safe to undo - match has MANUAL transaction and no MANUAL downstream dependencies
}

// Helper function to find matches that are directly affected by undoing a specific match
// Helper function to follow walkover chain to final destination
function followWalkoverChain(matchId, progression) {
    let currentMatchId = matchId;
    let visited = new Set(); // Prevent infinite loops

    while (currentMatchId && !visited.has(currentMatchId)) {
        visited.add(currentMatchId);

        const match = matches.find(m => m.id === currentMatchId);
        if (!match) break;

        // If match has real players or is not a walkover, this is the final destination
        if (!isWalkover(match.player1) && !isWalkover(match.player2)) {
            return currentMatchId;
        }

        // If it's a walkover match, follow the progression chain
        const matchProgression = progression[currentMatchId];
        if (!matchProgression || !matchProgression.winner) {
            break;
        }

        // Follow where the winner of this walkover match goes
        const [nextMatchId] = matchProgression.winner;
        currentMatchId = nextMatchId;
    }

    return matchId; // Return original if can't follow chain
}

function getConsequentialMatches(transaction) {
    const consequentialMatches = [];

    if (!transaction || !tournament || !tournament.bracketSize) {
        return consequentialMatches;
    }

    // Use hardcoded MATCH_PROGRESSION to find exact destinations
    const progression = MATCH_PROGRESSION[tournament.bracketSize];
    if (!progression || !progression[transaction.matchId]) {
        return consequentialMatches;
    }

    const matchProgression = progression[transaction.matchId];

    // Add winner destination match if it exists
    if (matchProgression.winner) {
        const [targetMatchId] = matchProgression.winner;
        // Follow walkover chain to final destination
        const finalMatchId = followWalkoverChain(targetMatchId, progression);
        const targetMatch = matches.find(m => m.id === finalMatchId);
        if (targetMatch) {
            consequentialMatches.push({
                id: targetMatch.id,
                match: targetMatch,
                isFrontside: targetMatch.id.startsWith('FS-')
            });
        }
    }

    // Add loser destination match if it exists
    if (matchProgression.loser) {
        const [targetMatchId] = matchProgression.loser;
        // Follow walkover chain to final destination
        const finalMatchId = followWalkoverChain(targetMatchId, progression);
        const targetMatch = matches.find(m => m.id === finalMatchId);
        if (targetMatch) {
            consequentialMatches.push({
                id: targetMatch.id,
                match: targetMatch,
                isFrontside: targetMatch.id.startsWith('FS-')
            });
        }
    }

    // Sort: frontside matches first, then backside
    return consequentialMatches.sort((a, b) => {
        if (a.isFrontside && !b.isFrontside) return -1;
        if (!a.isFrontside && b.isFrontside) return 1;
        return 0;
    });
}

// Create enhanced modal content with match cards
function createUndoModalContent(matchId, consequentialMatches) {
    let content = `<div class="undo-header">Undoing <strong>${matchId}</strong> will reset the following matches:</div>`;
    
    if (consequentialMatches.length === 0) {
        content += `<div class="undo-no-matches">No other matches will be affected.</div>`;
    } else {
        content += `<div class="undo-matches-container">`;
        
        consequentialMatches.forEach(({ id, match, isFrontside }) => {
            const player1Name = match.player1?.name || 'TBD';
            const player2Name = match.player2?.name || 'TBD';

            // Enhanced bracket type with round numbers
            let bracketType;
            if (match.id === 'GRAND-FINAL' || match.id === 'BS-FINAL') {
                bracketType = match.id;
            } else if (isFrontside) {
                bracketType = `⚪ Frontside - Round ${match.id.split('-')[1]}`;
            } else {
                bracketType = `⚫ Backside - Round ${match.id.split('-')[1]}`;
            }
            
            content += `
                <div class="undo-match-card">
                    <div class="undo-match-header">
                        <div class="undo-match-id">${id}</div>
                        <div class="undo-bracket-type">${bracketType}</div>
                    </div>
                    <div class="undo-match-players">${player1Name} vs ${player2Name}</div>
                </div>
            `;
        });
        
        content += `</div>`;
    }
    
    return content;
}

// Global debounce state for undo operations
let undoDebounceActive = false;

function handleSurgicalUndo(matchId) {
    // Debounce: Prevent rapid undo clicks
    if (undoDebounceActive) {
        console.log('⏸️ Undo operation blocked - debounce active');
        return;
    }

    // Activate debounce immediately to prevent multiple undo modals
    undoDebounceActive = true;
    console.log('🔒 Undo debounce activated');

    const history = getTournamentHistory();
    const transaction = history.find(t => t.matchId === matchId && t.completionType === 'MANUAL');

    if (!transaction) {
        // Clear debounce if we can't proceed
        undoDebounceActive = false;
        alert('Could not find a manual completion for this match in the history to undo.');
        return;
    }

    // For display purposes, still find consequential matches to show user what will be affected
    const consequentialMatches = getConsequentialMatches(transaction);
    
    // Create enhanced confirmation modal content
    const modalContent = createUndoModalContent(matchId, consequentialMatches);
    
    showUndoConfirmationModal(modalContent, () => {
        // New bulletproof undo: Only remove the MANUAL transaction and rebuild
        undoManualTransaction(transaction.id);

        // Clear debounce after operation completes
        setTimeout(() => {
            undoDebounceActive = false;
            console.log('🔓 Undo debounce cleared');
        }, 1500);
    }, () => {
        // User cancelled - clear debounce immediately
        undoDebounceActive = false;
        console.log('❌ Undo cancelled - debounce cleared');
    });
}

// Clean undo: Remove target transaction and consequences, rebuild from clean history
function undoManualTransaction(transactionId) {
    const history = getTournamentHistory();
    const targetTransaction = history.find(t => t.id === transactionId);

    if (!targetTransaction) {
        console.error(`Transaction ${transactionId} not found in history`);
        return;
    }

    // 1. Identify transactions to remove: target + immediate AUTO consequences
    const targetTimestamp = new Date(targetTransaction.timestamp);
    const transactionsToRemove = [transactionId];

    // Find AUTO transactions that happened immediately after target transaction
    // (within a short time window, indicating they were consequences)
    const timeWindowMs = 1000; // 1 second window for immediate consequences
    history.forEach(t => {
        const tTimestamp = new Date(t.timestamp);
        if (t.completionType === 'AUTO' &&
            tTimestamp > targetTimestamp &&
            tTimestamp - targetTimestamp <= timeWindowMs) {
            transactionsToRemove.push(t.id);
        }
    });

    console.log(`Clean undo ${targetTransaction.matchId}: removing ${transactionsToRemove.length} transactions`);

    // 2. Check if we're undoing GRAND-FINAL (need to reset tournament status)
    const isUndoingGrandFinal = targetTransaction.matchId === 'GRAND-FINAL';

    // 3. Create clean history by removing target + consequences
    const cleanHistory = history.filter(t => !transactionsToRemove.includes(t.id));

    // 4. Save clean history
    localStorage.setItem('tournamentHistory', JSON.stringify(cleanHistory));

    // 5. Reset tournament status if undoing GRAND-FINAL
    if (isUndoingGrandFinal && tournament) {
        console.log('Undoing GRAND-FINAL: resetting tournament to active state');
        tournament.status = 'active';
        tournament.placements = {}; // Clear final placements
    }

    // 6. Rebuild entire bracket from clean history (single source of truth)
    rebuildBracketFromHistory(cleanHistory);

    // 7. Save tournament state
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    // 8. Refresh results display if we reset tournament status
    if (isUndoingGrandFinal && typeof displayResults === 'function') {
        displayResults();
    }

    console.log(`Clean undo complete: rebuilt bracket from ${cleanHistory.length} transactions`);
}

// Rebuild entire bracket from clean transaction history (single source of truth approach)
function rebuildBracketFromHistory(cleanHistory) {
    if (!tournament || !tournament.bracketSize) {
        console.error('Cannot rebuild bracket: no tournament or bracket size');
        return;
    }

    // Set global flags to prevent any transaction creation during rebuild
    window.rebuildInProgress = true;
    window.autoAdvancementsDisabled = true;

    console.log(`Rebuilding bracket from ${cleanHistory.length} transactions`);

    // 1. Clear existing matches and regenerate bracket structure
    matches.length = 0;

    // Recreate the bracket structure (similar to generateCleanBracket)
    const bracketSize = tournament.bracketSize;
    const paidPlayers = players.filter(p => p.paid);

    // Use the existing bracket generation logic to create fresh structure
    if (typeof generateAllMatches === 'function') {
        // We need the bracket object to regenerate matches
        if (!tournament.bracket) {
            console.error('Cannot rebuild: tournament.bracket not available');
            return;
        }
        generateAllMatches(tournament.bracket, bracketSize);
    } else {
        console.error('generateAllMatches function not available');
        return;
    }

    // 2. Apply each transaction from clean history in chronological order
    const chronologicalHistory = cleanHistory
        .slice() // Don't mutate original array
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let appliedCount = 0;
    chronologicalHistory.forEach(transaction => {
        const match = matches.find(m => m.id === transaction.matchId);
        if (!match) return;

        // Process different transaction types
        switch (transaction.type) {
            case 'COMPLETE_MATCH':
                if (transaction.winner && transaction.loser) {
                    // Ensure the match has the correct players from transaction
                    match.player1 = transaction.winner;
                    match.player2 = transaction.loser;

                    // Winner is always player1 for this rebuild approach
                    const winnerPlayerNumber = 1;
                    if (typeof completeMatch === 'function') {
                        completeMatch(
                            transaction.matchId,
                            winnerPlayerNumber,
                            transaction.winnerLegs || 0,
                            transaction.loserLegs || 0,
                            transaction.completionType || 'MANUAL'
                        );
                        appliedCount++;
                    }
                }
                break;

            case 'START_MATCH':
                match.active = true;
                appliedCount++;
                break;

            case 'STOP_MATCH':
                match.active = false;
                appliedCount++;
                break;

            case 'ASSIGN_LANE':
                match.lane = transaction.afterState.lane;
                appliedCount++;
                break;

            case 'ASSIGN_REFEREE':
                match.referee = transaction.afterState.referee;
                appliedCount++;
                break;

            default:
                // Handle legacy transactions without explicit type (assume COMPLETE_MATCH)
                if (transaction.matchId && transaction.winner && transaction.loser) {
                    match.player1 = transaction.winner;
                    match.player2 = transaction.loser;
                    const winnerPlayerNumber = 1;
                    if (typeof completeMatch === 'function') {
                        completeMatch(
                            transaction.matchId,
                            winnerPlayerNumber,
                            transaction.winnerLegs || 0,
                            transaction.loserLegs || 0,
                            transaction.completionType || 'MANUAL'
                        );
                        appliedCount++;
                    }
                }
                break;
        }
    });

    // 5. Update match states and UI
    updateAllMatchStates();
    if (typeof refreshTournamentUI === 'function') {
        refreshTournamentUI();
    }

    console.log(`Bracket rebuild complete: applied ${appliedCount} transactions`);

    // Reasonable delay to prevent auto-advancements during UI refresh cycles
    setTimeout(() => {
        console.log('🔓 Rebuild protection window ending - re-enabling auto-advancements');
        window.rebuildInProgress = false;
        window.autoAdvancementsDisabled = false;
    }, 500);
}

// Update match states based on current player composition
function updateAllMatchStates() {
    matches.forEach(match => {
        if (match.completed) {
            match.state = 'COMPLETED';
        } else if (match.player1?.name === 'TBD' || match.player2?.name === 'TBD' ||
                   isWalkover(match.player1) || isWalkover(match.player2)) {
            match.state = 'PENDING';
        } else if (match.player1 && match.player2) {
            match.state = 'READY';
        } else {
            match.state = 'PENDING';
        }
    });
}


// --- END: Surgical Undo Implementation ---

// --- START: Match Command Center Implementation ---

// Helper function to get match format description
function getMatchFormatDescription(match) {
    if (!match.legs) return 'Unknown';
    const legs = match.legs;
    return `Best of ${legs}`;
}

// Helper function to get round description
function getRoundDescription(match) {
    if (match.id === 'GRAND-FINAL') return 'Grand Final';
    if (match.id === 'BS-FINAL') return 'Backside Final';
    
    // Check for semifinals
    if (typeof isFrontsideSemifinal === 'function' && isFrontsideSemifinal(match.id, tournament?.bracketSize)) {
        return 'Frontside Semifinal';
    }
    if (typeof isBacksideSemifinal === 'function' && isBacksideSemifinal(match.id, tournament?.bracketSize)) {
        return 'Backside Semifinal';
    }
    
    // Default round naming
    if (match.id.startsWith('FS-')) {
        const parts = match.id.split('-');
        return `Frontside Round ${parts[1]}`;
    }
    if (match.id.startsWith('BS-')) {
        const parts = match.id.split('-');
        return `Backside Round ${parts[1]}`;
    }
    
    return 'Match';
}

// Create match card HTML
function createMatchCard(match) {
    const format = getMatchFormatDescription(match);
    const round = getRoundDescription(match);
    const state = getMatchState(match);
    
    const laneOptions = generateLaneOptions(match.id, match.lane);
    const refereeOptions = generateRefereeOptionsWithConflicts(match.id, match.referee);
    
    const player1Name = match.player1?.name || 'TBD';
    const player2Name = match.player2?.name || 'TBD';
    const player1Id = match.player1?.id || '';
    const player2Id = match.player2?.id || '';
    
    // Use same button logic as tournament bracket, but add Command Center refresh
    const originalClickHandler = getButtonClickHandler(state, match.id);
    const commandCenterClickHandler = originalClickHandler ? 
        `${originalClickHandler}; setTimeout(() => { if (document.getElementById('matchCommandCenterModal').style.display === 'flex') showMatchCommandCenter(); }, 500)` : 
        '';
    
    // For live matches, show stop button; for non-live matches, show start button
    const actionButton = state === 'live' ?
        `<button class="cc-match-action-btn cc-btn-stop" onclick="toggleActive('${match.id}'); setTimeout(() => showMatchCommandCenter(), 200);">Stop Match</button>` :
        `<button class="cc-match-action-btn cc-btn-start" onclick="${commandCenterClickHandler}">Start Match</button>`;
    
    const liveClass = state === 'live' ? ' cc-match-card-live' : '';
    const backsideClass = (match.side === 'backside' || match.id.startsWith('BS-')) ? ' cc-match-card-backside' : '';
    
    return `
        <div class="cc-match-card${liveClass}${backsideClass}">
            <div class="cc-match-card-header">
                <div class="cc-match-id">${match.id}</div>
                <div class="cc-match-format">${format} • <strong>${round}</strong></div>
            </div>
            
            <div class="cc-match-players">
                ${state === 'live' ?
                    `<button class="cc-match-action-btn cc-btn-winner" onclick="completeMatchFromCommandCenter('${match.id}', 1)">${player1Name} Wins</button>
                     <button class="cc-match-action-btn cc-btn-winner" onclick="completeMatchFromCommandCenter('${match.id}', 2)">${player2Name} Wins</button>` :
                    `<span class="cc-player-name" onclick="openStatsModal(${player1Id})">${player1Name}</span>
                     <span class="cc-vs-divider">vs</span>
                     <span class="cc-player-name" onclick="openStatsModal(${player2Id})">${player2Name}</span>`
                }
            </div>
            
            <div class="cc-match-controls">
                <div class="cc-control-group">
                    <label class="cc-control-label">Lane:</label>
                    <select class="cc-match-dropdown" onchange="updateMatchLane('${match.id}', this.value);">
                        ${laneOptions}
                    </select>
                </div>

                <div class="cc-control-group">
                    <label class="cc-control-label">Ref:</label>
                    <select class="cc-match-dropdown" onchange="updateMatchReferee('${match.id}', this.value);">
                        ${refereeOptions}
                    </select>
                </div>

                <div style="flex: 1;"></div>
                ${actionButton}
            </div>
        </div>
    `;
}

// Main function to show the command center
function showMatchCommandCenter() {
    if (!matches || matches.length === 0) {
        showCommandCenterModal([]); // Show empty state
        return;
    }

    const liveMatches = matches.filter(m => getMatchState(m) === 'live');
    const readyMatches = matches.filter(m => getMatchState(m) === 'ready');

    // Separate ready matches by bracket side
    const frontMatches = readyMatches.filter(m => m.side === 'frontside' || m.id.startsWith('FS-'));
    const backMatches = readyMatches.filter(m => m.side === 'backside' || m.id.startsWith('BS-'));

    // Sort by match ID for consistent ordering
    liveMatches.sort((a, b) => a.id.localeCompare(b.id));
    frontMatches.sort((a, b) => a.id.localeCompare(b.id));
    backMatches.sort((a, b) => a.id.localeCompare(b.id));

    const matchData = {
        live: liveMatches,
        front: frontMatches,
        back: backMatches
    };

    showCommandCenterModal(matchData);
}

// Function to get referee suggestions
function getRefereeSuggestions() {
    if (!matches || !players) return { losers: [], winners: [] };

    // Get completed matches sorted by most recent first
    const completedMatches = matches
        .filter(m => m.completed && m.winner && m.loser)
        .sort((a, b) => {
            const aTime = a.completedAt || 0;
            const bTime = b.completedAt || 0;
            return bTime - aTime; // Most recent first
        });

    // Get players currently assigned as referees
    const assignedReferees = new Set();
    matches.forEach(match => {
        if (match.referee) {
            assignedReferees.add(match.referee);
        }
    });

    // Get players currently in LIVE matches
    const playersInLiveMatches = new Set();
    matches.forEach(match => {
        if (match.active) {
            if (match.player1?.id) playersInLiveMatches.add(match.player1.id);
            if (match.player2?.id) playersInLiveMatches.add(match.player2.id);
        }
    });

    // Helper function to check if a player is eligible
    const isEligible = (playerId, playerName) => {
        if (!playerId) return false;

        // Check basic eligibility (not assigned as referee, not in live match)
        if (assignedReferees.has(playerId) || playersInLiveMatches.has(playerId)) {
            return false;
        }

        // Check if player is a walkover by name or ID
        if (playerName === 'Walkover' || playerId.toString().startsWith('walkover-')) {
            return false;
        }

        // Additional check using player object if available
        const player = players.find(p => p.id === playerId);
        if (player && window.isWalkover && window.isWalkover(player)) {
            return false;
        }

        return true;
    };

    // Helper function to get round description
    const getRoundDescription = (matchId) => {
        if (matchId.startsWith('FS-')) {
            const parts = matchId.split('-');
            if (parts.length >= 2) {
                return `FS-R${parts[1]}`;
            }
        } else if (matchId.startsWith('BS-')) {
            const parts = matchId.split('-');
            if (parts.length >= 2) {
                return `BS-R${parts[1]}`;
            }
        }
        return matchId; // Fallback
    };

    // Collect recent losers by FS/BS (up to 10 total eligible)
    const fsLosers = [];
    const bsLosers = [];
    for (const match of completedMatches) {
        if (fsLosers.length + bsLosers.length >= 7) break;

        const loserId = match.loser?.id;
        if (loserId && isEligible(loserId, match.loser?.name)) {
            const loserData = {
                id: loserId,
                name: match.loser.name,
                round: getRoundDescription(match.id)
            };

            if (match.id.startsWith('FS-')) {
                fsLosers.push(loserData);
            } else if (match.id.startsWith('BS-')) {
                bsLosers.push(loserData);
            }
        }
    }

    // Combine FS first, then BS
    const recentLosers = [...fsLosers, ...bsLosers].slice(0, 7);

    // Collect recent winners by FS/BS (up to 10 total eligible)
    const fsWinners = [];
    const bsWinners = [];
    for (const match of completedMatches) {
        if (fsWinners.length + bsWinners.length >= 7) break;

        const winnerId = match.winner?.id;
        if (winnerId && isEligible(winnerId, match.winner?.name)) {
            // Don't add if already in losers list
            if (!recentLosers.some(loser => loser.id === winnerId)) {
                const winnerData = {
                    id: winnerId,
                    name: match.winner.name,
                    round: getRoundDescription(match.id)
                };

                if (match.id.startsWith('FS-')) {
                    fsWinners.push(winnerData);
                } else if (match.id.startsWith('BS-')) {
                    bsWinners.push(winnerData);
                }
            }
        }
    }

    // Combine FS first, then BS
    const recentWinners = [...fsWinners, ...bsWinners].slice(0, 7);

    // Get recent referee assignments from transaction history (last 10)
    const recentRefereeAssignments = [];
    const history = JSON.parse(localStorage.getItem('tournamentHistory') || '[]');

    // Filter ASSIGN_REFEREE transactions with actual referee assignments (not null)
    const refereeTransactions = history
        .filter(tx => tx.type === 'ASSIGN_REFEREE' && tx.afterState?.referee)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Most recent first
        .slice(0, 7);

    for (const tx of refereeTransactions) {
        const refereeId = tx.afterState.referee;
        if (refereeId) {
            // Find referee name from players
            const referee = players.find(p => p.id === refereeId);
            if (referee) {
                // Get round description from match ID
                const roundDescription = getRoundDescription(tx.matchId);

                recentRefereeAssignments.push({
                    id: refereeId,
                    name: referee.name,
                    round: roundDescription,
                    timestamp: tx.timestamp
                });
            }
        }
    }

    return {
        losers: recentLosers,
        winners: recentWinners,
        recentReferees: recentRefereeAssignments
    };
}

// Function to populate referee suggestions in the UI
function populateRefereeSuggestions() {
    const losersContainer = document.getElementById('refereeLosersContainer');
    const winnersContainer = document.getElementById('refereeWinnersContainer');
    const assignmentsContainer = document.getElementById('refereeAssignmentsContainer');
    const losersSection = document.getElementById('refereeLosersSection');
    const winnersSection = document.getElementById('refereeWinnersSection');
    const assignmentsSection = document.getElementById('refereeAssignmentsSection');
    const noSuggestionsMessage = document.getElementById('noRefereeSuggestionsMessage');

    if (!losersContainer || !winnersContainer || !assignmentsContainer) return;

    const suggestions = getRefereeSuggestions();
    const hasAnysuggestions = suggestions.losers.length > 0 || suggestions.winners.length > 0 || suggestions.recentReferees.length > 0;

    if (!hasAnysuggestions) {
        // Show empty state
        losersSection.style.display = 'none';
        winnersSection.style.display = 'none';
        assignmentsSection.style.display = 'none';
        noSuggestionsMessage.style.display = 'block';
        return;
    }

    noSuggestionsMessage.style.display = 'none';

    // Populate losers
    if (suggestions.losers.length > 0) {
        losersSection.style.display = 'block';
        losersContainer.innerHTML = suggestions.losers.map(loser => {
            const isBackside = loser.round.startsWith('BS-');
            const backsideClass = isBackside ? ' referee-suggestion-backside' : '';
            return `<div class="referee-suggestion-item${backsideClass}">
                <span class="referee-suggestion-name">${loser.name}</span>
                <span class="referee-suggestion-round">(${loser.round})</span>
            </div>`;
        }).join('');
    } else {
        losersSection.style.display = 'none';
    }

    // Populate winners
    if (suggestions.winners.length > 0) {
        winnersSection.style.display = 'block';
        winnersContainer.innerHTML = suggestions.winners.map(winner => {
            const isBackside = winner.round.startsWith('BS-');
            const backsideClass = isBackside ? ' referee-suggestion-backside' : '';
            return `<div class="referee-suggestion-item${backsideClass}">
                <span class="referee-suggestion-name">${winner.name}</span>
                <span class="referee-suggestion-round">(${winner.round})</span>
            </div>`;
        }).join('');
    } else {
        winnersSection.style.display = 'none';
    }

    // Populate recent assignments
    if (suggestions.recentReferees.length > 0) {
        assignmentsSection.style.display = 'block';
        assignmentsContainer.innerHTML = suggestions.recentReferees.map(assignment => {
            const isBackside = assignment.round.startsWith('BS-');
            const backsideClass = isBackside ? ' referee-suggestion-backside' : '';
            return `<div class="referee-suggestion-item${backsideClass}">
                <span class="referee-suggestion-name">${assignment.name}</span>
                <span class="referee-suggestion-round">(${assignment.round})</span>
            </div>`;
        }).join('');
    } else {
        assignmentsSection.style.display = 'none';
    }
}

function showCommandCenterModal(matchData) {
    const modal = document.getElementById('matchCommandCenterModal');
    const liveContainer = document.getElementById('liveMatchesContainer');
    const frontContainer = document.getElementById('frontMatchesContainer');
    const backContainer = document.getElementById('backMatchesContainer');
    const liveSection = document.getElementById('liveMatchesSection');
    const frontSection = document.getElementById('frontMatchesSection');
    const backSection = document.getElementById('backMatchesSection');
    const noMatchesMessage = document.getElementById('noMatchesMessage');
    const okBtn = document.getElementById('commandCenterOK');

    // Get the scrollable container and preserve scroll position
    const scrollContainer = document.querySelector('.match-controls-container');
    const initialScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

    if (!modal || !liveContainer || !frontContainer || !backContainer) {
        console.error('Match command center modal elements not found');
        return;
    }

    // Clear existing content
    liveContainer.innerHTML = '';
    frontContainer.innerHTML = '';
    backContainer.innerHTML = '';
    
    // Check if we have any matches to show
    const hasMatches = Array.isArray(matchData) ? matchData.length > 0 : 
        (matchData.live && matchData.live.length > 0) || 
        (matchData.front && matchData.front.length > 0) || 
        (matchData.back && matchData.back.length > 0);
    
    if (!hasMatches) {
        // Show empty state
        liveSection.style.display = 'none';
        frontSection.style.display = 'none';
        backSection.style.display = 'none';
        noMatchesMessage.style.display = 'block';
    } else {
        noMatchesMessage.style.display = 'none';
        
        // Populate LIVE matches
        if (matchData.live && matchData.live.length > 0) {
            liveSection.style.display = 'block';
            let liveHTML = '';
            matchData.live.forEach(match => {
                liveHTML += createMatchCard(match);
            });
            liveContainer.innerHTML = liveHTML;
        } else {
            liveSection.style.display = 'none';
        }

        // Populate Front matches
        if (matchData.front && matchData.front.length > 0) {
            frontSection.style.display = 'block';
            let frontHTML = '';
            matchData.front.forEach(match => {
                frontHTML += createMatchCard(match);
            });
            frontContainer.innerHTML = frontHTML;
        } else {
            frontSection.style.display = 'none';
        }

        // Populate Back matches
        if (matchData.back && matchData.back.length > 0) {
            backSection.style.display = 'block';
            let backHTML = '';
            matchData.back.forEach(match => {
                backHTML += createMatchCard(match);
            });
            backContainer.innerHTML = backHTML;
        } else {
            backSection.style.display = 'none';
        }
    }

    // Populate referee suggestions
    populateRefereeSuggestions();

    // Restore scroll position
    if (scrollContainer && initialScrollTop > 0) {
        scrollContainer.scrollTop = initialScrollTop;
    }

    // Show modal
    modal.style.display = 'flex';
    
    // Set up event handlers
    const closeModal = () => {
        modal.style.display = 'none';
        okBtn.onclick = null; // Clean up
    };
    
    okBtn.onclick = closeModal;
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Helper functions for match command center actions

function completeMatchFromCommandCenter(matchId, playerNumber) {
    // Find the match
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        return;
    }
    
    // Store reference to command center being open
    window.commandCenterWasOpen = true;
    
    // Close the command center modal
    const modal = document.getElementById('matchCommandCenterModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Complete match with selected winner
    if (typeof selectWinner === 'function') {
        selectWinner(matchId, playerNumber);
    }
}


// Export Command Center functions
if (typeof window !== 'undefined') {
    window.showMatchCommandCenter = showMatchCommandCenter;
    window.completeMatchFromCommandCenter = completeMatchFromCommandCenter;
    window.createMatchCard = createMatchCard;
    window.getMatchFormatDescription = getMatchFormatDescription;
    window.getRoundDescription = getRoundDescription;
}

// --- END: Match Command Center Implementation ---

// UNDO SYSTEM FUNCTIONS - Refactored for Transactional History



