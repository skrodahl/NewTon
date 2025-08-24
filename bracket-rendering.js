// bracket-rendering.js - Bracket Display and Visualization

// Zoom and pan variables
let zoomLevel = 0.6;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };

function initializeBracketControls() {
    // Bracket zoom and pan controls
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
    renderCompleteDoubleElimination();
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

function renderCompleteDoubleElimination() {
    const bracketSize = tournament.bracketSize;
    const structure = calculateBracketStructure(bracketSize);

    // Define grid parameters
    const grid = {
        matchWidth: 180,
        matchHeight: 90, // Updated to match our new sizing
        horizontalSpacing: 100,
        verticalSpacing: 60,
        canvasWidth: 3000,
        canvasHeight: 1200,
        centerX: 1500,
        centerY: 600,
        centerBuffer: 250
    };

    // Calculate the actual bounds of where matches will be placed
    const bounds = calculateMatchBounds(structure, grid);

    // Render all bracket sections
    renderFrontsideGrid(structure.frontside, grid);
    renderBacksideGrid(structure.backside, grid);
    renderFinalGrid(grid);
    
    // Render title text with smart positioning based on actual match positions
    renderSmartTitles(bounds, grid);
    
    renderAllConnections(structure, grid);
}

function renderFrontsideGrid(frontsideStructure, grid) {
    frontsideStructure.forEach((roundInfo, roundIndex) => {
        const frontsideMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === roundInfo.round
        );

        // Position: Center flowing RIGHT with buffer zone
        const roundX = grid.centerX + grid.centerBuffer + roundIndex * (grid.matchWidth + grid.horizontalSpacing);

        if (frontsideMatches.length === 1) {
            // Final/semi-final match - center it vertically
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderGridMatch(frontsideMatches[0], roundX, matchY);
        } else {
            // Multiple matches - use generous spacing
            const totalNeededHeight = frontsideMatches.length * grid.matchHeight + (frontsideMatches.length - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);

            frontsideMatches.forEach((match, matchIndex) => {
                const matchY = startY + matchIndex * (grid.matchHeight + grid.verticalSpacing);
                renderGridMatch(match, roundX, matchY);
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

        // CORRECTED: Backside flows CENTER → LEFT (toward outside)
        // Round 1 starts near center, later rounds move further left
        const roundX = grid.centerX - grid.centerBuffer - roundIndex * (grid.matchWidth + grid.horizontalSpacing);

        // Calculate Y position - simpler approach
        if (backsideMatches.length === 1) {
            // Single match - center it vertically
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderGridMatch(backsideMatches[0], roundX, matchY);
        } else {
            // Multiple matches - distribute vertically around center
            const totalNeededHeight = backsideMatches.length * grid.matchHeight + (backsideMatches.length - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);

            backsideMatches.forEach((match, matchIndex) => {
                const matchY = startY + matchIndex * (grid.matchHeight + grid.verticalSpacing);
                renderGridMatch(match, roundX, matchY);
            });
        }
    });
}

function renderFinalGrid(grid) {
    const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
    const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');

    // Position finals in the center area, below the main bracket
    const finalY = grid.centerY + 200; // Moved up from 350 to 200
    const grandFinalY = finalY + 120;   // Closer spacing

    if (backsideFinal) {
        // Position backside final in the center-left
        const backsideFinalX = grid.centerX - (grid.matchWidth / 2) - 100;
        renderGridMatch(backsideFinal, backsideFinalX, finalY);
    }

    if (grandFinal) {
        // Position grand final in the center
        const grandFinalX = grid.centerX - (grid.matchWidth / 2);
        renderGridMatch(grandFinal, grandFinalX, grandFinalY);
    }
}

function renderGridMatch(match, x, y) {
    const matchElement = document.createElement('div');
    matchElement.className = `bracket-match ${match.active ? 'active' : ''} ${match.completed ? 'completed' : ''}`;
    matchElement.style.left = x + 'px';
    matchElement.style.top = y + 'px';
    matchElement.id = `bracket-match-${match.id}`;

    const availableReferees = getAvailableReferees(match.id);
    const refereeOptions = availableReferees.map(ref =>
        `<option value="${ref.id}" ${match.referee?.id === ref.id ? 'selected' : ''}>${ref.name}</option>`
    ).join('');

    matchElement.innerHTML = `
        <div class="match-header">
            <span>${match.id}</span>
            <span class="match-info">
                L<select onchange="updateMatchLane('${match.id}', this.value)" style="background: white; border: 1px solid #ddd; font-size: 11px; width: 40px; padding: 2px;">
                    ${Array.from({length: 10}, (_, i) => i + 1).map(lane =>
                        `<option value="${lane}" ${match.lane === lane ? 'selected' : ''}>${lane}</option>`
                    ).join('')}
                </select> | Bo${match.legs}
            </span>
        </div>
        <div class="match-players">
            <div class="match-player ${match.player1?.isBye ? 'bye' : 'first-throw'} ${match.winner?.id === match.player1?.id ? 'winner' : ''}"
                 onclick="${match.player1?.isBye ? '' : `selectWinner('${match.id}', 1)`}">
                <span class="player-name-short">${getPlayerDisplayName(match.player1)}</span>
                ${match.winner?.id === match.player1?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
            <div class="match-player ${match.player2?.isBye ? 'bye' : ''} ${match.winner?.id === match.player2?.id ? 'winner' : ''}"
                 onclick="${match.player2?.isBye ? '' : `selectWinner('${match.id}', 2)`}">
                <span class="player-name-short">${getPlayerDisplayName(match.player2)}</span>
                ${match.winner?.id === match.player2?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
        </div>
        <div class="match-controls">
            <select onchange="updateReferee('${match.id}', this.value)" style="font-size: 11px; max-width: 80px; padding: 2px; background: white; border: 1px solid #ddd;">
                <option value="">No ref</option>
                ${refereeOptions}
            </select>
            <button onclick="toggleActive('${match.id}')" style="font-size: 8px; padding: 2px 4px; border: none; border-radius: 2px; background: ${match.active ? '#ff6b35' : '#ddd'}; color: ${match.active ? 'white' : 'black'};">
                ${match.active ? 'LIVE' : 'Start'}
            </button>
        </div>
    `;

    document.getElementById('bracketMatches').appendChild(matchElement);
}

function renderAllConnections(structure, grid) {
    document.getElementById('bracketLines').innerHTML = '';
    
    // Add small delay to ensure DOM elements are fully rendered
    setTimeout(() => {
        drawFrontsideConnections(structure.frontside);
        drawBacksideConnections(structure.backside);
        drawFinalConnections();
    }, 100);
}

function drawFrontsideConnections(frontsideStructure) {
    frontsideStructure.forEach((roundInfo, roundIndex) => {
        // Skip the last round (it connects to finals)
        if (roundIndex === frontsideStructure.length - 1) return;
        
        const currentMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === roundInfo.round
        ).sort((a, b) => a.positionInRound - b.positionInRound);
        
        const nextRoundMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === (roundInfo.round + 1)
        ).sort((a, b) => a.positionInRound - b.positionInRound);

        // Connect pairs of current matches to next match
        for (let i = 0; i < nextRoundMatches.length; i++) {
            const match1 = currentMatches[i * 2];
            const match2 = currentMatches[i * 2 + 1];
            const nextMatch = nextRoundMatches[i];

            if (match1 && nextMatch) {
                if (match2) {
                    // Two matches connecting to one
                    drawBracketConnection(match1.id, match2.id, nextMatch.id, 'frontside');
                } else {
                    // One match connecting to next
                    drawDirectConnection(match1.id, nextMatch.id);
                }
            }
        }
    });
}

function drawBacksideConnections(backsideStructure) {
    backsideStructure.forEach((roundInfo, roundIndex) => {
        // Skip the last round (it connects to finals)
        if (roundIndex === backsideStructure.length - 1) return;
        
        const currentMatches = matches.filter(m =>
            m.side === 'backside' && m.round === roundInfo.round
        ).sort((a, b) => a.positionInRound - b.positionInRound);
        
        const nextRoundMatches = matches.filter(m =>
            m.side === 'backside' && m.round === (roundInfo.round + 1)
        ).sort((a, b) => a.positionInRound - b.positionInRound);

        // Connect pairs of current matches to next match
        for (let i = 0; i < nextRoundMatches.length; i++) {
            const match1 = currentMatches[i * 2];
            const match2 = currentMatches[i * 2 + 1];
            const nextMatch = nextRoundMatches[i];

            if (match1 && nextMatch) {
                if (match2) {
                    // Two matches connecting to one
                    drawBracketConnection(match1.id, match2.id, nextMatch.id, 'backside');
                } else {
                    // One match connecting to next
                    drawDirectConnection(match1.id, nextMatch.id);
                }
            }
        }
    });
}

function drawLoserDropConnections(structure, grid) {
    structure.frontside.forEach((frontsideRound, index) => {
        if (index === structure.frontside.length - 1) return;

        const frontsideMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === frontsideRound.round
        );

        const targetBacksideRound = index * 2 + 2;
        const backsideMatches = matches.filter(m =>
            m.side === 'backside' && m.round === targetBacksideRound
        );

        frontsideMatches.forEach((fsMatch, fsIndex) => {
            const bsMatch = backsideMatches[Math.floor(fsIndex / 2)];
            if (bsMatch) {
                drawLoserDropLine(fsMatch.id, bsMatch.id);
            }
        });
    });
}

