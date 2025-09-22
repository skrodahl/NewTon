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

    // Horizontal line from start to midpoint
    const hLine1 = document.createElement('div');
    hLine1.style.position = 'absolute';
    hLine1.style.left = `${Math.min(fromX, midX)}px`;
    hLine1.style.top = `${fromY}px`;
    hLine1.style.width = `${Math.abs(midX - fromX)}px`;
    hLine1.style.height = `${width}px`;
    hLine1.style.backgroundColor = color;
    hLine1.style.zIndex = '1';

    // Vertical line from fromY to toY
    const vLine = document.createElement('div');
    vLine.style.position = 'absolute';
    vLine.style.left = `${midX}px`;
    vLine.style.top = `${Math.min(fromY, toY)}px`;
    vLine.style.width = `${width}px`;
    vLine.style.height = `${Math.abs(toY - fromY)}px`;
    vLine.style.backgroundColor = color;
    vLine.style.zIndex = '1';

    // Horizontal line from midpoint to end
    const hLine2 = document.createElement('div');
    hLine2.style.position = 'absolute';
    hLine2.style.left = `${Math.min(midX, toX)}px`;
    hLine2.style.top = `${toY}px`;
    hLine2.style.width = `${Math.abs(toX - midX)}px`;
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

    const fs31_v = document.createElement('div');
    fs31_v.style.position = 'absolute';
    fs31_v.style.left = `${finalsVerticalX}px`;
    fs31_v.style.top = `${Math.min(fs31CenterY, grandFinalCenterY)}px`;
    fs31_v.style.width = '3px';
    fs31_v.style.height = `${Math.abs(grandFinalCenterY - fs31CenterY)}px`;
    fs31_v.style.backgroundColor = '#666666';
    fs31_v.style.zIndex = '1';

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