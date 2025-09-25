/**
 * Bracket Lines and Background Module
 *
 * This module handles all progression line rendering and backside gradient backgrounds
 * for the NewTon DC Tournament Manager bracket system.
 *
 * Functions:
 * - createBracketLabels(): Creates FRONTSIDE and BACKSIDE text labels
 * - createLShapedProgressionLine(): Creates L-shaped tournament bracket progression lines
 * - createProgressionLine(): Creates simple horizontal/vertical line pairs
 * - createBacksideBackground(): Creates gradient background for backside bracket area
 * - createCustomFinalsLines(): Creates custom Finals area progression lines
 */

/**
 * Creates FRONTSIDE and BACKSIDE labels above bracket sections
 * @param {Object} grid - Grid configuration object
 * @param {number} round1StartY - Y coordinate of first round start
 * @param {number} frontsideX - X coordinate of frontside bracket center
 * @param {number} backsideX - X coordinate of backside bracket center
 * @returns {Array} Array of 3 DOM elements [tournamentHeader, frontsideLabel, backsideLabel]
 */
function createBracketLabels(grid, round1StartY, frontsideX, backsideX) {
    const labels = [];

    // Get current tournament data
    const currentTournament = localStorage.getItem('currentTournament');
    let tournamentName = 'Tournament';
    let tournamentDate = 'Date';

    if (currentTournament) {
        try {
            const tournament = JSON.parse(currentTournament);
            tournamentName = tournament.name || 'Tournament';
            tournamentDate = tournament.date || 'Date';
        } catch (e) {
            console.warn('Could not parse tournament data for bracket labels');
        }
    }

    // Calculate positioning
    const bracketCenterX = grid.centerX; // Center of entire bracket
    const tournamentHeaderY = round1StartY - 220; // 220px above bracket start for tournament header
    const labelY = round1StartY - 80; // 80px above bracket start for FRONTSIDE/BACKSIDE labels
    const fontSize = '36px'; // Large font for visibility when zoomed out

    // Tournament header - centered on entire bracket
    const tournamentHeader = document.createElement('div');
    tournamentHeader.style.position = 'absolute';
    tournamentHeader.style.left = `${bracketCenterX}px`;
    tournamentHeader.style.top = `${tournamentHeaderY}px`;
    tournamentHeader.style.fontFamily = 'Arial, sans-serif';
    tournamentHeader.style.fontSize = '78px';
    tournamentHeader.style.color = '#333333';
    tournamentHeader.style.textAlign = 'center';
    tournamentHeader.style.transform = 'translateX(-50%)'; // Center horizontally
    tournamentHeader.style.zIndex = '5';
    tournamentHeader.innerHTML = `<strong>${tournamentName}</strong> - ${tournamentDate}`;
    labels.push(tournamentHeader);

    // FRONTSIDE label - positioned above frontside bracket
    const frontsideLabel = document.createElement('div');
    frontsideLabel.style.position = 'absolute';
    frontsideLabel.style.left = `${frontsideX}px`;
    frontsideLabel.style.top = `${labelY}px`;
    frontsideLabel.style.fontFamily = 'Arial, sans-serif';
    frontsideLabel.style.fontSize = fontSize;
    frontsideLabel.style.fontWeight = 'bold';
    frontsideLabel.style.color = '#333333';
    frontsideLabel.style.textAlign = 'center';
    frontsideLabel.style.transform = 'translateX(-50%)'; // Center horizontally
    frontsideLabel.style.zIndex = '5';
    frontsideLabel.textContent = 'FRONTSIDE';
    labels.push(frontsideLabel);

    // BACKSIDE label - positioned above backside bracket
    const backsideLabel = document.createElement('div');
    backsideLabel.style.position = 'absolute';
    backsideLabel.style.left = `${backsideX}px`;
    backsideLabel.style.top = `${labelY}px`;
    backsideLabel.style.fontFamily = 'Arial, sans-serif';
    backsideLabel.style.fontSize = fontSize;
    backsideLabel.style.fontWeight = 'bold';
    backsideLabel.style.color = '#333333';
    backsideLabel.style.textAlign = 'center';
    backsideLabel.style.transform = 'translateX(-50%)'; // Center horizontally
    backsideLabel.style.zIndex = '5';
    backsideLabel.textContent = 'BACKSIDE';
    labels.push(backsideLabel);

    return labels;
}

/**
 * Creates an L-shaped progression line using HTML/CSS positioning
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Ending X coordinate
 * @param {number} toY - Ending Y coordinate
 * @param {string} color - Line color (default: '#666666')
 * @param {number} width - Line width in pixels (default: 3)
 * @returns {Array} Array of 3 DOM elements [hLine1, vLine, hLine2]
 */
function createLShapedProgressionLine(fromX, fromY, toX, toY, color = '#666666', width = 3) {
    const midX = (fromX + toX) / 2;
    const halfWidth = Math.floor(width / 2);

    // Horizontal line from start to midpoint (extend slightly past midpoint)
    const hLine1 = document.createElement('div');
    hLine1.style.position = 'absolute';
    hLine1.style.left = `${Math.min(fromX, midX)}px`;
    hLine1.style.top = `${fromY}px`;
    hLine1.style.width = `${Math.abs(midX - fromX) + halfWidth}px`; // Extend by half line width
    hLine1.style.height = `${width}px`;
    hLine1.style.backgroundColor = color;
    hLine1.style.zIndex = '1';

    // Vertical line from fromY to toY (extend at both ends)
    const vLine = document.createElement('div');
    vLine.style.position = 'absolute';
    vLine.style.left = `${midX - halfWidth}px`; // Start half-width before midpoint
    vLine.style.top = `${Math.min(fromY, toY)}px`;
    vLine.style.width = `${width}px`;
    vLine.style.height = `${Math.abs(toY - fromY) + halfWidth}px`; // Extend by half line width
    vLine.style.backgroundColor = color;
    vLine.style.zIndex = '1';

    // Horizontal line from midpoint to end (extend slightly before midpoint)
    const hLine2 = document.createElement('div');
    hLine2.style.position = 'absolute';
    hLine2.style.left = `${Math.min(midX, toX) - halfWidth}px`; // Start half-width before midpoint
    hLine2.style.top = `${toY}px`;
    hLine2.style.width = `${Math.abs(toX - midX) + halfWidth}px`; // Extend by half line width
    hLine2.style.height = `${width}px`;
    hLine2.style.backgroundColor = color;
    hLine2.style.zIndex = '1';

    return [hLine1, vLine, hLine2];
}

/**
 * Creates a simple horizontal and vertical line pair
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Ending X coordinate
 * @param {number} toY - Ending Y coordinate
 * @param {string} color - Line color (default: '#666666')
 * @param {number} width - Line width in pixels (default: 3)
 * @returns {Array} Array of 2 DOM elements [hLine, vLine]
 */
function createProgressionLine(fromX, fromY, toX, toY, color = '#666666', width = 3) {
    // Create horizontal line
    const hLine = document.createElement('div');
    hLine.style.position = 'absolute';
    hLine.style.left = `${Math.min(fromX, toX)}px`;
    hLine.style.top = `${fromY}px`;
    hLine.style.width = `${Math.abs(toX - fromX)}px`;
    hLine.style.height = `${width}px`;
    hLine.style.backgroundColor = color;
    hLine.style.zIndex = '1';

    // Create vertical line
    const vLine = document.createElement('div');
    vLine.style.position = 'absolute';
    vLine.style.left = `${toX}px`;
    vLine.style.top = `${Math.min(fromY, toY)}px`;
    vLine.style.width = `${width}px`;
    vLine.style.height = `${Math.abs(toY - fromY)}px`;
    vLine.style.backgroundColor = color;
    vLine.style.zIndex = '1';

    return [hLine, vLine];
}

/**
 * Creates a gradient background for the backside bracket area
 * @param {Object} grid - Grid configuration object with positioning data
 * @param {number} bracketSize - Tournament bracket size (8, 16, or 32)
 * @param {number} round1StartY - Starting Y position for round 1
 * @param {number} spacing - Vertical spacing between matches
 * @returns {HTMLElement} The gradient background element
 */
function createBacksideBackground(grid, bracketSize, round1StartY, spacing) {
    const backsideBackground = document.createElement('div');
    backsideBackground.className = 'backside-background';
    backsideBackground.style.cssText = `
        position: absolute;
        background: linear-gradient(to left, rgba(0, 0, 0, 0.06), transparent);
        border-radius: 16px;
        z-index: 0;
        pointer-events: none;
    `;

    // Calculate background dimensions based on bracket size
    let backsideStartX, backsideEndX, backsideHeight, horizontalSpacingMultiplier;

    switch (bracketSize) {
        case 8:
            horizontalSpacingMultiplier = 3;
            backsideHeight = 4 * spacing + 40; // Height to cover all 8-player matches plus padding
            break;
        case 16:
            horizontalSpacingMultiplier = 5;
            backsideHeight = 8 * spacing + 40; // Height to cover all 16-player matches plus padding
            break;
        case 32:
            horizontalSpacingMultiplier = 7;
            backsideHeight = 16 * spacing + 40; // Height to cover all 32-player matches plus padding
            break;
        default:
            horizontalSpacingMultiplier = 3;
            backsideHeight = 4 * spacing + 40;
    }

    backsideStartX = grid.centerX - grid.centerBuffer - (horizontalSpacingMultiplier * (grid.matchWidth + grid.horizontalSpacing));
    backsideEndX = grid.centerX - grid.centerBuffer - grid.horizontalSpacing;
    const backsideWidth = backsideEndX - backsideStartX + grid.matchWidth + 40 - (2 * grid.matchWidth / 3);
    const backsideTop = round1StartY - 20; // Start with some padding above

    backsideBackground.style.left = `${backsideStartX - 20 - (grid.matchWidth / 2) + (grid.matchWidth / 3)}px`;
    backsideBackground.style.top = `${backsideTop}px`;
    backsideBackground.style.width = `${backsideWidth}px`;
    backsideBackground.style.height = `${backsideHeight}px`;

    return backsideBackground;
}

