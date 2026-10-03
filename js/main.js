// main.js - Bulletproof Config Initialization and Core Application Logic

// Global variables for tournament data ONLY (never config)
let tournament = null;
let players = [];
let matches = [];
let currentStatsPlayer = null;

// Application version
const APP_VERSION = '5.1.10'; // Straight Down the Middle — new bracket (every round on one page, finals right or middle), Global Settings redesign

// Application identity (encoded)
const _0x4e = [78,101,119,84,111,110,32,68,67,32,84,111,117,114];
const _0x6e = [110,97,109,101,110,116,32,77,97,110,97,103,101,114];
const _0x2d = () => String.fromCharCode(..._0x4e, ..._0x6e);

/**
 * Escapes a value for safe interpolation into HTML — both element text and
 * quoted attribute values (escapes `"` and `'` too, unlike a textContent round-trip).
 * The single canonical escaper for the whole app; use it for every user-, import-,
 * or QR-payload-derived string placed into innerHTML.
 *
 * NOTE: this is HTML escaping, not JavaScript-string escaping. Do NOT rely on it to
 * make a name safe inside an inline `onclick="fn('…')"` string — the browser
 * HTML-decodes the attribute before the JS parser sees it. Pass identifiers to
 * handlers via data-* attributes or a numeric index instead.
 *
 * @param {*} value - any value; null/undefined become ''
 * @returns {string} HTML-escaped string
 */
