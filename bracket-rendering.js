// bracket-rendering.js - Simplified Version Without Lines

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
    renderCleanDoubleElimination();
}

function clearBracket() {
    const matchesContainer = document.getElementById('bracketMatches');
    const linesContainer = document.getElementById('bracketLines');
    
    if (matchesContainer) {
        matchesContainer.innerHTML = '';
    }
    if (linesContainer) {
        linesContainer.innerHTML = ''; // Keep for compatibility, but won't be used
    }
}

function renderCleanDoubleElimination() {
    const bracketSize = tournament.bracketSize;
    const structure = calculateBracketStructure(bracketSize);

    // Define grid parameters - reduced center buffer for tighter layout
    const grid = {
        matchWidth: 200,      // Slightly wider cards
        matchHeight: 100,     // Slightly taller cards
        horizontalSpacing: 150, // More space between rounds
        verticalSpacing: 80,   // More space between matches
        canvasWidth: 3000,
        canvasHeight: 1200,
        centerX: 1500,
        centerY: 600,
        centerBuffer: 75      // Reduced for tight, compact layout
    };

    // Render all bracket sections
    renderFrontsideGrid(structure.frontside, grid);
    renderBacksideGrid(structure.backside, grid);
    renderFinalGrid(grid);
    
    // Render clean titles
    renderCleanTitles(structure, grid);
    
    // Add visual flow indicators instead of lines
    addFlowIndicators(structure, grid);
}

function renderFrontsideGrid(frontsideStructure, grid) {
    frontsideStructure.forEach((roundInfo, roundIndex) => {
        const frontsideMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === roundInfo.round
        );

        // Position: Center flowing RIGHT
        const roundX = grid.centerX + grid.centerBuffer + roundIndex * (grid.matchWidth + grid.horizontalSpacing);

        if (frontsideMatches.length === 1) {
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderEnhancedMatch(frontsideMatches[0], roundX, matchY, 'frontside', roundIndex);
        } else {
            const totalNeededHeight = frontsideMatches.length * grid.matchHeight + (frontsideMatches.length - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);

            frontsideMatches.forEach((match, matchIndex) => {
                const matchY = startY + matchIndex * (grid.matchHeight + grid.verticalSpacing);
                renderEnhancedMatch(match, roundX, matchY, 'frontside', roundIndex);
            });
        }
    });
}

function renderBacksideGrid(backsideStructure, grid) {
    backsideStructure.forEach((roundInfo, roundIndex) => {
        const backsideMatches = matches.filter(m =>
            m.side === 'backside' && m.round === roundInfo.round
        );

        if (backsideMatches.length === 0) return;

        // FIXED: Use proper positioning for double elimination backside
        let roundX;
        
        if (tournament.bracketSize === 8) {
            // 8-player: 4 rounds total
            const positions = [1, 2, 3, 4]; 
            roundX = grid.centerX - grid.centerBuffer - positions[roundIndex] * (grid.matchWidth + grid.horizontalSpacing);
        } else if (tournament.bracketSize === 16) {
            // 16-player: 5 rounds total - the 5th round feeds into BS-FINAL
            const positions = [1, 2, 3, 4, 5]; 
            roundX = grid.centerX - grid.centerBuffer - positions[roundIndex] * (grid.matchWidth + grid.horizontalSpacing);
        } else {
            // Fallback for larger brackets
            roundX = grid.centerX - grid.centerBuffer - (roundIndex + 1) * (grid.matchWidth + grid.horizontalSpacing);
        }

        if (backsideMatches.length === 1) {
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderEnhancedMatch(backsideMatches[0], roundX, matchY, 'backside', roundIndex);
        } else {
            const totalNeededHeight = backsideMatches.length * grid.matchHeight + (backsideMatches.length - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);

            backsideMatches.forEach((match, matchIndex) => {
                const matchY = startY + matchIndex * (grid.matchHeight + grid.verticalSpacing);
                renderEnhancedMatch(match, roundX, matchY, 'backside', roundIndex);
            });
        }
    });
}

function renderFinalGrid(grid) {
    const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
    const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');

    // Position finals to the FAR RIGHT with generous vertical spacing
    const finalsX = grid.centerX + grid.centerBuffer + 4 * (grid.matchWidth + grid.horizontalSpacing);
    const backsideFinalY = grid.centerY - 80; // Above center
    const grandFinalY = grid.centerY + 80;    // Below center (more breathing room)

    if (backsideFinal) {
        renderEnhancedMatch(backsideFinal, finalsX, backsideFinalY, 'final', 0);
    }

    if (grandFinal) {
        renderEnhancedMatch(grandFinal, finalsX, grandFinalY, 'grand-final', 0);
    }
}