/**
 * Creates custom Finals area progression lines with optimized positioning
 * @param {number} round3X - X position of round 3 matches
 * @param {number} fs31CenterY - Center Y position of FS-3-1 match
 * @param {number} finalsX - X position of finals matches
 * @param {number} backsideFinalCenterY - Center Y position of BS-FINAL match
 * @param {number} grandFinalCenterY - Center Y position of GRAND-FINAL match
 * @param {Object} grid - Grid configuration object
 * @returns {Array} Array of DOM elements for all Finals progression lines
 */
function createCustomFinalsLines(round3X, fs31CenterY, finalsX, backsideFinalCenterY, grandFinalCenterY, grid) {
    // Custom Finals connections with vertical line positioned closer to Finals matches
    const finalsVerticalX = finalsX - 40; // Position vertical line closer to Finals matches

    // FS-3-1 to GRAND-FINAL connector
    const fs31_h1 = document.createElement('div');
    fs31_h1.style.position = 'absolute';
    fs31_h1.style.left = `${round3X + grid.matchWidth}px`;
    fs31_h1.style.top = `${fs31CenterY}px`;
    fs31_h1.style.width = `${finalsVerticalX - (round3X + grid.matchWidth)}px`;
    fs31_h1.style.height = '3px';
    fs31_h1.style.backgroundColor = '#666666';
    fs31_h1.style.zIndex = '1';

    // Create invisible placeholder for fs31_v to maintain array structure
    const fs31_v = document.createElement('div');
    fs31_v.style.display = 'none';

    const fs31_h2 = document.createElement('div');
    fs31_h2.style.position = 'absolute';
    fs31_h2.style.left = `${finalsVerticalX}px`;
    fs31_h2.style.top = `${grandFinalCenterY}px`;
    fs31_h2.style.width = `${finalsX - finalsVerticalX}px`;
    fs31_h2.style.height = '3px';
    fs31_h2.style.backgroundColor = '#666666';
    fs31_h2.style.zIndex = '1';

    // FS-3-1 to BS-FINAL connector (reuse same vertical line approach)
    const fs31ToBsFinal_h1 = document.createElement('div');
    fs31ToBsFinal_h1.style.position = 'absolute';
    fs31ToBsFinal_h1.style.left = `${round3X + grid.matchWidth}px`;
    fs31ToBsFinal_h1.style.top = `${fs31CenterY}px`;
    fs31ToBsFinal_h1.style.width = `${finalsVerticalX - (round3X + grid.matchWidth)}px`;
    fs31ToBsFinal_h1.style.height = '3px';
    fs31ToBsFinal_h1.style.backgroundColor = '#666666';
    fs31ToBsFinal_h1.style.zIndex = '1';

    // Extend vertical line to cover both BS-FINAL and GRAND-FINAL
    const extendedVertical = document.createElement('div');
    extendedVertical.style.position = 'absolute';
    extendedVertical.style.left = `${finalsVerticalX}px`;
    extendedVertical.style.top = `${Math.min(fs31CenterY, backsideFinalCenterY, grandFinalCenterY)}px`;
    extendedVertical.style.width = '3px';
    extendedVertical.style.height = `${Math.max(fs31CenterY, backsideFinalCenterY, grandFinalCenterY) - Math.min(fs31CenterY, backsideFinalCenterY, grandFinalCenterY)}px`;
    extendedVertical.style.backgroundColor = '#666666';
    extendedVertical.style.zIndex = '1';

    const fs31ToBsFinal_h2 = document.createElement('div');
    fs31ToBsFinal_h2.style.position = 'absolute';
    fs31ToBsFinal_h2.style.left = `${finalsVerticalX}px`;
    fs31ToBsFinal_h2.style.top = `${backsideFinalCenterY}px`;
    fs31ToBsFinal_h2.style.width = `${finalsX - finalsVerticalX}px`;
    fs31ToBsFinal_h2.style.height = '3px';
    fs31ToBsFinal_h2.style.backgroundColor = '#666666';
    fs31ToBsFinal_h2.style.zIndex = '1';

    return [fs31_h1, fs31_v, fs31_h2, fs31ToBsFinal_h1, extendedVertical, fs31ToBsFinal_h2];
}

/**
 * Creates all frontside progression lines for 8-player bracket
 * @param {Object} grid - Grid configuration object
 * @param {Array} matches - Array of match objects
 * @param {Object} positions - Object containing calculated match positions
 * @returns {Array} Array of DOM elements for all frontside progression lines
 */
function create8PlayerFrontsideLines(grid, matches, positions) {
    const progressionLines = [];
    const { round1X, round2X, round3X, round1StartY, spacing, fs21Y, fs22Y, fs31Y } = positions;

    // Add bracket labels
    const frontsideX = round1X + (grid.matchWidth / 2); // Center of FS-R1 for consistent positioning
    const backsideX = grid.centerX - grid.centerBuffer - (grid.matchWidth + grid.horizontalSpacing) + (grid.matchWidth / 2); // Center of BS-R1 for consistent positioning
    const labels = createBracketLabels(grid, round1StartY, frontsideX, backsideX);
    progressionLines.push(...labels);

    // Find matches
    const fs11 = matches.find(m => m.id === 'FS-1-1');
    const fs12 = matches.find(m => m.id === 'FS-1-2');
    const fs13 = matches.find(m => m.id === 'FS-1-3');
    const fs14 = matches.find(m => m.id === 'FS-1-4');
    const fs21 = matches.find(m => m.id === 'FS-2-1');
    const fs22 = matches.find(m => m.id === 'FS-2-2');
    const fs31 = matches.find(m => m.id === 'FS-3-1');

    if (!fs11 || !fs21) return progressionLines;

    // Calculate center Y coordinates
    const fs11CenterY = round1StartY + (grid.matchHeight / 2);
    const fs12CenterY = round1StartY + spacing + (grid.matchHeight / 2);
    const fs13CenterY = round1StartY + 2 * spacing + (grid.matchHeight / 2);
    const fs14CenterY = round1StartY + 3 * spacing + (grid.matchHeight / 2);
    const fs21CenterY = fs21Y + (grid.matchHeight / 2);
    const fs22CenterY = fs22Y + (grid.matchHeight / 2);

    // Round 1 → Round 2 connections
    // FS-1-1 and FS-1-2 to FS-2-1 connectors
    if (fs11 && fs21) {
        const [fs11_h1, fs11_v, fs11_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs11CenterY, round2X, fs21CenterY);
        progressionLines.push(fs11_h1, fs11_v, fs11_h2);
    }
    if (fs12 && fs21) {
        const [fs12_h1, fs12_v, fs12_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs12CenterY, round2X, fs21CenterY);
        progressionLines.push(fs12_h1, fs12_v, fs12_h2);
    }

    // FS-1-3 and FS-1-4 to FS-2-2 connectors
    if (fs13 && fs22) {
        const [fs13_h1, fs13_v, fs13_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs13CenterY, round2X, fs22CenterY);
        progressionLines.push(fs13_h1, fs13_v, fs13_h2);
    }
    if (fs14 && fs22) {
        const [fs14_h1, fs14_v, fs14_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs14CenterY, round2X, fs22CenterY);
        progressionLines.push(fs14_h1, fs14_v, fs14_h2);
    }

    // Round 2 → Round 3 connections (FS-2-1 and FS-2-2 → FS-3-1)
    if (fs31) {
        const fs31CenterY = fs31Y + (grid.matchHeight / 2);

        // FS-2-1 and FS-2-2 to FS-3-1 connectors
        if (fs21 && fs31) {
            const [fs21_h1, fs21_v, fs21_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs21CenterY, round3X, fs31CenterY);
            progressionLines.push(fs21_h1, fs21_v, fs21_h2);
        }
        if (fs22 && fs31) {
            const [fs22_h1, fs22_v, fs22_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs22CenterY, round3X, fs31CenterY);
            progressionLines.push(fs22_h1, fs22_v, fs22_h2);
        }

        // Finals connections (FS-3-1 and BS-FINAL → GRAND-FINAL)
        const spacingMultiplier = 4;
        const finalsX = round3X + grid.matchWidth + (spacingMultiplier * grid.horizontalSpacing);
        const backsideFinalY = grid.centerY - 80;
        const grandFinalY = grid.centerY + 80;

        const backsideFinalCenterY = backsideFinalY + (grid.matchHeight / 2);
        const grandFinalCenterY = grandFinalY + (grid.matchHeight / 2);

        // Custom Finals connections
        const [fs31_h1, fs31_v, fs31_h2, fs31ToBsFinal_h1, extendedVertical, fs31ToBsFinal_h2] =
            createCustomFinalsLines(round3X, fs31CenterY, finalsX, backsideFinalCenterY, grandFinalCenterY, grid);
        progressionLines.push(fs31_h1, fs31_v, fs31_h2, fs31ToBsFinal_h1, extendedVertical, fs31ToBsFinal_h2);
    }

    return progressionLines;
}

/**
 * Creates all backside progression lines for 8-player bracket
 * @param {Object} grid - Grid configuration object
 * @param {Array} matches - Array of match objects
 * @param {Object} positions - Object containing calculated match positions
 * @returns {Array} Array of DOM elements for all backside progression lines
 */
