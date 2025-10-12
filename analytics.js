/**
 * Analytics & Developer Console
 *
 * Hidden developer tool for real-time tournament diagnostics, validation checks,
 * and developer commands. Accessible by clicking version number when enabled in Config.
 *
 * Features:
 * - Real-time statistics (transactions, matches, players, lanes)
 * - 6 validation checks (lanes, referees, match state, transactions, player IDs, progression)
 * - Developer commands (re-render, recalculate, validate, refresh)
 * - Console output capture and display
 * - Auto-refresh every 2 seconds (pauses while scrolling)
 */

// Console output capture
let consoleBuffer = [];
let originalConsoleLog = null;
let maxConsoleEntries = 100;

// Auto-refresh system
let analyticsRefreshInterval = null;
let isUserScrolling = false;
let scrollTimeout = null;

// Current right pane view
let currentView = 'overview';

/**
 * Open Analytics Modal
 */
function openAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (!modal) {
        console.error('Analytics modal not found in DOM');
        return;
    }

    // Use dialog stack system with Escape key support
    if (typeof window.pushDialog === 'function') {
        window.pushDialog('analyticsModal', null, true); // true enables Escape key
    } else {
        modal.style.display = 'block';
    }

    // Start console capture
    startConsoleCapture();

    // Setup scroll detection (must be done after modal is displayed)
    setupScrollDetection();

    // Initial render
    refreshAnalytics();
    showQuickOverview();

    // Start auto-refresh
    startAutoRefresh();

    console.log('Developer Console opened');
}

/**
 * Close Analytics Modal
 */
function closeAnalyticsModal() {
    // Use dialog stack system
    if (typeof window.popDialog === 'function') {
        window.popDialog();
    } else {
        const modal = document.getElementById('analyticsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Stop console capture
    stopConsoleCapture();

    // Stop auto-refresh
    stopAutoRefresh();

    console.log('Developer Console closed');
}

/**
 * Start capturing console.log output
 */
function startConsoleCapture() {
    if (originalConsoleLog) return; // Already capturing

    originalConsoleLog = console.log;
    console.log = function(...args) {
        // Call original console.log
        originalConsoleLog.apply(console, args);

        // Capture to buffer
        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        consoleBuffer.push({ timestamp, message });

        // Keep only last N entries
        if (consoleBuffer.length > maxConsoleEntries) {
            consoleBuffer.shift();
        }

        // Update view if console is currently displayed
        if (currentView === 'console') {
            showConsoleOutput();
        }
    };
}

/**
 * Stop capturing console.log output
 */
function stopConsoleCapture() {
    if (originalConsoleLog) {
        console.log = originalConsoleLog;
        originalConsoleLog = null;
    }
}

/**
 * Start auto-refresh (every 2 seconds)
 */
function startAutoRefresh() {
    if (analyticsRefreshInterval) return; // Already running

    analyticsRefreshInterval = setInterval(() => {
        if (!isUserScrolling) {
            refreshAnalytics();
        }
    }, 2000);
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (analyticsRefreshInterval) {
        clearInterval(analyticsRefreshInterval);
        analyticsRefreshInterval = null;
    }
}

/**
 * Detect user scrolling and pause refresh
 */
function setupScrollDetection() {
    const rightPane = document.querySelector('.analytics-right-pane');
    if (!rightPane) return;

    rightPane.addEventListener('scroll', () => {
        isUserScrolling = true;

        // Clear existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Resume refresh 1 second after scroll stops
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
        }, 1000);
    });
}

/**
 * Refresh all analytics data and update left pane
 */
function refreshAnalytics() {
    updateStatisticsPane();
    updateTimestamp();

    // Only refresh Overview automatically, other views stay static until user clicks
    if (currentView === 'overview') {
        showQuickOverview();
    }
}

/**
 * Update statistics in left pane
 */