function drawFinalConnections() {
    // Find the final matches
    const frontsideRounds = Math.ceil(Math.log2(tournament.bracketSize));
    const backsideRounds = frontsideRounds - 1;
    
    const frontsideFinal = matches.find(m =>
        m.side === 'frontside' && m.round === frontsideRounds
    );
    
    const backsideFinal = matches.find(m =>
        m.side === 'backside' && m.round === backsideRounds
    );
    
    const bsFinalMatch = matches.find(m => m.id === 'BS-FINAL');
    const grandFinalMatch = matches.find(m => m.id === 'GRAND-FINAL');

    // Connect frontside final to grand final
    if (frontsideFinal && grandFinalMatch) {
        drawDirectConnection(frontsideFinal.id, grandFinalMatch.id);
    }

    // Connect backside final to BS-FINAL
    if (backsideFinal && bsFinalMatch) {
        drawDirectConnection(backsideFinal.id, bsFinalMatch.id);
    }

    // Connect BS-FINAL to grand final
    if (bsFinalMatch && grandFinalMatch) {
        drawDirectConnection(bsFinalMatch.id, grandFinalMatch.id);
    }
}

function drawTournamentConnection(match1Id, match2Id, nextMatchId) {
    // Handle single match to next match (when match2Id is undefined)
    if (!match2Id) {
        if (match1Id && nextMatchId) {
            drawSimpleConnection(match1Id, nextMatchId);
        }
        return;
    }

    // Handle pair of matches to next match
    const match1Element = document.getElementById(`bracket-match-${match1Id}`);
    const match2Element = document.getElementById(`bracket-match-${match2Id}`);
    const nextMatchElement = document.getElementById(`bracket-match-${nextMatchId}`);

    if (!match1Element || !match2Element || !nextMatchElement) {
        // Fallback to simple connection if elements missing
        if (match1Element && nextMatchElement) {
            drawSimpleConnection(match1Id, nextMatchId);
        }
        return;
    }

    const canvasRect = document.getElementById('bracketCanvas').getBoundingClientRect();

    // Get positions of all three matches
    const match1Rect = match1Element.getBoundingClientRect();
    const match2Rect = match2Element.getBoundingClientRect();
    const nextMatchRect = nextMatchElement.getBoundingClientRect();

    // Calculate connection points
    const match1Y = match1Rect.top - canvasRect.top + match1Rect.height / 2;
    const match2Y = match2Rect.top - canvasRect.top + match2Rect.height / 2;
    const nextMatchY = nextMatchRect.top - canvasRect.top + nextMatchRect.height / 2;
    
    const match1X = match1Rect.left - canvasRect.left + match1Rect.width;
    const match2X = match2Rect.left - canvasRect.left + match2Rect.width;
    const nextMatchX = nextMatchRect.left - canvasRect.left;

    // Determine connection style based on bracket side
    const isBackside = nextMatchX < Math.max(match1X, match2X);
    
    if (isBackside) {
        // Backside connections (right to left)
        const connectorX = Math.min(match1X, match2X) - 40;
        
        createLine(match1X, match1Y, connectorX, match1Y);
        createLine(match2X, match2Y, connectorX, match2Y);
        createLine(connectorX, Math.min(match1Y, match2Y), connectorX, Math.max(match1Y, match2Y));
        createLine(connectorX, (match1Y + match2Y) / 2, nextMatchX + match1Rect.width, nextMatchY);
    } else {
        // Frontside connections (left to right)
        const connectorX = Math.max(match1X, match2X) + 40;
        
        createLine(match1X, match1Y, connectorX, match1Y);
        createLine(match2X, match2Y, connectorX, match2Y);
        createLine(connectorX, Math.min(match1Y, match2Y), connectorX, Math.max(match1Y, match2Y));
        createLine(connectorX, (match1Y + match2Y) / 2, nextMatchX, nextMatchY);
    }
}

