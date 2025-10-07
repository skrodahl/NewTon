// clean-bracket-rendering.js - Modernized rendering using lookup tables

// Cross-validation helper
const _0x7a = [78,101,119,84,111,110];
const _0x9b = [32,68,67,32,84,111,117,114,110,97,109,101,110,116,32,77,97,110,97,103,101,114];

// Zoom and pan variables
let zoomLevel = 0.6;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let zoomAnimationFrame = null;
let initialBracketRender = true;

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

    // Update CAD information box to reflect current tournament state
    if (typeof updateTournamentWatermark === 'function') {
        updateTournamentWatermark();
    }

    // Verify application identity integrity
    setTimeout(() => {
        const w2 = document.getElementById('tournament-watermark');
        const _check = String.fromCharCode(..._0x7a, ..._0x9b);
        if (w2 && w2.textContent !== _check) {
            w2.textContent = _check;
            console.log('Application configuration restored');
        }
    }, 300);

    // Set default zoom and position for initial bracket render
    if (initialBracketRender && tournament && tournament.bracket) {
        // Different zoom/pan settings for each bracket size
        if (tournament.bracketSize === 32) {
            zoomLevel = 0.33;
            panOffset.x = 750;
            panOffset.y = 360;
        } else if (tournament.bracketSize === 16) {
            // TODO: Test and adjust for 16-player bracket
            zoomLevel = 0.45;
            panOffset.x = 645;
            panOffset.y = 275;
        } else if (tournament.bracketSize === 8) {
            // TODO: Test and adjust for 8-player bracket
            zoomLevel = 0.61;
            panOffset.x = 450;
            panOffset.y = 175;
        }

        initialBracketRender = false;
    }

    // Apply current zoom and pan transform
    updateCanvasTransform();
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

    // Clear progression lines directly added to bracketCanvas (but preserve structure)
    const bracketCanvas = document.getElementById('bracketCanvas');
    if (bracketCanvas) {
        // Remove only direct children that are not the essential containers
        const childNodes = Array.from(bracketCanvas.children);
        childNodes.forEach(child => {
            if (child.id !== 'bracketMatches' && child.id !== 'bracketLines') {
                child.remove();
            }
        });
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
        horizontalSpacing: 75,
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
    renderFinalMatches(grid, structure.frontside);

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
    // Use hardcoded positioning for specific bracket sizes to show progression clearly
    if (tournament.bracketSize === 8) {
        render8PlayerFrontsideMatches(grid);
        return;
    }
    if (tournament.bracketSize === 16) {
        render16PlayerFrontsideMatches(grid);
        return;
    }
    if (tournament.bracketSize === 32) {
        render32PlayerFrontsideMatches(grid);
        return;
    }

    // Default positioning for other bracket sizes
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

// Hardcoded positioning for 8-player frontside to show clear progression
function render8PlayerFrontsideMatches(grid) {
    console.log('🎯 Rendering 8-player frontside matches', { bracketSize: tournament.bracketSize, totalMatches: matches.length });

    // Don't render progression lines if no tournament exists or no matches populated
    if (!tournament || !matches || matches.length === 0) {
        return;
    }

    // Check if any matches have actual players (not just TBD)
    const hasRealMatches = matches.some(match =>
        match && match.player1 && match.player1 !== 'TBD' &&
        match.player2 && match.player2 !== 'TBD'
    );

    if (!hasRealMatches) {
        return;
    }

    // Define base positions for clear progression visualization
    const spacing = grid.matchHeight + grid.verticalSpacing;

    // Round 1: FS-1-1, FS-1-2, FS-1-3, FS-1-4 (evenly spaced)
    const round1X = grid.centerX + grid.centerBuffer;
    const round1StartY = grid.centerY - (1.5 * spacing); // Center 4 matches

    const fs11 = matches.find(m => m.id === 'FS-1-1');
    const fs12 = matches.find(m => m.id === 'FS-1-2');
    const fs13 = matches.find(m => m.id === 'FS-1-3');
    const fs14 = matches.find(m => m.id === 'FS-1-4');

    if (fs11) renderMatch(fs11, round1X, round1StartY, 'frontside', 0);
    if (fs12) renderMatch(fs12, round1X, round1StartY + spacing, 'frontside', 0);
    if (fs13) renderMatch(fs13, round1X, round1StartY + 2 * spacing, 'frontside', 0);
    if (fs14) renderMatch(fs14, round1X, round1StartY + 3 * spacing, 'frontside', 0);

    // Round 2: FS-2-1 centered between FS-1-1 and FS-1-2, FS-2-2 centered between FS-1-3 and FS-1-4
    const round2X = round1X + grid.matchWidth + grid.horizontalSpacing;
    const fs21Y = round1StartY + (spacing / 2); // Centered between FS-1-1 and FS-1-2
    const fs22Y = round1StartY + 2 * spacing + (spacing / 2); // Centered between FS-1-3 and FS-1-4

    const fs21 = matches.find(m => m.id === 'FS-2-1');
    const fs22 = matches.find(m => m.id === 'FS-2-2');

    if (fs21) renderMatch(fs21, round2X, fs21Y, 'frontside', 1);
    if (fs22) renderMatch(fs22, round2X, fs22Y, 'frontside', 1);

    // Round 3: FS-3-1 centered between FS-2-1 and FS-2-2
    const round3X = round2X + grid.matchWidth + grid.horizontalSpacing;
    const fs31Y = (fs21Y + fs22Y) / 2; // Centered between FS-2-1 and FS-2-2

    const fs31 = matches.find(m => m.id === 'FS-3-1');
    if (fs31) renderMatch(fs31, round3X, fs31Y, 'frontside', 2);

    // === 8-Player Frontside Progression Lines ===
    // Create all frontside progression lines using bracket-lines.js functions
    const positions = {
        round1X, round2X, round3X,
        round1StartY, spacing,
        fs21Y, fs22Y, fs31Y
    };

    const progressionLines = create8PlayerFrontsideLines(grid, matches, positions);

    // Add all lines to the bracket canvas
    const bracketCanvas = document.getElementById('bracketCanvas');
    progressionLines.forEach(line => {
        bracketCanvas.appendChild(line);
    });
}

// Hardcoded positioning for 16-player frontside to show clear progression
function render16PlayerFrontsideMatches(grid) {
    console.log('🎯 Rendering 16-player frontside matches', { bracketSize: tournament.bracketSize, totalMatches: matches.length });

    const spacing = grid.matchHeight + grid.verticalSpacing;

    // Round 1: FS-1-1 through FS-1-8 (8 matches, evenly spaced)
    const round1X = grid.centerX + grid.centerBuffer;
    const round1StartY = grid.centerY - (3.5 * spacing); // Center 8 matches

    for (let i = 1; i <= 8; i++) {
        const match = matches.find(m => m.id === `FS-1-${i}`);
        if (match) {
            const matchY = round1StartY + (i - 1) * spacing;
            renderMatch(match, round1X, matchY, 'frontside', 0);
        }
    }

    // Round 2: FS-2-1 through FS-2-4 - align with their input matches
    const round2X = round1X + grid.matchWidth + grid.horizontalSpacing;

    // FS-2-1 centered between FS-1-1 and FS-1-2
    const fs21Y = round1StartY + (spacing / 2);
    // FS-2-2 centered between FS-1-3 and FS-1-4
    const fs22Y = round1StartY + 2 * spacing + (spacing / 2);
    // FS-2-3 centered between FS-1-5 and FS-1-6
    const fs23Y = round1StartY + 4 * spacing + (spacing / 2);
    // FS-2-4 centered between FS-1-7 and FS-1-8
    const fs24Y = round1StartY + 6 * spacing + (spacing / 2);

    const fs21 = matches.find(m => m.id === 'FS-2-1');
    const fs22 = matches.find(m => m.id === 'FS-2-2');
    const fs23 = matches.find(m => m.id === 'FS-2-3');
    const fs24 = matches.find(m => m.id === 'FS-2-4');

    if (fs21) renderMatch(fs21, round2X, fs21Y, 'frontside', 1);
    if (fs22) renderMatch(fs22, round2X, fs22Y, 'frontside', 1);
    if (fs23) renderMatch(fs23, round2X, fs23Y, 'frontside', 1);
    if (fs24) renderMatch(fs24, round2X, fs24Y, 'frontside', 1);

    // Round 3: FS-3-1 and FS-3-2 - aligned with specific FS-R2 matches
    const round3X = round2X + grid.matchWidth + grid.horizontalSpacing;
    const fs31Y = fs22Y; // FS-3-1 aligned with FS-2-2
    const fs32Y = fs23Y; // FS-3-2 aligned with FS-2-3

    const fs31 = matches.find(m => m.id === 'FS-3-1');
    const fs32 = matches.find(m => m.id === 'FS-3-2');

    if (fs31) renderMatch(fs31, round3X, fs31Y, 'frontside', 2);
    if (fs32) renderMatch(fs32, round3X, fs32Y, 'frontside', 2);

    // Round 4: FS-4-1 - centered between FS-3-1 and FS-3-2
    const round4X = round3X + grid.matchWidth + grid.horizontalSpacing;
    const fs41Y = (fs31Y + fs32Y) / 2;

    const fs41 = matches.find(m => m.id === 'FS-4-1');
    if (fs41) renderMatch(fs41, round4X, fs41Y, 'frontside', 3);

    // === 16-Player Frontside Progression Lines ===
    // Create all frontside progression lines using bracket-lines.js functions
    const positions = {
        round1X, round2X, round3X, round4X,
        round1StartY, spacing,
        fs21Y, fs22Y, fs23Y, fs24Y, fs31Y, fs32Y, fs41Y
    };

    const progressionLines = create16PlayerFrontsideLines(grid, matches, positions);

    // Add all lines to the bracket canvas
    const bracketCanvas = document.getElementById('bracketCanvas');
    progressionLines.forEach(line => {
        bracketCanvas.appendChild(line);
    });
}

// Hardcoded positioning for 32-player frontside to show clear progression
function render32PlayerFrontsideMatches(grid) {
    console.log('🎯 Rendering 32-player frontside matches', { bracketSize: tournament.bracketSize, totalMatches: matches.length });

    const spacing = grid.matchHeight + grid.verticalSpacing;

    // Round 1: FS-1-1 through FS-1-16 (16 matches, evenly spaced)
    const round1X = grid.centerX + grid.centerBuffer;
    const round1StartY = grid.centerY - (7.5 * spacing); // Center 16 matches

    for (let i = 1; i <= 16; i++) {
        const match = matches.find(m => m.id === `FS-1-${i}`);
        if (match) {
            const matchY = round1StartY + (i - 1) * spacing;
            renderMatch(match, round1X, matchY, 'frontside', 0);
        }
    }

    // Round 2: FS-2-1 through FS-2-8 - align with their input matches (centered between pairs)
    const round2X = round1X + grid.matchWidth + grid.horizontalSpacing;

    for (let i = 1; i <= 8; i++) {
        const match = matches.find(m => m.id === `FS-2-${i}`);
        if (match) {
            // FS-2-1 centered between FS-1-1 and FS-1-2, etc.
            const input1Y = round1StartY + (2 * (i - 1)) * spacing;     // First input match
            const input2Y = round1StartY + (2 * (i - 1) + 1) * spacing; // Second input match
            const matchY = (input1Y + input2Y) / 2; // Center between them
            renderMatch(match, round2X, matchY, 'frontside', 1);
        }
    }

    // Round 3: FS-3-1 through FS-3-4 - centered between their FS-R2 inputs
    const round3X = round2X + grid.matchWidth + grid.horizontalSpacing;

    for (let i = 1; i <= 4; i++) {
        const match = matches.find(m => m.id === `FS-3-${i}`);
        if (match) {
            // FS-3-1 centered between FS-2-1 and FS-2-2, etc.
            const input1Index = 2 * (i - 1) + 1;     // FS-2-1, FS-2-3, FS-2-5, FS-2-7
            const input2Index = 2 * (i - 1) + 2;     // FS-2-2, FS-2-4, FS-2-6, FS-2-8

            const input1Y = round1StartY + (2 * (input1Index - 1)) * spacing + spacing / 2;
            const input2Y = round1StartY + (2 * (input2Index - 1)) * spacing + spacing / 2;
            const matchY = (input1Y + input2Y) / 2; // Center between the FS-R2 matches
            renderMatch(match, round3X, matchY, 'frontside', 2);
        }
    }

    // Round 4: FS-4-1 and FS-4-2 - centered between their FS-R3 inputs
    const round4X = round3X + grid.matchWidth + grid.horizontalSpacing;

    for (let i = 1; i <= 2; i++) {
        const match = matches.find(m => m.id === `FS-4-${i}`);
        if (match) {
            // FS-4-1 centered between FS-3-1 and FS-3-2, FS-4-2 centered between FS-3-3 and FS-3-4
            const input1Index = 2 * (i - 1) + 1;     // FS-3-1, FS-3-3
            const input2Index = 2 * (i - 1) + 2;     // FS-3-2, FS-3-4

            // Calculate FS-R3 positions to center between them
            const fs3_1Y = round1StartY + (2 * 0) * spacing + spacing / 2 + spacing * 1.5; // FS-3-1 position
            const fs3_2Y = round1StartY + (2 * 2) * spacing + spacing / 2 + spacing * 1.5; // FS-3-2 position
            const fs3_3Y = round1StartY + (2 * 4) * spacing + spacing / 2 + spacing * 1.5; // FS-3-3 position
            const fs3_4Y = round1StartY + (2 * 6) * spacing + spacing / 2 + spacing * 1.5; // FS-3-4 position

            let matchY;
            if (i === 1) {
                // FS-4-1: Align with FS-2-4 position
                // FS-2-4 is centered between FS-1-7 and FS-1-8
                const fs2_4_input1Y = round1StartY + (6) * spacing;     // FS-1-7 position
                const fs2_4_input2Y = round1StartY + (7) * spacing;     // FS-1-8 position
                matchY = (fs2_4_input1Y + fs2_4_input2Y) / 2; // Align with FS-2-4
            } else {
                // FS-4-2: Align with FS-2-5 position
                // FS-2-5 is centered between FS-1-9 and FS-1-10
                const fs2_5_input1Y = round1StartY + (8) * spacing;     // FS-1-9 position
                const fs2_5_input2Y = round1StartY + (9) * spacing;     // FS-1-10 position
                matchY = (fs2_5_input1Y + fs2_5_input2Y) / 2; // Align with FS-2-5
            }
            renderMatch(match, round4X, matchY, 'frontside', 3);
        }
    }

    // Round 5: FS-5-1 - centered between FS-4-1 and FS-4-2
    const round5X = round4X + grid.matchWidth + grid.horizontalSpacing;

    // Calculate FS-5-1 Y position (needed for progression lines)
    const fs51Y = grid.centerY - 80 + (grid.matchHeight / 2); // Half match height down from BS-FINAL

    const fs51 = matches.find(m => m.id === 'FS-5-1');
    if (fs51) {
        renderMatch(fs51, round5X, fs51Y, 'frontside', 4);
    }

    // === 32-Player Frontside Progression Lines ===
    // Calculate Y positions for rounds 2-5 based on centering logic used above
    const fs21Y = round1StartY + spacing / 2;       // FS-2-1 centered between FS-1-1 and FS-1-2
    const fs22Y = round1StartY + 2 * spacing + spacing / 2;   // FS-2-2 centered between FS-1-3 and FS-1-4
    const fs23Y = round1StartY + 4 * spacing + spacing / 2;   // FS-2-3 centered between FS-1-5 and FS-1-6
    const fs24Y = round1StartY + 6 * spacing + spacing / 2;   // FS-2-4 centered between FS-1-7 and FS-1-8
    const fs25Y = round1StartY + 8 * spacing + spacing / 2;   // FS-2-5 centered between FS-1-9 and FS-1-10
    const fs26Y = round1StartY + 10 * spacing + spacing / 2;  // FS-2-6 centered between FS-1-11 and FS-1-12
    const fs27Y = round1StartY + 12 * spacing + spacing / 2;  // FS-2-7 centered between FS-1-13 and FS-1-14
    const fs28Y = round1StartY + 14 * spacing + spacing / 2;  // FS-2-8 centered between FS-1-15 and FS-1-16

    const fs31Y = (fs21Y + fs22Y) / 2;  // FS-3-1 centered between FS-2-1 and FS-2-2
    const fs32Y = (fs23Y + fs24Y) / 2;  // FS-3-2 centered between FS-2-3 and FS-2-4
    const fs33Y = (fs25Y + fs26Y) / 2;  // FS-3-3 centered between FS-2-5 and FS-2-6
    const fs34Y = (fs27Y + fs28Y) / 2;  // FS-3-4 centered between FS-2-7 and FS-2-8

    const fs41Y = fs24Y;  // FS-4-1 aligned with FS-2-4 (as calculated above)
    const fs42Y = fs25Y;  // FS-4-2 aligned with FS-2-5 (as calculated above)

    // Create positions object for progression line generation
    const positions = {
        round1X, round2X, round3X, round4X, round5X,
        round1StartY, spacing,
        fs21Y, fs22Y, fs23Y, fs24Y, fs25Y, fs26Y, fs27Y, fs28Y,
        fs31Y, fs32Y, fs33Y, fs34Y,
        fs41Y, fs42Y, fs51Y
    };

    const progressionLines = create32PlayerFrontsideLines(grid, matches, positions);

    // Add all lines to the bracket canvas
    const bracketCanvas = document.getElementById('bracketCanvas');
    progressionLines.forEach(line => {
        bracketCanvas.appendChild(line);
    });
}

function renderBacksideMatches(backsideStructure, grid) {
    // Use hardcoded positioning for specific bracket sizes to show progression clearly
    if (tournament.bracketSize === 8) {
        render8PlayerBacksideMatches(grid);
        return;
    }
    if (tournament.bracketSize === 16) {
        render16PlayerBacksideMatches(grid);
        return;
    }
    if (tournament.bracketSize === 32) {
        render32PlayerBacksideMatches(grid);
        return;
    }

    // Default positioning for other bracket sizes
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

// Hardcoded positioning for 8-player backside to show clear progression (mirrored to left)
function render8PlayerBacksideMatches(grid) {
    console.log('🎯 Rendering 8-player backside matches', { bracketSize: tournament.bracketSize, totalMatches: matches.length });

    const spacing = grid.matchHeight + grid.verticalSpacing;

    // Add gradient background box for the backside bracket using bracket-lines.js function
    const round1StartY = grid.centerY - (1.5 * spacing);
    const backsideBackground = createBacksideBackground(grid, 8, round1StartY, spacing);
    document.getElementById('bracketMatches').appendChild(backsideBackground);

    // Round 1: Position BS matches on the left side, mirroring the frontside Y positions
    const bs1X = grid.centerX - grid.centerBuffer - (grid.matchWidth + grid.horizontalSpacing);

    // Use same Y positions as frontside round 1 for proper mirroring
    const fs11Y = round1StartY;                    // FS-1-1 position
    const fs12Y = round1StartY + spacing;          // FS-1-2 position
    const fs13Y = round1StartY + 2 * spacing;      // FS-1-3 position
    const fs14Y = round1StartY + 3 * spacing;      // FS-1-4 position

    // BS-1-1 gets losers from FS-1-1 and FS-1-2, position between them
    const bs11Y = (fs11Y + fs12Y) / 2;
    // BS-1-2 gets losers from FS-1-3 and FS-1-4, position between them
    const bs12Y = (fs13Y + fs14Y) / 2;

    const bs11 = matches.find(m => m.id === 'BS-1-1');
    const bs12 = matches.find(m => m.id === 'BS-1-2');

    if (bs11) renderMatch(bs11, bs1X, bs11Y, 'backside', 0);
    if (bs12) renderMatch(bs12, bs1X, bs12Y, 'backside', 0);

    // Round 2: BS-2-1 and BS-2-2 advance leftward, centered between their inputs
    const bs2X = bs1X - (grid.matchWidth + grid.horizontalSpacing);
    const bs21Y = (bs12Y + bs11Y) / 2 - (grid.matchHeight / 2); // BS-2-1 centered between BS-1-2 and BS-1-1

    // BS-2-2 gets input from BS-1-2 winner, position relative to BS-1-2
    const bs22Y = bs12Y - (grid.matchHeight / 2); // Align with BS-1-2

    const bs21 = matches.find(m => m.id === 'BS-2-1');
    const bs22 = matches.find(m => m.id === 'BS-2-2');

    if (bs21) renderMatch(bs21, bs2X, bs21Y, 'backside', 1);
    if (bs22) renderMatch(bs22, bs2X, bs22Y, 'backside', 1);

    // Round 3: BS-3-1 centered between BS-2-1 and BS-2-2
    const bs3X = bs2X - (grid.matchWidth + grid.horizontalSpacing);
    const bs31Y = (bs21Y + bs22Y) / 2;

    const bs31 = matches.find(m => m.id === 'BS-3-1');
    if (bs31) renderMatch(bs31, bs3X, bs31Y, 'backside', 2);

    // === ALL PROGRESSION LINES (HTML/CSS) ===

    const round1X = grid.centerX + grid.centerBuffer;
    const round2X = round1X + grid.matchWidth + grid.horizontalSpacing;
    const round3X = round2X + grid.matchWidth + grid.horizontalSpacing;

    // === 8-Player Backside Progression Lines ===
    // Create all backside progression lines using bracket-lines.js functions
    const positions = {
        round1X, bs1X, bs2X, bs3X, round3X,
        round1StartY, spacing,
        bs11Y, bs12Y, bs21Y, bs22Y, bs31Y
    };

    const progressionLines = create8PlayerBacksideLines(grid, matches, positions);

    // Add all lines to bracketMatches container
    progressionLines.forEach(line => {
        document.getElementById('bracketMatches').appendChild(line);
    });
}

// Hardcoded positioning for 16-player backside to show clear progression (mirrored to left)
function render16PlayerBacksideMatches(grid) {
    console.log('🎯 Rendering 16-player backside matches', { bracketSize: tournament.bracketSize, totalMatches: matches.length });

    const spacing = grid.matchHeight + grid.verticalSpacing;

    // Add gradient background box for the backside bracket using bracket-lines.js function
    const round1StartY = grid.centerY - (3.5 * spacing); // Same as frontside
    const backsideBackground = createBacksideBackground(grid, 16, round1StartY, spacing);
    document.getElementById('bracketMatches').appendChild(backsideBackground);

    // Round 1: Position BS matches on the left side, aligned with frontside round 2 positions
    const bs1X = grid.centerX - grid.centerBuffer - (grid.matchWidth + grid.horizontalSpacing);

    // BS-1-1 gets losers from FS-2-1, align with FS-2-1 position
    const bs11Y = round1StartY + (spacing / 2); // Same as FS-2-1
    // BS-1-2 gets losers from FS-2-2, align with FS-2-2 position
    const bs12Y = round1StartY + 2 * spacing + (spacing / 2); // Same as FS-2-2
    // BS-1-3 gets losers from FS-2-3, align with FS-2-3 position
    const bs13Y = round1StartY + 4 * spacing + (spacing / 2); // Same as FS-2-3
    // BS-1-4 gets losers from FS-2-4, align with FS-2-4 position
    const bs14Y = round1StartY + 6 * spacing + (spacing / 2); // Same as FS-2-4

    const bs11 = matches.find(m => m.id === 'BS-1-1');
    const bs12 = matches.find(m => m.id === 'BS-1-2');
    const bs13 = matches.find(m => m.id === 'BS-1-3');
    const bs14 = matches.find(m => m.id === 'BS-1-4');

    if (bs11) renderMatch(bs11, bs1X, bs11Y, 'backside', 0);
    if (bs12) renderMatch(bs12, bs1X, bs12Y, 'backside', 0);
    if (bs13) renderMatch(bs13, bs1X, bs13Y, 'backside', 0);
    if (bs14) renderMatch(bs14, bs1X, bs14Y, 'backside', 0);

    // Round 2: BS-2-1 through BS-2-4 advance leftward (align with frontside like BS-R1)
    const bs2X = bs1X - (grid.matchWidth + grid.horizontalSpacing);

    // BS-2-1 through BS-2-4 get losers from FS-3-1, FS-3-2, etc. - align with frontside round 3 positions
    const fs31Y = round1StartY + (spacing / 2) + spacing + (spacing / 2); // FS-3-1 position from frontside
    const fs32Y = round1StartY + 4 * spacing + (spacing / 2) + spacing + (spacing / 2); // FS-3-2 position from frontside

    // Align BS-2 matches with their corresponding frontside positions
    const bs21Y = round1StartY + (spacing / 2); // Same as FS-2-1 position
    const bs22Y = round1StartY + 2 * spacing + (spacing / 2); // Same as FS-2-2 position
    const bs23Y = round1StartY + 4 * spacing + (spacing / 2); // Same as FS-2-3 position
    const bs24Y = round1StartY + 6 * spacing + (spacing / 2); // Same as FS-2-4 position

    const bs21 = matches.find(m => m.id === 'BS-2-1');
    const bs22 = matches.find(m => m.id === 'BS-2-2');
    const bs23 = matches.find(m => m.id === 'BS-2-3');
    const bs24 = matches.find(m => m.id === 'BS-2-4');

    if (bs21) renderMatch(bs21, bs2X, bs21Y, 'backside', 1);
    if (bs22) renderMatch(bs22, bs2X, bs22Y, 'backside', 1);
    if (bs23) renderMatch(bs23, bs2X, bs23Y, 'backside', 1);
    if (bs24) renderMatch(bs24, bs2X, bs24Y, 'backside', 1);

    // Round 3: BS-3-1 and BS-3-2 (align horizontally with BS-2-2 and BS-2-3)
    const bs3X = bs2X - (grid.matchWidth + grid.horizontalSpacing);

    // Align BS-3-1 horizontally with BS-2-2 and BS-3-2 horizontally with BS-2-3
    const bs31Y = bs22Y; // BS-3-1 aligns with BS-2-2
    const bs32Y = bs23Y; // BS-3-2 aligns with BS-2-3

    const bs31 = matches.find(m => m.id === 'BS-3-1');
    const bs32 = matches.find(m => m.id === 'BS-3-2');

    if (bs31) renderMatch(bs31, bs3X, bs31Y, 'backside', 2);
    if (bs32) renderMatch(bs32, bs3X, bs32Y, 'backside', 2);

    // Round 4: BS-4-1 and BS-4-2 (align horizontally with BS-2-2 and BS-2-3)
    const bs4X = bs3X - (grid.matchWidth + grid.horizontalSpacing);

    // Align BS-4-1 horizontally with BS-2-2 and BS-4-2 horizontally with BS-2-3
    const bs41Y = bs22Y; // BS-4-1 aligns with BS-2-2
    const bs42Y = bs23Y; // BS-4-2 aligns with BS-2-3

    const bs41 = matches.find(m => m.id === 'BS-4-1');
    const bs42 = matches.find(m => m.id === 'BS-4-2');

    if (bs41) renderMatch(bs41, bs4X, bs41Y, 'backside', 3);
    if (bs42) renderMatch(bs42, bs4X, bs42Y, 'backside', 3);

    // Round 5: BS-5-1 (1 match) - centered between BS-4-1 and BS-4-2
    const bs5X = bs4X - (grid.matchWidth + grid.horizontalSpacing);
    const bs51Y = (bs41Y + bs42Y) / 2;

    const bs51 = matches.find(m => m.id === 'BS-5-1');
    if (bs51) renderMatch(bs51, bs5X, bs51Y, 'backside', 4);

    // === 16-Player Backside Progression Lines ===
    // Create Phase 1: FS → BS loser feed lines using bracket-lines.js functions

    // Calculate frontside coordinates for loser feeds
    const frontsideRound1X = grid.centerX + grid.centerBuffer;

    const positions = {
        round1X: frontsideRound1X, bs1X, bs2X, bs3X, bs4X, bs5X,
        round1StartY, spacing,
        bs11Y, bs12Y, bs13Y, bs14Y,
        bs21Y, bs22Y, bs23Y, bs24Y,
        bs31Y, bs32Y, bs41Y, bs42Y, bs51Y
    };

    const progressionLines = create16PlayerBacksideLines(grid, matches, positions);

    // Add all lines to bracketMatches container
    progressionLines.forEach(line => {
        document.getElementById('bracketMatches').appendChild(line);
    });
}

// Hardcoded positioning for 32-player backside to show clear progression (mirrored to left)
function render32PlayerBacksideMatches(grid) {
    console.log('🎯 Rendering 32-player backside matches', { bracketSize: tournament.bracketSize, totalMatches: matches.length });

    const spacing = grid.matchHeight + grid.verticalSpacing;

    // Add slightly darker background box for the backside bracket
    const backsideBackground = document.createElement('div');
    backsideBackground.className = 'backside-background';
    backsideBackground.style.cssText = `
        position: absolute;
        background: linear-gradient(to left, rgba(0, 0, 0, 0.06), transparent);
        border-radius: 16px;
        z-index: 0;
        pointer-events: none;
    `;

    // Calculate background dimensions based on the backside bracket area
    const round1StartY = grid.centerY - (7.5 * spacing);
    const backsideStartX = grid.centerX - grid.centerBuffer - (7 * (grid.matchWidth + grid.horizontalSpacing));
    const backsideEndX = grid.centerX - grid.centerBuffer - grid.horizontalSpacing;
    const backsideWidth = backsideEndX - backsideStartX + grid.matchWidth + 40 - (2 * grid.matchWidth / 3); // Extra padding minus 1/3 match width on each end
    const backsideHeight = 16 * spacing + 40; // Height to cover all matches plus padding
    const backsideTop = round1StartY - 20; // Start with some padding above

    backsideBackground.style.left = `${backsideStartX - 20 - (grid.matchWidth / 2) + (grid.matchWidth / 3)}px`;
    backsideBackground.style.top = `${backsideTop}px`;
    backsideBackground.style.width = `${backsideWidth}px`;
    backsideBackground.style.height = `${backsideHeight}px`;

    document.getElementById('bracketMatches').appendChild(backsideBackground);

    // Mirror frontside positioning to the left side
    // round1StartY already defined above for background calculation

    // Round 1: BS-1-1 through BS-1-8 aligned with FS-R2 positions (they receive FS-R2 losers)
    const bs1X = grid.centerX - grid.centerBuffer - (grid.matchWidth + grid.horizontalSpacing);


    for (let i = 1; i <= 8; i++) {
        const match = matches.find(m => m.id === `BS-1-${i}`);
        if (match) {
            // Align with FS-2-X positions (same Y as corresponding FS-R2 match)
            const input1Y = round1StartY + (2 * (i - 1)) * spacing;     // First input match
            const input2Y = round1StartY + (2 * (i - 1) + 1) * spacing; // Second input match
            const matchY = (input1Y + input2Y) / 2; // Same as FS-2-X position
            renderMatch(match, bs1X, matchY, 'backside', 0);
        }
    }

    // Round 2: BS-2-1 through BS-2-8 also aligned with FS-R2 positions
    const bs2X = bs1X - (grid.matchWidth + grid.horizontalSpacing);

    for (let i = 1; i <= 8; i++) {
        const match = matches.find(m => m.id === `BS-2-${i}`);
        if (match) {
            // Same alignment as FS-R2 matches
            const input1Y = round1StartY + (2 * (i - 1)) * spacing;
            const input2Y = round1StartY + (2 * (i - 1) + 1) * spacing;
            const matchY = (input1Y + input2Y) / 2; // Same as FS-2-X position
            renderMatch(match, bs2X, matchY, 'backside', 1);
        }
    }

    // Round 3: BS-3-1 through BS-3-4 aligned with FS-R3 positions
    const bs3X = bs2X - (grid.matchWidth + grid.horizontalSpacing);

    for (let i = 1; i <= 4; i++) {
        const match = matches.find(m => m.id === `BS-3-${i}`);
        if (match) {
            // Align with FS-3-X positions (same Y as corresponding FS-R3 match)
            const input1Index = 2 * (i - 1) + 1;     // FS-2-1, FS-2-3, FS-2-5, FS-2-7
            const input2Index = 2 * (i - 1) + 2;     // FS-2-2, FS-2-4, FS-2-6, FS-2-8

            const input1Y = round1StartY + (2 * (input1Index - 1)) * spacing + spacing / 2;
            const input2Y = round1StartY + (2 * (input2Index - 1)) * spacing + spacing / 2;
            const matchY = (input1Y + input2Y) / 2; // Same as FS-3-X position
            renderMatch(match, bs3X, matchY, 'backside', 2);
        }
    }

    // Round 4: BS-4-1 through BS-4-4 aligned with FS-R3 positions
    const bs4X = bs3X - (grid.matchWidth + grid.horizontalSpacing);

    for (let i = 1; i <= 4; i++) {
        const match = matches.find(m => m.id === `BS-4-${i}`);
        if (match) {
            // Same alignment as FS-R3 matches
            const input1Index = 2 * (i - 1) + 1;
            const input2Index = 2 * (i - 1) + 2;

            const input1Y = round1StartY + (2 * (input1Index - 1)) * spacing + spacing / 2;
            const input2Y = round1StartY + (2 * (input2Index - 1)) * spacing + spacing / 2;
            const matchY = (input1Y + input2Y) / 2; // Same as FS-3-X position
            renderMatch(match, bs4X, matchY, 'backside', 3);
        }
    }

    // Round 5: BS-5-1 and BS-5-2 aligned with BS-4-2 and BS-4-3
    const bs5X = bs4X - (grid.matchWidth + grid.horizontalSpacing);

    // BS-5-1 aligned with BS-2-4 position
    const bs51 = matches.find(m => m.id === 'BS-5-1');
    if (bs51) {
        // Align with BS-2-4: round1StartY + 6 * spacing + (spacing / 2)
        const matchY = round1StartY + 6 * spacing + (spacing / 2);
        renderMatch(bs51, bs5X, matchY, 'backside', 4);
    }

    // BS-5-2 aligned with BS-2-5 position
    const bs52 = matches.find(m => m.id === 'BS-5-2');
    if (bs52) {
        // Align with BS-2-5: round1StartY + 8.5 * spacing
        const matchY = round1StartY + 8.5 * spacing;
        renderMatch(bs52, bs5X, matchY, 'backside', 4);
    }

    // Round 6: BS-6-1 and BS-6-2 aligned with BS-4-2 and BS-4-3
    const bs6X = bs5X - (grid.matchWidth + grid.horizontalSpacing);

    // BS-6-1 aligned with BS-2-4 position (same as BS-5-1)
    const bs61 = matches.find(m => m.id === 'BS-6-1');
    if (bs61) {
        // Align with BS-2-4: round1StartY + 6 * spacing + (spacing / 2)
        const matchY = round1StartY + 6 * spacing + (spacing / 2);
        renderMatch(bs61, bs6X, matchY, 'backside', 5);
    }

    // BS-6-2 aligned with BS-2-5 position (same as BS-5-2)
    const bs62 = matches.find(m => m.id === 'BS-6-2');
    if (bs62) {
        // Align with BS-2-5: round1StartY + 8.5 * spacing
        const matchY = round1StartY + 8.5 * spacing;
        renderMatch(bs62, bs6X, matchY, 'backside', 5);
    }

    // Round 7: BS-7-1 aligned with FS-5-1's vertical position
    const bs7X = bs6X - (grid.matchWidth + grid.horizontalSpacing);

    const bs71 = matches.find(m => m.id === 'BS-7-1');
    if (bs71) {
        // Align with FS-5-1's position (half match height below BS-FINAL)
        const fs51Y = grid.centerY - 80 + (grid.matchHeight / 2); // Same as FS-5-1 position
        renderMatch(bs71, bs7X, fs51Y, 'backside', 6);
    }

    // === 32-Player Backside Progression Lines ===
    // Use existing variable declarations (all bs1X through bs6X are already defined above)

    // Create positions object for progression line generation
    // Use existing bs7X variable declared above

    const positions = {
        round1X: grid.centerX + grid.centerBuffer, // Frontside round 1 X for loser feeds
        bs1X, bs2X, bs3X, bs4X, bs5X, bs6X, bs7X,
        round1StartY, spacing
    };

    const backProgressionLines = create32PlayerBacksideLines(grid, matches, positions);

    // Add all lines to the bracket canvas
    const bracketCanvas = document.getElementById('bracketCanvas');
    backProgressionLines.forEach(line => {
        bracketCanvas.appendChild(line);
    });

    // TODO: Add remaining backside rounds if needed
}

function renderFinalMatches(grid, frontsideStructure) {
    const backsideFinal = matches.find(m => m.id === 'BS-FINAL');
    const grandFinal = matches.find(m => m.id === 'GRAND-FINAL');

    // Calculate dynamic position based on actual frontside bracket width
    const frontsideRounds = frontsideStructure.length;
    const lastFrontsideX = grid.centerX + grid.centerBuffer + (frontsideRounds - 1) * (grid.matchWidth + grid.horizontalSpacing);

    // Position finals with more spacing (4x the normal spacing for 8-player, 16-player, and 32-player brackets)
    const spacingMultiplier = (tournament.bracketSize === 8 || tournament.bracketSize === 16 || tournament.bracketSize === 32) ? 4 : 1;
    const finalsX = lastFrontsideX + grid.matchWidth + (spacingMultiplier * grid.horizontalSpacing);
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
                ${matchState === 'completed' && match.finalScore
                    ? `<span style="font-size: 16px;">Result:</span> <span style="font-size: 20px; font-weight: bold; color: #059669; font-family: 'Courier New', monospace; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">${match.finalScore.winnerLegs}-${match.finalScore.loserLegs}</span>`
                    : `L: <select onchange="updateMatchLane('${match.id}', this.value)"
                        onfocus="refreshLaneDropdown('${match.id}')"
                        style="background: white; border: 1px solid #ddd; font-size: 12px; width: 50px; padding: 2px;">
                        <option value="">No</option>
                        ${laneOptions}
                    </select> | Bo${match.legs}`
                }
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

    // Add hover events for match progression info and zoom functionality
    let hoverTimeout = null;
    let zoomTimeout = null;

    matchElement.addEventListener('mouseenter', function() {
        // HOVER DELAY SYSTEM:
        // - Prevents accidental triggers when quickly moving mouse across bracket
        // - 1500ms (1.5 seconds) requires deliberate hover intent
        // - Useful when navigating crowded brackets with many match cards
        // - Can be set to 0 for immediate response if preferred
        // - Timeout is cleared if mouse leaves before delay completes
        const HOVER_DELAY_MS = 300; // 0.3 second delay - responsive but prevents jumpy navigation

        hoverTimeout = setTimeout(() => {
            const progressionInfo = getMatchProgressionText(match.id);
            if (progressionInfo) {
                updateStatusCenter(progressionInfo);
            }
        }, HOVER_DELAY_MS);

        // ZOOM HOVER FUNCTIONALITY:
        // - Only zoom when current bracket zoom level is less than 1.0
        // - 1 second delay prevents accidental zooming during navigation
        // - Scale factor gives consistent viewport size regardless of bracket zoom
        const ZOOM_DELAY_MS = 1000; // 1 second delay for zoom activation
        const TARGET_VIEWPORT_SCALE = 1.0; // Target size relative to viewport (1.0 = normal size)

        if (zoomLevel < 1.0) {
            zoomTimeout = setTimeout(() => {
                // Calculate scale to achieve consistent viewport size
                // If bracket is at 0.5 zoom and we want 1.2 viewport scale: 1.2 / 0.5 = 2.4 element scale
                const elementScale = TARGET_VIEWPORT_SCALE / zoomLevel;
                matchElement.classList.add('zoom-hover');
                matchElement.style.transform = `scale(${elementScale})`;
                matchElement.style.zIndex = '1000';

                // Add depth: dim and blur everything except the zoomed match
                const bracketCanvas = document.getElementById('bracketCanvas');
                const bracketMatches = document.getElementById('bracketMatches');

                // Blur all direct children of bracketCanvas (some lines and labels)
                // Skip main section labels to keep them clear
                const skipBlurIds = ['bracketMatches', 'bracketLines', 'tournamentHeader', 'frontsideLabel', 'backsideLabel', 'finalsLabel'];
                if (bracketCanvas) {
                    Array.from(bracketCanvas.children).forEach(child => {
                        if (!skipBlurIds.includes(child.id)) {
                            child.style.opacity = '0.6';
                            child.style.filter = 'blur(0.5px)';
                        }
                    });
                }

                // Blur all children of bracketMatches except matches (lines, labels, backgrounds)
                // Skip tournament header to keep it clear
                if (bracketMatches) {
                    Array.from(bracketMatches.children).forEach(child => {
                        if (!child.classList.contains('bracket-match') && child.id !== 'tournamentHeader') {
                            child.style.opacity = '0.6';
                            child.style.filter = 'blur(0.5px)';
                        }
                    });
                }

                // Blur all other matches
                document.querySelectorAll('.bracket-match').forEach(m => {
                    if (m !== matchElement) {
                        m.style.opacity = '0.6';
                        m.style.filter = 'blur(0.5px)';
                    }
                });

                // Enhance the zoomed match with dramatic shadow
                matchElement.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            }, ZOOM_DELAY_MS);
        }
    });

    matchElement.addEventListener('mouseleave', function() {
        // Clear any pending hover timeout and immediately hide progression info
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        clearStatusCenter();

        // Clear zoom timeout and reset zoom state
        if (zoomTimeout) {
            clearTimeout(zoomTimeout);
            zoomTimeout = null;
        }
        matchElement.classList.remove('zoom-hover');
        matchElement.style.transform = '';
        matchElement.style.zIndex = '';
        matchElement.style.boxShadow = '';

        // Reset all bracket canvas and bracketMatches children back to normal
        const bracketCanvas = document.getElementById('bracketCanvas');
        const bracketMatches = document.getElementById('bracketMatches');

        if (bracketCanvas) {
            Array.from(bracketCanvas.children).forEach(child => {
                child.style.opacity = '';
                child.style.filter = '';
            });
        }

        if (bracketMatches) {
            Array.from(bracketMatches.children).forEach(child => {
                child.style.opacity = '';
                child.style.filter = '';
            });
        }

        // Reset all matches back to normal
        document.querySelectorAll('.bracket-match').forEach(m => {
            m.style.opacity = '';
            m.style.filter = '';
        });
    });

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

    // Watermark positioned below bottom-most first round match
    const watermark = document.createElement('div');
    watermark.id = 'tournament-watermark';
    watermark.textContent = String.fromCharCode(..._0x7a, ..._0x9b);
    watermark.style.position = 'absolute';
    watermark.style.fontSize = '16px';
    watermark.style.color = 'rgba(17,24,39,0.5)';
    watermark.style.letterSpacing = '1px';
    watermark.style.pointerEvents = 'none';
    watermark.style.width = grid.matchWidth + 'px';
    watermark.style.textAlign = 'center';

    // Position based on bracket size
    const spacing = grid.matchHeight + grid.verticalSpacing;
    let watermarkX, watermarkY;

    if (tournament.bracketSize === 32) {
        // Position below FS-1-16 (last match in round 1)
        const round1X = grid.centerX + grid.centerBuffer;
        const round1StartY = grid.centerY - (7.5 * spacing);
        const fs116Y = round1StartY + 15 * spacing; // FS-1-16 position
        watermarkX = round1X; // Align with left edge of match
        watermarkY = fs116Y + grid.matchHeight + 40; // Below the match with some spacing
    } else if (tournament.bracketSize === 16) {
        // Position below FS-1-8 (last match in round 1 for 16-player)
        const round1X = grid.centerX + grid.centerBuffer;
        const round1StartY = grid.centerY - (3.5 * spacing);
        const fs18Y = round1StartY + 7 * spacing; // FS-1-8 position
        watermarkX = round1X;
        watermarkY = fs18Y + grid.matchHeight + 40;
    } else {
        // For 8-player bracket, position below FS-1-4
        const round1X = grid.centerX + grid.centerBuffer;
        const round1StartY = grid.centerY - (1.5 * spacing);
        const fs14Y = round1StartY + 3 * spacing; // FS-1-4 position
        watermarkX = round1X;
        watermarkY = fs14Y + grid.matchHeight + 40;
    }

    watermark.style.left = watermarkX + 'px';
    watermark.style.top = watermarkY + 'px';

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
        case 'live': return 'Started';
        case 'completed': return 'Done';
        default: return 'Unknown';
    }
}

function getPlayerDisplayName(player) {
    if (!player) return '<span class="awaiting-player">Awaiting Player</span>';
    if (player.name === 'TBD') return '<span class="awaiting-player">Awaiting Player</span>';
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

    // Use smaller fixed step for finer control with both trackpad and mouse wheel
    // 0.015 provides smoother, more precise zoom than original 0.05
    const delta = e.deltaY > 0 ? -0.015 : 0.015;
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

        // Refresh all referee dropdowns to update conflict detection
        if (typeof refreshAllRefereeDropdowns === 'function') {
            refreshAllRefereeDropdowns();
        }

        // Note: No renderBracket() call needed - dropdown refresh is sufficient
        // and prevents losing match card hover zoom state

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

    // Note: No renderBracket() call needed - dropdown refresh is sufficient
    // and prevents losing match card hover zoom state

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
        // Check both bracket matches and command center matches
        const bracketElement = document.getElementById(`bracket-match-${match.id}`);
        const commandCenterElement = document.getElementById(`cc-match-card-${match.id}`);

        // Update bracket dropdown if it exists
        if (bracketElement) {
            const dropdown = bracketElement.querySelector('select[onchange*="updateMatchReferee"]');
            if (dropdown) {
                const currentValue = dropdown.value;
                dropdown.innerHTML = generateRefereeOptionsWithConflicts(match.id, match.referee);
                if (dropdown.querySelector(`option[value="${currentValue}"]`)) {
                    dropdown.value = currentValue;
                }
            }
        }

        // Update command center dropdown if it exists
        if (commandCenterElement) {
            const dropdown = commandCenterElement.querySelector('select[onchange*="updateMatchReferee"]');
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
    window.refreshAllRefereeDropdowns = refreshAllRefereeDropdowns;
    window.getAssignedReferees = getAssignedReferees;
    window.getPlayersInLiveMatches = getPlayersInLiveMatches;
    window.isPlayerAvailableAsReferee = isPlayerAvailableAsReferee;
    window.getRedoableMatches = getRedoableMatches;
    window.handleRedoClick = handleRedoClick;
}

// --- START: Surgical Undo Implementation ---

function isMatchUndoable(matchId) {
    // Read-only tournaments cannot be undone
    if (tournament && tournament.readOnly) return false;

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
// Helper function to collect all matches in walkover chain (including intermediate auto-completed matches)
function collectWalkoverChain(matchId, progression) {
    const chainMatches = [];
    let currentMatchId = matchId;
    let visited = new Set(); // Prevent infinite loops

    while (currentMatchId && !visited.has(currentMatchId)) {
        visited.add(currentMatchId);

        const match = matches.find(m => m.id === currentMatchId);
        if (!match) break;

        // Always add the current match to the chain
        chainMatches.push(currentMatchId);

        // If match has real players or is not a walkover, this is the final destination
        if (!isWalkover(match.player1) && !isWalkover(match.player2)) {
            break;
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

    return chainMatches;
}

function getConsequentialMatches(transaction) {
    const consequentialMatches = [];
    const addedMatchIds = new Set(); // Prevent duplicates

    if (!transaction || !tournament || !tournament.bracketSize) {
        return consequentialMatches;
    }

    // Use hardcoded MATCH_PROGRESSION to find exact destinations
    const progression = MATCH_PROGRESSION[tournament.bracketSize];
    if (!progression || !progression[transaction.matchId]) {
        return consequentialMatches;
    }

    const matchProgression = progression[transaction.matchId];

    // Add all matches in winner destination chain
    if (matchProgression.winner) {
        const [targetMatchId] = matchProgression.winner;
        // Collect all matches in the walkover chain (including intermediate auto-completed matches)
        const chainMatches = collectWalkoverChain(targetMatchId, progression);
        chainMatches.forEach(matchId => {
            if (!addedMatchIds.has(matchId)) {
                const targetMatch = matches.find(m => m.id === matchId);
                if (targetMatch) {
                    consequentialMatches.push({
                        id: targetMatch.id,
                        match: targetMatch,
                        isFrontside: targetMatch.id.startsWith('FS-')
                    });
                    addedMatchIds.add(matchId);
                }
            }
        });
    }

    // Add all matches in loser destination chain
    if (matchProgression.loser) {
        const [targetMatchId] = matchProgression.loser;
        // Collect all matches in the walkover chain (including intermediate auto-completed matches)
        const chainMatches = collectWalkoverChain(targetMatchId, progression);
        chainMatches.forEach(matchId => {
            if (!addedMatchIds.has(matchId)) {
                const targetMatch = matches.find(m => m.id === matchId);
                if (targetMatch) {
                    consequentialMatches.push({
                        id: targetMatch.id,
                        match: targetMatch,
                        isFrontside: targetMatch.id.startsWith('FS-')
                    });
                    addedMatchIds.add(matchId);
                }
            }
        });
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
    // Check if tournament is read-only (completed tournament)
    if (tournament && tournament.readOnly) {
        updateStatusCenter('Completed tournament: Read-only - Use Reset Tournament to modify');
        return;
    }

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
    // Check if tournament is read-only (imported completed tournament)
    if (tournament && tournament.readOnly) {
        alert('Completed tournament: Read-only - Use Reset Tournament to modify');
        return;
    }

    const history = getTournamentHistory();
    const targetTransaction = history.find(t => t.id === transactionId);

    if (!targetTransaction) {
        console.error(`Transaction ${transactionId} not found in history`);
        return;
    }

    // 1. Identify transactions to remove: target + downstream dependencies
    const transactionsToRemove = [transactionId];

    // Find all downstream matches affected by this transaction
    const consequentialMatches = getConsequentialMatches(targetTransaction);

    console.log(`🔍 Undo ${targetTransaction.matchId} - Consequential matches:`, consequentialMatches.map(m => m.id));

    // Remove all transactions for affected downstream matches
    consequentialMatches.forEach(match => {
        const matchTransactions = history.filter(t => t.matchId === match.id);
        matchTransactions.forEach(t => {
            if (!transactionsToRemove.includes(t.id)) {
                transactionsToRemove.push(t.id);
            }
        });
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

    // 6. Roll back ALL affected matches and remove advancing players from downstream matches
    // Process all transactions being removed (handles auto-advancement chains)
    const progression = MATCH_PROGRESSION[tournament.bracketSize];

    transactionsToRemove.forEach(transactionId => {
        const transaction = history.find(t => t.id === transactionId);
        if (!transaction || !transaction.winner || !transaction.loser) return;

        const match = matches.find(m => m.id === transaction.matchId);
        if (!match) return;

        console.log(`🔄 Rolling back ${transaction.matchId} from COMPLETED to READY`);

        // Find where the winner and loser went using hardcoded progression
        if (progression && progression[transaction.matchId]) {
            const matchProgression = progression[transaction.matchId];

            // Remove winner from their destination match
            if (matchProgression.winner) {
                const [winnerDestMatchId, winnerSlot] = matchProgression.winner;
                const winnerDestMatch = matches.find(m => m.id === winnerDestMatchId);
                if (winnerDestMatch) {
                    console.log(`  ➤ Removing winner ${transaction.winner.name} from ${winnerDestMatchId} (${winnerSlot})`);
                    winnerDestMatch[winnerSlot] = { name: 'TBD', id: null };
                }
            }

            // Remove loser from their destination match
            if (matchProgression.loser) {
                const [loserDestMatchId, loserSlot] = matchProgression.loser;
                const loserDestMatch = matches.find(m => m.id === loserDestMatchId);
                if (loserDestMatch) {
                    console.log(`  ➤ Removing loser ${transaction.loser.name} from ${loserDestMatchId} (${loserSlot})`);
                    loserDestMatch[loserSlot] = { name: 'TBD', id: null };
                }
            }
        }

        // Roll back the match itself
        match.completed = false;
        match.winner = null;
        match.loser = null;
        match.active = false;
        match.state = 'READY';
        // Keep original players - they came from upstream completed matches
        console.log(`✅ ${transaction.matchId} rolled back: ${match.player1?.name || 'TBD'} vs ${match.player2?.name || 'TBD'}`);
    });

    // 7. Update match states and UI
    updateAllMatchStates();
    if (typeof refreshTournamentUI === 'function') {
        refreshTournamentUI();
    }

    // 8. Refresh results displays after undo
    if (isUndoingGrandFinal && typeof displayResults === 'function') {
        displayResults();
    }

    // Clear stale placements and recalculate rankings after undo
    if (tournament) {
        tournament.placements = {}; // Clear all existing placements
        console.log('🧹 Cleared stale placements before recalculating rankings');
    }
    if (typeof calculateAllRankings === 'function') {
        calculateAllRankings();
    }

    // Save tournament state with updated rankings
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    // Always refresh results table to show updated rankings after undo
    if (typeof updateResultsTable === 'function') {
        updateResultsTable();
    }

    console.log(`Clean undo complete: surgically rolled back ${targetTransaction.matchId}`);
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

    // 1. Clear existing matches and placements, then regenerate bracket structure
    matches.length = 0;
    tournament.placements = {}; // Clear all rankings to start fresh

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
    chronologicalHistory.forEach((transaction, index) => {
        const match = matches.find(m => m.id === transaction.matchId);
        if (!match) {
            console.log(`🔍 Rebuild ${index + 1}/${chronologicalHistory.length}: Match ${transaction.matchId} not found`);
            return;
        }

        console.log(`🔍 Rebuild ${index + 1}/${chronologicalHistory.length}: Processing ${transaction.type} for ${transaction.matchId}`);

        // Process different transaction types
        switch (transaction.type) {
            case 'COMPLETE_MATCH':
                if (transaction.winner && transaction.loser) {
                    console.log(`  ➤ Setting players: ${transaction.winner.name} vs ${transaction.loser.name}`);

                    // Ensure the match has the correct players from transaction
                    match.player1 = transaction.winner;
                    match.player2 = transaction.loser;

                    // Winner is always player1 for this rebuild approach
                    const winnerPlayerNumber = 1;
                    if (typeof completeMatch === 'function') {
                        console.log(`  ➤ Calling completeMatch(${transaction.matchId}, ${winnerPlayerNumber})`);
                        completeMatch(
                            transaction.matchId,
                            winnerPlayerNumber,
                            transaction.winnerLegs || 0,
                            transaction.loserLegs || 0,
                            transaction.completionType || 'MANUAL'
                        );
                        console.log(`  ✅ Completed ${transaction.matchId}: ${transaction.winner.name} wins`);
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

        // Process auto-advancements to handle walkover matches that should advance automatically
        if (typeof processAutoAdvancements === 'function') {
            console.log('🔄 Processing auto-advancements after bracket rebuild');
            // Safety reset: ensure flag is clean before starting
            window.processingAutoAdvancements = false;

            // Process auto-advancements multiple times to catch cascading walkover effects
            let attempts = 0;
            const maxAttempts = 3;
            const processRound = () => {
                attempts++;
                console.log(`🔄 Auto-advancement attempt ${attempts}/${maxAttempts}`);
                processAutoAdvancements();

                // Schedule additional rounds to catch cascading effects
                if (attempts < maxAttempts) {
                    setTimeout(processRound, 100);
                }
            };

            processRound();

            // Emergency flag cleanup after all attempts
            setTimeout(() => {
                if (window.processingAutoAdvancements) {
                    console.warn('🚨 Emergency flag cleanup - processingAutoAdvancements was stuck');
                    window.processingAutoAdvancements = false;
                }
            }, 2000);
        }
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
        `${originalClickHandler}; setTimeout(() => { const modal = document.getElementById('matchCommandCenterModal'); if (modal && (modal.style.display === 'flex' || modal.style.display === 'block')) showMatchCommandCenter(); }, 100)` :
        '';
    
    // For live matches, show stop button; for non-live matches, show start button
    const actionButton = state === 'live' ?
        `<button class="cc-match-action-btn cc-btn-stop" onclick="toggleActive('${match.id}'); setTimeout(() => { const modal = document.getElementById('matchCommandCenterModal'); if (modal && (modal.style.display === 'flex' || modal.style.display === 'block')) showMatchCommandCenter(); }, 100);">Stop Match</button>` :
        `<button class="cc-match-action-btn cc-btn-start" onclick="${commandCenterClickHandler}">Start Match</button>`;
    
    const liveClass = state === 'live' ? ' cc-match-card-live' : '';
    const backsideClass = (match.side === 'backside' || match.id.startsWith('BS-')) ? ' cc-match-card-backside' : '';

    // Get progression text
    const progressionInfo = getMatchProgressionText(match.id);
    const progressionText = progressionInfo ? progressionInfo.line2 : '';

    return `
        <div id="cc-match-card-${match.id}" class="cc-match-card${liveClass}${backsideClass}">
            <div class="cc-match-card-header">
                <div class="cc-match-id">${match.id}${progressionText ? ` • <span style="font-weight: 400; color: #6b7280;">${progressionText}</span>` : ''}</div>
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
                    <label class="cc-control-label">Referee:</label>
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

    // Group ready matches by round for chronological organization
    const roundGroups = {};

    readyMatches.forEach(match => {
        // Determine round identifier for grouping
        let roundKey;

        if (match.id === 'GRAND-FINAL') {
            roundKey = 'GRAND-FINAL';
        } else if (match.id === 'BS-FINAL') {
            roundKey = 'BS-FINAL';
        } else if (match.id.startsWith('FS-')) {
            const roundNum = parseInt(match.id.split('-')[1]);
            roundKey = `FS-R${roundNum}`;
        } else if (match.id.startsWith('BS-')) {
            const roundNum = parseInt(match.id.split('-')[1]);
            roundKey = `BS-R${roundNum}`;
        } else {
            roundKey = 'OTHER';
        }

        if (!roundGroups[roundKey]) {
            roundGroups[roundKey] = [];
        }
        roundGroups[roundKey].push(match);
    });

    // Sort matches within each round group by match ID
    Object.keys(roundGroups).forEach(roundKey => {
        roundGroups[roundKey].sort((a, b) => a.id.localeCompare(b.id));
    });

    // Sort live matches
    liveMatches.sort((a, b) => a.id.localeCompare(b.id));

    const matchData = {
        live: liveMatches,
        rounds: roundGroups
    };

    showCommandCenterModal(matchData);
}


// Function to get referee suggestions
function getRefereeSuggestions() {
    console.log('🔍 getRefereeSuggestions called - tournament status:', tournament?.status);

    if (!matches || !players) {
        console.log('❌ No matches or players data available');
        return { losers: [], winners: [], recentReferees: [] };
    }

    // Get completed matches sorted by most recent first
    const completedMatches = matches
        .filter(m => m.completed && m.winner && m.loser)
        .sort((a, b) => {
            const aTime = a.completedAt || 0;
            const bTime = b.completedAt || 0;
            return bTime - aTime; // Most recent first
        });

    console.log(`📊 Found ${completedMatches.length} completed matches for referee suggestions`);

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

    console.log('📋 Referee suggestions summary:', {
        losersCount: recentLosers.length,
        winnersCount: recentWinners.length,
        recentRefereesCount: recentRefereeAssignments.length,
        losers: recentLosers.map(l => l.name),
        winners: recentWinners.map(w => w.name)
    });

    return {
        losers: recentLosers,
        winners: recentWinners,
        recentReferees: recentRefereeAssignments
    };
}

// Function to populate referee suggestions in the UI
function populateRefereeSuggestions() {
    console.log('🎯 populateRefereeSuggestions called');

    const losersContainer = document.getElementById('refereeLosersContainer');
    const winnersContainer = document.getElementById('refereeWinnersContainer');
    const assignmentsContainer = document.getElementById('refereeAssignmentsContainer');
    const losersSection = document.getElementById('refereeLosersSection');
    const winnersSection = document.getElementById('refereeWinnersSection');
    const assignmentsSection = document.getElementById('refereeAssignmentsSection');
    const noSuggestionsMessage = document.getElementById('noRefereeSuggestionsMessage');

    if (!losersContainer || !winnersContainer || !assignmentsContainer) {
        console.log('❌ Missing referee suggestion containers');
        return;
    }

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

    // Clear existing content and hide all sections first
    liveContainer.innerHTML = '';
    frontContainer.innerHTML = '';
    backContainer.innerHTML = '';

    // Get all possible display elements
    const setupMessage = document.getElementById('setupMessage');
    const celebrationDiv = document.getElementById('tournamentCelebration');

    // Hide all possible states initially
    liveSection.style.display = 'none';
    frontSection.style.display = 'none';
    backSection.style.display = 'none';
    noMatchesMessage.style.display = 'none';
    if (setupMessage) setupMessage.style.display = 'none';
    if (celebrationDiv) celebrationDiv.style.display = 'none';

    // STATE-DRIVEN LOGIC: Use tournament status to determine what to show
    if (!tournament || !tournament.status) {
        // Fallback: show empty state if no tournament data
        noMatchesMessage.style.display = 'block';
    } else {
        // Update title based on tournament state
        const titleElement = document.getElementById('commandCenterTitle');
        if (titleElement) {
            if (tournament.name && (tournament.status === 'setup' || tournament.status === 'active')) {
                titleElement.textContent = `Match Controls - ${tournament.name}`;
            } else {
                titleElement.textContent = 'Match Controls';
            }
        }

        switch (tournament.status) {
            case 'setup':
                // Tournament in setup - show enhanced setup interface
                if (setupMessage) {
                    // Update setup message with player count and bracket info
                    const totalPlayers = players ? players.length : 0;
                    const paidPlayers = players ? players.filter(p => p.paid).length : 0;

                    // Determine bracket size based on paid players
                    let bracketInfo;
                    if (paidPlayers < 4) {
                        bracketInfo = 'need 4+ paid players to start';
                    } else if (paidPlayers <= 8) {
                        bracketInfo = 'ready for 8-player bracket';
                    } else if (paidPlayers <= 16) {
                        bracketInfo = 'ready for 16-player bracket';
                    } else if (paidPlayers <= 32) {
                        bracketInfo = 'ready for 32-player bracket';
                    } else {
                        bracketInfo = 'remove 2+ players for 32-player bracket';
                    }

                    // Create player lists with toggle functionality
                    const paidPlayersList = players.filter(p => p.paid);
                    const unpaidPlayersList = players.filter(p => !p.paid);

                    let paidPlayersHTML = '';
                    if (paidPlayersList.length > 0) {
                        paidPlayersHTML = `
                            <div style="margin-top: 15px;">
                                <div style="font-size: 13px; font-weight: 500; color: #065f46;">Entrance Fee Paid (${paidPlayersList.length}):</div>
                                <div style="margin-top: 8px; line-height: 1.6;">
                                    ${paidPlayersList.map(player =>
                                        `<span onclick="togglePaid(${player.id}); setTimeout(() => showMatchCommandCenter(), 100);" style="cursor: pointer; color: #000; margin-right: 12px; display: inline-block;">✓ ${player.name}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        `;
                    }

                    let unpaidPlayersHTML = '';
                    if (unpaidPlayersList.length > 0) {
                        unpaidPlayersHTML = `
                            <div style="margin-top: 15px;">
                                <div style="font-size: 13px; font-weight: 500; color: #dc2626;">Entrance Fee Not Paid (${unpaidPlayersList.length}):</div>
                                <div style="margin-top: 8px; line-height: 1.6;">
                                    ${unpaidPlayersList.map(player =>
                                        `<span onclick="togglePaid(${player.id}); setTimeout(() => showMatchCommandCenter(), 100);" style="cursor: pointer; color: #000; margin-right: 12px; display: inline-block;">☐ ${player.name}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        `;
                    }

                    // Add player input section
                    let addPlayerHTML = '';
                    if (totalPlayers < 32) { // Only show if we haven't hit the max
                        addPlayerHTML = `
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                                <div style="font-size: 13px; font-weight: 500; color: #374151;">Add Player:</div>
                                <div style="margin-top: 8px; display: flex; gap: 8px; width: 70%; margin: 8px auto 0 auto;">
                                    <input type="text" id="ccPlayerName" placeholder="Player name" style="flex: 1; padding: 4px 8px; border: 1px solid #ccc;" onkeypress="if(event.key==='Enter') addPlayerFromCC()">
                                    <button onclick="addPlayerFromCC()" style="padding: 4px 12px; background: #065f46; color: white; border: none; cursor: pointer;">Add</button>
                                </div>
                            </div>
                        `;
                    }

                    // Add helpful hint for player interaction
                    let hintHTML = '';
                    if (totalPlayers > 0) {
                        hintHTML = `
                            <p style="font-size: 12px; color: #6b7280; margin-top: 12px; font-style: italic;">💡 Click player names to toggle paid/unpaid status</p>
                        `;
                    }

                    setupMessage.innerHTML = `
                        <p>🔧 Tournament in setup mode</p>
                        <p style="font-size: 14px; color: #666; margin-top: 8px;">${totalPlayers} players registered, ${paidPlayers} entrance fees paid (${bracketInfo})</p>
                        ${hintHTML}
                        ${paidPlayersHTML}
                        ${unpaidPlayersHTML}
                        ${addPlayerHTML}
                    `;
                    setupMessage.style.display = 'block';
                } else {
                    noMatchesMessage.style.display = 'block'; // Fallback
                }
                break;

            case 'completed':
                // Tournament completed - show celebration
                showTournamentCelebration();
                break;

            case 'active':
            default:
                // Tournament active - show matches (guaranteed to exist in active state)
                // Populate LIVE matches
                if (matchData.live && matchData.live.length > 0) {
                    liveSection.style.display = 'block';
                    let liveHTML = '';
                    matchData.live.forEach(match => {
                        liveHTML += createMatchCard(match);
                    });
                    liveContainer.innerHTML = liveHTML;
                }

                // Populate Round-based matches
                if (matchData.rounds && Object.keys(matchData.rounds).length > 0) {
                    // Sort round keys for logical display order
                    const sortedRoundKeys = Object.keys(matchData.rounds).sort((a, b) => {
                        // Custom sorting for logical round progression
                        const order = {
                            'FS-R1': 1, 'BS-R1': 2, 'FS-R2': 3, 'BS-R2': 4, 'FS-R3': 5, 'BS-R3': 6,
                            'FS-R4': 7, 'BS-R4': 8, 'FS-R5': 9, 'BS-R5': 10, 'BS-R6': 11, 'BS-R7': 12,
                            'BS-FINAL': 13, 'GRAND-FINAL': 14, 'OTHER': 15
                        };
                        return (order[a] || 99) - (order[b] || 99);
                    });

                    // Create dynamic sections for each round
                    let allRoundsHTML = '';
                    sortedRoundKeys.forEach(roundKey => {
                        const roundMatches = matchData.rounds[roundKey];
                        if (roundMatches && roundMatches.length > 0) {
                            // Create user-friendly round names
                            let roundDisplayName;
                            if (roundKey === 'GRAND-FINAL') {
                                roundDisplayName = '🏆 Grand Final';
                            } else if (roundKey === 'BS-FINAL') {
                                roundDisplayName = '🥈 Backside Final';
                            } else if (roundKey.startsWith('FS-R')) {
                                const roundNum = roundKey.replace('FS-R', '');
                                roundDisplayName = `⚪ Round ${roundNum} (Frontside)`;
                            } else if (roundKey.startsWith('BS-R')) {
                                const roundNum = roundKey.replace('BS-R', '');
                                roundDisplayName = `⚫ Round ${roundNum} (Backside)`;
                            } else {
                                roundDisplayName = `📋 ${roundKey}`;
                            }

                            allRoundsHTML += `
                                <div class="cc-match-section" style="display: block;">
                                    <h4 class="cc-section-header">${roundDisplayName} - Ready to Start</h4>
                                    <div class="cc-matches-container">
                                        ${roundMatches.map(match => createMatchCard(match)).join('')}
                                    </div>
                                </div>
                            `;
                        }
                    });

                    // Use frontContainer for all round content (repurposing existing container)
                    frontContainer.innerHTML = allRoundsHTML;
                    frontSection.style.display = 'block';
                }

                // If no matches in active state, show fallback message
                const hasActiveMatches = (matchData.live && matchData.live.length > 0) ||
                                       (matchData.rounds && Object.keys(matchData.rounds).length > 0);
                if (!hasActiveMatches) {
                    noMatchesMessage.style.display = 'block';
                }
                break;
        }
    }

    // Clear and populate referee section using STATE-DRIVEN LOGIC (same pattern as match section)
    const losersContainer = document.getElementById('refereeLosersContainer');
    const winnersContainer = document.getElementById('refereeWinnersContainer');
    const assignmentsContainer = document.getElementById('refereeAssignmentsContainer');
    const refereeHeader = document.querySelector('.referee-suggestions-container .cc-section-header');
    const refereeSetupMessage = document.getElementById('refereeSetupMessage');
    const noRefereeSuggestionsMessage = document.getElementById('noRefereeSuggestionsMessage');

    // Clear existing content first
    if (losersContainer) losersContainer.innerHTML = '';
    if (winnersContainer) winnersContainer.innerHTML = '';
    if (assignmentsContainer) assignmentsContainer.innerHTML = '';

    // Hide all referee sections initially
    const refereeSections = document.querySelectorAll('#refereeLosersSection, #refereeWinnersSection, #refereeAssignmentsSection');
    refereeSections.forEach(section => section.style.display = 'none');
    if (refereeSetupMessage) refereeSetupMessage.style.display = 'none';
    if (noRefereeSuggestionsMessage) noRefereeSuggestionsMessage.style.display = 'none';

    // STATE-DRIVEN LOGIC: Use tournament status to determine referee column content
    if (!tournament || !tournament.status) {
        // Fallback: show empty state if no tournament data
        if (refereeHeader) refereeHeader.textContent = '👥 Referee Suggestions';
        if (noRefereeSuggestionsMessage) noRefereeSuggestionsMessage.style.display = 'block';
    } else {
        switch (tournament.status) {
            case 'setup':
                // Tournament in setup - show setup actions
                if (refereeHeader) refereeHeader.textContent = '⚙️ Setup Actions';
                if (refereeSetupMessage) {
                    // Create action buttons below the setup message
                    const paidPlayers = players ? players.filter(p => p.paid).length : 0;
                    let bracketSize, buttonText;

                    if (paidPlayers < 4) {
                        buttonText = 'Generate Bracket (need 4+ players)';
                    } else if (paidPlayers > 32) {
                        buttonText = 'Generate Bracket (max 32 players)';
                    } else {
                        if (paidPlayers <= 8) bracketSize = 8;
                        else if (paidPlayers <= 16) bracketSize = 16;
                        else if (paidPlayers <= 32) bracketSize = 32;
                        buttonText = `Generate ${bracketSize}-Player Bracket`;
                    }

                    refereeSetupMessage.innerHTML = `
                        <p>🔧 Tournament in setup mode</p>
                        <p style="font-size: 14px; color: #666; margin-top: 8px;">Setup actions will help you configure the tournament.</p>
                        <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn" onclick="popDialog(); showPage('registration')" style="padding: 8px 16px; font-size: 14px;">Player Registration Page</button>
                            <button class="btn" onclick="popDialog(); showPage('config')" style="padding: 8px 16px; font-size: 14px;">Global Settings Page</button>
                            <button class="btn btn-success" onclick="generateBracket()" style="padding: 8px 16px; font-size: 14px;">${buttonText}</button>
                        </div>
                    `;
                    refereeSetupMessage.style.display = 'block';
                } else if (noRefereeSuggestionsMessage) {
                    noRefereeSuggestionsMessage.style.display = 'block'; // Fallback
                }
                break;

            case 'completed':
                // Tournament completed - show achievements
                showTournamentAchievements();
                break;

            case 'active':
            default:
                // Tournament active - show referee suggestions
                if (refereeHeader) refereeHeader.textContent = '👥 Referee Suggestions';

                // Reset subsection headers to their original values for active state
                const losersSection = document.getElementById('refereeLosersSection');
                const winnersSection = document.getElementById('refereeWinnersSection');
                const assignmentsSection = document.getElementById('refereeAssignmentsSection');

                if (losersSection) {
                    const header = losersSection.querySelector('.referee-subsection-header');
                    if (header) header.textContent = 'Recent Losers';
                }
                if (winnersSection) {
                    const header = winnersSection.querySelector('.referee-subsection-header');
                    if (header) header.textContent = 'Recent Winners';
                }
                if (assignmentsSection) {
                    const header = assignmentsSection.querySelector('.referee-subsection-header');
                    if (header) {
                        header.textContent = 'Recent Assignments';
                        header.style.display = '';  // Restore display (remove inline style)
                    }
                }

                refereeSections.forEach(section => section.style.display = 'block');
                populateRefereeSuggestions();
                break;
        }
    }

    // Restore scroll position
    if (scrollContainer && initialScrollTop > 0) {
        scrollContainer.scrollTop = initialScrollTop;
    }

    // Use dialog stack to show modal
    pushDialog('matchCommandCenterModal', () => showMatchCommandCenter(), true);

    // Set up event handlers

    // Statistics button handler
    const statsBtn = document.getElementById('showStatisticsBtn');
    if (statsBtn) {
        statsBtn.onclick = () => showStatisticsModal();
    }

    okBtn.onclick = () => popDialog(); // Use dialog stack to close
}

// Wrapper function to add player from Command Center
function addPlayerFromCC() {
    const ccInput = document.getElementById('ccPlayerName');
    const mainInput = document.getElementById('playerName');

    if (!ccInput || !mainInput) {
        console.error('Required input elements not found');
        return;
    }

    const playerName = ccInput.value.trim();
    if (!playerName) {
        alert('Please enter a player name');
        return;
    }

    // Temporarily set the main input value so addPlayer() can read it
    const originalValue = mainInput.value;
    mainInput.value = playerName;

    // Call the existing addPlayer function
    addPlayer();

    // Restore original value and clear our input
    mainInput.value = originalValue;
    ccInput.value = '';

    // Refresh the Command Center to show the new player and restore focus
    setTimeout(() => {
        showMatchCommandCenter();
        // Restore focus to the input field after refresh
        setTimeout(() => {
            const ccInput = document.getElementById('ccPlayerName');
            if (ccInput) {
                ccInput.focus();
            }
        }, 50);
    }, 100);
}

// Function to show Statistics modal with results table
function showStatisticsModal() {
    // Update the statistics table with current data
    updateStatisticsTable();

    // Use dialog stack to show modal with automatic parent hiding/restoration
    pushDialog('statisticsModal', () => showStatisticsModal(), true);
}

// Function to update the statistics table with current results data
function updateStatisticsTable() {
    // Use the enhanced original updateResultsTable function
    if (typeof updateResultsTable === 'function') {
        updateResultsTable('statisticsTableBody');
    }
}

// Helper functions for match command center actions

function completeMatchFromCommandCenter(matchId, playerNumber) {
    // Find the match
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        return;
    }

    // Complete match with selected winner - this will open Match Completion dialog via dialog stack
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

/**
 * TOURNAMENT CELEBRATION FUNCTIONS
 * Display celebratory podium when tournament is completed
 */

function showTournamentCelebration() {
    const celebrationDiv = document.getElementById('tournamentCelebration');
    const refereeSuggestionsContainer = document.querySelector('.referee-suggestions-container');

    if (!celebrationDiv || !tournament || !tournament.placements) {
        console.error('Cannot show celebration: missing elements or tournament data');
        return;
    }

    // Show the celebration container
    celebrationDiv.style.display = 'block';

    // Update subtitle with player count
    updateCelebrationSubtitle();

    // Get top 3 players from placements
    const topPlayers = getTopThreePlayers();

    // Populate podium positions
    populatePodium(topPlayers);

    // Generate and display highlights
    generateTournamentHighlights();

    // Referee column is now handled by main dialog logic based on tournament status

    console.log('🏆 Tournament celebration displayed');
}

function updateCelebrationSubtitle() {
    const subtitleDiv = document.getElementById('celebrationSubtitle');
    const titleDiv = document.querySelector('.celebration-title');
    if (!subtitleDiv) return;

    // Update main title with tournament name
    if (titleDiv && tournament.name) {
        titleDiv.textContent = `🏆 ${tournament.name} Complete! 🏆`;
    }

    // Update subtitle with tournament date and actual player count (paid players only)
    const playerCount = players ? players.filter(p => p.paid).length : 0;
    let subtitleText = `Congratulations to all ${playerCount} players!`;

    if (tournament.date) {
        // Format the date nicely for display
        const tournamentDate = new Date(tournament.date);
        const formattedDate = tournamentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        subtitleText = `${formattedDate} • ${subtitleText}`;
    }

    subtitleDiv.textContent = subtitleText;
}

function getTopThreePlayers() {
    if (!tournament.placements || !players) return { first: null, second: null, third: null };

    const placements = tournament.placements;
    const topPlayers = { first: null, second: null, third: null };

    // Find players by their placement rank
    for (const playerId in placements) {
        const rank = placements[playerId];
        const player = players.find(p => String(p.id) === playerId);

        if (player) {
            if (rank === 1) topPlayers.first = player;
            else if (rank === 2) topPlayers.second = player;
            else if (rank === 3) topPlayers.third = player;
        }
    }

    return topPlayers;
}

function populatePodium(topPlayers) {
    // Update first place
    if (topPlayers.first) {
        const firstDiv = document.getElementById('podium-first');
        if (firstDiv) {
            const nameDiv = firstDiv.querySelector('.podium-name');
            if (nameDiv) nameDiv.textContent = topPlayers.first.name;
        }
    }

    // Update second place
    if (topPlayers.second) {
        const secondDiv = document.getElementById('podium-second');
        if (secondDiv) {
            const nameDiv = secondDiv.querySelector('.podium-name');
            if (nameDiv) nameDiv.textContent = topPlayers.second.name;
        }
    }

    // Update third place
    if (topPlayers.third) {
        const thirdDiv = document.getElementById('podium-third');
        if (thirdDiv) {
            const nameDiv = thirdDiv.querySelector('.podium-name');
            if (nameDiv) nameDiv.textContent = topPlayers.third.name;
        }
    }
}

function generateTournamentHighlights() {
    const highlightsGrid = document.getElementById('highlightsGrid');
    if (!highlightsGrid || !players) return;

    // Calculate tournament statistics
    const stats = calculateTournamentStats();

    // Create highlight items
    const highlights = [
        {
            label: 'Most 180s',
            value: stats.most180s.count > 0 ? `${stats.most180s.player} (${stats.most180s.count})` : 'None'
        },
        {
            label: 'Highest Checkout',
            value: stats.highestCheckout.value > 0 ? `${stats.highestCheckout.player} (${stats.highestCheckout.value})` : 'None'
        },
        {
            label: 'Shortest Leg',
            value: stats.shortestLeg.value !== Infinity ? `${stats.shortestLeg.player} (${stats.shortestLeg.value} darts)` : 'None'
        }
    ];

    // Generate HTML for highlights
    let highlightsHTML = '';
    highlights.forEach(highlight => {
        highlightsHTML += `
            <div class="highlight-item">
                <div class="highlight-label">${highlight.label}</div>
                <div class="highlight-value">${highlight.value}</div>
            </div>
        `;
    });

    highlightsGrid.innerHTML = highlightsHTML;
}

function calculateTournamentStats() {
    const stats = {
        mostAchievementPoints: { player: '', points: 0 },
        most180s: { player: '', count: 0 },
        highestCheckout: { player: '', value: 0 },
        mostTons: { player: '', count: 0 },
        shortestLeg: { player: '', value: Infinity }
    };

    players.forEach(player => {
        if (!player.stats) return;

        // Check most achievement points (excluding placement/participation)
        const achievementPoints = calculateAchievementPoints(player);
        if (achievementPoints > stats.mostAchievementPoints.points) {
            stats.mostAchievementPoints = { player: player.name, points: achievementPoints };
        }

        // Check 180s
        const oneEighties = player.stats.oneEighties || 0;
        if (oneEighties > stats.most180s.count) {
            stats.most180s = { player: player.name, count: oneEighties };
        }

        // Check highest checkout
        const highOuts = player.stats.highOuts || [];
        if (Array.isArray(highOuts) && highOuts.length > 0) {
            const playerHighest = Math.max(...highOuts);
            if (playerHighest > stats.highestCheckout.value) {
                stats.highestCheckout = { player: player.name, value: playerHighest };
            }
        }

        // Check tons
        const tons = player.stats.tons || 0;
        if (tons > stats.mostTons.count) {
            stats.mostTons = { player: player.name, count: tons };
        }

        // Check shortest leg
        const shortLegs = player.stats.shortLegs || [];
        if (Array.isArray(shortLegs) && shortLegs.length > 0) {
            const playerShortest = Math.min(...shortLegs);
            if (playerShortest < stats.shortestLeg.value) {
                stats.shortestLeg = { player: player.name, value: playerShortest };
            }
        }
    });

    return stats;
}

function calculateAchievementPoints(player) {
    if (!player.stats) return 0;

    let points = 0;

    // Achievement points only (no placement or participation)
    const shortLegsCount = Array.isArray(player.stats.shortLegs) ? player.stats.shortLegs.length : 0;
    points += shortLegsCount * (config.points.shortLeg || 0);
    points += (player.stats.highOuts || []).length * config.points.highOut;
    points += (player.stats.tons || 0) * config.points.ton;
    points += (player.stats.oneEighties || 0) * config.points.oneEighty;

    return points;
}



function showTournamentAchievements() {
    console.log('🏆 Showing tournament achievements...');

    // Update header
    const header = document.querySelector('.referee-suggestions-container .cc-section-header');
    if (header) {
        header.textContent = '🏆 Tournament Achievements';
    }

    // Use existing referee containers to display achievement data
    const losersContainer = document.getElementById('refereeLosersContainer');
    const winnersContainer = document.getElementById('refereeWinnersContainer');
    const assignmentsContainer = document.getElementById('refereeAssignmentsContainer');
    const losersSection = document.getElementById('refereeLosersSection');
    const winnersSection = document.getElementById('refereeWinnersSection');
    const assignmentsSection = document.getElementById('refereeAssignmentsSection');

    if (!losersContainer || !winnersContainer || !assignmentsContainer) {
        console.error('Missing achievement containers');
        return;
    }

    // Calculate comprehensive stats
    console.log('📊 Calculating tournament stats...');
    const stats = calculateTournamentStats();
    const tournamentSummary = calculateTournamentSummary();

    console.log('Stats calculated:', stats);
    console.log('Tournament summary:', tournamentSummary);

    // Update section headers
    if (losersSection) {
        const header = losersSection.querySelector('.referee-subsection-header');
        if (header) header.textContent = '🎯 Player Achievements';
    }
    if (winnersSection) {
        const header = winnersSection.querySelector('.referee-subsection-header');
        if (header) header.textContent = '📊 Tournament Summary';
    }
    if (assignmentsSection) {
        const header = assignmentsSection.querySelector('.referee-subsection-header');
        if (header) header.style.display = 'none';
    }

    // Populate Player Achievements in losers container
    losersContainer.innerHTML = `
        <div class="achievement-list">
            ${generateAchievementItem('Most Achievement Points', stats.mostAchievementPoints.points > 0 ? `${stats.mostAchievementPoints.player} (${stats.mostAchievementPoints.points})` : 'None')}
            ${generateAchievementItem('Most 180s', stats.most180s.count > 0 ? `${stats.most180s.player} (${stats.most180s.count})` : 'None')}
            ${generateAchievementItem('Highest Checkout', stats.highestCheckout.value > 0 ? `${stats.highestCheckout.player} (${stats.highestCheckout.value})` : 'None')}
            ${generateAchievementItem('Shortest Leg', stats.shortestLeg.value !== Infinity ? `${stats.shortestLeg.player} (${stats.shortestLeg.value} darts)` : 'None')}
            ${generateAchievementItem('Most Tons', stats.mostTons.count > 0 ? `${stats.mostTons.player} (${stats.mostTons.count})` : 'None')}
        </div>
    `;

    // Populate Tournament Summary in winners container
    winnersContainer.innerHTML = `
        <div class="achievement-list">
            ${generateAchievementItem('Matches Played', tournamentSummary.matchesPlayed)}
            ${generateAchievementItem('Bracket Size', tournamentSummary.bracketSize)}
        </div>
    `;

    // Populate Export section in assignments container
    assignmentsContainer.innerHTML = `
        <div class="achievement-export-section">
            <button class="achievement-export-btn" onclick="exportTournamentJSON()">
                📊 Export Tournament Data
            </button>
            <p class="export-description">Download complete tournament results as JSON file</p>
        </div>
    `;

    // Make all sections visible after populating them
    if (losersSection) losersSection.style.display = 'block';
    if (winnersSection) winnersSection.style.display = 'block';
    if (assignmentsSection) assignmentsSection.style.display = 'block';

    console.log('✓ Tournament achievements displayed and sections made visible');
}

function generateAchievementItem(label, value) {
    return `
        <div class="achievement-item">
            <span class="achievement-label">${label}:</span>
            <span class="achievement-value">${value}</span>
        </div>
    `;
}

function calculateTournamentSummary() {
    // Count only matches that were actually played (not walkovers)
    const matchesPlayed = matches ? matches.filter(m => {
        return m.completed && !m.autoAdvanced &&
               (!isWalkover(m.player1) && !isWalkover(m.player2));
    }).length : 0;

    const summary = {
        matchesPlayed: matchesPlayed,
        completedMatches: matches ? matches.filter(m => m.completed).length : 0,
        bracketSize: tournament.bracketSize || (players ? players.length : 0)
    };

    return summary;
}

// Tournament export function for celebration button
function exportTournamentJSON() {
    // Use the existing exportResultsJSON function from results-config.js
    if (typeof exportResultsJSON === 'function') {
        exportResultsJSON();
    } else {
        alert('Export function not available. Please use the Results page to export tournament data.');
    }
}

// Expose functions to global scope
if (typeof window !== 'undefined') {
    window.showTournamentCelebration = showTournamentCelebration;
    window.exportTournamentJSON = exportTournamentJSON;
    window.updateStatusCenter = updateStatusCenter;
    window.clearStatusCenter = clearStatusCenter;
    window.getMatchProgressionText = getMatchProgressionText;
}

// --- END: Tournament Celebration Functions ---

// --- STATUS CENTER FUNCTIONS - Dynamic Tournament Page Status Bar ---

// Get detailed match state information including undo status
function getDetailedMatchState(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return null;

    const basicState = getMatchState(match);

    // For non-completed matches, return basic state
    if (basicState !== 'completed') {
        let stateText;
        switch (basicState) {
            case 'pending': stateText = 'Pending'; break;
            case 'ready': stateText = 'Ready to Start'; break;
            case 'live': stateText = 'Started'; break;
            default: stateText = 'Unknown'; break;
        }
        return { state: basicState, text: stateText };
    }

    // For completed matches, check if tournament is read-only first
    if (tournament && tournament.readOnly) {
        return { state: 'completed', text: 'Completed tournament: Read-only' };
    }

    // For completed matches, check if it's a walkover/bye match
    if (match.player1?.isBye || match.player2?.isBye ||
        match.player1?.name?.includes('Walkover') || match.player2?.name?.includes('Walkover')) {
        return { state: 'completed', text: 'Cannot Undo, Walkover' };
    }

    // Check undo status for regular completed matches
    const history = getTournamentHistory();
    if (history.length === 0) {
        return { state: 'completed', text: 'Cannot Undo' };
    }

    // Only MANUAL transactions can be undone
    const manualTransaction = history.find(t => t.matchId === matchId && t.completionType === 'MANUAL');
    if (!manualTransaction) {
        return { state: 'completed', text: 'Cannot Undo' };
    }

    // Check for blocking downstream matches
    if (tournament.bracketSize && MATCH_PROGRESSION[tournament.bracketSize]) {
        const progression = MATCH_PROGRESSION[tournament.bracketSize][matchId];
        if (progression) {
            const blockingMatches = [];

            // Check winner's destination
            if (progression.winner) {
                const [targetMatchId] = progression.winner;
                const targetMatch = matches.find(m => m.id === targetMatchId);
                if (targetMatch && targetMatch.completed) {
                    const targetTransaction = history.find(t => t.matchId === targetMatchId);
                    if (targetTransaction && targetTransaction.completionType === 'MANUAL') {
                        blockingMatches.push(targetMatchId);
                    }
                }
            }

            // Check loser's destination
            if (progression.loser) {
                const [targetMatchId] = progression.loser;
                const targetMatch = matches.find(m => m.id === targetMatchId);
                if (targetMatch && targetMatch.completed) {
                    const targetTransaction = history.find(t => t.matchId === targetMatchId);
                    if (targetTransaction && targetTransaction.completionType === 'MANUAL') {
                        blockingMatches.push(targetMatchId);
                    }
                }
            }

            // Generate text based on blocking matches
            if (blockingMatches.length === 0) {
                return { state: 'completed', text: 'Can Undo' };
            } else if (blockingMatches.length === 1) {
                return { state: 'completed', text: `Cannot Undo, blocked by ${blockingMatches[0]}` };
            } else {
                return { state: 'completed', text: `Cannot Undo, blocked by ${blockingMatches[0]} and ${blockingMatches[1]}` };
            }
        }
    }

    return { state: 'completed', text: 'Can Undo' };
}

// Update center watermark with message (supports both string and two-line object)
function updateStatusCenter(content) {
    const centerElement = document.getElementById('watermark-center');
    if (centerElement) {
        if (typeof content === 'string') {
            // Backwards compatibility for single-line strings
            centerElement.textContent = content;
        } else if (content && content.line1 && content.line2) {
            // Two-line object format
            centerElement.innerHTML = `
                <div class="status-line1">${content.line1}</div>
                <div class="status-line2">${content.line2}</div>
            `;
        }
        centerElement.classList.add('active');
    }
}

// Clear center watermark
function clearStatusCenter() {
    const centerElement = document.getElementById('watermark-center');
    if (centerElement) {
        centerElement.textContent = '';
        centerElement.classList.remove('active');
    }
}

// Generate two-line match information using MATCH_PROGRESSION and state logic
function getMatchProgressionText(matchId) {
    if (!tournament || !tournament.bracketSize || !MATCH_PROGRESSION[tournament.bracketSize]) {
        return null;
    }

    const progression = MATCH_PROGRESSION[tournament.bracketSize][matchId];
    if (!progression) {
        return null;
    }

    // Get detailed state information
    const stateInfo = getDetailedMatchState(matchId);
    if (!stateInfo) {
        return null;
    }

    // Generate first line: Match ID + State
    const line1 = `${matchId} • ${stateInfo.text}`;

    // Generate second line: Progression
    const destinations = [];
    if (progression.winner && progression.winner[0]) {
        destinations.push(progression.winner[0]);
    }
    if (progression.loser && progression.loser[0]) {
        destinations.push(progression.loser[0]);
    }

    let line2;
    if (destinations.length === 0) {
        line2 = "Leads to tournament completion";
    } else if (destinations.length === 1) {
        line2 = `Leads to ${destinations[0]}`;
    } else {
        line2 = `Leads to ${destinations[0]} and ${destinations[1]}`;
    }

    return {
        line1: line1,
        line2: line2
    };
}

// --- END: Status Center Functions ---

// UNDO SYSTEM FUNCTIONS - Refactored for Transactional History