function updateStatisticsPane() {
    const stats = getTransactionStats();
    const matchStats = getMatchStateStats();
    const playerStats = getPlayerStats();
    const laneStats = getLaneStats();

    // Update Transaction Health
    const transactionEl = document.getElementById('stat-transactions');
    if (transactionEl) {
        const percentage = Math.round((stats.total / 500) * 100);
        const status = percentage < 50 ? '✅' : (percentage < 80 ? '⚠️' : '🔴');
        transactionEl.innerHTML = `${stats.total}/500 (${percentage}%) ${status}`;
    }

    // Update Match State
    const matchEl = document.getElementById('stat-matches');
    if (matchEl) {
        matchEl.innerHTML = `${matchStats.completed} completed | ${matchStats.ready} ready | ${matchStats.live} live`;
    }

    // Update Player Count
    const playerEl = document.getElementById('stat-players');
    if (playerEl) {
        playerEl.innerHTML = `${playerStats.paid} paid | ${playerStats.unpaid} unpaid`;
    }

    // Update Lane Usage
    const laneEl = document.getElementById('stat-lanes');
    if (laneEl) {
        const status = laneStats.conflicts > 0 ? '⚠️' : '✅';
        laneEl.innerHTML = `${laneStats.inUse}/${laneStats.max} in use ${status}`;
    }
}

/**
 * Update last updated timestamp
 */