function drawSimpleConnection(fromMatchId, toMatchId) {
    const fromElement = document.getElementById(`bracket-match-${fromMatchId}`);
    const toElement = document.getElementById(`bracket-match-${toMatchId}`);

    if (!fromElement || !toElement) return;

    const canvasRect = document.getElementById('bracketCanvas').getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    // Determine connection points based on relative positions
    let fromX, fromY, toX, toY;
    
    const fromCenterX = fromRect.left - canvasRect.left + fromRect.width / 2;
    const toCenterX = toRect.left - canvasRect.left + toRect.width / 2;
    
    if (fromCenterX < toCenterX) {
        // Left to right (frontside)
        fromX = fromRect.left - canvasRect.left + fromRect.width;
        toX = toRect.left - canvasRect.left;
    } else {
        // Right to left (backside)
        fromX = fromRect.left - canvasRect.left;
        toX = toRect.left - canvasRect.left + toRect.width;
    }
    
    fromY = fromRect.top - canvasRect.top + fromRect.height / 2;
    toY = toRect.top - canvasRect.top + toRect.height / 2;

    createLine(fromX, fromY, toX, toY);
}

function drawLoserDropLine(fromMatchId, toMatchId) {
    const fromElement = document.getElementById(`bracket-match-${fromMatchId}`);
    const toElement = document.getElementById(`bracket-match-${toMatchId}`);

    if (!fromElement || !toElement) return;

    const canvasRect = document.getElementById('bracketCanvas').getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const fromX = fromRect.left - canvasRect.left + fromRect.width / 2;
    const fromY = fromRect.top - canvasRect.top + fromRect.height;
    const toX = toRect.left - canvasRect.left + toRect.width / 2;
    const toY = toRect.top - canvasRect.top;

    const line = document.createElement('div');
    line.className = 'bracket-line';
    line.style.position = 'absolute';
    line.style.background = '#ff6b35';

    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    line.style.width = length + 'px';
    line.style.height = '0px';
    line.style.borderBottom = '2px dashed #ff6b35';
    line.style.left = fromX + 'px';
    line.style.top = fromY + 'px';
    line.style.transformOrigin = '0 0';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.zIndex = '1';

    document.getElementById('bracketLines').appendChild(line);
}