function create8PlayerBacksideLines(grid, matches, positions) {
    const progressionLines = [];
    const { round1X, bs1X, bs2X, bs3X, round1StartY, spacing } = positions;
    const { bs11Y, bs12Y, bs21Y, bs22Y, bs31Y } = positions;

    // Calculate center Y coordinates for frontside matches (for loser feeds)
    const fs11CenterY = round1StartY + (grid.matchHeight / 2);
    const fs12CenterY = round1StartY + spacing + (grid.matchHeight / 2);
    const fs13CenterY = round1StartY + 2 * spacing + (grid.matchHeight / 2);
    const fs14CenterY = round1StartY + 3 * spacing + (grid.matchHeight / 2);

    // Calculate center Y coordinates for backside matches
    const bs11CenterY = bs11Y + (grid.matchHeight / 2);
    const bs12CenterY = bs12Y + (grid.matchHeight / 2);
    const bs21CenterY = bs21Y + (grid.matchHeight / 2);
    const bs22CenterY = bs22Y + (grid.matchHeight / 2);
    const bs31CenterY = bs31Y + (grid.matchHeight / 2);

    // FS to BS loser feed lines
    const [fs11_h1, fs11_v, fs11_h2] = createLShapedProgressionLine(round1X, fs11CenterY, bs1X + grid.matchWidth, bs11CenterY);
    const [fs12_h1, fs12_v, fs12_h2] = createLShapedProgressionLine(round1X, fs12CenterY, bs1X + grid.matchWidth, bs11CenterY);
    const [fs13_h1, fs13_v, fs13_h2] = createLShapedProgressionLine(round1X, fs13CenterY, bs1X + grid.matchWidth, bs12CenterY);
    const [fs14_h1, fs14_v, fs14_h2] = createLShapedProgressionLine(round1X, fs14CenterY, bs1X + grid.matchWidth, bs12CenterY);

    progressionLines.push(fs11_h1, fs11_v, fs11_h2, fs12_h1, fs12_v, fs12_h2, fs13_h1, fs13_v, fs13_h2, fs14_h1, fs14_v, fs14_h2);

    // BS to BS progression lines
    const [bs11_h1, bs11_v, bs11_h2] = createLShapedProgressionLine(bs1X, bs11CenterY, bs2X + grid.matchWidth, bs21CenterY);
    const [bs12_h1, bs12_v, bs12_h2] = createLShapedProgressionLine(bs1X, bs12CenterY, bs2X + grid.matchWidth, bs22CenterY);

    progressionLines.push(bs11_h1, bs11_v, bs11_h2, bs12_h1, bs12_v, bs12_h2);

    // BS-2 to BS-3 progression lines using createProgressionLine
    const bs2LeftEdge = bs2X;
    const bs3RightEdge = bs3X + grid.matchWidth;
    const bs2ToBS3MidPointX = (bs2LeftEdge + bs3RightEdge) / 2;

    // BS-2-1 to BS-3-1 progression line
    const [hLine1, vLine1] = createProgressionLine(bs2LeftEdge, bs21CenterY, bs2ToBS3MidPointX, bs21CenterY);
    const [hLine2, vLine2] = createProgressionLine(bs2ToBS3MidPointX, bs21CenterY, bs2ToBS3MidPointX, bs31CenterY);
    const [hLine3, vLine3] = createProgressionLine(bs2ToBS3MidPointX, bs31CenterY, bs3RightEdge, bs31CenterY);

    // BS-2-2 to BS-3-1 progression line
    const [hLine4, vLine4] = createProgressionLine(bs2LeftEdge, bs22CenterY, bs2ToBS3MidPointX, bs22CenterY);
    const [hLine5, vLine5] = createProgressionLine(bs2ToBS3MidPointX, bs22CenterY, bs2ToBS3MidPointX, bs31CenterY);

    progressionLines.push(hLine1, vLine1, hLine2, vLine2, hLine3, vLine3, hLine4, vLine4, hLine5, vLine5);

    // Add BS-FINAL indicator for 8-player bracket
    const spacingMultiplier = 4;
    const finalsX = positions.round3X + grid.matchWidth + (spacingMultiplier * grid.horizontalSpacing);
    const backsideFinalY = grid.centerY - 80;
    const backsideFinalCenterY = backsideFinalY + (grid.matchHeight / 2);

    const bs31ToFinalElements = createBS31ToFinalIndicator(bs3X, bs31CenterY, finalsX, backsideFinalCenterY, grid);
    progressionLines.push(...bs31ToFinalElements);

    return progressionLines;
}

/**
 * Creates L-shaped line with arrow pointing to BS-FINAL text for 8-player bracket
 * @param {number} bs3X - X position of BS-3-1 match
 * @param {number} bs31CenterY - Center Y position of BS-3-1 match
 * @param {number} finalsX - X position of finals matches
 * @param {number} backsideFinalCenterY - Center Y position of BS-FINAL match
 * @param {Object} grid - Grid configuration object
 * @returns {Array} Array of DOM elements for the L-shaped line, arrow, and text
 */
function createBS31ToFinalIndicator(bs3X, bs31CenterY, finalsX, backsideFinalCenterY, grid) {
    const elements = [];

    // Calculate positions
    const horizontalLineLength = 40; // Length of horizontal line
    const lineStartX = bs3X; // Start line from the left edge of BS-3-1 match
    const verticalLineEndX = lineStartX - horizontalLineLength; // Position vertical line at the end of horizontal line
    const textX = verticalLineEndX - 27; // Position text ~8px closer to the right (about one character width)
    const textY = backsideFinalCenterY + grid.matchHeight + 20; // Position text one match height + 20px below BS-FINAL center
    const verticalLineBottomY = textY - 15; // Vertical line ends 15px above text

    // Horizontal line (left from BS-3-1)
    const hLine = document.createElement('div');
    hLine.style.position = 'absolute';
    hLine.style.left = `${lineStartX - horizontalLineLength}px`;
    hLine.style.top = `${bs31CenterY}px`;
    hLine.style.width = `${horizontalLineLength}px`;
    hLine.style.height = '3px';
    hLine.style.backgroundColor = '#666666';
    hLine.style.zIndex = '2';
    elements.push(hLine);

    // Vertical line (downward)
    const vLine = document.createElement('div');
    vLine.style.position = 'absolute';
    vLine.style.left = `${verticalLineEndX}px`;
    vLine.style.top = `${bs31CenterY}px`;
    vLine.style.width = '3px';
    vLine.style.height = `${verticalLineBottomY - bs31CenterY}px`; // Line extends to just above text
    vLine.style.backgroundColor = '#666666';
    vLine.style.zIndex = '2';
    elements.push(vLine);

    // Arrow pointing down
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.left = `${verticalLineEndX - 4}px`; // Center arrow on vertical line (1px right)
    arrow.style.top = `${verticalLineBottomY}px`; // Position arrow at the end of vertical line
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '5px solid transparent';
    arrow.style.borderRight = '5px solid transparent';
    arrow.style.borderTop = '10px solid #666666';
    arrow.style.zIndex = '2';
    elements.push(arrow);

    // BS-FINAL text
    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.left = `${textX}px`;
    text.style.top = `${textY}px`;
    text.style.fontFamily = 'Arial, sans-serif';
    text.style.fontSize = '12px';
    text.style.fontWeight = 'bold';
    text.style.color = '#333333';
    text.style.textAlign = 'center';
    text.style.zIndex = '2';
    text.textContent = 'BS-FINAL';
    elements.push(text);

    return elements;
}

/**
 * Creates L-shaped line with arrow pointing to BS-FINAL text for 16-player bracket
 * @param {number} bs5X - X position of BS-5-1 match
 * @param {number} bs51CenterY - Center Y position of BS-5-1 match
 * @param {number} finalsX - X position of finals matches
 * @param {number} backsideFinalCenterY - Center Y position of BS-FINAL match
 * @param {Object} grid - Grid configuration object
 * @returns {Array} Array of DOM elements for the L-shaped line, arrow, and text
 */
function create16PlayerBSFinalIndicator(bs5X, bs51CenterY, finalsX, backsideFinalCenterY, grid) {
    const elements = [];

    // Calculate positions (same approach as 8-player createBS31ToFinalIndicator)
    const horizontalLineLength = 40; // Length of horizontal line
    const lineStartX = bs5X; // Start line from the left edge of BS-5-1 match
    const verticalLineEndX = lineStartX - horizontalLineLength; // Position vertical line at the end of horizontal line
    const textX = verticalLineEndX - 27; // Position text ~8px closer to the right (about one character width)
    const textY = backsideFinalCenterY + grid.matchHeight + 20; // Position text one match height + 20px below BS-FINAL center
    const verticalLineBottomY = textY - 15; // Vertical line ends 15px above text

    // Horizontal line (left from BS-5-1)
    const hLine = document.createElement('div');
    hLine.style.position = 'absolute';
    hLine.style.left = `${lineStartX - horizontalLineLength}px`;
    hLine.style.top = `${bs51CenterY}px`;
    hLine.style.width = `${horizontalLineLength}px`;
    hLine.style.height = '3px';
    hLine.style.backgroundColor = '#666666';
    hLine.style.zIndex = '2';
    elements.push(hLine);

    // Vertical line (downward)
    const vLine = document.createElement('div');
    vLine.style.position = 'absolute';
    vLine.style.left = `${verticalLineEndX}px`;
    vLine.style.top = `${bs51CenterY}px`;
    vLine.style.width = '3px';
    vLine.style.height = `${verticalLineBottomY - bs51CenterY}px`; // Line extends to just above text
    vLine.style.backgroundColor = '#666666';
    vLine.style.zIndex = '2';
    elements.push(vLine);

    // Arrow pointing down
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.left = `${verticalLineEndX - 4}px`; // Center arrow on vertical line (1px right)
    arrow.style.top = `${verticalLineBottomY}px`; // Position arrow at the end of vertical line
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '5px solid transparent';
    arrow.style.borderRight = '5px solid transparent';
    arrow.style.borderTop = '10px solid #666666';
    arrow.style.zIndex = '2';
    elements.push(arrow);

    // BS-FINAL text
    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.left = `${textX}px`;
    text.style.top = `${textY}px`;
    text.style.fontFamily = 'Arial, sans-serif';
    text.style.fontSize = '12px';
    text.style.fontWeight = 'bold';
    text.style.color = '#333333';
    text.style.textAlign = 'center';
    text.style.zIndex = '2';
    text.textContent = 'BS-FINAL';
    elements.push(text);

    return elements;
}

