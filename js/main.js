// main.js - Bulletproof Config Initialization and Core Application Logic

// Global variables for tournament data ONLY (never config)
let tournament = null;
let players = [];
let matches = [];
let currentStatsPlayer = null;

// Application version
const APP_VERSION = '4.0.4';

// Application identity (encoded)
const _0x4e = [78,101,119,84,111,110,32,68,67,32,84,111,117,114];
const _0x6e = [110,97,109,101,110,116,32,77,97,110,97,103,101,114];
const _0x2d = () => String.fromCharCode(..._0x4e, ..._0x6e);

// =============================================================================
// DIALOG STACK MANAGER - Unified dialog stacking system
// =============================================================================

// Global dialog stack - each entry: {id, restoreFunction, zIndex}
window.dialogStack = [];
const BASE_Z_INDEX = 1000;

/**
 * Push a dialog onto the stack and show it
 * @param {string} dialogId - DOM element ID of the dialog
 * @param {Function} restoreFunction - Function to call when this dialog needs to be restored
 */
window.pushDialog = function(dialogId, restoreFunction, enableEsc = false) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) {
        console.error(`Dialog ${dialogId} not found`);
        return;
    }

    // Check if this dialog is already on top of the stack (restoration scenario)
    if (window.dialogStack.length > 0 && window.dialogStack[window.dialogStack.length - 1].id === dialogId) {
        // Just show the dialog, don't add to stack again
        const zIndex = BASE_Z_INDEX + window.dialogStack.length;
        dialog.style.display = dialog.id === 'statisticsModal' ? 'flex' : 'block';
        dialog.style.zIndex = zIndex;
        console.log(`📚 Dialog restored: [${window.dialogStack.map(d => d.id).join(' → ')}]`);
        return;
    }

    // Hide current top dialog if any
    if (window.dialogStack.length > 0) {
        const currentTop = window.dialogStack[window.dialogStack.length - 1];
        const currentDialog = document.getElementById(currentTop.id);
        if (currentDialog) {
            currentDialog.style.display = 'none';
        }
    }

    // Calculate z-index for new dialog
    const zIndex = BASE_Z_INDEX + window.dialogStack.length + 1;

    // Add to stack
    window.dialogStack.push({
        id: dialogId,
        restoreFunction: restoreFunction || null,
        zIndex: zIndex,
        escEnabled: enableEsc
    });

    // Show dialog with proper z-index
    dialog.style.display = dialog.id === 'statisticsModal' ? 'flex' : 'block';
    dialog.style.zIndex = zIndex;

    console.log(`📚 Dialog stack: [${window.dialogStack.map(d => d.id).join(' → ')}]`);
};

/**
 * Pop the top dialog from the stack and restore the previous one
 */
window.popDialog = function() {
    if (window.dialogStack.length === 0) {
        console.warn('No dialogs in stack to pop');
        return;
    }

    // Get and remove top dialog
    const topDialog = window.dialogStack.pop();
    const dialog = document.getElementById(topDialog.id);
    if (dialog) {
        dialog.style.display = 'none';
    }

    // Restore previous dialog if any
    if (window.dialogStack.length > 0) {
        const previousDialog = window.dialogStack[window.dialogStack.length - 1];
        if (previousDialog.restoreFunction) {
            previousDialog.restoreFunction();
        }
    }

    console.log(`📚 Dialog stack: [${window.dialogStack.map(d => d.id).join(' → ')}]`);
};

// =============================================================================
// STACK-AWARE ESC KEY HANDLER - Works with dialog stack system
// =============================================================================