function updateTimestamp() {
    const timestampEl = document.getElementById('analytics-timestamp');
    if (timestampEl) {
        const now = new Date();
        timestampEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

/**
 * Get transaction statistics
 */
function getTransactionStats() {
    const history = getTournamentHistory ? getTournamentHistory() : [];

    const breakdown = {
        COMPLETE_MATCH: 0,
        START_MATCH: 0,
        STOP_MATCH: 0,
        ASSIGN_LANE: 0,
        ASSIGN_REFEREE: 0
    };

    history.forEach(tx => {
        if (breakdown.hasOwnProperty(tx.type)) {
            breakdown[tx.type]++;
        }
    });

    return {
        total: history.length,
        breakdown: breakdown
    };
}

/**
 * Get match state statistics
 */
function getMatchStateStats() {
    if (!matches || matches.length === 0) {
        return { total: 0, completed: 0, live: 0, ready: 0, pending: 0 };
    }

    const stats = {
        total: matches.length,
        completed: 0,
        live: 0,
        ready: 0,
        pending: 0
    };

    matches.forEach(match => {
        const state = getMatchState ? getMatchState(match) : 'unknown';
        if (stats.hasOwnProperty(state)) {
            stats[state]++;
        }
    });

    return stats;
}

/**
 * Get player statistics
 */
function getPlayerStats() {
    if (!players || players.length === 0) {
        return { total: 0, paid: 0, unpaid: 0 };
    }

    const paid = players.filter(p => p.paid).length;
    return {
        total: players.length,
        paid: paid,
        unpaid: players.length - paid
    };
}

/**
 * Get lane usage statistics
 */
function getLaneStats() {
    const maxLanes = (config && config.lanes && config.lanes.maxLanes) || 10;
    const usedLanes = getUsedLanes ? getUsedLanes() : [];
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true, conflicts: [] };

    return {
        max: maxLanes,
        inUse: usedLanes.length,
        conflicts: validation.conflicts.length
    };
}

// ============================================================================
// RIGHT PANE VIEWS
// ============================================================================

/**
 * Show Quick Overview (default view)
 */
function showQuickOverview() {
    currentView = 'overview';

    const stats = getTransactionStats();
    const matchStats = getMatchStateStats();
    const laneStats = getLaneStats();
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true };

    const transactionPercentage = Math.round((stats.total / 500) * 100);
    const matchPercentage = matchStats.total > 0 ? Math.round((matchStats.completed / matchStats.total) * 100) : 0;

    const laneStatus = laneStats.conflicts === 0 ? '✅ None' : `⚠️ ${laneStats.conflicts} conflict(s)`;
    const refereeValidation = validateRefereeAssignments();
    const refereeStatus = refereeValidation.valid ? '✅ None' : `⚠️ ${refereeValidation.conflicts.length} conflict(s)`;

    const html = `
        <h4>Quick Overview</h4>
        <div style="line-height: 1.8;">
            <p><strong>Matches:</strong> ${matchStats.completed}/${matchStats.total} completed (${matchPercentage}%)</p>
            <p><strong>Transactions:</strong> ${stats.total}/500 (${transactionPercentage}%)</p>
            <p><strong>Active:</strong> ${matchStats.live} live matches, ${matchStats.ready} ready</p>
            <p><strong>Lane conflicts:</strong> ${laneStatus}</p>
            <p><strong>Referee conflicts:</strong> ${refereeStatus}</p>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Show Transaction Breakdown
 */
function showTransactionBreakdown() {
    currentView = 'transactions';

    const stats = getTransactionStats();
    const percentage = Math.round((stats.total / 500) * 100);
    const status = percentage < 50 ? '✅ Healthy' : (percentage < 80 ? '⚠️ Moderate' : '🔴 High');
    const remaining = 500 - stats.total;

    let html = `
        <h4>Transaction Breakdown (${stats.total} total)</h4>
        <div style="line-height: 1.8;">
    `;

    for (const [type, count] of Object.entries(stats.breakdown)) {
        const typePercentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
        html += `<p><strong>${type}:</strong> ${count} (${typePercentage}%)</p>`;
    }

    html += `
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>Storage:</strong> ${stats.total}/500 entries (${percentage}%)</p>
            <p><strong>Status:</strong> ${status} (${remaining} capacity remaining)</p>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Show Match State Details
 */
function showMatchStateDetails() {
    currentView = 'matches';

    const matchStats = getMatchStateStats();

    let html = `
        <h4>Match State Breakdown (${matchStats.total} total)</h4>
        <div style="line-height: 1.8;">
    `;

    // Group matches by state
    const matchesByState = {
        completed: [],
        live: [],
        ready: [],
        pending: []
    };

    if (matches && matches.length > 0) {
        matches.forEach(match => {
            const state = getMatchState ? getMatchState(match) : 'unknown';
            if (matchesByState.hasOwnProperty(state)) {
                matchesByState[state].push(match.id);
            }
        });
    }

    // Display each state
    for (const [state, matchIds] of Object.entries(matchesByState)) {
        const count = matchIds.length;
        const stateName = state.toUpperCase();

        html += `<p><strong>${stateName}:</strong> ${count} matches</p>`;
        if (count > 0) {
            html += `<p style="margin-left: 20px; color: #666; font-size: 13px;">${matchIds.join(', ')}</p>`;
        }
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show Transaction History
 */
function showTransactionHistory() {
    currentView = 'history';

    const history = getTournamentHistory ? getTournamentHistory() : [];

    let html = `
        <h4>Transaction History (${history.length} total)</h4>
        <div style="font-family: monospace; font-size: 12px; line-height: 1.6;">
    `;

    if (history.length === 0) {
        html += `<p style="color: #666;">No transactions recorded</p>`;
    } else {
        // Reverse to show latest first
        const reversedHistory = [...history].reverse();

        reversedHistory.forEach((tx, index) => {
            const time = new Date(tx.timestamp).toLocaleTimeString();
            const number = history.length - index;
            html += `<p>#${number} | ${time} | ${tx.type} | ${tx.description || 'No description'}</p>`;
        });
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show Console Output
 */
function showConsoleOutput() {
    currentView = 'console';

    let html = `
        <h4>Console Output (last ${consoleBuffer.length} entries)</h4>
        <div style="margin-bottom: 15px;">
            <button class="btn" onclick="clearConsoleOutput()" style="margin-right: 10px;">Clear Console</button>
            <button class="btn" onclick="copyConsoleOutput()">Copy to Clipboard</button>
        </div>
        <div style="font-family: monospace; font-size: 12px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 4px;">
    `;

    if (consoleBuffer.length === 0) {
        html += `<p style="color: #666;">No console output captured yet</p>`;
    } else {
        consoleBuffer.forEach(entry => {
            html += `<p>[${entry.timestamp}] ${entry.message}</p>`;
        });
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show Match Progression Rules
 */
function showMatchProgression() {
    currentView = 'progression';

    if (!tournament || !tournament.bracketSize) {
        updateRightPane(`<h4>Match Progression Rules</h4><p style="color: #666;">No tournament loaded</p>`);
        return;
    }

    const bracketSize = tournament.bracketSize;
    const progression = MATCH_PROGRESSION ? MATCH_PROGRESSION[bracketSize] : null;

    if (!progression) {
        updateRightPane(`<h4>Match Progression Rules</h4><p style="color: #666;">No progression rules found for ${bracketSize}-player bracket</p>`);
        return;
    }

    let html = `
        <h4>Match Progression Rules (${bracketSize}-player bracket)</h4>
        <div style="font-family: monospace; font-size: 13px; line-height: 1.8;">
    `;

    for (const [matchId, rule] of Object.entries(progression)) {
        html += `<p><strong>${matchId}:</strong></p>`;

        if (rule.winner) {
            html += `<p style="margin-left: 20px;">Winner → ${rule.winner[0]} (${rule.winner[1]})</p>`;
        } else {
            html += `<p style="margin-left: 20px;">Winner → Tournament Champion</p>`;
        }

        if (rule.loser) {
            html += `<p style="margin-left: 20px;">Loser → ${rule.loser[0]} (${rule.loser[1]})</p>`;
        } else {
            html += `<p style="margin-left: 20px;">Loser → Eliminated</p>`;
        }

        html += `<br>`;
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show Validation Results
 */
function showValidationResults() {
    currentView = 'validation';

    const results = runAllValidations();

    let html = `
        <h4>Validation Results</h4>
        <div style="line-height: 1.8;">
    `;

    results.forEach(result => {
        const icon = result.valid ? '✅' : '⚠️';
        html += `<p><strong>${icon} ${result.name}:</strong> ${result.message}</p>`;

        if (result.details && result.details.length > 0) {
            result.details.forEach(detail => {
                html += `<p style="margin-left: 20px; color: #666; font-size: 13px;">${detail}</p>`;
            });
        }
    });

    html += `
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 13px; color: #666;">Last validated: ${new Date().toLocaleTimeString()}</p>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Update right pane content
 */
function updateRightPane(html) {
    const rightPane = document.querySelector('.analytics-right-pane');
    if (rightPane) {
        rightPane.innerHTML = html;
    }
}

// ============================================================================
// VALIDATION CHECKS
// ============================================================================

/**
 * Run all validation checks
 */
function runAllValidations() {
    return [
        validateLaneConflicts(),
        validateRefereeAssignments(),
        validateMatchStateIntegrity(),
        validateTransactionCount(),
        validatePlayerIdIntegrity(),
        validateProgressionIntegrity()
    ];
}

/**
 * Validate lane assignments
 */
function validateLaneConflicts() {
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true, conflicts: [] };

    const details = validation.conflicts.map(conflict =>
        `Lane ${conflict.lane}: Used by ${conflict.matches.join(', ')}`
    );

    return {
        name: 'Lane Assignments',
        valid: validation.valid,
        message: validation.valid ? 'No conflicts detected' : `${validation.conflicts.length} conflict(s) detected`,
        details: details
    };
}

/**
 * Validate referee assignments
 */
function validateRefereeAssignments() {
    if (!matches || matches.length === 0) {
        return {
            name: 'Referee Assignments',
            valid: true,
            message: 'No matches to validate',
            details: []
        };
    }

    const conflicts = [];

    matches.forEach(match => {
        if (match.referee && match.active) {
            // Check if referee is playing in this match
            if (match.player1 && match.player1.id === match.referee) {
                conflicts.push(`${match.id}: Referee is player1`);
            }
            if (match.player2 && match.player2.id === match.referee) {
                conflicts.push(`${match.id}: Referee is player2`);
            }
        }
    });

    return {
        name: 'Referee Assignments',
        valid: conflicts.length === 0,
        message: conflicts.length === 0 ? 'No conflicts detected' : `${conflicts.length} conflict(s) detected`,
        details: conflicts
    };
}

/**
 * Validate match state integrity
 */
function validateMatchStateIntegrity() {
    if (!matches || matches.length === 0) {
        return {
            name: 'Match State Integrity',
            valid: true,
            message: 'No matches to validate',
            details: []
        };
    }

    const issues = [];

    matches.forEach(match => {
        if (match.completed) {
            // Completed matches must have winner and loser
            if (!match.winner || !match.loser) {
                issues.push(`${match.id}: Completed but missing winner/loser`);
            }
        }
    });

    return {
        name: 'Match State Integrity',
        valid: issues.length === 0,
        message: issues.length === 0 ? 'All matches valid' : `${issues.length} issue(s) detected`,
        details: issues
    };
}

/**
 * Validate transaction count
 */
function validateTransactionCount() {
    const history = getTournamentHistory ? getTournamentHistory() : [];
    const count = history.length;
    const percentage = Math.round((count / 500) * 100);

    const valid = count < 400; // Warn if over 80%
    const status = count < 250 ? 'Healthy' : (count < 400 ? 'Moderate' : 'High');

    return {
        name: 'Transaction Count',
        valid: valid,
        message: `${count}/500 entries (${percentage}%) - ${status}`,
        details: []
    };
}

/**
 * Validate player ID integrity
 */
function validatePlayerIdIntegrity() {
    if (!matches || matches.length === 0 || !players || players.length === 0) {
        return {
            name: 'Player ID Integrity',
            valid: true,
            message: 'No data to validate',
            details: []
        };
    }

    const issues = [];
    const playerIds = new Set(players.map(p => p.id));

    matches.forEach(match => {
        // Check player1
        if (match.player1 && match.player1.id) {
            // Skip special players (BYE, TBD, WALKOVER)
            if (!match.player1.id.startsWith('bye-') &&
                !match.player1.id.startsWith('tbd-') &&
                match.player1.id !== 'WALKOVER' &&
                !playerIds.has(match.player1.id)) {
                issues.push(`${match.id}: player1 ID ${match.player1.id} not found in players array`);
            }
        }

        // Check player2
        if (match.player2 && match.player2.id) {
            // Skip special players (BYE, TBD, WALKOVER)
            if (!match.player2.id.startsWith('bye-') &&
                !match.player2.id.startsWith('tbd-') &&
                match.player2.id !== 'WALKOVER' &&
                !playerIds.has(match.player2.id)) {
                issues.push(`${match.id}: player2 ID ${match.player2.id} not found in players array`);
            }
        }

        // Check referee
        if (match.referee && !playerIds.has(match.referee)) {
            issues.push(`${match.id}: referee ID ${match.referee} not found in players array`);
        }
    });

    return {
        name: 'Player ID Integrity',
        valid: issues.length === 0,
        message: issues.length === 0 ? 'All player IDs valid' : `${issues.length} issue(s) detected`,
        details: issues
    };
}

/**
 * Validate progression integrity
 */
function validateProgressionIntegrity() {
    if (!matches || matches.length === 0 || !tournament || !tournament.bracketSize) {
        return {
            name: 'Progression Integrity',
            valid: true,
            message: 'No data to validate',
            details: []
        };
    }

    const progression = MATCH_PROGRESSION ? MATCH_PROGRESSION[tournament.bracketSize] : null;
    if (!progression) {
        return {
            name: 'Progression Integrity',
            valid: true,
            message: 'No progression rules available',
            details: []
        };
    }

    const issues = [];

    matches.forEach(match => {
        if (match.completed && match.winner && match.loser) {
            const rule = progression[match.id];
            if (!rule) return;

            // Check winner placement
            if (rule.winner) {
                const [destMatchId, destSlot] = rule.winner;
                const destMatch = matches.find(m => m.id === destMatchId);

                if (destMatch) {
                    const expectedPlayer = destMatch[destSlot];
                    if (expectedPlayer && expectedPlayer.id !== match.winner.id) {
                        issues.push(`${match.id}: Winner should be in ${destMatchId}.${destSlot}, found ${expectedPlayer.name || 'unknown'} instead`);
                    }
                }
            }

            // Check loser placement
            if (rule.loser) {
                const [destMatchId, destSlot] = rule.loser;
                const destMatch = matches.find(m => m.id === destMatchId);

                if (destMatch) {
                    const expectedPlayer = destMatch[destSlot];
                    if (expectedPlayer && expectedPlayer.id !== match.loser.id) {
                        issues.push(`${match.id}: Loser should be in ${destMatchId}.${destSlot}, found ${expectedPlayer.name || 'unknown'} instead`);
                    }
                }
            }
        }
    });

    return {
        name: 'Progression Integrity',
        valid: issues.length === 0,
        message: issues.length === 0 ? 'All progressions valid' : `${issues.length} issue(s) detected`,
        details: issues
    };
}

// ============================================================================
// COMMANDS
// ============================================================================

/**
 * Command: Re-render Bracket
 */
function commandReRenderBracket() {
    console.log('Re-rendering bracket...');

    if (typeof renderBracket === 'function') {
        renderBracket();
        console.log('✓ Bracket re-rendered');
    } else {
        console.error('renderBracket function not available');
    }
}

/**
 * Command: Recalculate Rankings
 */
function commandRecalculateRankings() {
    console.log('Recalculating rankings...');

    if (typeof calculateAllRankings === 'function') {
        calculateAllRankings();
        console.log('✓ Rankings recalculated');
    } else {
        console.error('calculateAllRankings function not available');
    }
}

/**
 * Command: Refresh All Dropdowns
 */
function commandRefreshDropdowns() {
    console.log('Refreshing all dropdowns...');

    let refreshed = 0;

    if (typeof refreshAllLaneDropdowns === 'function') {
        refreshAllLaneDropdowns();
        refreshed++;
    }

    if (typeof refreshAllRefereeDropdowns === 'function') {
        refreshAllRefereeDropdowns();
        refreshed++;
    }

    console.log(`✓ Refreshed ${refreshed} dropdown type(s)`);
}

/**
 * Command: Validate Everything
 */
function commandValidateEverything() {
    console.log('Running all validation checks...');
    showValidationResults();
    console.log('✓ Validation complete - see results in right pane');
}

/**
 * Clear console output
 */
function clearConsoleOutput() {
    consoleBuffer = [];
    console.log('Console output cleared');
    showConsoleOutput();
}

/**
 * Copy console output to clipboard
 */
function copyConsoleOutput() {
    if (consoleBuffer.length === 0) {
        alert('No console output to copy');
        return;
    }

    const text = consoleBuffer.map(entry => `[${entry.timestamp}] ${entry.message}`).join('\n');

    navigator.clipboard.writeText(text).then(() => {
        console.log('Console output copied to clipboard');
        alert('Console output copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy to clipboard');
    });
}

/**
 * Debug Analytics (callable from browser console)
 */
function debugAnalytics() {
    console.log('=== DEVELOPER CONSOLE DEBUG ===');

    const results = runAllValidations();
    results.forEach(result => {
        console.log(`${result.valid ? '✅' : '⚠️'} ${result.name}: ${result.message}`);
        if (result.details.length > 0) {
            result.details.forEach(detail => console.log(`  - ${detail}`));
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Make functions globally accessible
if (typeof window !== 'undefined') {
    window.openAnalyticsModal = openAnalyticsModal;
    window.closeAnalyticsModal = closeAnalyticsModal;
    window.debugAnalytics = debugAnalytics;
    window.showQuickOverview = showQuickOverview;
    window.showTransactionBreakdown = showTransactionBreakdown;
    window.showMatchStateDetails = showMatchStateDetails;
    window.showTransactionHistory = showTransactionHistory;
    window.showConsoleOutput = showConsoleOutput;
    window.showMatchProgression = showMatchProgression;
    window.showValidationResults = showValidationResults;
    window.commandReRenderBracket = commandReRenderBracket;
    window.commandRecalculateRankings = commandRecalculateRankings;
    window.commandRefreshDropdowns = commandRefreshDropdowns;
    window.commandValidateEverything = commandValidateEverything;
    window.clearConsoleOutput = clearConsoleOutput;
    window.copyConsoleOutput = copyConsoleOutput;
}

console.log('✓ Analytics module loaded');