/**
 * Creates all frontside progression lines for 16-player bracket
 * @param {Object} grid - Grid configuration object
 * @param {Array} matches - Array of match objects
 * @param {Object} positions - Object containing calculated match positions
 * @returns {Array} Array of DOM elements for all frontside progression lines
 */
function create16PlayerFrontsideLines(grid, matches, positions) {
    const progressionLines = [];
    const { round1X, round2X, round3X, round4X, round1StartY, spacing } = positions;
    const { fs21Y, fs22Y, fs23Y, fs24Y, fs31Y, fs32Y, fs41Y } = positions;

    // Add bracket labels
    const frontsideX = round1X + (grid.matchWidth / 2); // Center of FS-R1 for consistent positioning
    const backsideX = grid.centerX - grid.centerBuffer - (grid.matchWidth + grid.horizontalSpacing) + (grid.matchWidth / 2); // Center of BS-R1 for consistent positioning
    const labels = createBracketLabels(grid, round1StartY, frontsideX, backsideX);
    progressionLines.push(...labels);

    // Calculate center Y coordinates for all matches
    const fs11CenterY = round1StartY + (grid.matchHeight / 2);
    const fs12CenterY = round1StartY + spacing + (grid.matchHeight / 2);
    const fs13CenterY = round1StartY + 2 * spacing + (grid.matchHeight / 2);
    const fs14CenterY = round1StartY + 3 * spacing + (grid.matchHeight / 2);
    const fs15CenterY = round1StartY + 4 * spacing + (grid.matchHeight / 2);
    const fs16CenterY = round1StartY + 5 * spacing + (grid.matchHeight / 2);
    const fs17CenterY = round1StartY + 6 * spacing + (grid.matchHeight / 2);
    const fs18CenterY = round1StartY + 7 * spacing + (grid.matchHeight / 2);

    const fs21CenterY = fs21Y + (grid.matchHeight / 2);
    const fs22CenterY = fs22Y + (grid.matchHeight / 2);
    const fs23CenterY = fs23Y + (grid.matchHeight / 2);
    const fs24CenterY = fs24Y + (grid.matchHeight / 2);

    const fs31CenterY = fs31Y + (grid.matchHeight / 2);
    const fs32CenterY = fs32Y + (grid.matchHeight / 2);

    const fs41CenterY = fs41Y + (grid.matchHeight / 2);

    // Round 1 → Round 2 connections
    // FS-1-1 and FS-1-2 to FS-2-1
    const [fs11_h1, fs11_v, fs11_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs11CenterY, round2X, fs21CenterY);
    progressionLines.push(fs11_h1, fs11_v, fs11_h2);

    const [fs12_h1, fs12_v, fs12_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs12CenterY, round2X, fs21CenterY);
    progressionLines.push(fs12_h1, fs12_v, fs12_h2);

    // FS-1-3 and FS-1-4 to FS-2-2
    const [fs13_h1, fs13_v, fs13_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs13CenterY, round2X, fs22CenterY);
    progressionLines.push(fs13_h1, fs13_v, fs13_h2);

    const [fs14_h1, fs14_v, fs14_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs14CenterY, round2X, fs22CenterY);
    progressionLines.push(fs14_h1, fs14_v, fs14_h2);

    // FS-1-5 and FS-1-6 to FS-2-3
    const [fs15_h1, fs15_v, fs15_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs15CenterY, round2X, fs23CenterY);
    progressionLines.push(fs15_h1, fs15_v, fs15_h2);

    const [fs16_h1, fs16_v, fs16_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs16CenterY, round2X, fs23CenterY);
    progressionLines.push(fs16_h1, fs16_v, fs16_h2);

    // FS-1-7 and FS-1-8 to FS-2-4
    const [fs17_h1, fs17_v, fs17_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs17CenterY, round2X, fs24CenterY);
    progressionLines.push(fs17_h1, fs17_v, fs17_h2);

    const [fs18_h1, fs18_v, fs18_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs18CenterY, round2X, fs24CenterY);
    progressionLines.push(fs18_h1, fs18_v, fs18_h2);

    // Round 2 → Round 3 connections
    // FS-2-1 and FS-2-2 to FS-3-1
    const [fs21_h1, fs21_v, fs21_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs21CenterY, round3X, fs31CenterY);
    progressionLines.push(fs21_h1, fs21_v, fs21_h2);

    const [fs22_h1, fs22_v, fs22_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs22CenterY, round3X, fs31CenterY);
    progressionLines.push(fs22_h1, fs22_v, fs22_h2);

    // FS-2-3 and FS-2-4 to FS-3-2
    const [fs23_h1, fs23_v, fs23_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs23CenterY, round3X, fs32CenterY);
    progressionLines.push(fs23_h1, fs23_v, fs23_h2);

    const [fs24_h1, fs24_v, fs24_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs24CenterY, round3X, fs32CenterY);
    progressionLines.push(fs24_h1, fs24_v, fs24_h2);

    // Round 3 → Round 4 connections
    // FS-3-1 and FS-3-2 to FS-4-1
    const [fs31_h1, fs31_v, fs31_h2] = createLShapedProgressionLine(round3X + grid.matchWidth, fs31CenterY, round4X, fs41CenterY);
    progressionLines.push(fs31_h1, fs31_v, fs31_h2);

    const [fs32_h1, fs32_v, fs32_h2] = createLShapedProgressionLine(round3X + grid.matchWidth, fs32CenterY, round4X, fs41CenterY);
    progressionLines.push(fs32_h1, fs32_v, fs32_h2);

    // Round 4 → Finals connections
    const spacingMultiplier = 4;
    const finalsX = round4X + grid.matchWidth + (spacingMultiplier * grid.horizontalSpacing);
    const backsideFinalY = grid.centerY - 80;
    const grandFinalY = grid.centerY + 80;

    const backsideFinalCenterY = backsideFinalY + (grid.matchHeight / 2);
    const grandFinalCenterY = grandFinalY + (grid.matchHeight / 2);

    // Custom Finals connections (FS-4-1 to both BS-FINAL and GRAND-FINAL)
    const [fs41_h1, fs41_v, fs41_h2, fs41ToBsFinal_h1, extendedVertical, fs41ToBsFinal_h2] =
        createCustomFinalsLines(round4X, fs41CenterY, finalsX, backsideFinalCenterY, grandFinalCenterY, grid);
    progressionLines.push(fs41_h1, fs41_v, fs41_h2, fs41ToBsFinal_h1, extendedVertical, fs41ToBsFinal_h2);

    return progressionLines;
}

/**
 * Creates all backside progression lines for 16-player bracket
 * @param {Object} grid - Grid configuration object
 * @param {Array} matches - Array of match objects
 * @param {Object} positions - Object containing calculated match positions
 * @returns {Array} Array of DOM elements for all backside progression lines
 */