function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

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
        dialog.style.display = 'block';
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
    dialog.style.display = 'block';
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

        if (topDialog.id === 'statsModal') {
            e.preventDefault();
            // stopImmediatePropagation prevents the winner-confirm keydown listener
            // (also on document) from firing in this same event.
            e.stopImmediatePropagation();

            // Enter in a list-editor input behaves like clicking its Add button.
            // Anywhere else (counters, buttons, body), Enter saves and closes.
            const active = document.activeElement;
            if (active && active.id === 'statsShortLegDarts' && typeof addShortLeg === 'function') {
                addShortLeg();
            } else if (active && active.id === 'statsHighOut' && typeof addHighOut === 'function') {
                addHighOut();
            } else if (typeof saveStats === 'function') {
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
    // Restore last active page immediately to avoid flash of default page
    const savedPage = localStorage.getItem('newton_activePage');
    if (savedPage && document.getElementById(savedPage)) {
        showPage(savedPage);
    }

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

    // Step 7: Fill the Setup page's current tournament and match history on initial load
    setTimeout(() => {
        renderSetupCurrent();
        updateMatchHistory();
    }, 200);

    // Step 8: Update storage indicator
    setTimeout(() => {
        if (typeof updateStorageIndicator === 'function') {
            updateStorageIndicator();
        }
    }, 200);

    // Update footer with version
    const footerContent = document.getElementById('footerContent');
    if (footerContent) {
        footerContent.innerHTML = `<a href="https://newtondarts.com" target="_blank" rel="noopener">${_0x2d()}</a> version ${APP_VERSION}`;
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

    // Try logo file extensions in priority order, one at a time — parallel
    // requests would let the last-to-load win instead of the first match
    const logoFiles = ['images/logo.png', 'images/logo.jpg', 'images/logo.jpeg', 'images/logo.svg'];

    const tryLogo = (index) => {
        if (index >= logoFiles.length) return; // No logo found - keep placeholder

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
        };
        img.onerror = function () {
            tryLogo(index + 1);
        };
        img.src = logoFiles[index];  // Relative path (works for both file:// and web server)
    };

    tryLogo(0);
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
}

// ANALYTICS BRACKET PREVIEW - exit/restore helper (Phase 4.3)
/**
 * Exit the Analytics bracket preview (analytics-only mode) and restore whatever
 * tournament was active before the preview began.
 *
 * viewBracket() (newton-history.js) overwrites the shared `currentTournament`
 * pointer with a read-only, `_analyticsPreview`-tagged copy fetched from the
 * server, first stashing any real active tournament under
 * `_preAnalyticsPreviewTournament`. Restoring that stash here means a `?tm`
 * edit session survives a preview round-trip instead of being deactivated.
 * When nothing was active, the pointer is cleared (unchanged prior behavior).
 *
 * @returns {void}
 */
function exitAnalyticsBracketPreview() {
    tournament = null;
    players = [];
    matches = [];

    const prior = localStorage.getItem('_preAnalyticsPreviewTournament');
    if (prior !== null) {
        localStorage.setItem('currentTournament', prior);
    } else {
        localStorage.removeItem('currentTournament');
    }
    localStorage.removeItem('_preAnalyticsPreviewTournament');

    showPage('history');
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
            format: tournamentData.format, // SE/DE format (absent = DE for backward compat)
            placements: tournamentData.placements || {},
            readOnly: tournamentData.readOnly, // ✅ Fixed: Include readOnly flag
            _analyticsPreview: tournamentData._analyticsPreview // 4.3: keep the no-persist guard alive across reload
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

            // The last page is restored before the tournament loads, so Registration picked
            // its layout (players or Leaderboard) and saved players without it: redo them now
            if (typeof updateRegistrationPageLayout === 'function') {
                updateRegistrationPageLayout();
                renderPlayerList();
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
    // Leaving Global Settings with unsaved changes: ask to save or discard first
    if (typeof ConfigPage !== 'undefined' && ConfigPage.interceptLeave(pageId)) return;

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(pageId).classList.add('active');

    // Remember active page across reloads
    localStorage.setItem('newton_activePage', pageId);

    // Only update nav button if it exists (may not exist when navigating from Tournament page)
    const navBtn = document.querySelector(`[data-page="${pageId}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    // Update the current tournament, match history and tournament list when showing setup page
    if (pageId === 'setup') {
        renderSetupCurrent();
        updateMatchHistory();
        if (typeof loadRecentTournaments === 'function') {
            loadRecentTournaments();
        }
    }

    // Global Settings: fill the form from the stored settings and track changes from there
    if (pageId === 'config' && typeof ConfigPage !== 'undefined') {
        ConfigPage.onShow();
    }

    // Bracket page header: refresh on entry (settings such as the Developer Console may have changed)
    if (pageId === 'tournament' && typeof BracketView !== 'undefined') {
        BracketView.updateHeader();
    }

    // Auto-open Match Controls when navigating to tournament page (if enabled and tournament exists)
    if (pageId === 'tournament' && config.ui.autoOpenMatchControls && tournament && !tournament._analyticsPreview) {
        // Small delay to ensure page transition is complete
        setTimeout(() => {
            if (typeof showMatchCommandCenter === 'function') {
                showMatchCommandCenter();
            }
        }, 100);
    }

    // Load history when showing history page
    if (pageId === 'history' && typeof NewtonHistory !== 'undefined') {
        NewtonHistory.render();
    }

    // Update Registration page layout when showing registration page
    if (pageId === 'registration') {
        if (typeof updateRegistrationPageLayout === 'function') {
            updateRegistrationPageLayout();
        }
        if (typeof updatePlayersDisplay === 'function') {
            updatePlayersDisplay();
        }
        if (typeof renderPlayerList === 'function') {
            renderPlayerList();
        }
    }

    // HELP SYSTEM INTEGRATION
    if (typeof setHelpPage === 'function') setHelpPage(pageId);
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

/**
 * Where a player went after a match, for the Setup page's match history: "to FS-3-2",
 * "out (13th-16th)", "wins the tournament". Reads the progression table for the format.
 * @param {string|number} playerId
 * @param {string} matchId
 * @param {boolean} isWinner
 * @returns {string} empty when unknown
 */
function getPlayerProgressionForDisplay(playerId, matchId, isWinner) {
    if (!tournament || !tournament.bracketSize) return '';
    const size = tournament.bracketSize;
    if (getFormat() === 'SE' && isSEBronzeMatch(matchId, size)) return isWinner ? 'takes 3rd place' : 'takes 4th place';

    const table = getProgressionTable();
    const progression = table && table[matchId];
    if (!progression) return '';

    const next = isWinner ? progression.winner : progression.loser;
    if (next) return `to ${humanizeMatchId(next[0])}`;
    if (isWinner) return 'wins the tournament';

    // Eliminated: the rank for the match, or the placement once it has been set
    const rank = getEliminationRankForMatch(matchId, size) ||
        (tournament.placements && tournament.placements[String(playerId)]);
    return rank && typeof formatRanking === 'function' ? `out (${formatRanking(rank)})` : 'out';
}

/**
 * A match number as a tag that shows the side: frontside outlined, backside grey (as in the
 * bracket), the Grand Final dark. Used by Match History and Analytics (css/components.css).
 * @param {string} matchId - e.g. 'FS-2-1', 'BS-FINAL', 'GRAND-FINAL'
 * @returns {string} HTML
 */
function matchIdTag(matchId) {
    const id = String(matchId || '');
    const side = id === 'GRAND-FINAL' ? ' nt-gf' : id.startsWith('BS-') ? ' nt-bs' : '';
    return `<span class="nt-id${side}">${escapeHtml(id)}</span>`;
}

/**
 * Fill the Setup page's match history: the current tournament's completed matches, latest
 * first, one entry each (winner, score, then lane, referee and where both players went).
 * A played match opens its details; walkovers are greyed out, and walkovers between two
 * empty slots are left out.
 * @returns {void}
 */
function updateMatchHistory() {
    const matchResultsContainer = document.getElementById('matchResults');
    const matchHistoryHeading = document.getElementById('matchHistoryHeading');
    const matchHistoryCount = document.getElementById('matchHistoryCount');
    if (!matchResultsContainer) return;

    if (matchHistoryHeading) {
        matchHistoryHeading.innerHTML = tournament && tournament.name
            ? `Match history<small>${escapeHtml(tournament.name)}</small>` : 'Match history';
    }

    // A walkover between two empty slots moves no one on, so it isn't listed (the bracket shows it)
    const isEmptySlot = p => !p || p.isBye === true || p.name === 'Walkover' ||
        String(p.id || '').startsWith('walkover-');
    const completedMatches = (tournament && Array.isArray(matches) ? matches : [])
        .filter(match => match.completed && !isEmptySlot(match.winner))
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)); // latest first

    const playedCount = completedMatches.filter(m => !(m.autoAdvanced || isWalkoverMatch(m))).length;
    if (matchHistoryCount) matchHistoryCount.textContent = playedCount ? `${playedCount} played` : '';

    if (completedMatches.length === 0) {
        const text = !tournament ? 'No tournament loaded.' : 'No matches played yet.';
        matchResultsContainer.innerHTML = `<div class="st-empty st-small"><span>${text}</span></div>`;
        return;
    }

    // Per-render lookup so match/tournament ids never pass through inline handlers
    const historyRows = [];
    const where = (player, matchId, isWinner) => {
        const text = player && getPlayerProgressionForDisplay(player.id, matchId, isWinner);
        return text ? `${escapeHtml(player.name)} ${text}` : '';
    };
    matchResultsContainer.innerHTML = completedMatches.map(match => {
        const winner = match.winner || {};
        const loser = match.loser || ([match.player1, match.player2].find(p => p && p.id !== winner.id) || {});
        const id = matchIdTag(match.id);

        if (match.autoAdvanced || isWalkoverMatch(match)) {
            const meta = where(winner, match.id, true);
            return `<div class="st-hrow st-wo">${id}<span class="st-players"><b>${escapeHtml(winner.name || 'Unknown')}</b><span class="st-vs">walkover</span></span><span class="st-score">W/O</span>${meta ? `<span class="st-meta">${meta}</span>` : ''}</div>`;
        }

        const score = match.finalScore && match.finalScore.winnerLegs !== undefined
            ? `${match.finalScore.winnerLegs}-${match.finalScore.loserLegs}` : '';
        const meta = [
            match.lane ? `Lane ${escapeHtml(String(match.lane))}` : '',
            match.referee ? `Ref: ${escapeHtml(getPlayerNameById(match.referee))}` : '',
            [where(winner, match.id, true), where(loser, match.id, false)].filter(Boolean).join(', ')
        ].filter(Boolean).join(' · ');
        const idx = historyRows.push({ tournamentId: String(tournament.id), matchId: match.id }) - 1;
        return `<div class="st-hrow" data-mh-idx="${idx}" title="Open match details">${id}<span class="st-players"><b>${escapeHtml(winner.name || 'Unknown')}</b><span class="st-vs">beat</span>${escapeHtml(loser.name || 'Unknown')}</span><span class="st-score">${score}</span>${meta ? `<span class="st-meta">${meta}</span>` : ''}</div>`;
    }).join('');

    // One delegated click listener (attached once): opens the match modal by index,
    // keeping tournament/match ids out of inline handler strings.
    updateMatchHistory._historyRows = historyRows;
    if (!matchResultsContainer._mhDelegated) {
        matchResultsContainer._mhDelegated = true;
        matchResultsContainer.addEventListener('click', (e) => {
            const el = e.target.closest('[data-mh-idx]');
            if (!el) return;
            const row = (updateMatchHistory._historyRows || [])[parseInt(el.getAttribute('data-mh-idx'), 10)];
            if (row) NewtonHistory.openMatchModal(row.tournamentId, row.matchId);
        });
    }
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
