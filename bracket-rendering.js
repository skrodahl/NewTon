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
    document.getElementById('bracketMatches').innerHTML = '';
    document.getElementById('bracketLines').innerHTML = '';
}

function renderCompleteDoubleElimination() {
    const bracketSize = tournament.bracketSize;
    const structure = calculateBracketStructure(bracketSize);

    // Define grid parameters
    const grid = {
        matchWidth: 180,
        matchHeight: 80,
        horizontalSpacing: 100,
        verticalSpacing: 60,
        canvasWidth: 3000,
        canvasHeight: 1200,
        centerX: 1500,
        centerY: 600,
        centerBuffer: 250
    };

    // Render all bracket sections
    renderFrontsideGrid(structure.frontside, grid);
    renderBacksideGrid(structure.backside, grid);
    renderFinalGrid(grid);
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

        // Position: Center flowing LEFT with buffer zone
        const roundX = grid.centerX - grid.centerBuffer - roundIndex * (grid.matchWidth + grid.horizontalSpacing);

        if (backsideMatches.length === 1) {
            const matchY = grid.centerY - (grid.matchHeight / 2);
            renderGridMatch(backsideMatches[0], roundX, matchY);
        } else {
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

    const finalY = grid.centerY + 350;

    if (backsideFinal) {
        renderGridMatch(backsideFinal, grid.centerX - 150, finalY);
    }

    if (grandFinal) {
        renderGridMatch(grandFinal, grid.centerX - (grid.matchWidth / 2), finalY + 150);
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
                <span class="player-name-short">${match.player1?.name || 'TBD'}</span>
                ${match.winner?.id === match.player1?.id ? '<span class="winner-check">✓</span>' : ''}
            </div>
            <div class="match-player ${match.player2?.isBye ? 'bye' : ''} ${match.winner?.id === match.player2?.id ? 'winner' : ''}"
                 onclick="${match.player2?.isBye ? '' : `selectWinner('${match.id}', 2)`}">
                <span class="player-name-short">${match.player2?.name || 'TBD'}</span>
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
    drawFrontsideConnections(structure.frontside, grid);
    drawBacksideConnections(structure.backside, grid);
    drawLoserDropConnections(structure, grid);
    drawFinalConnections(grid);
}

function drawFrontsideConnections(frontsideStructure, grid) {
    for (let roundIndex = 0; roundIndex < frontsideStructure.length - 1; roundIndex++) {
        const currentRound = frontsideStructure[roundIndex];
        const nextRound = frontsideStructure[roundIndex + 1];

        const currentMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === currentRound.round
        );
        const nextMatches = matches.filter(m =>
            m.side === 'frontside' && m.round === nextRound.round
        );

        for (let i = 0; i < nextMatches.length; i++) {
            const match1 = currentMatches[i * 2];
            const match2 = currentMatches[i * 2 + 1];
            const nextMatch = nextMatches[i];

            if (match1 && match2 && nextMatch) {
                drawTournamentConnection(match1.id, match2.id, nextMatch.id);
            }
        }
    }
}

function drawBacksideConnections(backsideStructure, grid) {
    for (let roundIndex = 0; roundIndex < backsideStructure.length - 1; roundIndex++) {
        const currentRound = backsideStructure[roundIndex];
        const nextRound = backsideStructure[roundIndex + 1];

        const currentMatches = matches.filter(m =>
            m.side === 'backside' && m.round === currentRound.round
        );
        const nextMatches = matches.filter(m =>
            m.side === 'backside' && m.round === nextRound.round
        );

        currentMatches.forEach((currentMatch, index) => {
            const nextMatch = nextMatches[Math.floor(index / 2)];
            if (nextMatch) {
                drawSimpleConnection(currentMatch.id, nextMatch.id);
            }
        });
    }
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

function drawFinalConnections(grid) {
    const frontsideWinnerMatch = matches.find(m =>
        m.side === 'frontside' && m.round === Math.max(...matches.filter(m => m.side === 'frontside').map(m => m.round))
    );
    const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');

    if (frontsideWinnerMatch && grandFinal) {
        drawSimpleConnection(frontsideWinnerMatch.id, grandFinal.id);
    }

    const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
    if (backsideFinal && grandFinal) {
        drawSimpleConnection(backsideFinal.id, grandFinal.id);
    }
}

function drawTournamentConnection(match1Id, match2Id, nextMatchId) {
    const match1Element = document.getElementById(`bracket-match-${match1Id}`);
    const match2Element = document.getElementById(`bracket-match-${match2Id}`);
    const nextMatchElement = document.getElementById(`bracket-match-${nextMatchId}`);

    if (!match1Element || !match2Element || !nextMatchElement) return;

    const canvasRect = document.getElementById('bracketCanvas').getBoundingClientRect();

    const match1Rect = match1Element.getBoundingClientRect();
    const match2Rect = match2Element.getBoundingClientRect();
    const nextMatchRect = nextMatchElement.getBoundingClientRect();

    const match1Y = match1Rect.top - canvasRect.top + match1Rect.height / 2;
    const match2Y = match2Rect.top - canvasRect.top + match2Rect.height / 2;
    const nextMatchY = nextMatchRect.top - canvasRect.top + nextMatchRect.height / 2;
    const match1X = match1Rect.left - canvasRect.left + match1Rect.width;
    const nextMatchX = nextMatchRect.left - canvasRect.left;

    const connectorX = match1X + 40;

    createLine(match1X, match1Y, connectorX, match1Y);
    createLine(match1X, match2Y, connectorX, match2Y);
    createLine(connectorX, Math.min(match1Y, match2Y), connectorX, Math.max(match1Y, match2Y));
    createLine(connectorX, (match1Y + match2Y) / 2, nextMatchX, nextMatchY);
}

function drawSimpleConnection(fromMatchId, toMatchId) {
    const fromElement = document.getElementById(`bracket-match-${fromMatchId}`);
    const toElement = document.getElementById(`bracket-match-${toMatchId}`);

    if (!fromElement || !toElement) return;

    const canvasRect = document.getElementById('bracketCanvas').getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const fromX = fromRect.left - canvasRect.left + fromRect.width;
    const fromY = fromRect.top - canvasRect.top + fromRect.height / 2;
    const toX = toRect.left - canvasRect.left;
    const toY = toRect.top - canvasRect.top + toRect.height / 2;

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

function createLine(x1, y1, x2, y2) {
    const line = document.createElement('div');
    line.className = 'bracket-line';
    line.style.position = 'absolute';
    line.style.background = '#333333';
    line.style.zIndex = '1';

    if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
        line.style.left = Math.min(x1, x2) + 'px';
        line.style.top = y1 + 'px';
        line.style.width = Math.abs(x2 - x1) + 'px';
        line.style.height = '3px';
    } else {
        line.style.left = x1 + 'px';
        line.style.top = Math.min(y1, y2) + 'px';
        line.style.width = '3px';
        line.style.height = Math.abs(y2 - y1) + 'px';
    }

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