function create16PlayerBacksideLines(grid, matches, positions) {
    const progressionLines = [];
    const { round1X, bs1X, bs2X, bs3X, bs4X } = positions;
    const { round1StartY, spacing } = positions;
    const { bs11Y, bs12Y, bs13Y, bs14Y } = positions;

    // Calculate center Y coordinates for frontside Round 1 matches (for loser feeds)
    const fs11CenterY = round1StartY + (grid.matchHeight / 2);
    const fs12CenterY = round1StartY + spacing + (grid.matchHeight / 2);
    const fs13CenterY = round1StartY + 2 * spacing + (grid.matchHeight / 2);
    const fs14CenterY = round1StartY + 3 * spacing + (grid.matchHeight / 2);
    const fs15CenterY = round1StartY + 4 * spacing + (grid.matchHeight / 2);
    const fs16CenterY = round1StartY + 5 * spacing + (grid.matchHeight / 2);
    const fs17CenterY = round1StartY + 6 * spacing + (grid.matchHeight / 2);
    const fs18CenterY = round1StartY + 7 * spacing + (grid.matchHeight / 2);

    // Calculate center Y coordinates for backside matches
    const bs11CenterY = bs11Y + (grid.matchHeight / 2);
    const bs12CenterY = bs12Y + (grid.matchHeight / 2);
    const bs13CenterY = bs13Y + (grid.matchHeight / 2);
    const bs14CenterY = bs14Y + (grid.matchHeight / 2);

    // Phase 1: FS Round 1 to BS Round 1 loser feed lines (custom L-shaped with vertical closer to frontside)
    // Hardcode vertical line position closer to frontside (like 8-player bracket)
    const loserFeedVerticalX = round1X - 40; // Position vertical line 40px left of frontside matches

    // Helper function to create custom loser feed lines
    function createLoserFeedLine(fromX, fromY, toX, toY, verticalX) {
        // Horizontal line from frontside match to vertical line
        const hLine1 = document.createElement('div');
        hLine1.style.position = 'absolute';
        hLine1.style.left = `${Math.min(fromX, verticalX)}px`;
        hLine1.style.top = `${fromY}px`;
        hLine1.style.width = `${Math.abs(verticalX - fromX)}px`;
        hLine1.style.height = '3px';
        hLine1.style.backgroundColor = '#666666';
        hLine1.style.zIndex = '1';

        // Vertical line
        const vLine = document.createElement('div');
        vLine.style.position = 'absolute';
        vLine.style.left = `${verticalX}px`;
        vLine.style.top = `${Math.min(fromY, toY)}px`;
        vLine.style.width = '3px';
        vLine.style.height = `${Math.abs(toY - fromY)}px`;
        vLine.style.backgroundColor = '#666666';
        vLine.style.zIndex = '1';

        // Horizontal line from vertical line to backside match
        const hLine2 = document.createElement('div');
        hLine2.style.position = 'absolute';
        hLine2.style.left = `${Math.min(verticalX, toX)}px`;
        hLine2.style.top = `${toY}px`;
        hLine2.style.width = `${Math.abs(toX - verticalX)}px`;
        hLine2.style.height = '3px';
        hLine2.style.backgroundColor = '#666666';
        hLine2.style.zIndex = '1';

        return [hLine1, vLine, hLine2];
    }

    // FS-1-1 and FS-1-2 losers → BS-1-1
    const [fs11_h1, fs11_v, fs11_h2] = createLoserFeedLine(round1X, fs11CenterY, bs1X + grid.matchWidth, bs11CenterY, loserFeedVerticalX);
    const [fs12_h1, fs12_v, fs12_h2] = createLoserFeedLine(round1X, fs12CenterY, bs1X + grid.matchWidth, bs11CenterY, loserFeedVerticalX);

    // FS-1-3 and FS-1-4 losers → BS-1-2
    const [fs13_h1, fs13_v, fs13_h2] = createLoserFeedLine(round1X, fs13CenterY, bs1X + grid.matchWidth, bs12CenterY, loserFeedVerticalX);
    const [fs14_h1, fs14_v, fs14_h2] = createLoserFeedLine(round1X, fs14CenterY, bs1X + grid.matchWidth, bs12CenterY, loserFeedVerticalX);

    // FS-1-5 and FS-1-6 losers → BS-1-3
    const [fs15_h1, fs15_v, fs15_h2] = createLoserFeedLine(round1X, fs15CenterY, bs1X + grid.matchWidth, bs13CenterY, loserFeedVerticalX);
    const [fs16_h1, fs16_v, fs16_h2] = createLoserFeedLine(round1X, fs16CenterY, bs1X + grid.matchWidth, bs13CenterY, loserFeedVerticalX);

    // FS-1-7 and FS-1-8 losers → BS-1-4
    const [fs17_h1, fs17_v, fs17_h2] = createLoserFeedLine(round1X, fs17CenterY, bs1X + grid.matchWidth, bs14CenterY, loserFeedVerticalX);
    const [fs18_h1, fs18_v, fs18_h2] = createLoserFeedLine(round1X, fs18CenterY, bs1X + grid.matchWidth, bs14CenterY, loserFeedVerticalX);

    progressionLines.push(fs11_h1, fs11_v, fs11_h2, fs12_h1, fs12_v, fs12_h2, fs13_h1, fs13_v, fs13_h2, fs14_h1, fs14_v, fs14_h2);
    progressionLines.push(fs15_h1, fs15_v, fs15_h2, fs16_h1, fs16_v, fs16_h2, fs17_h1, fs17_v, fs17_h2, fs18_h1, fs18_v, fs18_h2);

    // Phase 2a: BS Round 1 → BS Round 2 (straight lines, 1:1 progression)
    console.log('🔧 Creating BS-R1 → BS-R2 straight lines');
    console.log('bs1X:', bs1X, 'bs2X:', bs2X);
    console.log('bs21Y:', positions.bs21Y, 'bs22Y:', positions.bs22Y);

    const bs21CenterY = positions.bs21Y + (grid.matchHeight / 2);
    const bs22CenterY = positions.bs22Y + (grid.matchHeight / 2);
    const bs23CenterY = positions.bs23Y + (grid.matchHeight / 2);
    const bs24CenterY = positions.bs24Y + (grid.matchHeight / 2);

    // Straight lines: BS-1-1→BS-2-1, BS-1-2→BS-2-2, BS-1-3→BS-2-3, BS-1-4→BS-2-4
    // Connect from left edge of BS-R1 to right edge of BS-R2 (proper bracket flow)
    const lineStart = bs2X + grid.matchWidth; // Start from right edge of BS-R2 matches
    const lineEnd = bs1X; // End at left edge of BS-R1 matches
    const lineWidth = lineEnd - lineStart; // Width between the matches
    console.log('BS progression line: from BS-R2 right edge', lineStart, 'to BS-R1 left edge', lineEnd, 'width =', lineWidth);

    const bs11ToBs21 = document.createElement('div');
    bs11ToBs21.style.position = 'absolute';
    bs11ToBs21.style.left = `${lineStart}px`;
    bs11ToBs21.style.top = `${bs11CenterY}px`;
    bs11ToBs21.style.width = `${lineWidth}px`;
    bs11ToBs21.style.height = '3px';
    bs11ToBs21.style.backgroundColor = '#666666';
    bs11ToBs21.style.zIndex = '10';

    console.log('BS-1-1→BS-2-1 line:', {
        left: bs1X,
        top: bs11CenterY,
        width: lineWidth,
        height: 3
    });

    const bs12ToBs22 = document.createElement('div');
    bs12ToBs22.style.position = 'absolute';
    bs12ToBs22.style.left = `${lineStart}px`;
    bs12ToBs22.style.top = `${bs12CenterY}px`;
    bs12ToBs22.style.width = `${lineWidth}px`;
    bs12ToBs22.style.height = '3px';
    bs12ToBs22.style.backgroundColor = '#666666';
    bs12ToBs22.style.zIndex = '10';

    const bs13ToBs23 = document.createElement('div');
    bs13ToBs23.style.position = 'absolute';
    bs13ToBs23.style.left = `${lineStart}px`;
    bs13ToBs23.style.top = `${bs13CenterY}px`;
    bs13ToBs23.style.width = `${lineWidth}px`;
    bs13ToBs23.style.height = '3px';
    bs13ToBs23.style.backgroundColor = '#666666';
    bs13ToBs23.style.zIndex = '10';

    const bs14ToBs24 = document.createElement('div');
    bs14ToBs24.style.position = 'absolute';
    bs14ToBs24.style.left = `${lineStart}px`;
    bs14ToBs24.style.top = `${bs14CenterY}px`;
    bs14ToBs24.style.width = `${lineWidth}px`;
    bs14ToBs24.style.height = '3px';
    bs14ToBs24.style.backgroundColor = '#666666';
    bs14ToBs24.style.zIndex = '10';

    progressionLines.push(bs11ToBs21, bs12ToBs22, bs13ToBs23, bs14ToBs24);

    // Phase 2b: BS Round 3 → BS Round 4 (straight lines, 1:1 progression)
    console.log('🔧 Creating BS-R3 → BS-R4 straight lines');

    const bs31CenterY = positions.bs31Y + (grid.matchHeight / 2);
    const bs32CenterY = positions.bs32Y + (grid.matchHeight / 2);
    const bs41CenterY = positions.bs41Y + (grid.matchHeight / 2);
    const bs42CenterY = positions.bs42Y + (grid.matchHeight / 2);

    // Connect from right edge of BS-R4 to left edge of BS-R3 (same pattern as BS-R1→BS-R2)
    const bs3ToBS4LineStart = bs4X + grid.matchWidth; // Start from right edge of BS-R4 matches
    const bs3ToBS4LineEnd = bs3X; // End at left edge of BS-R3 matches
    const bs3ToBS4LineWidth = bs3ToBS4LineEnd - bs3ToBS4LineStart; // Width between the matches

    console.log('BS-R3→BS-R4 line: from BS-R4 right edge', bs3ToBS4LineStart, 'to BS-R3 left edge', bs3ToBS4LineEnd, 'width =', bs3ToBS4LineWidth);

    // Straight line: BS-3-1 → BS-4-1
    const bs31ToBs41 = document.createElement('div');
    bs31ToBs41.style.position = 'absolute';
    bs31ToBs41.style.left = `${bs3ToBS4LineStart}px`;
    bs31ToBs41.style.top = `${bs31CenterY}px`;
    bs31ToBs41.style.width = `${bs3ToBS4LineWidth}px`;
    bs31ToBs41.style.height = '3px';
    bs31ToBs41.style.backgroundColor = '#666666';
    bs31ToBs41.style.zIndex = '10';

    // Straight line: BS-3-2 → BS-4-2
    const bs32ToBs42 = document.createElement('div');
    bs32ToBs42.style.position = 'absolute';
    bs32ToBs42.style.left = `${bs3ToBS4LineStart}px`;
    bs32ToBs42.style.top = `${bs32CenterY}px`;
    bs32ToBs42.style.width = `${bs3ToBS4LineWidth}px`;
    bs32ToBs42.style.height = '3px';
    bs32ToBs42.style.backgroundColor = '#666666';
    bs32ToBs42.style.zIndex = '10';

    progressionLines.push(bs31ToBs41, bs32ToBs42);

    // Phase 2c: BS Round 2 → BS Round 3 (L-shaped convergence lines, 4→2)
    console.log('🔧 Creating BS-R2 → BS-R3 convergence lines');

    // BS-2-1 & BS-2-2 → BS-3-1 (convergence)
    // Note: bs21CenterY, bs22CenterY, bs23CenterY, bs24CenterY already calculated above for Phase 2a

    const [bs21_h1, bs21_v, bs21_h2] = createLShapedProgressionLine(bs2X, bs21CenterY, bs3X + grid.matchWidth, bs31CenterY);
    const [bs22_h1, bs22_v, bs22_h2] = createLShapedProgressionLine(bs2X, bs22CenterY, bs3X + grid.matchWidth, bs31CenterY);

    progressionLines.push(bs21_h1, bs21_v, bs21_h2, bs22_h1, bs22_v, bs22_h2);

    // BS-2-3 & BS-2-4 → BS-3-2 (convergence)

    const [bs23_h1, bs23_v, bs23_h2] = createLShapedProgressionLine(bs2X, bs23CenterY, bs3X + grid.matchWidth, bs32CenterY);
    const [bs24_h1, bs24_v, bs24_h2] = createLShapedProgressionLine(bs2X, bs24CenterY, bs3X + grid.matchWidth, bs32CenterY);

    progressionLines.push(bs23_h1, bs23_v, bs23_h2, bs24_h1, bs24_v, bs24_h2);

    // Phase 2d: BS Round 4 → BS Round 5 (L-shaped convergence lines, 2→1)
    console.log('🔧 Creating BS-R4 → BS-R5 convergence lines');

    const bs51CenterY = positions.bs51Y + (grid.matchHeight / 2);

    // BS-4-1 & BS-4-2 → BS-5-1 (convergence)
    const [bs41_h1, bs41_v, bs41_h2] = createLShapedProgressionLine(bs4X, bs41CenterY, positions.bs5X + grid.matchWidth, bs51CenterY);
    const [bs42_h1, bs42_v, bs42_h2] = createLShapedProgressionLine(bs4X, bs42CenterY, positions.bs5X + grid.matchWidth, bs51CenterY);

    progressionLines.push(bs41_h1, bs41_v, bs41_h2, bs42_h1, bs42_v, bs42_h2);

    // Phase 2e: BS-5-1 to BS-FINAL indicator (like 8-player BS-3-1 indicator)
    console.log('🔧 Creating BS-5-1 to BS-FINAL indicator');

    // Calculate finals positioning (similar to frontside finals)
    const spacingMultiplier = 4;
    const finalsX = positions.round1X + grid.matchWidth + (spacingMultiplier * grid.horizontalSpacing);
    const backsideFinalY = grid.centerY - 80;
    const backsideFinalCenterY = backsideFinalY + (grid.matchHeight / 2);

    // Create BS-FINAL indicator from BS-5-1 (like createBS31ToFinalIndicator for 8-player)
    const bs51ToFinalElements = create16PlayerBSFinalIndicator(positions.bs5X, bs51CenterY, finalsX, backsideFinalCenterY, grid);
    progressionLines.push(...bs51ToFinalElements);

    return progressionLines;
}