/**
 * Global Esc key handler that respects dialog stack escEnabled setting
 * Only closes dialogs that explicitly enable Esc support via pushDialog()
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.dialogStack.length > 0) {
        const topDialog = window.dialogStack[window.dialogStack.length - 1];

        // Only handle if top dialog explicitly enables Esc
        if (topDialog.escEnabled) {
            e.preventDefault();
            e.stopPropagation();

            // Use existing popDialog logic for consistent behavior
            popDialog();

            console.log('🔑 Stack Esc handler closed dialog:', topDialog.id);
        }
    }

    // Enter key handler for Edit Statistics dialog
    if (e.key === 'Enter' && window.dialogStack.length > 0) {
        const topDialog = window.dialogStack[window.dialogStack.length - 1];

        // Only handle Enter for the Edit Statistics dialog
        if (topDialog.id === 'statsModal') {
            e.preventDefault();
            e.stopPropagation();

            // Call saveStats function to save statistics
            if (typeof saveStats === 'function') {
                saveStats();
                console.log('🔑 Enter key saved statistics');
            }
        }
    }
});

// Global config is loaded by results-config.js - NEVER override it here
// let config = {}; // This is loaded by results-config.js

// Initialize application with bulletproof config loading
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Starting tournament manager...');

    // Step 1: Ensure global config is loaded FIRST
    if (typeof loadConfiguration === 'function') {
        console.log('✓ Global config loaded by results-config.js');
    } else {
        console.warn('⚠️ loadConfiguration not available - config may not be loaded');
    }

    // Step 2: Auto-detect and load logo
    loadClubLogo();

    // Application identity injection
    const w1 = document.getElementById('watermark-left');
    if (w1) w1.textContent = `${_0x2d()} (Press F1 for help)`;

    // Step 3: Load recent tournaments list (but NOT tournament config)
    setTimeout(() => {
        try {
            if (typeof loadRecentTournaments === 'function') {
                loadRecentTournaments();
            }
        } catch (error) {
            console.error('Failed to load recent tournaments:', error);
        }
    }, 100);

    // Step 4: Setup event listeners
    setupEventListeners();

    // Step 5: Set today's date
    setTodayDate();

    // Step 6: Auto-load current tournament (if exists) - Never loads config
    autoLoadCurrentTournament();

    // Step 7: Update match history on initial load (since Setup page is default)
    setTimeout(() => {
        updateMatchHistory();
    }, 200);

    // Update footer with version
    const footerContent = document.getElementById('footerContent');
    if (footerContent) {
        footerContent.textContent = `${_0x2d()} version ${APP_VERSION}`;
    }

    // Application integrity check
    const _0x3f = () => {
        const w1 = document.getElementById('watermark-left');
        const w2 = document.getElementById('tournament-watermark');
        const f1 = document.getElementById('footerContent');
        const _s = _0x2d();

        if (w1 && !w1.textContent.includes(_s.split(' ').slice(0, 2).join(' '))) {
            w1.textContent = `${_s} (Press F1 for help)`;
            console.log('Application configuration restored');
        }
        if (f1 && !f1.textContent.includes(_s)) {
            f1.textContent = `${_s} version ${APP_VERSION}`;
            console.log('Application configuration restored');
        }
    };

    setTimeout(_0x3f, 500);
});

function loadClubLogo() {
    const logoContainer = document.getElementById('clubLogo');
    if (!logoContainer) return;

    // Try different logo file extensions
    const logoFiles = ['images/logo.png', 'images/logo.jpg', 'images/logo.jpeg', 'images/logo.svg'];
    let logoLoaded = false;

    logoFiles.forEach(filename => {
        if (logoLoaded) return;

        const img = new Image();
        img.onload = function () {
            logoContainer.innerHTML = '';
            logoContainer.className = 'club-logo';
            logoContainer.appendChild(img);
            img.alt = 'Club Logo';
            img.style.width = '60px';
            img.style.height = '60px';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            logoLoaded = true;
        };
        img.onerror = function () {
            // Logo not found - keep placeholder
        };
        img.src = filename;  // Relative path (works for both file:// and web server)
    });
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateElement = document.getElementById('tournamentDate');
    if (dateElement) {
        dateElement.value = today;
    }
}

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const page = this.dataset.page;
            if (page) {  // Only call showPage if data-page attribute exists
                showPage(page);
            }
        });
    });

    // Enter key handlers
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                addPlayer();
            }
        });
    }

    // Initialize bracket controls
    if (typeof initializeBracketControls === 'function') {
        initializeBracketControls();
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(pageId).classList.add('active');

    // Only update nav button if it exists (may not exist when navigating from Tournament page)
    const navBtn = document.querySelector(`[data-page="${pageId}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }
}

// AUTO-LOAD CURRENT TOURNAMENT - Never loads config, only tournament data
function autoLoadCurrentTournament() {
    console.log('🔄 Auto-loading current tournament (config stays global)...');

    const currentTournament = localStorage.getItem('currentTournament');
    if (!currentTournament) {
        console.log('No current tournament found');
        return;
    }

    try {
        const tournamentData = JSON.parse(currentTournament);

        // Load ONLY tournament data - NEVER config
        tournament = {
            id: tournamentData.id,
            name: tournamentData.name,
            date: tournamentData.date,
            created: tournamentData.created,
            status: tournamentData.status,
            players: tournamentData.players || [],
            matches: tournamentData.matches || [],
            bracket: tournamentData.bracket,
            bracketSize: tournamentData.bracketSize, // ✅ Fixed: Include bracketSize
            placements: tournamentData.placements || {},
            readOnly: tournamentData.readOnly // ✅ Fixed: Include readOnly flag
            // NO CONFIG loading - config stays global
        };

        // Set global arrays from tournament object
        players = tournament.players;
        matches = tournament.matches;

        // Update UI with tournament data - preserve user input during navigation
        if (tournament.name && tournament.date) {
            // Don't modify the input fields during navigation - preserve user's work

            // Update tournament-specific UI
            if (typeof updateTournamentStatus === 'function') {
                updateTournamentStatus();
            }

            if (typeof updatePlayersDisplay === 'function') {
                updatePlayersDisplay();
                updatePlayerCount();
            }

            // Render bracket if exists
            if (tournament.bracket && matches.length > 0 && typeof renderBracket === 'function') {
                renderBracket();
            }

            // Display results using global config
            if (typeof displayResults === 'function') {
                displayResults();
            }

            // Refresh lane dropdowns with correct config after tournament load
            if (tournament.bracket && matches.length > 0) {
                setTimeout(() => {
                    if (typeof refreshAllLaneDropdowns === 'function') {
                        refreshAllLaneDropdowns();
                    }
                }, 200);
            }

            console.log('✓ Current tournament loaded (global config preserved)');
        }
    } catch (error) {
        console.error('❌ Error loading current tournament:', error);
    }
}

// FORCE CONFIG RELOAD (for debugging)
function forceConfigReload() {
    if (typeof forceReloadConfig === 'function') {
        forceReloadConfig();
    } else {
        console.error('forceReloadConfig function not available');
    }
}

// DEBUG FUNCTIONS
function debugConfigState() {
    console.log('=== CONFIG DEBUG ===');
    console.log('Global config object:', config);
    console.log('Config in localStorage:', JSON.parse(localStorage.getItem('dartsConfig') || 'null'));
    console.log('Tournament object:', tournament);
    console.log('Current tournament in localStorage:', JSON.parse(localStorage.getItem('currentTournament') || 'null'));
}

// UPDATE: Enhanced showPage function with help integration
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(pageId).classList.add('active');

    // Only update nav button if it exists (may not exist when navigating from Tournament page)
    const navBtn = document.querySelector(`[data-page="${pageId}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    // Update match history when showing setup page
    if (pageId === 'setup') {
        updateMatchHistory();
    }

    // Auto-open Match Controls when navigating to tournament page (if enabled and tournament exists)
    if (pageId === 'tournament' && config.ui.autoOpenMatchControls && tournament) {
        // Small delay to ensure page transition is complete
        setTimeout(() => {
            if (typeof showMatchCommandCenter === 'function') {
                showMatchCommandCenter();
            }
        }, 100);
    }

    // Update Registration page layout when showing registration page
    if (pageId === 'registration') {
        if (typeof updateRegistrationPageLayout === 'function') {
            updateRegistrationPageLayout();
        }
        if (typeof renderPlayerList === 'function') {
            renderPlayerList();
        }
    }

    // HELP SYSTEM INTEGRATION
    onPageChange(pageId);
}

// Helper function to get elimination rank based on match ID and bracket size
function getEliminationRankForMatch(matchId, bracketSize) {
    // Hardcoded elimination ranks based on tournament progression logic
    const rankMappings = {
        8: {
            'BS-1-1': 7, 'BS-1-2': 7,  // 7th-8th place
            'BS-2-1': 5, 'BS-2-2': 5,  // 5th-6th place
            'BS-3-1': 4,               // 4th place
            'BS-FINAL': 3,             // 3rd place (loser)
            'GRAND-FINAL': 2           // 2nd place (loser)
        },
        16: {
            'BS-1-1': 13, 'BS-1-2': 13, 'BS-1-3': 13, 'BS-1-4': 13,  // 13th-16th place
            'BS-2-1': 9, 'BS-2-2': 9, 'BS-2-3': 9, 'BS-2-4': 9,      // 9th-12th place
            'BS-3-1': 7, 'BS-3-2': 7,                                 // 7th-8th place
            'BS-4-1': 5, 'BS-4-2': 5,                                 // 5th-6th place
            'BS-5-1': 4,                                              // 4th place
            'BS-FINAL': 3,                                            // 3rd place (loser)
            'GRAND-FINAL': 2                                          // 2nd place (loser)
        },
        32: {
            'BS-1-1': 25, 'BS-1-2': 25, 'BS-1-3': 25, 'BS-1-4': 25, 'BS-1-5': 25, 'BS-1-6': 25, 'BS-1-7': 25, 'BS-1-8': 25,  // 25th-32nd place
            'BS-2-1': 17, 'BS-2-2': 17, 'BS-2-3': 17, 'BS-2-4': 17, 'BS-2-5': 17, 'BS-2-6': 17, 'BS-2-7': 17, 'BS-2-8': 17,  // 17th-24th place
            'BS-3-1': 13, 'BS-3-2': 13, 'BS-3-3': 13, 'BS-3-4': 13,  // 13th-16th place
            'BS-4-1': 9, 'BS-4-2': 9, 'BS-4-3': 9, 'BS-4-4': 9,      // 9th-12th place
            'BS-5-1': 7, 'BS-5-2': 7,                                 // 7th-8th place
            'BS-6-1': 5, 'BS-6-2': 5,                                 // 5th-6th place
            'BS-7-1': 4,                                              // 4th place
            'BS-FINAL': 3,                                            // 3rd place (loser)
            'GRAND-FINAL': 2                                          // 2nd place (loser)
        }
    };

    if (rankMappings[bracketSize] && rankMappings[bracketSize][matchId]) {
        return rankMappings[bracketSize][matchId];
    }
    return null;
}

// Helper function to convert match ID to human-readable format
function humanizeMatchId(matchId) {
    if (!matchId) return matchId;

    // Convert GRAND-FINAL to "Grand Final"
    if (matchId === 'GRAND-FINAL') return 'Grand Final';

    // Convert BS-FINAL to "Backside Final"
    if (matchId === 'BS-FINAL') return 'Backside Final';

    // Keep other match IDs unchanged (BS-1-1, FS-2-1, etc.)
    return matchId;
}

// Helper function to get player progression info for display
function getPlayerProgressionForDisplay(playerId, matchId, isWinner) {
    if (!tournament || !tournament.bracketSize || !MATCH_PROGRESSION) {
        return '';
    }

    const progression = MATCH_PROGRESSION[tournament.bracketSize] && MATCH_PROGRESSION[tournament.bracketSize][matchId];
    if (!progression) {
        return '';
    }

    if (isWinner) {
        if (progression.winner) {
            const nextMatch = progression.winner[0];
            const displayMatch = humanizeMatchId(nextMatch);
            return `(${displayMatch})`;
        } else {
            return '(Tournament Winner!)';
        }
    } else {
        // For losers
        if (progression.loser) {
            const nextMatch = progression.loser[0];
            const displayMatch = humanizeMatchId(nextMatch);
            return `(${displayMatch})`;
        } else {
            // Player is eliminated - show rank
            const rank = getEliminationRankForMatch(matchId, tournament.bracketSize);
            if (rank && typeof formatRanking === 'function') {
                return `(${formatRanking(rank)})`;
            }
            return '(Eliminated)';
        }
    }
}

// Update match history for Setup page
function updateMatchHistory() {
    const matchResultsContainer = document.getElementById('matchResults');
    if (!matchResultsContainer) return;

    // If no tournament or no matches, show empty state
    if (!tournament || !matches || matches.length === 0) {
        matchResultsContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">No match results yet</p>';
        return;
    }

    // Get completed matches sorted chronologically (latest first)
    const completedMatches = matches
        .filter(match => match.completed)
        .sort((a, b) => {
            // Sort by completion timestamp if available, otherwise by match ID
            const aTime = a.completedAt || 0;
            const bTime = b.completedAt || 0;
            return bTime - aTime; // Latest first
        });

    if (completedMatches.length === 0) {
        matchResultsContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">No matches completed yet</p>';
        return;
    }

    // Build match history HTML
    let historyHtml = '';
    completedMatches.forEach(match => {
        const isWalkover = match.autoAdvanced || isWalkoverMatch(match);
        const isBackside = match.id && match.id.startsWith('BS-');

        let itemClass = 'match-history-item';
        if (isWalkover) itemClass += ' walkover';
        if (isBackside) itemClass += ' backside';
        
        const player1Name = match.player1?.name || 'Unknown';
        const player2Name = match.player2?.name || 'Unknown';
        const winnerName = match.winner?.name || 'Unknown';
        
        // Get progression info for both players
        const player1Id = match.player1?.id;
        const player2Id = match.player2?.id;
        const winnerId = match.winner?.id;
        
        const player1IsWinner = player1Id === winnerId;
        const player2IsWinner = player2Id === winnerId;
        
        const player1Progression = getPlayerProgressionForDisplay(player1Id, match.id, player1IsWinner);
        const player2Progression = getPlayerProgressionForDisplay(player2Id, match.id, player2IsWinner);
        
        // Format match result with winner highlighting and progression info
        let player1Display = player1IsWinner ? `<span class="winner-name">${player1Name}</span>${player1Progression ? ` <span class="progression-info">${player1Progression}</span>` : ''}` : `${player1Name}${player1Progression ? ` <span class="progression-info">${player1Progression}</span>` : ''}`;
        let player2Display = player2IsWinner ? `<span class="winner-name">${player2Name}</span>${player2Progression ? ` <span class="progression-info">${player2Progression}</span>` : ''}` : `${player2Name}${player2Progression ? ` <span class="progression-info">${player2Progression}</span>` : ''}`;
        
        const score = formatMatchScore(match);
        const scoreText = score ? `(${score})` : '';
        
        const autoCompletedText = isWalkover ? ' <span class="auto-completed">(auto-completed)</span>' : '';

        // Add lane and referee information
        let matchDetailsText = '';
        const laneText = match.lane ? `Lane ${match.lane}` : '';
        const refereeText = match.referee ? `Referee: ${getPlayerNameById(match.referee)}` : '';

        if (laneText || refereeText) {
            const details = [refereeText, laneText].filter(Boolean).join(' • ');
            matchDetailsText = `<div class="match-details"><span class="match-meta">${details}</span></div>`;
        }

        historyHtml += `
            <div class="${itemClass}">
                <div class="match-header">
                    <span class="match-id">${match.id}${autoCompletedText}</span>
                    <span class="match-winner">Winner: ${winnerName}</span>
                </div>
                <div class="match-result-enhanced">
                    <span class="player-info">${player1Display} vs ${player2Display}</span>
                    <span class="result-score">${scoreText}</span>
                </div>
                ${matchDetailsText}
            </div>
        `;
    });

    matchResultsContainer.innerHTML = historyHtml;
}

// Helper function to check if a match is a walkover
function isWalkoverMatch(match) {
    if (!match || !match.player1 || !match.player2) return false;
    
    return match.player1.name === 'Walkover' || 
           match.player2.name === 'Walkover' ||
           match.player1.isBye === true || 
           match.player2.isBye === true ||
           (match.player1.id && match.player1.id.toString().startsWith('walkover-')) ||
           (match.player2.id && match.player2.id.toString().startsWith('walkover-'));
}

// Helper function to get player name by ID
function getPlayerNameById(playerId) {
    if (!playerId || !players) return 'Unknown';
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
}

// Helper function to format match score in Player1 vs Player2 order
function formatMatchScore(match) {
    if (!match) {
        return '';
    }

    // Check if this is a walkover match first (before checking finalScore)
    if (isWalkoverMatch(match)) {
        return 'W/O';
    }

    // For regular matches, require finalScore
    if (!match.finalScore || !match.finalScore.winnerLegs) {
        return '';
    }

    const winnerLegs = match.finalScore.winnerLegs;
    const loserLegs = match.finalScore.loserLegs;
    const winnerId = match.winner?.id;
    const player1Id = match.player1?.id;

    // Show score in Player1 vs Player2 order
    const player1IsWinner = player1Id === winnerId;
    return player1IsWinner ? `${winnerLegs}-${loserLegs}` : `${loserLegs}-${winnerLegs}`;
}


// Make functions globally available
if (typeof window !== 'undefined') {
    window.showPage = showPage;
    window.updateMatchHistory = updateMatchHistory;
    window.isWalkoverMatch = isWalkoverMatch;
    window.formatMatchScore = formatMatchScore;
    window.forceConfigReload = forceConfigReload;
    window.debugConfigState = debugConfigState;
    window.APP_VERSION = APP_VERSION;

    // Also make these available for console debugging
    window.autoLoadCurrentTournament = autoLoadCurrentTournament;
}