function renderEnhancedMatch(match, x, y, section, roundIndex) {
    const matchElement = document.createElement('div');
    
    // Use new state-based CSS classes
    const stateClasses = getMatchStateClasses ? getMatchStateClasses(match) : 
        `bracket-match ${match.active ? 'active' : ''} ${match.completed ? 'completed' : ''}`;
    
    // Enhanced styling based on match importance and section
    let extraClasses = '';
    if (match.id === 'GRAND-FINAL') {
        extraClasses = 'grand-final-match';
    } else if (match.id === 'BS-FINAL') {
        extraClasses = 'backside-final-match';
    } else if (section === 'frontside' && roundIndex >= 2) {
        extraClasses = 'important-match';
    }

    matchElement.className = `${stateClasses} ${extraClasses}`;
    matchElement.style.left = x + 'px';
    matchElement.style.top = y + 'px';
    matchElement.id = `bracket-match-${match.id}`;

    const availableReferees = getAvailableReferees(match.id);
    const refereeOptions = availableReferees.map(ref =>
        `<option value="${ref.id}" ${match.referee?.id === ref.id ? 'selected' : ''}>${ref.name}</option>`
    ).join('');

    // Add round indicator for better visual flow
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

    // Get current match state for UI decisions
    const matchState = getMatchState ? getMatchState(match) : 
        (match.completed ? 'completed' : match.active ? 'live' : 'ready');
    
    const buttonText = getMatchButtonText ? getMatchButtonText(match) : 
        (match.active ? 'LIVE' : 'Start');
    
    const buttonDisabled = matchState === 'pending' || matchState === 'completed';
    const buttonColor = matchState === 'live' ? '#ff6b35' : 
                       matchState === 'completed' ? '#28a745' : 
                       matchState === 'pending' ? '#6c757d' : '#ddd';
    const buttonTextColor = matchState === 'live' || matchState === 'completed' ? 'white' : 'black';

    // Generate lane options using new lane management system
    const laneOptions = typeof generateLaneOptions === 'function' ? 
        generateLaneOptions(match.id, match.lane) :
        // Fallback to old system if lane management not available
        Array.from({length: 10}, (_, i) => i + 1).map(lane =>
            `<option value="${lane}" ${match.lane === lane ? 'selected' : ''}>${lane}</option>`
        ).join('');

    // Lane conflict warning
    const hasLaneConflict = match.lane && typeof isLaneInUse === 'function' && 
                           isLaneInUse(match.lane, match.id) && matchState === 'live';
    const laneWarning = hasLaneConflict ? 
        '<span style="color: red; font-size: 8px;">⚠️</span>' : '';

    matchElement.innerHTML = `
        <div class="match-header">
            <span>${match.id}</span>
            ${roundIndicator}
            <span class="match-info">
                L<select onchange="updateMatchLaneEnhanced('${match.id}', this.value)" 
                         style="background: white; border: 1px solid #ddd; font-size: 11px; width: 40px; padding: 2px; ${hasLaneConflict ? 'border-color: red;' : ''}">
                    ${laneOptions}
                </select>${laneWarning} | Bo${match.legs}
            </span>
        </div>
        <div class="match-players">
            <div class="match-player ${match.player1?.isBye ? 'bye' : 'first-throw'} ${match.winner?.id === match.player1?.id ? 'winner' : ''} ${canSelectWinner && !canSelectWinner(match, 1) ? 'disabled' : ''}"
                 onclick="${getPlayerClickHandler(match, 1, matchState)}">
                <span class="player-name-short">${getPlayerDisplayName(match.player1)}</span>
                ${match.winner?.id === match.player1?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
            <div class="match-player ${match.player2?.isBye ? 'bye' : ''} ${match.winner?.id === match.player2?.id ? 'winner' : ''} ${canSelectWinner && !canSelectWinner(match, 2) ? 'disabled' : ''}"
                 onclick="${getPlayerClickHandler(match, 2, matchState)}">
                <span class="player-name-short">${getPlayerDisplayName(match.player2)}</span>
                ${match.winner?.id === match.player2?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
        </div>
        <div class="match-controls">
            <select onchange="updateReferee('${match.id}', this.value)" style="font-size: 11px; max-width: 90px; padding: 2px; background: white; border: 1px solid #ddd;">
                <option value="">No ref</option>
                ${refereeOptions}
            </select>
            <button onclick="${getButtonClickHandlerEnhanced(matchState, match.id)}" 
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

function renderCleanTitles(structure, grid) {
    // Remove any existing titles
    document.querySelectorAll('.bracket-title').forEach(title => title.remove());

    const frontsideTitle = document.createElement('div');
    frontsideTitle.className = 'bracket-title front';
    frontsideTitle.textContent = 'FRONTSIDE';
    
    const backsideTitle = document.createElement('div');
    backsideTitle.className = 'bracket-title back';
    backsideTitle.textContent = 'BACKSIDE';

    // Position titles higher and more prominently
    const titleY = 100;
    
    frontsideTitle.style.position = 'absolute';
    frontsideTitle.style.left = (grid.centerX + grid.centerBuffer + 100) + 'px';
    frontsideTitle.style.top = titleY + 'px';
    
    backsideTitle.style.position = 'absolute';
    backsideTitle.style.left = (grid.centerX - grid.centerBuffer - 300) + 'px';
    backsideTitle.style.top = titleY + 'px';

    document.getElementById('bracketCanvas').appendChild(frontsideTitle);
    document.getElementById('bracketCanvas').appendChild(backsideTitle);
}

function addFlowIndicators(structure, grid) {
    // Add FINALS title to the far right
    const finalsTitle = document.createElement('div');
    finalsTitle.className = 'bracket-title finals';
    finalsTitle.textContent = 'FINALS';
    finalsTitle.style.position = 'absolute';
    
    // Position title above the finals matches
    const finalsX = grid.centerX + grid.centerBuffer + 4 * (grid.matchWidth + grid.horizontalSpacing);
    finalsTitle.style.left = (finalsX + (grid.matchWidth / 2) - 50) + 'px'; // Center title above matches
    finalsTitle.style.top = '100px';
    finalsTitle.style.fontSize = '28px';
    finalsTitle.style.color = '#ff6b35';

    document.getElementById('bracketCanvas').appendChild(finalsTitle);
}

// Keep existing helper functions
function getPlayerDisplayName(player) {
    if (!player) return 'TBD';
    if (player.name === 'TBD') return 'TBD';
    if (player.isBye) return 'Walkover';
    
    // Handle placeholder names
    if (player.name === 'Frontside Runner-up' || player.name === 'Backside Winner' || 
        player.name === 'Frontside Winner' || player.name === 'Backside Champion' ||
        player.name.includes('Frontside') || player.name.includes('Backside')) {
        
        if (player.id && typeof player.id === 'number') {
            const realPlayer = players.find(p => p.id === player.id);
            if (realPlayer) {
                return realPlayer.name;
            }
        }
        
        if (player.id === 'fs-runnerup') {
            const frontsideRounds = Math.ceil(Math.log2(tournament.bracketSize));
            const frontsideFinal = matches.find(m => 
                m.side === 'frontside' && 
                m.round === frontsideRounds &&
                m.completed === true
            );
            
            if (frontsideFinal && frontsideFinal.loser) {
                return frontsideFinal.loser.name;
            }
        }
        
        if (player.name.length > 12) {
            return player.name.substring(0, 12) + '...';
        }
        return player.name;
    }
    
    return player.name;
}

// Keep all existing zoom and pan functionality
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

/**
 * Get the appropriate click handler for player selection based on match state
 */
function getPlayerClickHandler(match, playerNumber, matchState) {
    if (matchState === 'live') {
        // Use new validation function if available, fallback to old function
        const functionName = typeof selectWinnerWithValidation !== 'undefined' ? 
            'selectWinnerWithValidation' : 'selectWinner';
        return `${functionName}('${match.id}', ${playerNumber})`;
    }
    return ''; // No click handler for non-live matches
}

/**
 * Get the appropriate click handler for the match button based on state
 */
function getButtonClickHandler(matchState, matchId) {
    if (matchState === 'pending' || matchState === 'completed') {
        return ''; // No action for pending or completed matches
    }
    
    // Use new validation function if available, fallback to old function
    const functionName = typeof toggleActiveWithValidation !== 'undefined' ? 
        'toggleActiveWithValidation' : 'toggleActive';
    return `${functionName}('${matchId}')`;
}

/**
 * Enhanced lane update function wrapper
 */
function updateMatchLaneEnhanced(matchId, newLane) {
    // Use new validation function if available
    if (typeof updateMatchLaneWithValidation === 'function') {
        return updateMatchLaneWithValidation(matchId, newLane);
    } else {
        // Fallback to original function
        return updateMatchLane(matchId, newLane);
    }
}

/**
 * Enhanced button click handler
 */
function getButtonClickHandlerEnhanced(matchState, matchId) {
    if (matchState === 'pending' || matchState === 'completed') {
        return ''; // No action for pending or completed matches
    }
    
    // Use lane validation function if available
    if (typeof toggleActiveWithLaneValidation === 'function') {
        return `toggleActiveWithLaneValidation('${matchId}')`;
    } else if (typeof toggleActiveWithValidation === 'function') {
        return `toggleActiveWithValidation('${matchId}')`;
    } else {
        return `toggleActive('${matchId}')`;
    }
}

// Add these global functions to make them available
if (typeof window !== 'undefined') {
    window.updateMatchLaneEnhanced = updateMatchLaneEnhanced;
    window.getButtonClickHandlerEnhanced = getButtonClickHandlerEnhanced;
}