/**
 * Creates all frontside progression lines for 32-player bracket
 * @param {Object} grid - Grid configuration object
 * @param {Array} matches - Array of match objects
 * @param {Object} positions - Object containing calculated match positions
 * @returns {Array} Array of DOM elements for all frontside progression lines
 */
function create32PlayerFrontsideLines(grid, matches, positions) {
    const progressionLines = [];
    const { round1X, round2X, round3X, round4X, round5X, round1StartY, spacing } = positions;

    // Add bracket labels
    const frontsideX = round1X + (grid.matchWidth / 2); // Center of FS-R1 for consistent positioning
    const backsideX = grid.centerX - grid.centerBuffer - (grid.matchWidth + grid.horizontalSpacing) + (grid.matchWidth / 2); // Center of BS-R1 for consistent positioning
    const labels = createBracketLabels(grid, round1StartY, frontsideX, backsideX);
    progressionLines.push(...labels);
    const { fs21Y, fs22Y, fs23Y, fs24Y, fs25Y, fs26Y, fs27Y, fs28Y } = positions;
    const { fs31Y, fs32Y, fs33Y, fs34Y, fs41Y, fs42Y, fs51Y } = positions;

    // Calculate center Y coordinates for Round 1 matches (16 matches)
    const fs11CenterY = round1StartY + (grid.matchHeight / 2);
    const fs12CenterY = round1StartY + spacing + (grid.matchHeight / 2);
    const fs13CenterY = round1StartY + 2 * spacing + (grid.matchHeight / 2);
    const fs14CenterY = round1StartY + 3 * spacing + (grid.matchHeight / 2);
    const fs15CenterY = round1StartY + 4 * spacing + (grid.matchHeight / 2);
    const fs16CenterY = round1StartY + 5 * spacing + (grid.matchHeight / 2);
    const fs17CenterY = round1StartY + 6 * spacing + (grid.matchHeight / 2);
    const fs18CenterY = round1StartY + 7 * spacing + (grid.matchHeight / 2);
    const fs19CenterY = round1StartY + 8 * spacing + (grid.matchHeight / 2);
    const fs110CenterY = round1StartY + 9 * spacing + (grid.matchHeight / 2);
    const fs111CenterY = round1StartY + 10 * spacing + (grid.matchHeight / 2);
    const fs112CenterY = round1StartY + 11 * spacing + (grid.matchHeight / 2);
    const fs113CenterY = round1StartY + 12 * spacing + (grid.matchHeight / 2);
    const fs114CenterY = round1StartY + 13 * spacing + (grid.matchHeight / 2);
    const fs115CenterY = round1StartY + 14 * spacing + (grid.matchHeight / 2);
    const fs116CenterY = round1StartY + 15 * spacing + (grid.matchHeight / 2);

    // Calculate center Y coordinates for Round 2 matches (8 matches)
    const fs21CenterY = fs21Y + (grid.matchHeight / 2);
    const fs22CenterY = fs22Y + (grid.matchHeight / 2);
    const fs23CenterY = fs23Y + (grid.matchHeight / 2);
    const fs24CenterY = fs24Y + (grid.matchHeight / 2);
    const fs25CenterY = fs25Y + (grid.matchHeight / 2);
    const fs26CenterY = fs26Y + (grid.matchHeight / 2);
    const fs27CenterY = fs27Y + (grid.matchHeight / 2);
    const fs28CenterY = fs28Y + (grid.matchHeight / 2);

    // Calculate center Y coordinates for Round 3 matches (4 matches)
    const fs31CenterY = fs31Y + (grid.matchHeight / 2);
    const fs32CenterY = fs32Y + (grid.matchHeight / 2);
    const fs33CenterY = fs33Y + (grid.matchHeight / 2);
    const fs34CenterY = fs34Y + (grid.matchHeight / 2);

    // Calculate center Y coordinates for Round 4 matches (2 matches)
    const fs41CenterY = fs41Y + (grid.matchHeight / 2);
    const fs42CenterY = fs42Y + (grid.matchHeight / 2);

    // Calculate center Y coordinates for Round 5 match (1 match)
    const fs51CenterY = fs51Y + (grid.matchHeight / 2);

    // Round 1 → Round 2 connections (16→8 matches)

    // FS-1-1 and FS-1-2 to FS-2-1
    const [fs11_h1, fs11_v, fs11_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs11CenterY, round2X, fs21CenterY);
    const [fs12_h1, fs12_v, fs12_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs12CenterY, round2X, fs21CenterY);
    progressionLines.push(fs11_h1, fs11_v, fs11_h2, fs12_h1, fs12_v, fs12_h2);

    // FS-1-3 and FS-1-4 to FS-2-2
    const [fs13_h1, fs13_v, fs13_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs13CenterY, round2X, fs22CenterY);
    const [fs14_h1, fs14_v, fs14_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs14CenterY, round2X, fs22CenterY);
    progressionLines.push(fs13_h1, fs13_v, fs13_h2, fs14_h1, fs14_v, fs14_h2);

    // FS-1-5 and FS-1-6 to FS-2-3
    const [fs15_h1, fs15_v, fs15_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs15CenterY, round2X, fs23CenterY);
    const [fs16_h1, fs16_v, fs16_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs16CenterY, round2X, fs23CenterY);
    progressionLines.push(fs15_h1, fs15_v, fs15_h2, fs16_h1, fs16_v, fs16_h2);

    // FS-1-7 and FS-1-8 to FS-2-4
    const [fs17_h1, fs17_v, fs17_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs17CenterY, round2X, fs24CenterY);
    const [fs18_h1, fs18_v, fs18_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs18CenterY, round2X, fs24CenterY);
    progressionLines.push(fs17_h1, fs17_v, fs17_h2, fs18_h1, fs18_v, fs18_h2);

    // FS-1-9 and FS-1-10 to FS-2-5
    const [fs19_h1, fs19_v, fs19_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs19CenterY, round2X, fs25CenterY);
    const [fs110_h1, fs110_v, fs110_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs110CenterY, round2X, fs25CenterY);
    progressionLines.push(fs19_h1, fs19_v, fs19_h2, fs110_h1, fs110_v, fs110_h2);

    // FS-1-11 and FS-1-12 to FS-2-6
    const [fs111_h1, fs111_v, fs111_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs111CenterY, round2X, fs26CenterY);
    const [fs112_h1, fs112_v, fs112_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs112CenterY, round2X, fs26CenterY);
    progressionLines.push(fs111_h1, fs111_v, fs111_h2, fs112_h1, fs112_v, fs112_h2);

    // FS-1-13 and FS-1-14 to FS-2-7
    const [fs113_h1, fs113_v, fs113_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs113CenterY, round2X, fs27CenterY);
    const [fs114_h1, fs114_v, fs114_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs114CenterY, round2X, fs27CenterY);
    progressionLines.push(fs113_h1, fs113_v, fs113_h2, fs114_h1, fs114_v, fs114_h2);

    // FS-1-15 and FS-1-16 to FS-2-8
    const [fs115_h1, fs115_v, fs115_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs115CenterY, round2X, fs28CenterY);
    const [fs116_h1, fs116_v, fs116_h2] = createLShapedProgressionLine(round1X + grid.matchWidth, fs116CenterY, round2X, fs28CenterY);
    progressionLines.push(fs115_h1, fs115_v, fs115_h2, fs116_h1, fs116_v, fs116_h2);

    // Round 2 → Round 3 connections (8→4 matches)

    // FS-2-1 and FS-2-2 to FS-3-1
    const [fs21_h1, fs21_v, fs21_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs21CenterY, round3X, fs31CenterY);
    const [fs22_h1, fs22_v, fs22_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs22CenterY, round3X, fs31CenterY);
    progressionLines.push(fs21_h1, fs21_v, fs21_h2, fs22_h1, fs22_v, fs22_h2);

    // FS-2-3 and FS-2-4 to FS-3-2
    const [fs23_h1, fs23_v, fs23_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs23CenterY, round3X, fs32CenterY);
    const [fs24_h1, fs24_v, fs24_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs24CenterY, round3X, fs32CenterY);
    progressionLines.push(fs23_h1, fs23_v, fs23_h2, fs24_h1, fs24_v, fs24_h2);

    // FS-2-5 and FS-2-6 to FS-3-3
    const [fs25_h1, fs25_v, fs25_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs25CenterY, round3X, fs33CenterY);
    const [fs26_h1, fs26_v, fs26_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs26CenterY, round3X, fs33CenterY);
    progressionLines.push(fs25_h1, fs25_v, fs25_h2, fs26_h1, fs26_v, fs26_h2);

    // FS-2-7 and FS-2-8 to FS-3-4
    const [fs27_h1, fs27_v, fs27_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs27CenterY, round3X, fs34CenterY);
    const [fs28_h1, fs28_v, fs28_h2] = createLShapedProgressionLine(round2X + grid.matchWidth, fs28CenterY, round3X, fs34CenterY);
    progressionLines.push(fs27_h1, fs27_v, fs27_h2, fs28_h1, fs28_v, fs28_h2);

    // Round 3 → Round 4 connections (4→2 matches)

    // FS-3-1 and FS-3-2 to FS-4-1
    const [fs31_h1, fs31_v, fs31_h2] = createLShapedProgressionLine(round3X + grid.matchWidth, fs31CenterY, round4X, fs41CenterY);
    const [fs32_h1, fs32_v, fs32_h2] = createLShapedProgressionLine(round3X + grid.matchWidth, fs32CenterY, round4X, fs41CenterY);
    progressionLines.push(fs31_h1, fs31_v, fs31_h2, fs32_h1, fs32_v, fs32_h2);

    // FS-3-3 and FS-3-4 to FS-4-2
    const [fs33_h1, fs33_v, fs33_h2] = createLShapedProgressionLine(round3X + grid.matchWidth, fs33CenterY, round4X, fs42CenterY);
    const [fs34_h1, fs34_v, fs34_h2] = createLShapedProgressionLine(round3X + grid.matchWidth, fs34CenterY, round4X, fs42CenterY);
    progressionLines.push(fs33_h1, fs33_v, fs33_h2, fs34_h1, fs34_v, fs34_h2);

    // Round 4 → Round 5 connections (2→1 match)

    // FS-4-1 and FS-4-2 to FS-5-1
    const [fs41_h1, fs41_v, fs41_h2] = createLShapedProgressionLine(round4X + grid.matchWidth, fs41CenterY, round5X, fs51CenterY);
    const [fs42_h1, fs42_v, fs42_h2] = createLShapedProgressionLine(round4X + grid.matchWidth, fs42CenterY, round5X, fs51CenterY);
    progressionLines.push(fs41_h1, fs41_v, fs41_h2, fs42_h1, fs42_v, fs42_h2);

    // Round 5 → Finals connections (using custom finals routing like 8 and 16-player)

    // Calculate finals positioning (match 16-player pattern)
    const spacingMultiplier = 4;
    const finalsX = round5X + grid.matchWidth + (spacingMultiplier * grid.horizontalSpacing);
    const backsideFinalY = grid.centerY - 80;
    const grandfinalY = grid.centerY + 80;
    const backsideFinalCenterY = backsideFinalY + (grid.matchHeight / 2);
    const grandfinalCenterY = grandfinalY + (grid.matchHeight / 2);

    // Create custom finals lines from FS-5-1 to both BS-FINAL and GRAND-FINAL
    const fs51CustomLines = createCustomFinalsLines(round5X, fs51CenterY, finalsX, backsideFinalCenterY, grandfinalCenterY, grid);
    progressionLines.push(...fs51CustomLines);

    return progressionLines;
}

