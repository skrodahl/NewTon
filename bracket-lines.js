/**
 * Bracket Lines and Background Module
 *
 * This module handles all progression line rendering and backside gradient backgrounds
 * for the NewTon DC Tournament Manager bracket system.
 *
 * Functions:
 * - createLShapedProgressionLine(): Creates L-shaped tournament bracket progression lines
 * - createProgressionLine(): Creates simple horizontal/vertical line pairs
 * - createBacksideBackground(): Creates gradient background for backside bracket area
 * - createCustomFinalsLines(): Creates custom Finals area progression lines
 */

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