function drawLine(x1, y1, x2, y2) {
    const line = document.createElement('div');
    line.className = 'bracket-line';
    line.style.position = 'absolute';
    line.style.background = '#333333';
    line.style.zIndex = '1';

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    line.style.width = length + 'px';
    line.style.height = '2px';
    line.style.left = x1 + 'px';
    line.style.top = y1 + 'px';
    line.style.transformOrigin = '0 0';
    line.style.transform = `rotate(${angle}deg)`;

    document.getElementById('bracketLines').appendChild(line);
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

function calculateMatchBounds(structure, grid) {
    const bounds = {
        frontside: { minY: Infinity, maxY: -Infinity, minX: Infinity, maxX: -Infinity },
        backside: { minY: Infinity, maxY: -Infinity, minX: Infinity, maxX: -Infinity }
    };

    // Calculate frontside bounds (unchanged)
    structure.frontside.forEach((roundInfo, roundIndex) => {
        const roundX = grid.centerX + grid.centerBuffer + roundIndex * (grid.matchWidth + grid.horizontalSpacing);
        
        if (roundInfo.matches === 1) {
            const matchY = grid.centerY - (grid.matchHeight / 2);
            bounds.frontside.minY = Math.min(bounds.frontside.minY, matchY);
            bounds.frontside.maxY = Math.max(bounds.frontside.maxY, matchY + grid.matchHeight);
        } else {
            const totalNeededHeight = roundInfo.matches * grid.matchHeight + (roundInfo.matches - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);
            bounds.frontside.minY = Math.min(bounds.frontside.minY, startY);
            bounds.frontside.maxY = Math.max(bounds.frontside.maxY, startY + totalNeededHeight);
        }
        
        bounds.frontside.minX = Math.min(bounds.frontside.minX, roundX);
        bounds.frontside.maxX = Math.max(bounds.frontside.maxX, roundX + grid.matchWidth);
    });

    // Calculate backside bounds (simplified)
    structure.backside.forEach((roundInfo, roundIndex) => {
        const roundX = grid.centerX - grid.centerBuffer - roundIndex * (grid.matchWidth + grid.horizontalSpacing);
        
        if (roundInfo.matches === 1) {
            const matchY = grid.centerY - (grid.matchHeight / 2);
            bounds.backside.minY = Math.min(bounds.backside.minY, matchY);
            bounds.backside.maxY = Math.max(bounds.backside.maxY, matchY + grid.matchHeight);
        } else {
            const totalNeededHeight = roundInfo.matches * grid.matchHeight + (roundInfo.matches - 1) * grid.verticalSpacing;
            const startY = grid.centerY - (totalNeededHeight / 2);
            bounds.backside.minY = Math.min(bounds.backside.minY, startY);
            bounds.backside.maxY = Math.max(bounds.backside.maxY, startY + totalNeededHeight);
        }
        
        bounds.backside.minX = Math.min(bounds.backside.minX, roundX);
        bounds.backside.maxX = Math.max(bounds.backside.maxX, roundX + grid.matchWidth);
    });

    return bounds;
}

function renderSmartTitles(bounds, grid) {
    // Remove any existing titles
    document.querySelectorAll('.bracket-title').forEach(title => title.remove());

    // Create new title elements with smart positioning
    const frontsideTitle = document.createElement('div');
    frontsideTitle.className = 'bracket-title front';
    frontsideTitle.textContent = 'FRONTSIDE';
    
    const backsideTitle = document.createElement('div');
    backsideTitle.className = 'bracket-title back';
    backsideTitle.textContent = 'BACKSIDE';

    // Position titles above the matches, but not too high
    const titleY = Math.max(50, bounds.frontside.minY - 80); // At least 50px from top, 80px above matches
    
    // Frontside title - positioned above the rightmost part of frontside matches
    const frontsideCenterX = (bounds.frontside.minX + bounds.frontside.maxX) / 2;
    frontsideTitle.style.position = 'absolute';
    frontsideTitle.style.left = (frontsideCenterX - 100) + 'px'; // Center the text (approximate)
    frontsideTitle.style.top = titleY + 'px';
    
    // Backside title - positioned above the leftmost part of backside matches  
    const backsideCenterX = (bounds.backside.minX + bounds.backside.maxX) / 2;
    backsideTitle.style.position = 'absolute';
    backsideTitle.style.left = (backsideCenterX - 100) + 'px'; // Center the text (approximate)
    backsideTitle.style.top = titleY + 'px';

    // Add to the bracket canvas
    document.getElementById('bracketCanvas').appendChild(frontsideTitle);
    document.getElementById('bracketCanvas').appendChild(backsideTitle);
}

function getDisplayName(player) {
    if (!player) return 'TBD';
    if (player.name === 'TBD') return 'TBD';
    if (player.isBye) return 'Walkover';
    
    // Handle placeholder text cases - show actual player name instead
    if (player.name === 'Frontside Runner-up' || player.name === 'Backside Winner' || 
        player.name === 'Frontside Winner' || player.name === 'Backside Champion') {
        // If it's a placeholder but we have an actual player, show the player name
        if (player.id && typeof player.id === 'number') {
            // This is an actual player with placeholder text - return their real name
            const actualPlayer = players.find(p => p.id === player.id);
            return actualPlayer ? actualPlayer.name : player.name;
        }
        return player.name; // Keep placeholder if no real player found
    }
    
    return player.name;
}

function getPlayerDisplayName(player) {
    if (!player) return 'TBD';
    if (player.name === 'TBD') return 'TBD';
    if (player.isBye) return 'Walkover';
    
    // Handle placeholder names - look up the actual player by ID
    if (player.name === 'Frontside Runner-up' || player.name === 'Backside Winner' || 
        player.name === 'Frontside Winner' || player.name === 'Backside Champion' ||
        player.name.includes('Frontside') || player.name.includes('Backside')) {
        
        // Check for numeric ID (real player with placeholder name)
        if (player.id && typeof player.id === 'number') {
            const realPlayer = players.find(p => p.id === player.id);
            if (realPlayer) {
                return realPlayer.name;
            }
        }
        
        // Check for string placeholder IDs like 'fs-runnerup'
        if (player.id === 'fs-runnerup' || player.id === 'bs-winner' || 
            player.id === 'fs-champion' || player.id === 'bs-champion') {
            
            // For frontside runner-up, find the player who lost the frontside final
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
            
            // For backside winner, find the winner of the last backside match
            if (player.id === 'bs-winner') {
                const backsideRounds = Math.ceil(Math.log2(tournament.bracketSize)) - 1;
                const backsideFinal = matches.find(m => 
                    m.side === 'backside' && 
                    m.round === backsideRounds &&
                    m.completed === true
                );
                
                if (backsideFinal && backsideFinal.winner) {
                    return backsideFinal.winner.name;
                }
            }
        }
        
        // If no real player found, return the placeholder (truncated for display)
        if (player.name.length > 12) {
            return player.name.substring(0, 12) + '...';
        }
        return player.name;
    }
    
    return player.name;
}

function drawBracketConnection(match1Id, match2Id, nextMatchId, side) {
    const match1El = document.getElementById(`bracket-match-${match1Id}`);
    const match2El = document.getElementById(`bracket-match-${match2Id}`);
    const nextMatchEl = document.getElementById(`bracket-match-${nextMatchId}`);

    if (!match1El || !match2El || !nextMatchEl) {
        // Fallback to direct connection
        if (match1El && nextMatchEl) {
            drawDirectConnection(match1Id, nextMatchId);
        }
        return;
    }

    const canvas = document.getElementById('bracketCanvas');
    const canvasRect = canvas.getBoundingClientRect();

    // Get match positions relative to canvas
    const match1Rect = match1El.getBoundingClientRect();
    const match2Rect = match2El.getBoundingClientRect();
    const nextMatchRect = nextMatchEl.getBoundingClientRect();

    const match1Y = match1Rect.top - canvasRect.top + match1Rect.height / 2;
    const match2Y = match2Rect.top - canvasRect.top + match2Rect.height / 2;
    const nextMatchY = nextMatchRect.top - canvasRect.top + nextMatchRect.height / 2;

    let match1X, match2X, nextMatchX, connectorX;

    if (side === 'frontside') {
        // Frontside: matches connect from right side, next match receives on left
        match1X = match1Rect.left - canvasRect.left + match1Rect.width;
        match2X = match2Rect.left - canvasRect.left + match2Rect.width;
        nextMatchX = nextMatchRect.left - canvasRect.left;
        connectorX = Math.max(match1X, match2X) + 30;
    } else {
        // Backside: matches connect from left side, next match receives on right
        match1X = match1Rect.left - canvasRect.left;
        match2X = match2Rect.left - canvasRect.left;
        nextMatchX = nextMatchRect.left - canvasRect.left + nextMatchRect.width;
        connectorX = Math.min(match1X, match2X) - 30;
    }

    // Draw the bracket connection
    drawLine(match1X, match1Y, connectorX, match1Y);
    drawLine(match2X, match2Y, connectorX, match2Y);
    drawLine(connectorX, Math.min(match1Y, match2Y), connectorX, Math.max(match1Y, match2Y));
    drawLine(connectorX, (match1Y + match2Y) / 2, nextMatchX, nextMatchY);
}

function drawDirectConnection(fromMatchId, toMatchId) {
    const fromEl = document.getElementById(`bracket-match-${fromMatchId}`);
    const toEl = document.getElementById(`bracket-match-${toMatchId}`);

    if (!fromEl || !toEl) return;

    const canvas = document.getElementById('bracketCanvas');
    const canvasRect = canvas.getBoundingClientRect();

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const fromCenterX = fromRect.left - canvasRect.left + fromRect.width / 2;
    const toCenterX = toRect.left - canvasRect.left + toRect.width / 2;

    let fromX, toX;
    if (fromCenterX < toCenterX) {
        // Left to right
        fromX = fromRect.left - canvasRect.left + fromRect.width;
        toX = toRect.left - canvasRect.left;
    } else {
        // Right to left
        fromX = fromRect.left - canvasRect.left;
        toX = toRect.left - canvasRect.left + toRect.width;
    }

    const fromY = fromRect.top - canvasRect.top + fromRect.height / 2;
    const toY = toRect.top - canvasRect.top + toRect.height / 2;

    drawLine(fromX, fromY, toX, toY);
}