/**
 * Creates BS-FINAL indicator for 32-player bracket (L-shaped line with arrow and text)
 * @param {number} bs7X - X coordinate of BS-7-1 match
 * @param {number} bs71CenterY - Center Y coordinate of BS-7-1 match
 * @param {number} finalsX - X coordinate of finals area
 * @param {number} backsideFinalCenterY - Center Y coordinate of BS-FINAL match
 * @param {Object} grid - Grid configuration object
 * @returns {Array} Array of 4 DOM elements [hLine, vLine, arrow, text]
 */
function create32PlayerBSFinalIndicator(bs7X, bs71CenterY, finalsX, backsideFinalCenterY, grid) {
    const elements = [];

    // Calculate positions (same approach as 8-player and 16-player indicators)
    const horizontalLineLength = 40; // Length of horizontal line
    const lineStartX = bs7X; // Start line from the left edge of BS-7-1 match
    const verticalLineEndX = lineStartX - horizontalLineLength; // Position vertical line at the end of horizontal line
    const textX = verticalLineEndX - 27; // Position text ~8px closer to the right (about one character width)
    const textY = backsideFinalCenterY + grid.matchHeight + 20; // Position text one match height + 20px below BS-FINAL center
    const verticalLineBottomY = textY - 15; // Vertical line ends 15px above text

    // Horizontal line (left from BS-7-1)
    const hLine = document.createElement('div');
    hLine.style.position = 'absolute';
    hLine.style.left = `${lineStartX - horizontalLineLength}px`;
    hLine.style.top = `${bs71CenterY}px`;
    hLine.style.width = `${horizontalLineLength}px`;
    hLine.style.height = '3px';
    hLine.style.backgroundColor = '#666666';
    hLine.style.zIndex = '2';
    elements.push(hLine);

    // Vertical line (downward)
    const vLine = document.createElement('div');
    vLine.style.position = 'absolute';
    vLine.style.left = `${verticalLineEndX}px`;
    vLine.style.top = `${bs71CenterY}px`;
    vLine.style.width = '3px';
    vLine.style.height = `${verticalLineBottomY - bs71CenterY}px`; // Line extends to just above text
    vLine.style.backgroundColor = '#666666';
    vLine.style.zIndex = '2';
    elements.push(vLine);

    // Arrow pointing down
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.left = `${verticalLineEndX - 4}px`; // Center arrow on vertical line (1px right)
    arrow.style.top = `${verticalLineBottomY}px`; // Position arrow at the end of vertical line
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '5px solid transparent';
    arrow.style.borderRight = '5px solid transparent';
    arrow.style.borderTop = '10px solid #666666';
    arrow.style.zIndex = '2';
    elements.push(arrow);

    // BS-FINAL text
    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.left = `${textX}px`;
    text.style.top = `${textY}px`;
    text.style.fontFamily = 'Arial, sans-serif';
    text.style.fontSize = '12px';
    text.style.fontWeight = 'bold';
    text.style.color = '#333333';
    text.style.textAlign = 'center';
    text.style.zIndex = '2';
    text.textContent = 'BS-FINAL';
    elements.push(text);

    return elements;
}

/**
 * Creates all backside progression lines for 32-player bracket
 * @param {Object} grid - Grid configuration object
 * @param {Array} matches - Array of match objects
 * @param {Object} positions - Object containing calculated match positions
 * @returns {Array} Array of DOM elements for all backside progression lines
 */
function create32PlayerBacksideLines(grid, matches, positions) {
    const progressionLines = [];
    const { round1X, bs1X, bs2X, bs3X, bs4X, bs5X, bs6X, bs7X, round1StartY, spacing } = positions;

    // Phase 1: FS-R1 → BS-R1 loser feed lines (16 connections, 2→1 grouping)
    // FS-1-X losers feed into BS-1-Y matches (traditional double-elimination pattern)

    // Hardcode vertical line position closer to frontside (like 16-player bracket)
    const loserFeedVerticalX = round1X - 40; // Position vertical line 40px left of frontside matches

    // Helper function to create custom loser feed lines (same as 16-player)
    function createLoserFeedLine(fromX, fromY, toX, toY, verticalX) {
        // Horizontal line from frontside match to vertical line
        const hLine1 = document.createElement('div');
        hLine1.style.position = 'absolute';
        hLine1.style.left = `${Math.min(fromX, verticalX)}px`;
        hLine1.style.top = `${fromY}px`;
        hLine1.style.width = `${Math.abs(verticalX - fromX)}px`;
        hLine1.style.height = '3px';
        hLine1.style.backgroundColor = '#666666';
        hLine1.style.zIndex = '10';

        // Vertical line
        const vLine = document.createElement('div');
        vLine.style.position = 'absolute';
        vLine.style.left = `${verticalX}px`;
        vLine.style.top = `${Math.min(fromY, toY)}px`;
        vLine.style.width = '3px';
        vLine.style.height = `${Math.abs(toY - fromY)}px`;
        vLine.style.backgroundColor = '#666666';
        vLine.style.zIndex = '10';

        // Horizontal line from vertical line to backside match
        const hLine2 = document.createElement('div');
        hLine2.style.position = 'absolute';
        hLine2.style.left = `${Math.min(verticalX, toX)}px`;
        hLine2.style.top = `${toY}px`;
        hLine2.style.width = `${Math.abs(toX - verticalX)}px`;
        hLine2.style.height = '3px';
        hLine2.style.backgroundColor = '#666666';
        hLine2.style.zIndex = '10';

        return [hLine1, vLine, hLine2];
    }

    for (let i = 1; i <= 8; i++) {
        // Each BS-1-X receives losers from two FS-1-Y matches
        // BS-1-1 gets FS-1-1 and FS-1-2 losers, BS-1-2 gets FS-1-3 and FS-1-4 losers, etc.
        const fs1Match1Index = (2 * i) - 1; // FS-1-1, FS-1-3, FS-1-5, etc.
        const fs1Match2Index = (2 * i);     // FS-1-2, FS-1-4, FS-1-6, etc.

        // Calculate FS-1-X center Y positions
        const fs1Match1Y = round1StartY + (fs1Match1Index - 1) * spacing + (grid.matchHeight / 2);
        const fs1Match2Y = round1StartY + (fs1Match2Index - 1) * spacing + (grid.matchHeight / 2);

        // Calculate BS-1-X center Y position (aligned with FS-2-X as calculated in bracket-rendering.js)
        const input1Y = round1StartY + (2 * (i - 1)) * spacing;     // FS-R1 input for FS-2-X
        const input2Y = round1StartY + (2 * (i - 1) + 1) * spacing; // FS-R1 input for FS-2-X
        const bs1CenterY = (input1Y + input2Y) / 2 + (grid.matchHeight / 2);

        // Create custom loser feed lines using the same approach as 16-player
        // First loser feed line: FS-1-X (first match) → RIGHT side of BS-1-Y
        const [loser1_h1, loser1_v, loser1_h2] = createLoserFeedLine(
            round1X, fs1Match1Y,
            bs1X + grid.matchWidth, bs1CenterY,
            loserFeedVerticalX
        );
        progressionLines.push(loser1_h1, loser1_v, loser1_h2);

        // Second loser feed line: FS-1-X (second match) → RIGHT side of BS-1-Y
        const [loser2_h1, loser2_v, loser2_h2] = createLoserFeedLine(
            round1X, fs1Match2Y,
            bs1X + grid.matchWidth, bs1CenterY,
            loserFeedVerticalX
        );
        progressionLines.push(loser2_h1, loser2_v, loser2_h2);

    }

    // Phase 2a: BS-R1 → BS-R2 straight lines (8→8, 1:1 progression)

    for (let i = 1; i <= 8; i++) {
        // Calculate BS-1-X and BS-2-X center Y positions (same Y alignment)
        const input1Y = round1StartY + (2 * (i - 1)) * spacing;
        const input2Y = round1StartY + (2 * (i - 1) + 1) * spacing;
        const bs1CenterY = (input1Y + input2Y) / 2 + (grid.matchHeight / 2);
        const bs2CenterY = bs1CenterY; // Same Y position

        // Calculate line positioning with debugging
        // BS progression goes leftward: BS-1-X (right) → BS-2-X (left)
        const lineStartX = bs2X + grid.matchWidth; // Start from BS-2-X right edge
        const lineEndX = bs1X; // End at BS-1-X left edge
        const lineWidth = lineEndX - lineStartX; // Width between matches

        // Only create line if width is positive
        if (lineWidth > 0) {
            const straightLine = document.createElement('div');
            straightLine.style.position = 'absolute';
            straightLine.style.left = `${lineStartX}px`;
            straightLine.style.top = `${bs1CenterY}px`;
            straightLine.style.width = `${lineWidth}px`;
            straightLine.style.height = '3px';
            straightLine.style.backgroundColor = '#666666';
            straightLine.style.zIndex = '10';

            progressionLines.push(straightLine);
        }
    }

    // Phase 2b: BS-R3 → BS-R4 straight lines (4→4, 1:1 progression)

    for (let i = 1; i <= 4; i++) {
        // BS-3-X and BS-4-X will have the same Y positions (1:1 progression)
        // Need to calculate based on convergence from BS-R2
        const bs3CenterY = round1StartY + ((i - 1) * 4 + 1.5) * spacing + (grid.matchHeight / 2);
        const bs4CenterY = bs3CenterY; // Same Y position

        // Create straight horizontal line (BS progression goes leftward)
        const lineStartX = bs4X + grid.matchWidth; // Start from BS-4-X right edge
        const lineWidth = bs3X - lineStartX; // Width from BS-4-X to BS-3-X

        const straightLine = document.createElement('div');
        straightLine.style.position = 'absolute';
        straightLine.style.left = `${lineStartX}px`;
        straightLine.style.top = `${bs3CenterY}px`;
        straightLine.style.width = `${lineWidth}px`;
        straightLine.style.height = '3px';
        straightLine.style.backgroundColor = '#666666';
        straightLine.style.zIndex = '10';

        progressionLines.push(straightLine);
    }

    // Phase 2c: BS-R5 → BS-R6 straight lines (2→2, 1:1 progression)

    for (let i = 1; i <= 2; i++) {
        // Use exact same Y positioning as bracket-rendering.js
        let matchY;
        if (i === 1) {
            // BS-5-1 and BS-6-1: aligned with BS-2-4 position
            matchY = round1StartY + 6 * spacing + (spacing / 2);
        } else {
            // BS-5-2 and BS-6-2: aligned with BS-2-5 position
            matchY = round1StartY + 8.5 * spacing;
        }

        const bs5CenterY = matchY + (grid.matchHeight / 2);
        const bs6CenterY = bs5CenterY; // Same Y position

        // Create straight horizontal line (BS progression goes leftward)
        const lineStartX = bs6X + grid.matchWidth; // Start from BS-6-X right edge
        const lineWidth = bs5X - lineStartX; // Width from BS-6-X to BS-5-X

        const straightLine = document.createElement('div');
        straightLine.style.position = 'absolute';
        straightLine.style.left = `${lineStartX}px`;
        straightLine.style.top = `${bs5CenterY}px`;
        straightLine.style.width = `${lineWidth}px`;
        straightLine.style.height = '3px';
        straightLine.style.backgroundColor = '#666666';
        straightLine.style.zIndex = '10';

        progressionLines.push(straightLine);
    }

    // Phase 3a: BS-R2 → BS-R3 convergence lines (8→4, L-shaped)

    for (let i = 1; i <= 4; i++) {
        // Each BS-3-X receives convergence from two BS-2-Y matches
        const bs2Match1Index = (2 * i) - 1; // BS-2-1, BS-2-3, BS-2-5, BS-2-7
        const bs2Match2Index = (2 * i);     // BS-2-2, BS-2-4, BS-2-6, BS-2-8

        // Calculate BS-2-X center Y positions (same as BS-1-X positions)
        const input1Y_1 = round1StartY + (2 * (bs2Match1Index - 1)) * spacing;
        const input2Y_1 = round1StartY + (2 * (bs2Match1Index - 1) + 1) * spacing;
        const bs2Match1CenterY = (input1Y_1 + input2Y_1) / 2 + (grid.matchHeight / 2);

        const input1Y_2 = round1StartY + (2 * (bs2Match2Index - 1)) * spacing;
        const input2Y_2 = round1StartY + (2 * (bs2Match2Index - 1) + 1) * spacing;
        const bs2Match2CenterY = (input1Y_2 + input2Y_2) / 2 + (grid.matchHeight / 2);

        // Calculate BS-3-X center Y position (from Phase 2b)
        const bs3CenterY = round1StartY + ((i - 1) * 4 + 1.5) * spacing + (grid.matchHeight / 2);

        // Create L-shaped convergence lines
        const [bs2m1_h1, bs2m1_v, bs2m1_h2] = createLShapedProgressionLine(bs2X, bs2Match1CenterY, bs3X + grid.matchWidth, bs3CenterY);
        const [bs2m2_h1, bs2m2_v, bs2m2_h2] = createLShapedProgressionLine(bs2X, bs2Match2CenterY, bs3X + grid.matchWidth, bs3CenterY);

        progressionLines.push(bs2m1_h1, bs2m1_v, bs2m1_h2, bs2m2_h1, bs2m2_v, bs2m2_h2);

    }

    // Phase 3b: BS-R4 → BS-R5 convergence lines (4→2, L-shaped)

    for (let i = 1; i <= 2; i++) {
        // Each BS-5-X receives convergence from two BS-4-Y matches
        const bs4Match1Index = (2 * i) - 1; // BS-4-1, BS-4-3
        const bs4Match2Index = (2 * i);     // BS-4-2, BS-4-4

        // Calculate BS-4-X center Y positions (from Phase 2b)
        const bs4Match1CenterY = round1StartY + ((bs4Match1Index - 1) * 4 + 1.5) * spacing + (grid.matchHeight / 2);
        const bs4Match2CenterY = round1StartY + ((bs4Match2Index - 1) * 4 + 1.5) * spacing + (grid.matchHeight / 2);

        // Calculate BS-5-X center Y position (from Phase 2c)
        let bs5MatchY;
        if (i === 1) {
            bs5MatchY = round1StartY + 6 * spacing + (spacing / 2);
        } else {
            bs5MatchY = round1StartY + 8.5 * spacing;
        }
        const bs5CenterY = bs5MatchY + (grid.matchHeight / 2);

        // Create L-shaped convergence lines
        const [bs4m1_h1, bs4m1_v, bs4m1_h2] = createLShapedProgressionLine(bs4X, bs4Match1CenterY, bs5X + grid.matchWidth, bs5CenterY);
        const [bs4m2_h1, bs4m2_v, bs4m2_h2] = createLShapedProgressionLine(bs4X, bs4Match2CenterY, bs5X + grid.matchWidth, bs5CenterY);

        progressionLines.push(bs4m1_h1, bs4m1_v, bs4m1_h2, bs4m2_h1, bs4m2_v, bs4m2_h2);

    }

    // Phase 3c: BS-R6 → BS-R7 convergence lines (2→1, L-shaped)

    // BS-6-1 and BS-6-2 → BS-7-1 (single convergence)
    // Calculate BS-6-X center Y positions (same as BS-5-X from Phase 2c)
    const bs61CenterY = (round1StartY + 6 * spacing + (spacing / 2)) + (grid.matchHeight / 2);
    const bs62CenterY = (round1StartY + 8.5 * spacing) + (grid.matchHeight / 2);

    // Calculate BS-7-1 center Y position (should be centered between BS-6-1 and BS-6-2)
    const bs71CenterY = (bs61CenterY + bs62CenterY) / 2;

    // Create L-shaped convergence lines
    const [bs61_h1, bs61_v, bs61_h2] = createLShapedProgressionLine(bs6X, bs61CenterY, bs7X + grid.matchWidth, bs71CenterY);
    const [bs62_h1, bs62_v, bs62_h2] = createLShapedProgressionLine(bs6X, bs62CenterY, bs7X + grid.matchWidth, bs71CenterY);

    progressionLines.push(bs61_h1, bs61_v, bs61_h2, bs62_h1, bs62_v, bs62_h2);

    // Phase 4: BS-7-1 → BS-FINAL indicator (L-shaped line with arrow and text)

    // Calculate finals positioning (similar to frontside finals)
    const spacingMultiplier = 4;
    const finalsX = round1X + grid.matchWidth + (spacingMultiplier * grid.horizontalSpacing);
    const backsideFinalY = grid.centerY - 80;
    const backsideFinalCenterY = backsideFinalY + (grid.matchHeight / 2);

    // Create BS-FINAL indicator from BS-7-1 (like 8-player and 16-player)
    const bs71ToFinalElements = create32PlayerBSFinalIndicator(bs7X, bs71CenterY, finalsX, backsideFinalCenterY, grid);
    progressionLines.push(...bs71ToFinalElements);

    return progressionLines;
}